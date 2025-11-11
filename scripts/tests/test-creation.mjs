#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const timestamp = Date.now();

async function testRegistration() {
  console.log('\n📋 Test 1: Create New Clinic');
  
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
    const error = await response.text();
    throw new Error(`Registration failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('  ✅ Registration successful');
  console.log(`  📝 Tenant: ${data.tenantId}`);
  console.log(`  📝 Email: test${timestamp}@clinic.test`);
  
  return data;
}

async function runTests() {
  try {
    console.log('\n🧪 CREATION TESTS');
    console.log(`API: ${API_URL}`);
    
    const registration = await testRegistration();
    
    console.log('\n🎉 CREATION TEST PASSED!');
    console.log('\n✅ New clinic created');
    console.log('✅ User registered');
    console.log('✅ Ready for functionality testing');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
