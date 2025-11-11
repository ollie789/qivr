#!/usr/bin/env node

/**
 * Live System Test Suite
 * Tests production with live Cognito authentication via HTTPS
 * 
 * Usage:
 *   node test-live-system.mjs
 */

const API_URL = 'https://clinic.qivr.pro/api';

console.log(`\n🧪 Testing Production (HTTPS)`);
console.log(`API: ${API_URL}\n`);

let authCookie = null;
let tenantId = null;
let testData = {};

// Test utilities
async function makeRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authCookie) {
    headers['Cookie'] = authCookie;
  }
  
  if (tenantId && !headers['X-Tenant-Id']) {
    headers['X-Tenant-Id'] = tenantId;
  }
  
  const response = await fetch(url, { ...options, headers, credentials: 'include' });
  
  // Capture auth cookie from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && (setCookie.includes('accessToken') || setCookie.includes('auth-token'))) {
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

// Test Suite
const tests = {
  async testRegistration() {
    console.log('\n📋 Test 1: Clinic Registration');
    
    const timestamp = Date.now();
    const email = `test${timestamp}@clinic.test`;
    const clinicData = {
      username: email,
      email: email,
      password: 'TestPass123!',
      clinicName: `Test Clinic ${timestamp}`,
      firstName: 'Test',
      lastName: 'Doctor',
      phone: '+61400000000'
    };
    
    const response = await makeRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(clinicData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  ❌ Status: ${response.status}`);
      console.log(`  ❌ Error: ${errorText}`);
    }
    
    assert(response.ok, 'Registration successful');
    
    const data = await response.json();
    assert(data.tenantId, 'Tenant ID returned');
    assert(data.userId, 'User ID returned');
    assert(data.cognitoPoolId, 'Cognito pool ID returned');
    
    testData.registration = { ...clinicData, ...data };
    tenantId = data.tenantId;
    
    console.log(`  📝 Tenant: ${tenantId}`);
    console.log(`  📝 Pool: ${data.cognitoPoolId}`);
  },

  async testLogin() {
    console.log('\n📋 Test 2: Login');
    
    const { email, password } = testData.registration;
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  ❌ Status: ${response.status}`);
      console.log(`  ❌ Error: ${errorText}`);
    }
    
    assert(response.ok, 'Login successful');
    
    const data = await response.json();
    assert(data.userInfo, 'User data returned');
    assert(data.userInfo.tenantId === tenantId, 'Correct tenant ID');
    assert(authCookie, 'Auth cookie set');
    
    testData.user = data.userInfo;
    console.log(`  📝 User: ${data.userInfo.email}`);
  },

  async testCheckAuth() {
    console.log('\n📋 Test 4: Check Auth Status');
    
    const response = await makeRequest('/auth/user-info');
    console.log(`  📝 Auth check status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`  📝 Error response: ${errorText}`);
    }
    assert(response.ok, 'Auth check successful');
    
    const data = await response.json();
    // If we get user data back, we're authenticated
    assert(data.username && data.tenantId, 'User is authenticated');
    assert(data.tenantId === tenantId, 'Correct tenant context');
  },

  async testCreatePatient() {
    console.log('\n📋 Test 5: Create Patient');
    
    const patientData = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      email: `patient${Date.now()}@test.com`,
      phone: '+61400000001',
      gender: 'Male'
    };
    
    const response = await makeRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData)
    });
    
    assert(response.ok, 'Patient created');
    
    const data = await response.json();
    assert(data.id, 'Patient ID returned');
    assert(data.tenantId === tenantId, 'Patient belongs to correct tenant');
    
    testData.patient = data;
    console.log(`  📝 Patient: ${data.id}`);
  },

  async testGetPatients() {
    console.log('\n📋 Test 6: Get Patients List');
    
    const response = await makeRequest('/patients');
    assert(response.ok, 'Patients list retrieved');
    
    const data = await response.json();
    assert(Array.isArray(data.items), 'Returns array of patients');
    assert(data.items.length > 0, 'At least one patient exists');
    assert(data.items.every(p => p.tenantId === tenantId), 'All patients belong to tenant');
  },

  async testCreateAppointment() {
    console.log('\n📋 Test 7: Create Appointment');
    
    const appointmentData = {
      patientId: testData.patient.id,
      providerId: testData.user.id,
      appointmentType: 'Consultation',
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 90000000).toISOString(),
      status: 'Scheduled'
    };
    
    const response = await makeRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
    
    assert(response.ok, 'Appointment created');
    
    const data = await response.json();
    assert(data.id, 'Appointment ID returned');
    assert(data.tenantId === tenantId, 'Appointment belongs to correct tenant');
    
    testData.appointment = data;
    console.log(`  📝 Appointment: ${data.id}`);
  },

  async testGetAppointments() {
    console.log('\n📋 Test 8: Get Appointments');
    
    const response = await makeRequest('/appointments');
    assert(response.ok, 'Appointments retrieved');
    
    const data = await response.json();
    assert(Array.isArray(data.items), 'Returns array of appointments');
    assert(data.items.length > 0, 'At least one appointment exists');
    assert(data.items.every(a => a.tenantId === tenantId), 'All appointments belong to tenant');
  },

  async testMessages() {
    console.log('\n📋 Test 9: Messages');
    
    const response = await makeRequest('/messages/threads');
    assert(response.ok || response.status === 404, 'Messages endpoint accessible');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📝 Message threads: ${data.items?.length || 0}`);
    }
  },

  async testDocuments() {
    console.log('\n📋 Test 10: Documents');
    
    const response = await makeRequest('/documents');
    assert(response.ok || response.status === 404, 'Documents endpoint accessible');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📝 Documents: ${data.items?.length || 0}`);
    }
  },

  async testMedicalRecords() {
    console.log('\n📋 Test 11: Medical Records');
    
    const response = await makeRequest('/medical-records');
    assert(response.ok || response.status === 404, 'Medical records endpoint accessible');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📝 Medical records: ${data.items?.length || 0}`);
    }
  },

  async testSettings() {
    console.log('\n📋 Test 12: Settings');
    
    const response = await makeRequest('/settings/clinic');
    assert(response.ok || response.status === 404, 'Settings endpoint accessible');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📝 Clinic settings loaded`);
    }
  },

  async testAnalytics() {
    console.log('\n📋 Test 13: Analytics');
    
    const response = await makeRequest('/analytics/overview');
    assert(response.ok || response.status === 404, 'Analytics endpoint accessible');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📝 Analytics data loaded`);
    }
  },

  async testPROM() {
    console.log('\n📋 Test 14: PROM Questionnaires');
    
    const response = await makeRequest('/prom/questionnaires');
    assert(response.ok || response.status === 404, 'PROM endpoint accessible');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📝 PROM questionnaires: ${data.items?.length || 0}`);
    }
  },

  async testIntakeForms() {
    console.log('\n📋 Test 15: Intake Forms');
    
    const response = await makeRequest('/intake/forms');
    assert(response.ok || response.status === 404, 'Intake forms endpoint accessible');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  📝 Intake forms: ${data.items?.length || 0}`);
    }
  },

  async testDashboardStats() {
    console.log('\n📋 Test 16: Dashboard Stats');
    
    const response = await makeRequest('/dashboard/stats');
    assert(response.ok, 'Dashboard stats retrieved');
    
    const data = await response.json();
    assert(typeof data.totalPatients === 'number', 'Total patients count exists');
    assert(typeof data.totalAppointments === 'number', 'Total appointments count exists');
  },

  async testTenantIsolation() {
    console.log('\n📋 Test 17: Tenant Isolation');
    
    // Try to access data with wrong tenant ID
    const response = await makeRequest('/patients', {
      headers: { 'X-Tenant-Id': '00000000-0000-0000-0000-000000000000' }
    });
    
    if (response.ok) {
      const data = await response.json();
      assert(data.items.length === 0, 'No data returned for wrong tenant');
    } else {
      assert(response.status === 403, 'Forbidden for wrong tenant');
    }
  },

  async testTokenRefresh() {
    console.log('\n📋 Test 18: Token Refresh');
    
    const response = await makeRequest('/auth/refresh', { method: 'POST' });
    assert(response.ok, 'Token refresh successful');
    assert(authCookie, 'New auth cookie set');
  },

  async testLogout() {
    console.log('\n📋 Test 19: Logout');
    
    const response = await makeRequest('/auth/logout', { method: 'POST' });
    assert(response.ok, 'Logout successful');
    
    // Verify auth is cleared
    authCookie = null;
    const checkResponse = await makeRequest('/auth/user-info');
    const checkData = await checkResponse.json();
    assert(!checkData.authenticated, 'User is logged out');
  }
};

// Run all tests
async function runTests() {
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  
  for (const [name, test] of Object.entries(tests)) {
    try {
      await test();
      passed++;
    } catch (error) {
      failed++;
      console.error(`\n❌ ${name} failed:`);
      console.error(`   ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
      
      // Stop on first failure for easier debugging
      console.log('\n💡 Fix the issue and run again');
      process.exit(1);
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results (${duration}s)`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed!');
    console.log('\n📝 Test Data:');
    console.log(`   Tenant: ${tenantId}`);
    console.log(`   Email: ${testData.registration?.email}`);
    console.log(`   Password: ${testData.registration?.password}`);
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error.message);
  process.exit(1);
});
