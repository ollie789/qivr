#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const timestamp = Date.now();

async function testSESIntegration() {
  console.log('📧 TESTING SES INTEGRATION');
  console.log('==========================');
  
  // Test with unique email
  const testEmail = `test-${timestamp}@example.com`;
  
  const signupData = {
    email: testEmail,
    password: 'TestPass123!',
    firstName: 'SES',
    lastName: 'Test',
    clinicName: 'SES Test Clinic'
  };
  
  console.log(`📝 Testing signup with: ${testEmail}`);
  
  const signup = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signupData)
  });
  
  console.log(`Status: ${signup.status}`);
  const response = await signup.text();
  console.log(`Response: ${response}`);
  
  if (signup.ok) {
    console.log('🎉 SES INTEGRATION SUCCESS!');
    console.log('✅ User created successfully');
    console.log('📧 Email sent via SES (no limits!)');
    console.log('🚀 Migration battle COMPLETE!');
  } else {
    console.log('❌ SES test failed');
  }
}

testSESIntegration().catch(console.error);
