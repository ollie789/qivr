#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';

// Test with existing confirmed user
const TEST_EMAIL = 'test1762774598204@clinic.test';
const TEST_PASSWORD = 'TestPassword123!';

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

async function testLogin() {
  console.log('\n📋 Test 1: Login');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
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
  console.log(`  📝 User: ${data.userInfo.email}`);
}

async function testPatients() {
  console.log('\n📋 Test 2: List Patients');
  
  const response = await makeRequest('/patients');
  if (!response.ok) {
    throw new Error(`Failed to list patients: ${response.status}`);
  }
  
  const patients = await response.json();
  console.log(`  ✅ Found ${patients.length} patients`);
  
  if (patients.length > 0) {
    console.log(`  📝 First patient: ${patients[0].firstName} ${patients[0].lastName}`);
    return patients[0];
  }
  return null;
}

async function testProviders() {
  console.log('\n📋 Test 3: List Providers');
  
  const response = await makeRequest(`/clinic-management/clinics/${tenantId}/providers`);
  if (!response.ok) {
    throw new Error(`Failed to list providers: ${response.status}`);
  }
  
  const providers = await response.json();
  console.log(`  ✅ Found ${providers.length} providers`);
  
  if (providers.length > 0) {
    console.log(`  📝 First provider: ${providers[0].firstName} ${providers[0].lastName}`);
    return providers[0];
  }
  return null;
}

async function testAppointments() {
  console.log('\n📋 Test 4: List Appointments');
  
  const response = await makeRequest('/appointments');
  if (!response.ok) {
    throw new Error(`Failed to list appointments: ${response.status}`);
  }
  
  const appointments = await response.json();
  console.log(`  ✅ Found ${appointments.length} appointments`);
  
  if (appointments.length > 0) {
    console.log(`  📝 First appointment: ${appointments[0].appointmentDate}`);
  }
}

async function runTests() {
  try {
    console.log('\n🧪 FUNCTIONALITY TESTS');
    console.log(`API: ${API_URL}`);
    
    await testLogin();
    const patient = await testPatients();
    const provider = await testProviders();
    await testAppointments();
    
    console.log('\n🎉 ALL FUNCTIONALITY TESTS PASSED!');
    console.log('\n✅ Login works');
    console.log('✅ Patient listing works');
    console.log('✅ Provider listing works');
    console.log('✅ Appointment listing works');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
