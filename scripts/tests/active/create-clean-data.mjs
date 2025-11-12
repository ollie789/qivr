#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';

async function createCleanTestData() {
  console.log('🧹 Creating Clean Test Data');
  console.log('============================');
  
  // Register a fresh clinic (this creates tenant + user in one go)
  const signupData = {
    email: 'fresh.test@clinic.com',
    password: 'TestPass123!',
    firstName: 'Fresh',
    lastName: 'Test',
    clinicName: 'Fresh Test Clinic'
  };
  
  console.log('📝 Registering fresh clinic...');
  const signup = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signupData)
  });
  
  console.log(`Status: ${signup.status}`);
  const signupResponse = await signup.text();
  console.log(`Response: ${signupResponse}`);
  
  if (signup.ok) {
    console.log('✅ Fresh test data created!');
    console.log('🧪 Test credentials:');
    console.log('   Email: fresh.test@clinic.com');
    console.log('   Password: TestPass123!');
  } else {
    console.log('❌ Failed to create test data');
  }
}

createCleanTestData().catch(console.error);
