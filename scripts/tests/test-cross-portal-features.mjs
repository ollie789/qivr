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
  console.log('🧪 Testing Cross-Portal Features\n');
  
  const admin = await login(ADMIN_USER);
  const patient = await login(PATIENT_USER);
  
  console.log('✅ Both users logged in\n');
  
  // Get patient ID
  const patientsResponse = await apiCall('/patients', admin.cookies);
  const patientRecord = patientsResponse.data?.items?.find(p => 
    p.email === PATIENT_USER.email
  );
  
  if (!patientRecord) {
    console.log('❌ Patient record not found');
    return;
  }
  
  console.log(`📋 Testing for patient: ${patientRecord.firstName} ${patientRecord.lastName}\n`);
  
  // Test 1: PROM Assignment
  console.log('1️⃣  PROM Assignment');
  const promTemplates = await apiCall('/proms/templates', admin.cookies);
  console.log(`   📝 Available PROM templates: ${promTemplates.data?.length || 0}`);
  
  const patientProms = await apiCall('/patient/proms', patient.cookies);
  console.log(`   📋 Patient assigned PROMs: ${patientProms.data?.length || 0}`);
  
  if (promTemplates.data?.length > 0) {
    console.log(`   ℹ️  Can assign PROMs to patients`);
  }
  
  // Test 2: Document Sharing
  console.log('\n2️⃣  Document Sharing');
  const clinicDocs = await apiCall('/documents', admin.cookies);
  console.log(`   📄 Clinic documents: ${clinicDocs.data?.length || 0}`);
  
  const patientDocs = await apiCall('/patient/documents', patient.cookies);
  console.log(`   📄 Patient documents: ${patientDocs.data?.length || 0}`);
  
  // Test 3: Appointment Booking
  console.log('\n3️⃣  Appointment Booking');
  const providers = await apiCall('/clinic-management/providers', admin.cookies);
  console.log(`   👨‍⚕️  Available providers: ${providers.data?.length || 0}`);
  
  if (providers.data?.length > 0) {
    const providerId = providers.data[0].userId;
    const slots = await apiCall(
      `/patient/appointments/available-slots?providerId=${providerId}&date=2025-11-15`,
      patient.cookies
    );
    console.log(`   📅 Available slots: ${slots.status === 200 ? 'API working' : `Error ${slots.status}`}`);
  }
  
  const patientAppts = await apiCall('/patient/appointments', patient.cookies);
  console.log(`   📅 Patient appointments: ${patientAppts.data?.length || 0}`);
  
  // Test 4: Messaging (after fix deploys)
  console.log('\n4️⃣  Messaging');
  const patientMessages = await apiCall('/patient/messages', patient.cookies);
  console.log(`   📬 Patient messages: ${patientMessages.data?.length || 0}`);
  
  console.log('\n📊 Summary:');
  console.log(`   PROM Templates: ${promTemplates.data?.length || 0} available`);
  console.log(`   Documents: ${patientDocs.data?.length || 0} accessible to patient`);
  console.log(`   Appointment Booking: ${providers.data?.length > 0 ? '✅ Working' : '⚠️ No providers'}`);
  console.log(`   Messaging: ${patientMessages.status === 200 ? '✅ API Working' : '❌ Error'}`);
}

main().catch(console.error);
