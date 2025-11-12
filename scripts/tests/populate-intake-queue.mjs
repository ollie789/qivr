#!/usr/bin/env node

import fetch from 'node-fetch';

const BASE_URL = 'https://clinic.qivr.pro/api';

// Test user credentials (from our previous test)
const testUser = {
  email: 'test1762923257212@example.com',
  password: 'TestPass123!'
};

// Sample intake data
const intakeData = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '555-0101',
    dateOfBirth: '1985-03-15',
    reason: 'Annual checkup',
    symptoms: 'General wellness check',
    urgency: 'routine'
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '555-0102',
    dateOfBirth: '1990-07-22',
    reason: 'Back pain',
    symptoms: 'Lower back pain for 2 weeks',
    urgency: 'moderate'
  },
  {
    firstName: 'Mike',
    lastName: 'Davis',
    email: 'mike.davis@example.com',
    phone: '555-0103',
    dateOfBirth: '1978-11-08',
    reason: 'Follow-up appointment',
    symptoms: 'Blood pressure monitoring',
    urgency: 'routine'
  },
  {
    firstName: 'Emily',
    lastName: 'Wilson',
    email: 'emily.wilson@example.com',
    phone: '555-0104',
    dateOfBirth: '1995-01-30',
    reason: 'Urgent care',
    symptoms: 'Severe headache and nausea',
    urgency: 'urgent'
  },
  {
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@example.com',
    phone: '555-0105',
    dateOfBirth: '1982-09-12',
    reason: 'Skin consultation',
    symptoms: 'Rash on arms',
    urgency: 'moderate'
  }
];

let cookies = '';

function log(message) {
  console.log(`[INTAKE] ${message}`);
}

function extractCookies(response) {
  const setCookieHeaders = response.headers.raw()['set-cookie'];
  if (setCookieHeaders) {
    return setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
  }
  return '';
}

async function login() {
  log('Logging in...');
  
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });

  if (response.ok) {
    cookies = extractCookies(response);
    log('✅ Login successful');
    return true;
  } else {
    const error = await response.text();
    log(`❌ Login failed: ${error}`);
    return false;
  }
}

async function createIntakeEntry(data) {
  log(`Creating intake for ${data.firstName} ${data.lastName}...`);
  
  const response = await fetch(`${BASE_URL}/evaluations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      patientName: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      conditionType: data.reason,
      symptoms: [data.symptoms],
      severity: data.urgency === 'urgent' ? 'high' : data.urgency === 'moderate' ? 'medium' : 'low',
      painLevel: data.urgency === 'urgent' ? 8 : data.urgency === 'moderate' ? 5 : 2,
      status: 'pending',
      submittedAt: new Date().toISOString()
    })
  });

  if (response.ok) {
    const result = await response.json();
    log(`✅ Created intake for ${data.firstName} ${data.lastName} (ID: ${result.id || 'unknown'})`);
    return true;
  } else {
    const error = await response.text();
    log(`❌ Failed to create intake for ${data.firstName} ${data.lastName}: ${error}`);
    return false;
  }
}

async function populateIntakeQueue() {
  console.log('🏥 Populating Intake Queue');
  console.log('─'.repeat(40));

  try {
    // Step 1: Login
    if (!await login()) {
      console.log('❌ Failed to login');
      return;
    }

    // Step 2: Create intake entries
    let successCount = 0;
    for (const data of intakeData) {
      if (await createIntakeEntry(data)) {
        successCount++;
      }
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('─'.repeat(40));
    console.log(`🎉 Intake queue populated!`);
    console.log(`✅ Created ${successCount}/${intakeData.length} intake entries`);
    console.log('');
    console.log('You can now view the intake queue at:');
    console.log('https://clinic.qivr.pro/intake');

  } catch (error) {
    console.log('❌ Error populating intake queue:', error.message);
  }
}

// Run the script
populateIntakeQueue();
