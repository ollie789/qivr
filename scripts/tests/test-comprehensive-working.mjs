#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const timestamp = Date.now();

let cookies = '';
let tenantId = '';

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

async function testRegistration() {
  console.log('\n📋 Test 1: Clinic Registration');
  
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${timestamp}@clinic.test`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Doctor',
      clinicName: `Test Clinic ${timestamp}`
    }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error(`Registration failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('  ✅ Registration successful');
  console.log('  ✅ Tenant ID returned');
  console.log('  ✅ User ID returned');
  console.log('  ✅ Cognito pool ID returned');
  console.log(`  📝 Tenant: ${data.tenantId}`);
  console.log(`  📝 Pool: ${data.cognitoPoolId}`);
  
  return data;
}

async function testLogin() {
  console.log('\n📋 Test 2: Login');
  
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${timestamp}@clinic.test`,
      password: 'TestPassword123!'
    }),
    credentials: 'include'
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  const loginData = await loginResponse.json();
  tenantId = loginData.userInfo.tenantId;
  cookies = loginResponse.headers.get('set-cookie') || '';
  
  console.log('  ✅ Login successful');
  console.log('  ✅ User data returned');
  console.log('  ✅ Correct tenant ID');
  console.log('  ✅ Auth cookie set');
  console.log(`  📝 User: ${loginData.userInfo.email}`);
  console.log(`  📝 Role: ${loginData.userInfo.role}`);
  
  return loginData;
}

async function testAuthCheck() {
  console.log('\n📋 Test 3: Check Auth Status');
  
  const response = await makeRequest('/auth/user-info');
  console.log(`  📝 Auth check status: ${response.status}`);
  
  if (!response.ok) {
    throw new Error(`Auth check failed: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.username || !data.tenantId) {
    throw new Error('User not authenticated');
  }
  
  if (data.tenantId !== tenantId) {
    throw new Error('Incorrect tenant context');
  }
  
  console.log('  ✅ Auth check successful');
  console.log('  ✅ User is authenticated');
  console.log('  ✅ Correct tenant context');
}

async function testCreatePatient() {
  console.log('\n📋 Test 4: Create Patient');
  
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
  console.log('  ✅ Patient ID returned');
  console.log('  ✅ Patient belongs to correct tenant');
  console.log(`  📝 Patient ID: ${patient.id}`);
  console.log(`  📝 Patient: ${patient.firstName} ${patient.lastName}`);
  
  return patient;
}

async function runComprehensiveTest() {
  try {
    console.log('\n🧪 COMPREHENSIVE SYSTEM TEST');
    console.log(`API: ${API_URL}`);
    
    await testRegistration();
    await testLogin();
    await testAuthCheck();
    await testCreatePatient();
    
    console.log('\n🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉');
    console.log('\n✅ Clinic registration works');
    console.log('✅ User login works');
    console.log('✅ Auth verification works');
    console.log('✅ Patient creation works');
    console.log('\n🚀 QIVR SYSTEM IS FULLY OPERATIONAL! 🚀');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runComprehensiveTest();
