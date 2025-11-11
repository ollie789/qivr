#!/usr/bin/env node

import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const API_URL = 'https://clinic.qivr.pro/api';
const timestamp = Date.now();

let cookies = '';
let tenantId = '';
let clinicId = '';

// CloudWatch debugging function
async function debugOnFailure(operation, error) {
  console.log(`\n🔍 DEBUGGING: ${operation} failed - ${error.message}`);
  
  try {
    const { stdout } = await execAsync(
      `aws logs get-log-events --log-group-name "/ecs/qivr-api" --log-stream-name $(aws logs describe-log-streams --log-group-name "/ecs/qivr-api" --order-by LastEventTime --descending --limit 1 --region ap-southeast-2 --query 'logStreams[0].logStreamName' --output text) --start-time ${Date.now() - 300000} --region ap-southeast-2 --query 'events[-3:].[timestamp,message]' --output text`
    );
    console.log('📝 Recent logs:', stdout.split('\n').slice(-3).join('\n'));
  } catch (logError) {
    console.log('⚠️  Could not fetch debug logs');
  }
}

async function makeRequest(endpoint, options = {}) {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies,
      'X-Tenant-Id': tenantId,
      ...options.headers
    },
    credentials: 'include'
  });
}

async function testRegisterClinic() {
  console.log('\n📋 Test 1: Register New Clinic');
  
  const email = `test${timestamp}@clinic.test`;
  const registrationData = {
    email: email,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Admin',
    clinicName: `Test Clinic ${timestamp}`,
    role: 'admin'  // Clinic owner should be admin
  };

  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData),
    credentials: 'include'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Clinic registration failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  tenantId = result.tenantId;
  
  console.log('  ✅ Clinic registered successfully');
  console.log(`  📝 Tenant ID: ${tenantId}`);
  console.log(`  📝 Email: ${email}`);
  
  return { email, password: 'TestPassword123!' };
}

async function testLogin(credentials) {
  console.log('\n📋 Test 2: Login with Admin User');
  
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include'
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
  }

  const loginData = await loginResponse.json();
  cookies = loginResponse.headers.get('set-cookie') || '';
  
  // Get clinic information
  const clinicsResponse = await makeRequest('/clinic-management/clinics');
  if (clinicsResponse.ok) {
    const clinics = await clinicsResponse.json();
    if (clinics && clinics.length > 0) {
      clinicId = clinics[0].id;
      console.log(`  📝 Clinic ID: ${clinicId}`);
    }
  }
  
  console.log('  ✅ Login successful');
  console.log(`  📝 Role: ${loginData.userInfo.role}`);
  console.log(`  📝 Tenant: ${tenantId}`);
  
  return loginData;
}

async function testCreatePatient() {
  console.log('\n📋 Test 3: Create Patient');
  
  const randomId = Math.random().toString(36).substring(7);
  const patientData = {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    email: `patient-${timestamp}-${randomId}@test.com`,
    phoneNumber: `+614${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    gender: 'Male',
    address: `${Math.floor(Math.random() * 999)} Test Street`,
    emergencyContactName: 'Emergency Contact',
    emergencyContactPhone: `+614${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
  };

  const response = await makeRequest('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Patient creation failed: ${response.status} - ${errorText}`);
  }

  const patient = await response.json();
  console.log('  ✅ Patient created successfully');
  console.log(`  📝 Patient ID: ${patient.id}`);
  
  return patient;
}

async function testCreateProvider() {
  console.log('\n📋 Test 4: Create Provider');
  
  // If we don't have clinic ID, use tenant ID as fallback
  if (!clinicId) {
    clinicId = tenantId;
    console.log(`  📝 Using tenant ID as clinic ID: ${clinicId}`);
  }
  
  const providerData = {
    firstName: 'Dr. Jane',
    lastName: 'Smith',
    title: 'MD',
    specialty: 'General Practice',
    email: `provider-${timestamp}@clinic.test`,
    phone: `+614${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    licenseNumber: `LIC${timestamp}`,
    isActive: true
  };

  const response = await makeRequest(`/clinic-management/clinics/${clinicId}/providers`, {
    method: 'POST',
    body: JSON.stringify(providerData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`  ⚠️  Provider creation failed: ${response.status} - ${errorText}`);
    
    // Try alternative approach - check if we can create via different endpoint
    const altResponse = await makeRequest('/clinic-management/providers', {
      method: 'POST',
      body: JSON.stringify({...providerData, clinicId})
    });
    
    if (!altResponse.ok) {
      throw new Error(`Provider creation failed on both endpoints: ${response.status}`);
    }
    
    const provider = await altResponse.json();
    console.log('  ✅ Provider created via alternative endpoint');
    console.log(`  📝 Provider ID: ${provider.id}`);
    return provider;
  }

  const provider = await response.json();
  console.log('  ✅ Provider created successfully');
  console.log(`  📝 Provider ID: ${provider.id}`);
  console.log(`  📝 Provider: ${provider.firstName} ${provider.lastName}`);
  
  return provider;
}

async function testCreateAppointment(patient, provider) {
  console.log('\n📋 Test 5: Create Appointment');
  
  const appointmentData = {
    patientId: patient.id,
    providerId: provider.id,
    clinicId: clinicId,
    appointmentType: 'Consultation',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    status: 'Scheduled',
    notes: 'Advanced test appointment'
  };

  const response = await makeRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Appointment creation failed: ${response.status} - ${errorText}`);
  }

  const appointment = await response.json();
  console.log('  ✅ Appointment created successfully');
  console.log(`  📝 Appointment ID: ${appointment.id}`);
  
  return appointment;
}

async function testMessages(patient) {
  console.log('\n📋 Test 6: Test Messages');
  
  const messageData = {
    recipientId: patient.id,
    subject: 'Advanced Test Message',
    content: 'This is an advanced test message to verify messaging functionality.',
    messageType: 'General'
  };

  const response = await makeRequest('/messages', {
    method: 'POST',
    body: JSON.stringify(messageData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Message creation failed: ${response.status} - ${errorText}`);
  }

  const message = await response.json();
  console.log('  ✅ Message created successfully');
  console.log(`  📝 Message ID: ${message.id}`);
  
  return message;
}

async function testPROMs(patient) {
  console.log('\n📋 Test 7: Test PROMs');
  
  // First create a PROM template
  const promTemplateData = {
    title: 'Advanced Test PROM',
    description: 'Test questionnaire for advanced testing',
    questions: [
      {
        id: 'q1',
        text: 'Rate your pain level (1-10)',
        type: 'scale',
        required: true,
        options: { min: 1, max: 10 }
      },
      {
        id: 'q2', 
        text: 'How are you feeling today?',
        type: 'choice',
        required: true,
        options: ['Excellent', 'Good', 'Fair', 'Poor']
      }
    ]
  };

  const templateResponse = await makeRequest('/proms', {
    method: 'POST',
    body: JSON.stringify(promTemplateData)
  });

  if (!templateResponse.ok) {
    const errorText = await templateResponse.text();
    throw new Error(`PROM template creation failed: ${templateResponse.status} - ${errorText}`);
  }

  const promTemplate = await templateResponse.json();
  console.log('  ✅ PROM template created successfully');
  console.log(`  📝 PROM Template ID: ${promTemplate.id}`);
  
  return promTemplate;
}

async function runAdvancedTest() {
  try {
    console.log('\n🧪 ADVANCED COMPREHENSIVE SYSTEM TEST');
    console.log('Testing: Clinic Setup → Login → Patients → Providers → Appointments → Messages → PROMs');
    console.log(`API: ${API_URL}`);
    
    const credentials = await testRegisterClinic();
    await testLogin(credentials);
    const patient = await testCreatePatient();
    const provider = await testCreateProvider();
    await testCreateAppointment(patient, provider);
    await testMessages(patient);
    await testPROMs(patient);
    
    console.log('\n🎉🎉🎉 ALL ADVANCED TESTS PASSED! 🎉🎉🎉');
    console.log('\n✅ Clinic registration works');
    console.log('✅ Admin login works');
    console.log('✅ Patient creation works');
    console.log('✅ Provider creation works');
    console.log('✅ Appointment creation works');
    console.log('✅ Messages system works');
    console.log('✅ PROMs system works');
    console.log('\n🚀 QIVR ADVANCED FEATURES FULLY OPERATIONAL! 🚀');
    
  } catch (error) {
    console.error('\n❌ Advanced test failed:', error.message);
    await debugOnFailure('Advanced Test', error);
    process.exit(1);
  }
}

runAdvancedTest();
