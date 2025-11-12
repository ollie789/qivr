#!/usr/bin/env node

import fetch from 'node-fetch';
import { execSync } from 'child_process';

const BASE_URL = 'https://clinic.qivr.pro';
const API_URL = `${BASE_URL}/api`;

// Test user data
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User'
};

const clinicData = {
  clinicName: 'Test Clinic',
  phone: '555-1234',
  address: '123 Test St',
  city: 'Test City',
  state: 'CA',
  zipCode: '12345'
};

let cookies = '';

function log(step, message) {
  console.log(`[${step}] ${message}`);
}

function extractCookies(response) {
  const setCookieHeaders = response.headers.raw()['set-cookie'];
  if (setCookieHeaders) {
    return setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
  }
  return '';
}

async function step1_signup() {
  log('STEP 1', 'Testing user signup...');
  
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password,
      firstName: testUser.firstName,
      lastName: testUser.lastName
    })
  });

  if (response.ok) {
    log('STEP 1', `✅ Signup successful for ${testUser.email}`);
    return true;
  } else {
    const error = await response.text();
    log('STEP 1', `❌ Signup failed: ${error}`);
    return false;
  }
}

async function step2_confirmUser() {
  log('STEP 2', 'Confirming user (simulating email click)...');
  
  try {
    const command = `aws cognito-idp admin-confirm-sign-up --user-pool-id ap-southeast-2_VHnD5yZaA --username ${testUser.email} --region ap-southeast-2`;
    execSync(command, { stdio: 'pipe' });
    log('STEP 2', '✅ User confirmed successfully');
    return true;
  } catch (error) {
    log('STEP 2', `❌ User confirmation failed: ${error.message}`);
    return false;
  }
}

async function step3_login() {
  log('STEP 3', 'Testing user login...');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUser.email,
      password: testUser.password
    })
  });

  if (response.ok) {
    const data = await response.json();
    cookies = extractCookies(response);
    log('STEP 3', `✅ Login successful. TenantId: ${data.userInfo?.tenantId || 'null'}`);
    
    if (!data.userInfo?.tenantId) {
      log('STEP 3', '📝 No tenant found - clinic registration needed');
    }
    
    return { success: true, userInfo: data.userInfo };
  } else {
    const error = await response.text();
    log('STEP 3', `❌ Login failed: ${error}`);
    return { success: false };
  }
}

async function step4_clinicRegistration() {
  log('STEP 4', 'Testing clinic registration...');
  
  const response = await fetch(`${API_URL}/tenant-onboarding/register-clinic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      CognitoSub: 'auto-filled-by-backend',
      ClinicName: clinicData.clinicName,
      Email: testUser.email,
      Phone: clinicData.phone,
      FirstName: testUser.firstName,
      LastName: testUser.lastName,
      Address: clinicData.address,
      City: clinicData.city,
      State: clinicData.state,
      ZipCode: clinicData.zipCode
    })
  });

  if (response.ok) {
    const data = await response.json();
    log('STEP 4', `✅ Clinic registration successful: ${clinicData.clinicName}`);
    return { success: true, data };
  } else {
    const error = await response.text();
    log('STEP 4', `❌ Clinic registration failed: ${error}`);
    return { success: false };
  }
}

async function step5_verifyDashboardAccess() {
  log('STEP 5', 'Testing dashboard access...');
  
  const response = await fetch(`${API_URL}/auth/user-info`, {
    method: 'GET',
    headers: { 'Cookie': cookies }
  });

  if (response.ok) {
    const userInfo = await response.json();
    log('STEP 5', `✅ Dashboard access verified. TenantId: ${userInfo.tenantId}`);
    return { success: true, userInfo };
  } else {
    const error = await response.text();
    log('STEP 5', `❌ Dashboard access failed: ${error}`);
    return { success: false };
  }
}

async function runFullTest() {
  console.log('🚀 Starting Frontend Flow Test');
  console.log(`📧 Test user: ${testUser.email}`);
  console.log(`🏥 Test clinic: ${clinicData.clinicName}`);
  console.log('─'.repeat(50));

  try {
    // Step 1: Signup
    if (!await step1_signup()) {
      console.log('❌ Test failed at signup step');
      return;
    }

    // Wait for user creation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Confirm user
    if (!await step2_confirmUser()) {
      console.log('❌ Test failed at user confirmation step');
      return;
    }

    // Step 3: Login
    const loginResult = await step3_login();
    if (!loginResult.success) {
      console.log('❌ Test failed at login step');
      return;
    }

    // Step 4: Clinic Registration
    const clinicResult = await step4_clinicRegistration();
    if (!clinicResult.success) {
      console.log('❌ Test failed at clinic registration step');
      return;
    }

    // Step 5: Verify Dashboard Access
    const dashboardResult = await step5_verifyDashboardAccess();
    if (!dashboardResult.success) {
      console.log('❌ Test failed at dashboard verification step');
      return;
    }

    console.log('─'.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Complete frontend flow working:');
    console.log('   1. User signup');
    console.log('   2. Email confirmation');
    console.log('   3. User login');
    console.log('   4. Clinic registration');
    console.log('   5. Dashboard access');

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Run the test
runFullTest();
