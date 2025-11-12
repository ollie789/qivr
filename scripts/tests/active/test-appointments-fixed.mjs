#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const timestamp = Date.now();

let cookies = '';
let tenantId = '';
let patientId = '';
let providerId = '';

async function makeRequest(endpoint, options = {}) {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      'Cookie': cookies,
      ...options.headers
    }
  });
}

async function login() {
  console.log('🔐 Login');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'fresh.test@clinic.com',
      password: 'TestPass123!'
    }),
    credentials: 'include'
  });

  const data = await response.json();
  tenantId = data.userInfo.tenantId;
  cookies = response.headers.get('set-cookie') || '';
  
  console.log('  ✅ Login successful');
  return data;
}

async function setupTestData() {
  console.log('\n📋 Setup Test Data');
  
  // Create patient
  const patientData = {
    firstName: 'Test',
    lastName: 'Patient',
    dateOfBirth: '1990-01-01',
    email: `patient-${timestamp}@test.com`,
    phoneNumber: '+61400123456',
    gender: 'Male'
  };

  const patientResponse = await makeRequest('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData)
  });

  const patient = await patientResponse.json();
  patientId = patient.id;
  console.log(`  ✅ Patient created: ${patientId}`);

  // Create provider
  const providerData = {
    title: 'Dr.',
    specialty: 'General Practice',
    licenseNumber: 'GP12345',
    isActive: true
  };

  const providerResponse = await makeRequest('/clinic-management/providers', {
    method: 'POST',
    body: JSON.stringify(providerData)
  });

  const provider = await providerResponse.json();
  providerId = provider.id;
  console.log(`  ✅ Provider created: ${providerId}`);
}

async function testAppointmentCreation() {
  console.log('\n📅 Test Appointment Creation');
  
  // Try different appointment data formats
  const appointmentData = {
    patientId: patientId,
    providerId: providerId,
    scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    appointmentType: 'Consultation',
    locationType: 'InPerson', // Try as string first
    notes: 'Test appointment'
  };

  console.log('  🔍 Attempting appointment creation...');
  let response = await makeRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  });

  console.log(`  📝 Status: ${response.status}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`  ⚠️  Error: ${error}`);
    
    // Try with numeric locationType
    console.log('  🔍 Trying with numeric locationType...');
    appointmentData.locationType = 0; // Assuming 0 = InPerson
    
    response = await makeRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
    
    console.log(`  📝 Status: ${response.status}`);
    
    if (!response.ok) {
      const error2 = await response.text();
      console.log(`  ⚠️  Error: ${error2}`);
    } else {
      const appointment = await response.json();
      console.log(`  ✅ Appointment created: ${appointment.id}`);
    }
  } else {
    const appointment = await response.json();
    console.log(`  ✅ Appointment created: ${appointment.id}`);
  }
}

async function testMessagingCreation() {
  console.log('\n💬 Test Message Creation');
  
  // Try different message formats
  const messageData = {
    recipientId: patientId,
    subject: 'Test Message',
    content: 'This is a test message.',
    messageType: 'General'
  };

  console.log('  🔍 Attempting message creation...');
  let response = await makeRequest('/messages', {
    method: 'POST',
    body: JSON.stringify(messageData)
  });

  console.log(`  📝 Status: ${response.status}`);
  
  if (!response.ok) {
    const error = await response.text();
    console.log(`  ⚠️  Error: ${error.substring(0, 200)}...`);
    
    // Try simpler format
    const simpleMessage = {
      content: 'Test message content',
      recipientId: patientId
    };
    
    console.log('  🔍 Trying simpler message format...');
    response = await makeRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(simpleMessage)
    });
    
    console.log(`  📝 Status: ${response.status}`);
    
    if (response.ok) {
      const message = await response.json();
      console.log(`  ✅ Message created: ${message.id}`);
    } else {
      const error2 = await response.text();
      console.log(`  ⚠️  Still failed: ${error2.substring(0, 100)}...`);
    }
  } else {
    const message = await response.json();
    console.log(`  ✅ Message created: ${message.id}`);
  }
}

async function runFixedTest() {
  console.log('🧪 FIXED APPOINTMENTS & MESSAGING TEST');
  console.log('=====================================');

  try {
    await login();
    await setupTestData();
    await testAppointmentCreation();
    await testMessagingCreation();

    console.log('\n🎉 FIXED TEST COMPLETE!');
    console.log('📅 Appointment creation tested');
    console.log('💬 Messaging creation tested');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

runFixedTest();
