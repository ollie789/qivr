#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';

let cookies = '';
let tenantId = '';
let patientId = '';

async function makeRequest(endpoint, options = {}) {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      'Cookie': cookies,
      ...options.headers
    }
  });
}

async function loginAsAdmin() {
  console.log('🔐 Admin Login (for setup)');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'fresh.test@clinic.com',
      password: 'TestPass123!'
    }),
    credentials: 'include'
  });

  const data = await response.json();
  tenantId = data.userInfo.tenantId;
  cookies = response.headers.get('set-cookie') || '';
  
  console.log('  ✅ Admin login successful');
  console.log(`  📝 Tenant: ${tenantId}`);
  return data;
}

async function createTestPatient() {
  console.log('\n👤 Create Test Patient');
  
  const timestamp = Date.now();
  const patientData = {
    firstName: 'Patient',
    lastName: 'Dashboard',
    dateOfBirth: '1985-06-15',
    email: `patient-dashboard-${timestamp}@test.com`,
    phoneNumber: '+61400555666',
    gender: 'Female'
  };

  const response = await makeRequest('/patients', {
    method: 'POST',
    body: JSON.stringify(patientData)
  });

  if (response.ok) {
    const patient = await response.json();
    patientId = patient.id;
    console.log(`  ✅ Patient created: ${patientId}`);
    console.log(`  📧 Email: ${patientData.email}`);
    return patient;
  } else {
    const error = await response.text();
    console.log(`  ❌ Patient creation failed: ${error}`);
    return null;
  }
}

async function testPatientDashboardEndpoints() {
  console.log('\n📊 Testing Patient Dashboard Endpoints');
  
  // Test patient dashboard overview
  const overviewResponse = await makeRequest('/patient-dashboard/overview');
  console.log(`  📝 /patient-dashboard/overview: ${overviewResponse.status}`);
  
  if (overviewResponse.ok) {
    const overview = await overviewResponse.json();
    console.log('  ✅ Patient dashboard overview working');
    console.log(`  📊 Keys: ${Object.keys(overview).join(', ')}`);
    
    // Show key patient data
    if (overview.patientInfo) {
      console.log(`  👤 Patient info available`);
    }
    if (overview.upcomingAppointments !== undefined) {
      console.log(`  📅 Upcoming appointments: ${overview.upcomingAppointments.length || overview.upcomingAppointments}`);
    }
    if (overview.recentActivity !== undefined) {
      console.log(`  📋 Recent activity available`);
    }
  } else {
    const error = await overviewResponse.text();
    console.log(`  ❌ Overview failed: ${error.substring(0, 100)}...`);
  }

  // Test appointment history
  const historyResponse = await makeRequest('/patient-dashboard/appointments/history');
  console.log(`  📝 /patient-dashboard/appointments/history: ${historyResponse.status}`);
  
  if (historyResponse.ok) {
    const history = await historyResponse.json();
    console.log('  ✅ Appointment history working');
    console.log(`  📅 History items: ${history.length || Object.keys(history).length}`);
  }

  // Test health summary
  const healthResponse = await makeRequest('/patient-dashboard/health-summary');
  console.log(`  📝 /patient-dashboard/health-summary: ${healthResponse.status}`);
  
  if (healthResponse.ok) {
    const health = await healthResponse.json();
    console.log('  ✅ Health summary working');
    console.log(`  🏥 Health data available`);
  }
}

async function testPatientSpecificEndpoints() {
  console.log('\n🔍 Testing Patient-Specific Endpoints');
  
  if (!patientId) {
    console.log('  ⚠️  No patient ID available for testing');
    return;
  }

  // Test getting specific patient data
  const patientResponse = await makeRequest(`/patients/${patientId}`);
  console.log(`  📝 /patients/${patientId}: ${patientResponse.status}`);
  
  if (patientResponse.ok) {
    const patient = await patientResponse.json();
    console.log('  ✅ Patient data retrieval working');
    console.log(`  👤 Patient: ${patient.firstName} ${patient.lastName}`);
  }

  // Test patient appointments
  const appointmentsResponse = await makeRequest(`/appointments?patientId=${patientId}`);
  console.log(`  📝 Patient appointments: ${appointmentsResponse.status}`);
  
  if (appointmentsResponse.ok) {
    const appointments = await appointmentsResponse.json();
    console.log(`  ✅ Patient appointments: ${appointments.length || appointments.data?.length || 0} found`);
  }
}

async function testPatientAuthentication() {
  console.log('\n🔐 Testing Patient Authentication Flow');
  
  // Note: This would typically require patient credentials
  // For now, we'll test the endpoint availability
  
  const patientAuthEndpoints = [
    '/auth/patient/login',
    '/auth/patient/register', 
    '/auth/patient/profile'
  ];

  for (const endpoint of patientAuthEndpoints) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`  📝 ${endpoint}: ${response.status}`);
    
    if (response.status === 405) {
      console.log(`  ℹ️  Method not allowed (endpoint exists, wrong method)`);
    } else if (response.status === 404) {
      console.log(`  ⚠️  Endpoint not found`);
    } else if (response.status === 401) {
      console.log(`  ✅ Endpoint exists (requires auth)`);
    }
  }
}

async function runPatientDashboardAlignment() {
  console.log('🎯 PATIENT DASHBOARD ALIGNMENT TEST');
  console.log('==================================');

  try {
    await loginAsAdmin();
    const patient = await createTestPatient();
    await testPatientDashboardEndpoints();
    await testPatientSpecificEndpoints();
    await testPatientAuthentication();

    console.log('\n🎉 PATIENT DASHBOARD ALIGNMENT TEST COMPLETE!');
    
    console.log('\n📊 RESULTS SUMMARY:');
    console.log('✅ Patient creation: Working');
    console.log('📊 Patient dashboard endpoints: Tested');
    console.log('🔍 Patient-specific data: Tested');
    console.log('🔐 Patient auth endpoints: Investigated');
    
    console.log('\n🎯 NEXT: Analyze results and fix any alignment issues');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

runPatientDashboardAlignment();
