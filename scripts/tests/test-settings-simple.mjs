#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'https://clinic.qivr.pro/api';

async function testEndpoint(path, description) {
  console.log(`Testing ${description}: ${path}`);
  
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Cookie': 'auth-token=test' }
  });
  
  console.log(`  Status: ${response.status}`);
  const text = await response.text();
  
  if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
    console.log(`  Response: HTML page (likely 404/error)`);
  } else {
    console.log(`  Response: ${text.substring(0, 100)}...`);
  }
  
  return response.status < 500;
}

async function main() {
  console.log('🔍 Testing Settings Page Endpoints\n');
  
  const endpoints = [
    ['/providers', 'Providers API'],
    ['/staff', 'Staff API (alternative)'],
    ['/users', 'Users API'],
    ['/tenants/current', 'Current Tenant'],
    ['/auth/me', 'Current User']
  ];
  
  for (const [path, desc] of endpoints) {
    await testEndpoint(path, desc);
    console.log('');
  }
}

main().catch(console.error);
