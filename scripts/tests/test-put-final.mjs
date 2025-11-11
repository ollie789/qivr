#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'https://clinic.qivr.pro/api';

async function testPUTOperations() {
  console.log('🧪 Final PUT Test - Using Working Authentication\n');
  
  try {
    // Step 1: Register a new clinic to get fresh credentials
    console.log('1. Registering test clinic...');
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicName: `PUT Test Clinic ${Date.now()}`,
        email: `put-test-${Date.now()}@clinic.test`,
        password: 'TestPassword123!',
        firstName: 'PUT',
        lastName: 'Tester'
      })
    });
    
    if (registerResponse.status !== 200) {
      console.error('❌ Registration failed:', await registerResponse.text());
      return;
    }
    
    const registerData = await registerResponse.json();
    console.log('✅ Registration successful');
    console.log(`📝 Tenant: ${registerData.tenantId}`);
    
    // Step 2: Login to get authentication cookie
    console.log('\n2. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerData.email || `put-test-${Date.now()}@clinic.test`,
        password: 'TestPassword123!'
      })
    });
    
    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }
    
    // Extract cookies for subsequent requests
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');
    
    // Step 3: Create a patient
    console.log('\n3. Creating test patient...');
    const createPatientResponse = await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        firstName: 'Original',
        lastName: 'Patient',
        email: 'original@example.com',
        phoneNumber: '+61400000001',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        address: '123 Original St',
        emergencyContactName: 'Original Emergency',
        emergencyContactPhone: '+61400000002'
      })
    });
    
    if (createPatientResponse.status !== 201) {
      console.error('❌ Patient creation failed:', await createPatientResponse.text());
      return;
    }
    
    const patient = await createPatientResponse.json();
    console.log('✅ Patient created successfully');
    console.log(`📝 Patient ID: ${patient.id}`);
    
    // Step 4: Test PUT update (this is the main test)
    console.log('\n4. Testing PUT update...');
    const updateData = {
      ...patient,
      firstName: 'Updated',
      lastName: 'PUTPatient',
      phoneNumber: '+61400999999',
      address: '999 Updated PUT Street',
      emergencyContactName: 'Updated Emergency Contact'
    };
    
    const putResponse = await fetch(`${API_BASE}/patients/${patient.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(updateData)
    });
    
    const putResult = await putResponse.text();
    console.log(`PUT Status: ${putResponse.status}`);
    console.log(`PUT Response: ${putResult}`);
    
    if (putResponse.status === 200) {
      console.log('✅ PUT update successful!');
      const updatedPatient = JSON.parse(putResult);
      console.log(`📝 Updated name: ${updatedPatient.firstName} ${updatedPatient.lastName}`);
      console.log(`📝 Updated phone: ${updatedPatient.phoneNumber}`);
      console.log(`📝 Updated address: ${updatedPatient.address}`);
    } else {
      console.log('❌ PUT update failed');
      console.log('This indicates the CognitoSub fix may need further investigation');
    }
    
    // Step 5: Verify the update
    console.log('\n5. Verifying update...');
    const verifyResponse = await fetch(`${API_BASE}/patients/${patient.id}`, {
      method: 'GET',
      headers: { 'Cookie': cookies }
    });
    
    if (verifyResponse.status === 200) {
      const verified = await verifyResponse.json();
      console.log('✅ Verification successful');
      console.log(`📝 Verified name: ${verified.firstName} ${verified.lastName}`);
      console.log(`📝 Verified phone: ${verified.phoneNumber}`);
    } else {
      console.log('❌ Verification failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testPUTOperations();
