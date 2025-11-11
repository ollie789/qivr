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

async function testRegisterAndLogin() {
  console.log('\n📋 Step 1: Register New Clinic');
  
  const email = `test${timestamp}@clinic.test`;
  const registrationData = {
    email: email,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Admin',
    clinicName: `Test Clinic ${timestamp}`,
    role: 'admin'
  };

  const regResponse = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData),
    credentials: 'include'
  });

  if (!regResponse.ok) {
    const errorText = await regResponse.text();
    throw new Error(`Registration failed: ${regResponse.status} - ${errorText}`);
  }

  const regResult = await regResponse.json();
  tenantId = regResult.tenantId;
  
  console.log('  ✅ Registration successful');
  console.log(`  📝 Tenant ID: ${tenantId}`);

  // Login
  console.log('\n📋 Step 2: Login');
  
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'TestPassword123!' }),
    credentials: 'include'
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
  }

  const loginData = await loginResponse.json();
  cookies = loginResponse.headers.get('set-cookie') || '';
  
  console.log('  ✅ Login successful');
  console.log(`  📝 Role: ${loginData.userInfo.role}`);
  
  return loginData;
}

async function testProviderCreation() {
  console.log('\n📋 Step 3: Test Simplified Provider Creation (Phase 2.4)');
  
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

  console.log('  🎯 Using simplified endpoint: /clinic-management/providers');
  console.log('  📝 No clinicId required - using tenant context from auth');
  
  const response = await makeRequest('/clinic-management/providers', {
    method: 'POST',
    body: JSON.stringify(providerData)
  });

  console.log(`  📝 Response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`  ❌ Provider creation failed: ${errorText}`);
    throw new Error(`Provider creation failed: ${response.status} - ${errorText}`);
  }

  const provider = await response.json();
  console.log('  ✅ Provider created successfully with simplified endpoint!');
  console.log(`  📝 Provider: ${JSON.stringify(provider, null, 2)}`);
  
  return provider;
}

async function runDebugTest() {
  try {
    console.log('\n🎯 TENANT-CLINIC MERGE VALIDATION TEST (Phase 2.4)');
    console.log(`API: ${API_URL}`);
    console.log('Testing simplified endpoints with tenant context authentication');
    
    await testRegisterAndLogin();
    await testProviderCreation();
    
    console.log('\n🎉 TENANT-CLINIC MERGE TEST PASSED!');
    console.log('✅ Simplified endpoints working');
    console.log('✅ Tenant context authentication working');
    console.log('✅ No clinic ID confusion');
    
  } catch (error) {
    console.error('\n❌ Tenant-clinic merge test failed:', error.message);
    process.exit(1);
  }
}

runDebugTest();
