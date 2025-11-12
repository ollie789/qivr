#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';

async function testAuth() {
  console.log('🔐 AUTH DEBUG TEST');
  console.log('==================');
  
  // Test 1: Health without tenant (should fail)
  console.log('\n1. Health endpoint (no tenant):');
  const health = await fetch(`${API_URL}/health`);
  console.log(`Status: ${health.status}`);
  console.log(`Response: ${await health.text()}`);
  
  // Test 2: Try login with test credentials
  console.log('\n2. Login attempt:');
  const loginData = {
    email: 'test.doctor@clinic.com',
    password: 'TempPassword123!'
  };
  
  const login = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData)
  });
  
  console.log(`Status: ${login.status}`);
  const loginResponse = await login.text();
  console.log(`Response: ${loginResponse}`);
  
  // Test 3: Check if we have any tenants
  console.log('\n3. List tenants:');
  const tenants = await fetch(`${API_URL}/tenants`);
  console.log(`Status: ${tenants.status}`);
  console.log(`Response: ${await tenants.text()}`);
}

testAuth().catch(console.error);
