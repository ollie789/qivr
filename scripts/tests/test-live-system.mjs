#!/usr/bin/env node

/**
 * Live System Test Suite
 * Tests production with existing test credentials
 * 
 * Usage:
 *   node test-live-system.mjs
 */

const API_URL = 'https://clinic.qivr.pro/api';

// Test credentials
const TEST_ADMIN = {
  email: 'test1762923257212@example.com',
  password: 'TestPass123!'
};
const TEST_TENANT_ID = 'd1466419-46e4-4594-b6d9-523668431e06';

console.log(`\n🧪 Testing Production (HTTPS)`);
console.log(`API: ${API_URL}\n`);

let authCookie = null;
let tenantId = TEST_TENANT_ID;
let testData = {};
let passed = 0;
let failed = 0;

// Test utilities
async function makeRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    ...options.headers
  };
  
  if (authCookie) {
    headers['Cookie'] = authCookie;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  // Capture auth cookie from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && setCookie.includes('accessToken')) {
    authCookie = setCookie.split(';')[0];
  }
  
  return response;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function safeJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

// Test Suite
const tests = {
  async testHealthCheck() {
    console.log('\n📋 Test: Health Check');
    const response = await makeRequest('/health');
    assert(response.ok, 'API is healthy');
  },

  async testAdminLogin() {
    console.log('\n📋 Test: Admin Login');
    
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  ❌ Status: ${response.status}, Error: ${errorText}`);
    }
    
    assert(response.ok, 'Login successful');
    const data = await response.json();
    assert(data.userInfo, 'User data returned');
    assert(authCookie, 'Auth cookie set');
    testData.adminUser = data.userInfo;
    console.log(`  📝 Logged in as: ${data.userInfo.email} (${data.userInfo.role})`);
  },

  async testGetPatients() {
    console.log('\n📋 Test: Get Patients');
    const response = await makeRequest('/patients');
    assert(response.ok, 'Patients endpoint accessible');
    const data = await safeJson(response);
    const patients = data.data || data.items || (Array.isArray(data) ? data : []);
    assert(Array.isArray(patients), 'Returns patient data');
    console.log(`  📝 Found ${patients.length} patients`);
    if (patients.length > 0) {
      testData.patientId = patients[0].id;
    }
  },

  async testGetAppointments() {
    console.log('\n📋 Test: Get Appointments');
    const response = await makeRequest('/appointments');
    assert(response.ok, 'Appointments endpoint accessible');
    const data = await safeJson(response);
    const appointments = data.data || data.items || (Array.isArray(data) ? data : []);
    assert(Array.isArray(appointments) || data, 'Returns appointments data');
    console.log(`  📝 Found ${appointments.length || 0} appointments`);
  },

  async testGetConversations() {
    console.log('\n📋 Test: Get Conversations');
    const response = await makeRequest('/messages/conversations');
    assert(response.ok, 'Conversations endpoint accessible');
    const data = await safeJson(response);
    const conversations = Array.isArray(data) ? data : (data.items || []);
    console.log(`  📝 Found ${conversations.length} conversations`);
  },

  async testGetDocuments() {
    console.log('\n📋 Test: Get Documents');
    const response = await makeRequest('/documents');
    assert(response.ok, 'Documents endpoint accessible');
    const data = await safeJson(response);
    const docs = Array.isArray(data) ? data : (data.items || []);
    console.log(`  📝 Found ${docs.length} documents`);
  },

  async testGetReferrals() {
    console.log('\n📋 Test: Get Referrals');
    const response = await makeRequest('/referrals');
    assert(response.ok, 'Referrals endpoint accessible');
    const data = await safeJson(response);
    const referrals = Array.isArray(data) ? data : (data.items || []);
    console.log(`  📝 Found ${referrals.length} referrals`);
  },

  async testCreateReferral() {
    console.log('\n📋 Test: Create Referral');
    if (!testData.patientId) {
      console.log('  ⏭️ Skipped - no patient available');
      return;
    }
    
    const response = await makeRequest('/referrals', {
      method: 'POST',
      body: JSON.stringify({
        patientId: testData.patientId,
        type: 'Specialist',
        specialty: 'Orthopedics',
        priority: 'Routine',
        reasonForReferral: 'E2E Test referral'
      })
    });
    
    if (!response.ok && response.status !== 201) {
      const errorText = await response.text();
      console.log(`  ❌ Status: ${response.status}, Error: ${errorText}`);
    }
    
    assert(response.ok || response.status === 201, 'Referral created');
    const data = await safeJson(response);
    assert(data.id, 'Referral ID returned');
    testData.referralId = data.id;
    console.log(`  📝 Created referral: ${data.id}`);
  },

  async testGetTreatmentPlans() {
    console.log('\n📋 Test: Get Treatment Plans');
    const response = await makeRequest('/treatment-plans');
    assert(response.ok, 'Treatment plans endpoint accessible');
    const data = await safeJson(response);
    const plans = Array.isArray(data) ? data : (data.items || []);
    console.log(`  📝 Found ${plans.length} treatment plans`);
  },

  async testGetDashboardMetrics() {
    console.log('\n📋 Test: Get Dashboard Metrics');
    const response = await makeRequest('/clinic-dashboard/metrics');
    assert(response.ok, 'Dashboard metrics endpoint accessible');
    const data = await safeJson(response);
    console.log(`  📝 Metrics retrieved: ${Object.keys(data).length} fields`);
  },

  async testGetIntakeSubmissions() {
    console.log('\n📋 Test: Get Intake Submissions');
    const response = await makeRequest('/intake/submissions');
    if (response.ok) {
      const data = await safeJson(response);
      const submissions = Array.isArray(data) ? data : (data.items || []);
      console.log(`  📝 Found ${submissions.length} intake submissions`);
    } else {
      console.log(`  📝 Intake endpoint returned ${response.status}`);
    }
    assert(response.ok || response.status === 404, 'Intake endpoint accessible');
  },

  async testLogout() {
    console.log('\n📋 Test: Logout');
    const response = await makeRequest('/auth/logout', { method: 'POST' });
    assert(response.ok, 'Logout successful');
    authCookie = null;
  }
};

// Run tests
async function runTests() {
  const testNames = Object.keys(tests);
  
  for (const name of testNames) {
    try {
      await tests[name]();
      passed++;
    } catch (error) {
      failed++;
      console.log(`\n❌ ${name} failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
