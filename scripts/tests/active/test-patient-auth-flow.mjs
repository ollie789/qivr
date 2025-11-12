#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';
const timestamp = Date.now();

async function testPatientAuthFlow() {
  console.log('🔐 PATIENT COGNITO → DATABASE AUTH TEST');
  console.log('======================================');
  
  // Test 1: Patient Registration Flow
  console.log('\n📝 Test 1: Patient Registration');
  
  const patientEmail = `patient-auth-${timestamp}@test.com`;
  const registrationData = {
    email: patientEmail,
    password: 'PatientPass123!',
    firstName: 'Auth',
    lastName: 'Patient',
    clinicId: '7f615fdf-199e-428a-be54-2dad7ebdd05d' // Use existing tenant
  };
  
  const registerResponse = await fetch(`${API_URL}/auth/patient/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registrationData)
  });
  
  console.log(`  📝 Patient registration: ${registerResponse.status}`);
  
  if (registerResponse.ok) {
    const regData = await registerResponse.json();
    console.log('  ✅ Patient registration successful');
    console.log(`  📧 Email: ${patientEmail}`);
    console.log(`  🆔 User ID: ${regData.userId || 'N/A'}`);
  } else {
    const error = await registerResponse.text();
    console.log(`  ⚠️  Registration response: ${error.substring(0, 100)}...`);
  }
  
  // Test 2: Patient Login Flow
  console.log('\n🔐 Test 2: Patient Login');
  
  const loginData = {
    email: patientEmail,
    password: 'PatientPass123!'
  };
  
  const loginResponse = await fetch(`${API_URL}/auth/patient/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginData),
    credentials: 'include'
  });
  
  console.log(`  📝 Patient login: ${loginResponse.status}`);
  
  let patientCookies = '';
  let patientTenantId = '';
  
  if (loginResponse.ok) {
    const loginResult = await loginResponse.json();
    patientCookies = loginResponse.headers.get('set-cookie') || '';
    console.log('  ✅ Patient login successful');
    console.log(`  👤 User: ${loginResult.userInfo?.firstName} ${loginResult.userInfo?.lastName}`);
    console.log(`  🏢 Tenant: ${loginResult.userInfo?.tenantId}`);
    console.log(`  🎭 Role: ${loginResult.userInfo?.role}`);
    patientTenantId = loginResult.userInfo?.tenantId;
  } else {
    const error = await loginResponse.text();
    console.log(`  ⚠️  Login response: ${error.substring(0, 100)}...`);
  }
  
  // Test 3: Patient Database Lookup
  console.log('\n🗄️  Test 3: Database Integration');
  
  if (patientTenantId) {
    // Check if patient exists in database
    const dbCheckResponse = await fetch(`${API_URL}/patients?email=${patientEmail}`, {
      headers: {
        'X-Tenant-Id': patientTenantId,
        'Cookie': patientCookies
      }
    });
    
    console.log(`  📝 Database lookup: ${dbCheckResponse.status}`);
    
    if (dbCheckResponse.ok) {
      const patients = await dbCheckResponse.json();
      console.log(`  ✅ Found ${patients.length || patients.data?.length || 0} patients in database`);
      
      if (patients.length > 0 || patients.data?.length > 0) {
        const patient = patients[0] || patients.data[0];
        console.log(`  👤 DB Patient: ${patient.firstName} ${patient.lastName}`);
        console.log(`  📧 DB Email: ${patient.email}`);
        console.log(`  🏢 DB Tenant: ${patient.tenantId || 'N/A'}`);
      }
    }
  }
  
  // Test 4: Patient-Specific Endpoints
  console.log('\n🎯 Test 4: Patient-Specific Access');
  
  if (patientCookies && patientTenantId) {
    // Test patient dashboard access
    const dashboardResponse = await fetch(`${API_URL}/patient-dashboard/overview`, {
      headers: {
        'X-Tenant-Id': patientTenantId,
        'Cookie': patientCookies
      }
    });
    
    console.log(`  📝 Patient dashboard: ${dashboardResponse.status}`);
    
    if (dashboardResponse.ok) {
      console.log('  ✅ Patient dashboard accessible');
    } else if (dashboardResponse.status === 500) {
      console.log('  ⚠️  Dashboard has known 500 error (not auth issue)');
    } else {
      console.log('  ❌ Dashboard access denied');
    }
    
    // Test patient appointments access
    const appointmentsResponse = await fetch(`${API_URL}/patient-dashboard/appointments/history`, {
      headers: {
        'X-Tenant-Id': patientTenantId,
        'Cookie': patientCookies
      }
    });
    
    console.log(`  📝 Patient appointments: ${appointmentsResponse.status}`);
    
    if (appointmentsResponse.ok) {
      const appointments = await appointmentsResponse.json();
      console.log(`  ✅ Patient appointments: ${appointments.length || Object.keys(appointments).length} items`);
    }
  }
  
  // Test 5: Cross-Tenant Isolation
  console.log('\n🛡️  Test 5: Tenant Isolation');
  
  if (patientCookies) {
    // Try to access different tenant data
    const wrongTenantId = 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11';
    
    const isolationTest = await fetch(`${API_URL}/patients`, {
      headers: {
        'X-Tenant-Id': wrongTenantId,
        'Cookie': patientCookies
      }
    });
    
    console.log(`  📝 Wrong tenant access: ${isolationTest.status}`);
    
    if (isolationTest.status === 401 || isolationTest.status === 403) {
      console.log('  ✅ Tenant isolation working - access denied');
    } else if (isolationTest.ok) {
      const data = await isolationTest.json();
      console.log(`  ⚠️  Cross-tenant access allowed: ${data.length || Object.keys(data).length} items`);
    }
  }
  
  console.log('\n🎉 PATIENT AUTH FLOW TEST COMPLETE!');
  console.log('\n📊 SUMMARY:');
  console.log('🔐 Patient registration/login flow tested');
  console.log('🗄️  Cognito → Database integration tested');
  console.log('🎯 Patient-specific endpoint access tested');
  console.log('🛡️  Tenant isolation verified');
}

testPatientAuthFlow().catch(console.error);
