#!/usr/bin/env node

/**
 * Authenticated User End-to-End Test
 * Tests full API flow with pre-confirmed user
 * 
 * Usage: node test-authenticated-flow.mjs
 */

const API_URL = 'https://clinic.qivr.pro/api';

// Use the confirmed user
const TEST_USER = {
  email: 'test1762774598204@clinic.test',
  password: 'TestPass123!'
};

console.log(`\n🧪 Authenticated User E2E Test`);
console.log(`API: ${API_URL}\n`);

let authCookie = null;
let tenantId = null;
let testData = {};

async function makeRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
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
  
  const response = await fetch(url, { ...options, headers });
  
  // Extract cookies from set-cookie header
  const setCookieHeader = response.headers.get('set-cookie');
  if (setCookieHeader) {
    // Parse multiple cookies
    const cookies = setCookieHeader.split(',').map(c => c.trim().split(';')[0]).join('; ');
    if (cookies) {
      authCookie = cookies;
    }
  }
  
  return response;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

const tests = {
  async testLogin() {
    console.log('\n📋 Test 1: Login');
    
    const response = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });
    
    assert(response.ok, 'Login successful');
    
    const data = await response.json();
    assert(data.userInfo, 'User info returned');
    assert(data.userInfo.tenantId, 'Tenant ID present');
    assert(data.userInfo.role === 'Admin', 'User is Admin');
    assert(authCookie, 'Auth cookie set');
    
    tenantId = data.userInfo.tenantId;
    testData.user = data.userInfo;
    
    console.log(`  📝 Tenant: ${tenantId}`);
    console.log(`  📝 User: ${data.userInfo.email}`);
    console.log(`  📝 Role: ${data.userInfo.role}`);
  },

  async testCreatePatient() {
    console.log('\n📋 Test 2: Create Patient');
    
    const timestamp = Date.now();
    const patientData = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      email: `patient${timestamp}@test.com`,
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
    assert(data.email === patientData.email, 'Patient email correct');
    
    testData.patient = data;
    console.log(`  📝 Patient ID: ${data.id}`);
    console.log(`  📝 Patient: ${data.firstName} ${data.lastName}`);
  },

  async testGetPatients() {
    console.log('\n📋 Test 3: Get Patients List');
    
    const response = await makeRequest('/patients');
    assert(response.ok, 'Patients list retrieved');
    
    const data = await response.json();
    assert(Array.isArray(data.items), 'Returns array of patients');
    assert(data.items.length > 0, 'At least one patient exists');
    assert(data.items.every(p => p.tenantId === tenantId), 'All patients belong to tenant');
    
    console.log(`  📝 Total patients: ${data.items.length}`);
  },

  async testGetPatientById() {
    console.log('\n📋 Test 4: Get Patient by ID');
    
    const response = await makeRequest(`/patients/${testData.patient.id}`);
    assert(response.ok, 'Patient retrieved');
    
    const data = await response.json();
    assert(data.id === testData.patient.id, 'Correct patient returned');
    assert(data.tenantId === tenantId, 'Patient belongs to tenant');
  },

  async testCreateAppointment() {
    console.log('\n📋 Test 5: Create Appointment');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);
    
    const appointmentData = {
      patientId: testData.patient.id,
      providerId: testData.user.username,
      appointmentType: 'Consultation',
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      status: 'Scheduled'
    };
    
    const response = await makeRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
    
    assert(response.ok, 'Appointment created');
    
    const data = await response.json();
    assert(data.id, 'Appointment ID returned');
    assert(data.tenantId === tenantId, 'Appointment belongs to tenant');
    assert(data.patientId === testData.patient.id, 'Correct patient linked');
    
    testData.appointment = data;
    console.log(`  📝 Appointment ID: ${data.id}`);
    console.log(`  📝 Time: ${new Date(data.startTime).toLocaleString()}`);
  },

  async testGetAppointments() {
    console.log('\n📋 Test 6: Get Appointments');
    
    const response = await makeRequest('/appointments');
    assert(response.ok, 'Appointments retrieved');
    
    const data = await response.json();
    assert(Array.isArray(data.items), 'Returns array of appointments');
    assert(data.items.length > 0, 'At least one appointment exists');
    assert(data.items.every(a => a.tenantId === tenantId), 'All appointments belong to tenant');
    
    console.log(`  📝 Total appointments: ${data.items.length}`);
  },

  async testUpdatePatient() {
    console.log('\n📋 Test 7: Update Patient');
    
    const updateData = {
      ...testData.patient,
      phone: '+61400999999'
    };
    
    const response = await makeRequest(`/patients/${testData.patient.id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    
    assert(response.ok, 'Patient updated');
    
    const data = await response.json();
    assert(data.phone === '+61400999999', 'Phone number updated');
  },

  async testDashboardStats() {
    console.log('\n📋 Test 8: Dashboard Stats');
    
    const response = await makeRequest('/dashboard/stats');
    assert(response.ok, 'Dashboard stats retrieved');
    
    const data = await response.json();
    assert(typeof data.totalPatients === 'number', 'Total patients count exists');
    assert(typeof data.totalAppointments === 'number', 'Total appointments count exists');
    assert(data.totalPatients > 0, 'Has patients');
    assert(data.totalAppointments > 0, 'Has appointments');
    
    console.log(`  📝 Patients: ${data.totalPatients}`);
    console.log(`  📝 Appointments: ${data.totalAppointments}`);
  },

  async testTenantIsolation() {
    console.log('\n📋 Test 9: Tenant Isolation');
    
    // Try to access with wrong tenant ID
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

  async testCheckAuth() {
    console.log('\n📋 Test 10: Check Auth Status');
    
    const response = await makeRequest('/auth/check');
    assert(response.ok, 'Auth check successful');
    
    const data = await response.json();
    assert(data.authenticated, 'User is authenticated');
    assert(data.user.tenantId === tenantId, 'Correct tenant context');
  }
};

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
      
      // Continue with other tests
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
    console.log(`   Patient: ${testData.patient?.id}`);
    console.log(`   Appointment: ${testData.appointment?.id}`);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed.`);
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error.message);
  process.exit(1);
});
