#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'https://clinic.qivr.pro/api';
const testUser = {
  email: 'test1762923257212@example.com',
  password: 'TestPass123!'
};

const testProviders = [
  {
    firstName: 'Dr. Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@clinic.com',
    specialization: 'General Practice',
    department: 'Primary Care',
    isActive: true
  },
  {
    firstName: 'Dr. Michael',
    lastName: 'Chen',
    email: 'michael.chen@clinic.com',
    specialization: 'Cardiology',
    department: 'Cardiology',
    isActive: true
  },
  {
    firstName: 'Dr. Emily',
    lastName: 'Rodriguez',
    email: 'emily.rodriguez@clinic.com',
    specialization: 'Pediatrics',
    department: 'Pediatrics',
    isActive: true
  }
];

let cookies = '';

function extractCookies(response) {
  const setCookieHeaders = response.headers.raw()['set-cookie'];
  if (setCookieHeaders) {
    return setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
  }
  return '';
}

async function login() {
  console.log('🔐 Logging in...');
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });

  if (response.ok) {
    cookies = extractCookies(response);
    console.log('✅ Login successful');
    return true;
  } else {
    const error = await response.text();
    console.log(`❌ Login failed: ${error}`);
    return false;
  }
}

async function addProvider(provider) {
  console.log(`👨‍⚕️ Adding ${provider.firstName} ${provider.lastName}...`);
  
  const response = await fetch(`${BASE_URL}/providers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify(provider)
  });

  if (response.ok) {
    const result = await response.json();
    console.log(`✅ Added ${provider.firstName} ${provider.lastName}`);
    return true;
  } else {
    const error = await response.text();
    console.log(`❌ Failed to add ${provider.firstName} ${provider.lastName}: ${error}`);
    return false;
  }
}

async function testProvidersAPI() {
  console.log('📋 Testing providers API...');
  
  const response = await fetch(`${BASE_URL}/providers`, {
    headers: { 'Cookie': cookies }
  });

  if (response.ok) {
    const providers = await response.json();
    console.log(`✅ Found ${providers.length} providers`);
    providers.forEach(p => console.log(`  - ${p.firstName} ${p.lastName} (${p.specialization})`));
    return true;
  } else {
    const error = await response.text();
    console.log(`❌ Failed to fetch providers: ${error}`);
    return false;
  }
}

async function main() {
  console.log('👥 Adding Test Providers for Settings Page\n');

  if (!await login()) return;

  console.log('\n📋 Testing current providers...');
  await testProvidersAPI();

  console.log('\n➕ Adding new providers...');
  let added = 0;
  for (const provider of testProviders) {
    if (await addProvider(provider)) added++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📋 Final providers list:');
  await testProvidersAPI();

  console.log(`\n🎉 Added ${added}/${testProviders.length} providers`);
  console.log('\n✅ Settings page should now show staff members!');
  console.log('Visit: https://clinic.qivr.pro/settings → Staff tab');
}

main().catch(console.error);
