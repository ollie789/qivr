#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const TENANT_ID = 'd1466419-46e4-4594-b6d9-523668431e06';
const USER = {
  email: 'test1762923257212@example.com',
  password: 'TestPass123!'
};

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID
    },
    body: JSON.stringify(USER),
    credentials: 'include'
  });
  
  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const cookies = response.headers.raw()['set-cookie'];
  return cookies.map(c => c.split(';')[0]).join('; ');
}

async function testEndpoint(name, path, cookies) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: {
        'Cookie': cookies,
        'X-Tenant-Id': TENANT_ID
      }
    });
    
    const status = response.status;
    const icon = status === 200 ? '✅' : status === 401 ? '🔒' : status === 404 ? '❓' : '❌';
    console.log(`${icon} ${status} ${name.padEnd(40)} ${path}`);
    
    if (status === 500) {
      const text = await response.text();
      console.log(`   Error: ${text.substring(0, 200)}`);
    }
    
    return status;
  } catch (error) {
    console.log(`❌ ERR ${name.padEnd(40)} ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🧪 Testing All API Endpoints\n');
  
  console.log('1️⃣  Logging in...');
  const cookies = await login();
  console.log('   ✅ Logged in\n');
  
  console.log('2️⃣  Testing endpoints...\n');
  
  const endpoints = [
    ['Dashboard Overview', '/clinic-dashboard/overview'],
    ['Analytics', '/clinic-management/analytics?from=2025-10-01&to=2025-11-14'],
    ['Providers List', '/clinic-management/providers'],
    ['Patients List', '/patients'],
    ['Appointments List', '/appointments'],
    ['Evaluations List', '/evaluations'],
    ['Intake Management', '/intake-management/intakes'],
    ['Settings Clinic', '/settings/clinic'],
    ['Settings Users', '/settings/users'],
    ['Notifications', '/notifications?limit=20'],
    ['Tenants', '/tenants'],
    ['User Info', '/auth/user-info'],
  ];
  
  const results = {};
  for (const [name, path] of endpoints) {
    const status = await testEndpoint(name, path, cookies);
    results[status] = (results[status] || 0) + 1;
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ 200 OK: ${results[200] || 0}`);
  console.log(`   ❌ 500 Error: ${results[500] || 0}`);
  console.log(`   🔒 401 Unauthorized: ${results[401] || 0}`);
  console.log(`   ❓ 404 Not Found: ${results[404] || 0}`);
}

main().catch(console.error);
