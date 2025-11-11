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

async function debugClinicAccess() {
  console.log('\n📋 Step 3: Debug Clinic Access');
  
  // Try different endpoints to find clinic ID
  console.log('  🔍 Trying /clinic-management/clinics...');
  let response = await makeRequest('/clinic-management/clinics');
  console.log(`  📝 Status: ${response.status}`);
  if (response.ok) {
    const clinics = await response.json();
    console.log(`  📝 Clinics: ${JSON.stringify(clinics, null, 2)}`);
    return clinics;
  }
  
  console.log('  🔍 Trying to create a clinic...');
  const clinicData = {
    name: `Debug Clinic ${timestamp}`,
    email: `clinic${timestamp}@test.com`,
    phone: '+61412345678',
    address: '123 Test Street, Test City, NSW 2000'
  };
  
  response = await makeRequest('/clinic-management/clinics', {
    method: 'POST',
    body: JSON.stringify(clinicData)
  });
  
  console.log(`  📝 Create clinic status: ${response.status}`);
  if (response.ok) {
    const clinic = await response.json();
    console.log(`  📝 Created clinic: ${JSON.stringify(clinic, null, 2)}`);
    return [clinic];
  } else {
    const errorText = await response.text();
    console.log(`  📝 Create clinic error: ${errorText}`);
  }
  
  // Try to get user info to see if clinic is embedded
  console.log('  🔍 Checking user profile...');
  response = await makeRequest('/profile');
  if (response.ok) {
    const profile = await response.json();
    console.log(`  📝 Profile: ${JSON.stringify(profile, null, 2)}`);
  }
  
  return null;
}

async function testProviderCreation(clinics) {
  console.log('\n📋 Step 4: Test Provider Creation');
  
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

  // Try new simplified endpoint first (Phase 2.1)
  console.log('  🔍 Trying simplified endpoint: /clinic-management/providers...');
  let response = await makeRequest('/clinic-management/providers', {
    method: 'POST',
    body: JSON.stringify(providerData)
  });

  console.log(`  📝 Simplified endpoint status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log(`  📝 Simplified endpoint error: ${errorText}`);
    
    // Fallback to old endpoint if needed
    if (clinics && clinics.length > 0) {
      const clinicId = clinics[0].id;
      console.log(`  🔍 Trying old endpoint: /clinic-management/clinics/${clinicId}/providers...`);
      
      response = await makeRequest(`/clinic-management/clinics/${clinicId}/providers`, {
        method: 'POST',
        body: JSON.stringify(providerData)
      });
      
      console.log(`  📝 Old endpoint status: ${response.status}`);
      
      if (!response.ok) {
        const errorText2 = await response.text();
        console.log(`  📝 Old endpoint error: ${errorText2}`);
        return null;
      }
    } else {
      console.log('  ⚠️  No clinics available and simplified endpoint failed');
      return null;
    }
  }

  const provider = await response.json();
  console.log('  ✅ Provider created successfully');
  console.log(`  📝 Provider: ${JSON.stringify(provider, null, 2)}`);
  
  return provider;
}

async function runDebugTest() {
  try {
    console.log('\n🔍 PROVIDER CREATION DEBUG TEST');
    console.log(`API: ${API_URL}`);
    
    await testRegisterAndLogin();
    const clinics = await debugClinicAccess();
    await testProviderCreation(clinics);
    
    console.log('\n🎉 DEBUG TEST COMPLETED!');
    
  } catch (error) {
    console.error('\n❌ Debug test failed:', error.message);
    process.exit(1);
  }
}

runDebugTest();
