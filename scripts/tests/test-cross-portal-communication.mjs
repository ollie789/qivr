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
    body: JSON.stringify(user),
    credentials: 'include'
  });
  
  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
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
  console.log('🧪 Testing Cross-Portal Communication\n');
  
  // Step 1: Login as admin
  console.log('1️⃣  Logging in as clinician...');
  const admin = await login(ADMIN_USER);
  console.log(`   ✅ Logged in as ${ADMIN_USER.email}\n`);
  
  // Step 2: Login as patient
  console.log('2️⃣  Logging in as patient...');
  const patient = await login(PATIENT_USER);
  console.log(`   ✅ Logged in as ${PATIENT_USER.email}\n`);
  
  // Step 3: Get patient ID
  console.log('3️⃣  Getting patient details...');
  const patientsResponse = await apiCall('/patients', admin.cookies);
  const patientRecord = patientsResponse.data?.items?.find(p => 
    p.email === PATIENT_USER.email
  );
  
  if (!patientRecord) {
    console.log('   ❌ Patient record not found');
    return;
  }
  console.log(`   ✅ Found patient: ${patientRecord.firstName} ${patientRecord.lastName} (ID: ${patientRecord.id})\n`);
  
  // Step 4: Check current messages for patient
  console.log('4️⃣  Checking patient messages (before)...');
  const messagesBefore = await apiCall('/messages', patient.cookies);
  const beforeMessages = messagesBefore.data?.data?.items || messagesBefore.data?.items || (Array.isArray(messagesBefore.data) ? messagesBefore.data : []);
  const beforeCount = beforeMessages.length;
  console.log(`   📬 Patient has ${beforeCount} messages\n`);
  
  // Step 5: Clinician sends message to patient
  console.log('5️⃣  Clinician sending message to patient...');
  const timestamp = Date.now();
  const messageData = {
    recipientId: patientRecord.id,
    subject: `Test Message ${timestamp}`,
    content: `This is a test message sent at ${new Date().toISOString()}`
  };
  
  const sendResult = await apiCall('/messages', admin.cookies, 'POST', messageData);
  console.log(`   ${sendResult.status === 201 || sendResult.status === 200 ? '✅' : '❌'} Message send status: ${sendResult.status}`);
  if (sendResult.status !== 201 && sendResult.status !== 200) {
    console.log(`   Error: ${JSON.stringify(sendResult.data)}`);
  }
  console.log();
  
  // Step 6: Check if patient received the message
  console.log('6️⃣  Checking patient messages (after)...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  const messagesAfter = await apiCall('/messages', patient.cookies);
  const messages = messagesAfter.data?.data?.items || messagesAfter.data?.items || (Array.isArray(messagesAfter.data) ? messagesAfter.data : []);
  const afterCount = messages.length;
  const newMessage = messages.find(m => m.subject?.includes(timestamp.toString()));
  
  console.log(`   📬 Patient now has ${afterCount} messages`);
  if (newMessage) {
    console.log(`   ✅ New message received: "${newMessage.subject}"`);
  } else {
    console.log(`   ⚠️  Message not found yet (may need time to sync)`);
  }
  
  console.log('\n7️⃣  Testing document sharing...');
  const docsBefore = await apiCall('/documents', patient.cookies);
  console.log(`   📄 Patient has ${docsBefore.data?.length || 0} documents`);
  
  console.log('\n8️⃣  Testing PROM assignment...');
  const promsBefore = await apiCall('/proms', patient.cookies);
  console.log(`   📋 Patient has ${promsBefore.data?.length || 0} PROMs available`);
  
  console.log('\n📊 Summary:');
  console.log(`   Messages: ${beforeCount} → ${afterCount} ${afterCount > beforeCount ? '✅' : '⚠️'}`);
  console.log(`   Message delivery: ${newMessage ? '✅ Working' : '⚠️ Delayed or not working'}`);
  console.log(`   Documents: ${docsBefore.data?.length || 0} available`);
  console.log(`   PROMs: ${promsBefore.data?.length || 0} available`);
}

main().catch(console.error);
