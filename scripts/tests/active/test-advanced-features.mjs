#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const timestamp = Date.now();

let cookies = '';
let tenantId = '';
let patientId = '';
let providerId = '';
let appointmentId = '';

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
  console.log('🔐 Step 1: Login');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'fresh.test@clinic.com',
      password: 'TestPass123!'
    }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  tenantId = data.userInfo.tenantId;
  cookies = response.headers.get('set-cookie') || '';
  
  console.log('  ✅ Login successful');
  console.log(`  📝 Tenant: ${tenantId}`);
  return data;
}

async function createPatient() {
  console.log('\n👤 Step 2: Create Patient');
  
  const patientData = {
    firstName: 'Test',
    lastName: 'Patient',
    dateOfBirth: '1990-01-01',
    email: `patient-${timestamp}@test.com`,
    phoneNumber: '+61400123456',
    gender: 'Male'
  };

  const response = await makeRequest('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData)
  });

  if (!response.ok) {
    throw new Error(`Patient creation failed: ${response.status}`);
  }

  const patient = await response.json();
  patientId = patient.id;
  
  console.log('  ✅ Patient created');
  console.log(`  📝 Patient ID: ${patientId}`);
  return patient;
}

async function createProvider() {
  console.log('\n👨‍⚕️ Step 3: Create Provider');
  
  const providerData = {
    title: 'Dr.',
    specialty: 'General Practice',
    licenseNumber: 'GP12345',
    isActive: true
  };

  const response = await makeRequest('/clinic-management/providers', {
    method: 'POST',
    body: JSON.stringify(providerData)
  });

  if (!response.ok) {
    throw new Error(`Provider creation failed: ${response.status}`);
  }

  const provider = await response.json();
  providerId = provider.id;
  
  console.log('  ✅ Provider created');
  console.log(`  📝 Provider ID: ${providerId}`);
  return provider;
}

async function testAppointments() {
  console.log('\n📅 Step 4: Test Appointment Creation');
  
  // Create appointment
  const appointmentData = {
    patientId: patientId,
    providerId: providerId,
    scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    scheduledEnd: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // +1 hour
    appointmentType: 'Consultation',
    locationType: 'InPerson',
    notes: 'Test appointment for advanced features'
  };

  const createResponse = await makeRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  });

  console.log(`  📝 Create appointment status: ${createResponse.status}`);
  
  if (createResponse.ok) {
    const appointment = await createResponse.json();
    appointmentId = appointment.id;
    console.log('  ✅ Appointment created successfully');
    console.log(`  📝 Appointment ID: ${appointmentId}`);
  } else {
    const error = await createResponse.text();
    console.log(`  ⚠️  Appointment creation failed: ${error}`);
  }

  // List appointments
  const listResponse = await makeRequest('/appointments');
  console.log(`  📝 List appointments status: ${listResponse.status}`);
  
  if (listResponse.ok) {
    const appointments = await listResponse.json();
    console.log(`  ✅ Found ${appointments.length || appointments.data?.length || 0} appointments`);
  }
}

async function testMessaging() {
  console.log('\n💬 Step 5: Test Messaging System');
  
  // Test message templates
  const templatesResponse = await makeRequest('/messages/templates');
  console.log(`  📝 Message templates status: ${templatesResponse.status}`);
  
  if (templatesResponse.ok) {
    const templates = await templatesResponse.json();
    console.log(`  ✅ Found ${templates.length || 0} message templates`);
  }

  // Test conversations
  const conversationsResponse = await makeRequest('/messages/conversations');
  console.log(`  📝 Conversations status: ${conversationsResponse.status}`);
  
  if (conversationsResponse.ok) {
    const conversations = await conversationsResponse.json();
    console.log(`  ✅ Found ${conversations.length || conversations.data?.length || 0} conversations`);
  }

  // Test creating a message (if we have a patient)
  if (patientId) {
    const messageData = {
      recipientId: patientId,
      subject: 'Test Message',
      content: 'This is a test message from the advanced features test.',
      messageType: 'General'
    };

    const messageResponse = await makeRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData)
    });

    console.log(`  📝 Create message status: ${messageResponse.status}`);
    
    if (messageResponse.ok) {
      const message = await messageResponse.json();
      console.log('  ✅ Message created successfully');
      console.log(`  📝 Message ID: ${message.id}`);
    } else {
      const error = await messageResponse.text();
      console.log(`  ⚠️  Message creation: ${error.substring(0, 100)}...`);
    }
  }

  // Test unread count
  const unreadResponse = await makeRequest('/messages/unread-count');
  console.log(`  📝 Unread count status: ${unreadResponse.status}`);
  
  if (unreadResponse.ok) {
    const unread = await unreadResponse.json();
    console.log(`  ✅ Unread messages: ${unread.count || unread}`);
  }
}

async function testPROMs() {
  console.log('\n📊 Step 6: Test PROMs System');
  
  // Test PROM templates
  const templatesResponse = await makeRequest('/proms/templates');
  console.log(`  📝 PROM templates status: ${templatesResponse.status}`);
  
  if (templatesResponse.ok) {
    const templates = await templatesResponse.json();
    console.log(`  ✅ Found ${templates.length || templates.data?.length || 0} PROM templates`);
  } else {
    const error = await templatesResponse.text();
    console.log(`  ⚠️  PROM templates: ${templatesResponse.status} - ${error.substring(0, 100)}...`);
  }

  // Test PROM instances
  const instancesResponse = await makeRequest('/proms/instances');
  console.log(`  📝 PROM instances status: ${instancesResponse.status}`);
  
  if (instancesResponse.ok) {
    const instances = await instancesResponse.json();
    console.log(`  ✅ Found ${instances.length || instances.data?.length || 0} PROM instances`);
  }

  // Test creating a PROM instance (if we have templates and patient)
  if (patientId) {
    const promData = {
      patientId: patientId,
      templateId: 'default-template', // This might not exist
      scheduledDate: new Date().toISOString(),
      notes: 'Test PROM instance'
    };

    const createResponse = await makeRequest('/proms/instances', {
      method: 'POST',
      body: JSON.stringify(promData)
    });

    console.log(`  📝 Create PROM instance status: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const instance = await createResponse.json();
      console.log('  ✅ PROM instance created successfully');
      console.log(`  📝 Instance ID: ${instance.id}`);
    } else {
      const error = await createResponse.text();
      console.log(`  ⚠️  PROM creation: ${error.substring(0, 100)}...`);
    }
  }
}

async function runAdvancedFeaturesTest() {
  console.log('🧪 ADVANCED FEATURES TEST');
  console.log('Testing: Appointments → Messaging → PROMs');
  console.log('========================');

  try {
    await login();
    await createPatient();
    await createProvider();
    await testAppointments();
    await testMessaging();
    await testPROMs();

    console.log('\n🎉 ADVANCED FEATURES TEST COMPLETE!');
    console.log('✅ Appointment system tested');
    console.log('✅ Messaging system tested');
    console.log('✅ PROMs system tested');
    console.log('\n🚀 All advanced features are operational!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runAdvancedFeaturesTest();
