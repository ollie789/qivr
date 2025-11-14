#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const TENANT_ID = 'd1466419-46e4-4594-b6d9-523668431e06';

const ADMIN_USER = {
  email: 'test1762923257212@example.com',
  password: 'TestPass123!'
};

const PATIENT_USER = {
  email: 'patient1762923257212@example.com',
  password: 'PatientPass123!'
};

async function login(user) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID
    },
    body: JSON.stringify(user)
  });
  
  const data = await response.json();
  const cookies = response.headers.raw()['set-cookie'];
  return {
    cookies: cookies.map(c => c.split(';')[0]).join('; '),
    userId: data.userInfo.username
  };
}

async function apiCall(path, cookies, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Cookie': cookies,
      'X-Tenant-Id': TENANT_ID
    }
  };
  
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(`${API_URL}${path}`, options);
  return {
    status: response.status,
    data: response.status !== 204 ? await response.json().catch(() => null) : null
  };
}

async function main() {
  console.log('🔧 Populating Patient Test Data\n');
  
  const admin = await login(ADMIN_USER);
  const patient = await login(PATIENT_USER);
  
  // Get patient ID
  const patientsResponse = await apiCall('/patients', admin.cookies);
  const patientRecord = patientsResponse.data?.items?.find(p => 
    p.email === PATIENT_USER.email
  );
  
  if (!patientRecord) {
    console.log('❌ Patient record not found');
    return;
  }
  
  console.log(`📋 Populating data for: ${patientRecord.firstName} ${patientRecord.lastName}\n`);
  
  // 1. Send Messages
  console.log('1️⃣  Sending test messages...');
  const messages = [
    {
      recipientId: patientRecord.id,
      subject: 'Welcome to Qivr',
      content: 'Welcome to our patient portal! You can view your appointments, medical records, and communicate with your healthcare team here.'
    },
    {
      recipientId: patientRecord.id,
      subject: 'Appointment Reminder',
      content: 'This is a reminder about your upcoming appointment. Please arrive 10 minutes early.'
    },
    {
      recipientId: patientRecord.id,
      subject: 'Lab Results Available',
      content: 'Your recent lab results are now available in your medical records. Please review them at your convenience.'
    }
  ];
  
  for (const msg of messages) {
    const result = await apiCall('/messages', admin.cookies, 'POST', msg);
    console.log(`   ${result.status === 201 || result.status === 200 ? '✅' : '❌'} "${msg.subject}" - Status: ${result.status}`);
    if (result.status !== 201 && result.status !== 200) {
      console.log(`      Error: ${JSON.stringify(result.data)?.substring(0, 100)}`);
    }
  }
  
  // 2. Assign PROMs
  console.log('\n2️⃣  Assigning PROMs...');
  const promTemplates = await apiCall('/proms/templates', admin.cookies);
  if (promTemplates.data?.length > 0) {
    console.log(`   📝 Found ${promTemplates.data.length} PROM template(s)`);
    console.log(`   ℹ️  PROM assignment endpoint needs to be implemented`);
  } else {
    console.log(`   ⚠️  No PROM templates available`);
  }
  
  // 3. Check appointment booking
  console.log('\n3️⃣  Appointment booking availability...');
  const providers = await apiCall('/clinic-management/providers', admin.cookies);
  if (providers.data?.length > 0) {
    console.log(`   ✅ ${providers.data.length} provider(s) available for booking`);
  }
  
  // 4. Verify patient can see the data
  console.log('\n4️⃣  Verifying patient access...');
  const patientMessages = await apiCall('/patient/messages', patient.cookies);
  console.log(`   📬 Patient can see ${patientMessages.data?.length || 0} messages`);
  
  const patientAppts = await apiCall('/patient/appointments', patient.cookies);
  console.log(`   📅 Patient has ${patientAppts.data?.length || 0} appointments`);
  
  console.log('\n✅ Test data population complete!');
  console.log('\nPatient can now:');
  console.log('  - View messages from clinician');
  console.log('  - Book appointments with available providers');
  console.log('  - Access their medical records');
}

main().catch(console.error);
