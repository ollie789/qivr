#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const TENANT_ID = 'd1466419-46e4-4594-b6d9-523668431e06';
const PATIENT_USER = {
  email: 'patient1762923257212@example.com',
  password: 'PatientPass123!'
};

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID
    },
    body: JSON.stringify(PATIENT_USER),
    credentials: 'include'
  });
  
  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const cookies = response.headers.raw()['set-cookie'];
  return cookies.map(c => c.split(';')[0]).join('; ');
}

async function testEndpoint(name, path, cookies, method = 'GET') {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Cookie': cookies,
        'X-Tenant-Id': TENANT_ID
      }
    });
    
    const status = response.status;
    const icon = status === 200 || status === 201 ? '✅' : status === 401 ? '🔒' : status === 404 ? '❓' : '❌';
    console.log(`${icon} ${status} ${name.padEnd(40)} ${method} ${path}`);
    
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
  console.log('🧪 Testing Patient Portal Functionality\n');
  
  console.log('1️⃣  Logging in as patient...');
  const cookies = await login();
  console.log('   ✅ Logged in\n');
  
  console.log('2️⃣  Testing patient endpoints...\n');
  
  const endpoints = [
    ['Patient Dashboard', '/patient/dashboard'],
    ['Patient Profile', '/patient/profile'],
    ['Patient Appointments', '/patient/appointments'],
    ['Patient Documents', '/patient/documents'],
    ['Patient Messages', '/patient/messages'],
    ['Patient PROMs', '/patient/proms'],
    ['Patient PROM Instances', '/patient/proms/instances'],
    ['Patient Evaluations', '/patient/evaluations'],
    ['Patient Medical Records', '/patient/medical-records'],
    ['Available Appointment Slots', '/patient/appointments/available-slots?providerId=00000000-0000-0000-0000-000000000000&date=2025-11-15'],
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
  console.log(`   ⚠️  Other: ${Object.entries(results).filter(([k]) => !['200','500','401','404'].includes(k)).reduce((sum, [,v]) => sum + v, 0)}`);
}

main().catch(console.error);
