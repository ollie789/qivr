#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const TENANT_ID = 'd1466419-46e4-4594-b6d9-523668431e06';
const USER = {
  email: 'test1762923257212@example.com',
  password: 'TestPass123!'
};

function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('🔐 JWT Authentication Debug\n');
  
  // Step 1: Login
  console.log('1️⃣  Logging in...');
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID
    },
    body: JSON.stringify(USER)
  });
  
  const loginData = await loginResponse.json();
  console.log(`   Status: ${loginResponse.status}`);
  
  if (loginResponse.status !== 200) {
    console.log(`   ❌ Login failed:`, loginData);
    return;
  }
  
  console.log(`   ✅ Login successful`);
  console.log(`   Response:`, JSON.stringify(loginData, null, 2));
  console.log();
  
  // Step 2: Decode JWT
  console.log('2️⃣  Decoding JWT token...');
  const accessToken = loginData.accessToken || loginData.AccessToken || loginData.access_token;
  if (!accessToken) {
    console.log('   ❌ No access token found in response');
    return;
  }
  
  const decoded = decodeJWT(accessToken);
  if (decoded) {
    console.log('   JWT Claims:');
    console.log(JSON.stringify(decoded, null, 2));
  } else {
    console.log('   ❌ Failed to decode JWT');
  }
  
  // Step 3: Test API call with token
  console.log('\n3️⃣  Testing API call with Bearer token...');
  const apiResponse = await fetch(`${API_URL}/patients`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Tenant-Id': TENANT_ID
    }
  });
  
  console.log(`   Status: ${apiResponse.status}`);
  const responseText = await apiResponse.text();
  console.log(`   Response: ${responseText.substring(0, 200)}`);
  
  // Step 4: Check what the backend sees
  console.log('\n4️⃣  Checking authentication header format...');
  console.log(`   Token length: ${accessToken.length} chars`);
  console.log(`   Token prefix: ${accessToken.substring(0, 20)}...`);
  console.log(`   Token suffix: ...${accessToken.substring(accessToken.length - 20)}`);
}

main().catch(console.error);
