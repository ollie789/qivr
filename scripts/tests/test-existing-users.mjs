#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const TENANT_ID = 'd1466419-46e4-4594-b6d9-523668431e06';

// Existing confirmed users
const ADMIN_USER = {
  email: 'test1762923257212@example.com',
  password: 'TestPass123!'
};

const PATIENT_USER = {
  email: 'patient1762923257212@example.com', 
  password: 'PatientPass123!'
};

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
      ...options.headers
    },
    ...options
  });
  
  const data = await response.text();
  try {
    return { status: response.status, data: JSON.parse(data) };
  } catch {
    return { status: response.status, data };
  }
}

async function login(user) {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(user)
  });
  
  if (result.status === 200) {
    console.log(`  ✅ ${user.email} logged in successfully`);
    return result.data;
  } else {
    console.log(`  ❌ ${user.email} login failed: ${result.status} - ${JSON.stringify(result.data)}`);
    return null;
  }
}

async function testEndpoint(name, endpoint, authToken) {
  const result = await apiRequest(endpoint, {
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
  });
  
  if (result.status === 200) {
    console.log(`  ✅ ${name}: Working`);
    return true;
  } else if (result.status === 401) {
    console.log(`  🔒 ${name}: Auth required (${result.status})`);
    return false;
  } else if (result.status === 404) {
    console.log(`  ❓ ${name}: Endpoint not found (${result.status})`);
    return false;
  } else {
    console.log(`  ❌ ${name}: Error ${result.status} - ${JSON.stringify(result.data).substring(0, 100)}`);
    return false;
  }
}

async function main() {
  console.log('🧪 EXISTING USER FEATURE TEST');
  console.log('============================');
  console.log(`🔗 Tenant: ${TENANT_ID}`);
  console.log(`🌐 API: ${API_URL}\n`);

  // Test 1: Admin Login
  console.log('📋 Test 1: Admin Authentication');
  const adminAuth = await login(ADMIN_USER);
  
  // Test 2: Patient Login  
  console.log('\n📋 Test 2: Patient Authentication');
  const patientAuth = await login(PATIENT_USER);
  
  // Test 3: Core Endpoints (Admin)
  if (adminAuth) {
    console.log('\n📋 Test 3: Admin Endpoints');
    await testEndpoint('Patients', '/patients', adminAuth.accessToken);
    await testEndpoint('Providers', '/clinic-management/providers', adminAuth.accessToken);
    await testEndpoint('Appointments', '/appointments', adminAuth.accessToken);
    await testEndpoint('Intake Management', '/intake-management/intakes', adminAuth.accessToken);
    await testEndpoint('Settings', '/settings/clinic', adminAuth.accessToken);
  }
  
  // Test 4: Patient Endpoints
  if (patientAuth) {
    console.log('\n📋 Test 4: Patient Endpoints');
    await testEndpoint('Patient Dashboard', '/patient/dashboard', patientAuth.accessToken);
    await testEndpoint('Patient PROMs', '/patient/proms', patientAuth.accessToken);
    await testEndpoint('Patient Appointments', '/patient/appointments', patientAuth.accessToken);
  }
  
  console.log('\n🎉 FEATURE TEST COMPLETE!');
  console.log('\n📊 Summary:');
  console.log(`👨‍⚕️ Admin Auth: ${adminAuth ? '✅ Working' : '❌ Failed'}`);
  console.log(`🏥 Patient Auth: ${patientAuth ? '✅ Working' : '❌ Failed'}`);
  console.log('🔗 Cross-tenant communication ready for testing');
}

main().catch(console.error);
