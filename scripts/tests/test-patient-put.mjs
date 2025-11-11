#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'https://api.qivr.pro/api';
const TENANT_ID = '1';

// Mock JWT token for testing
const AUTH_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFkZGJkNzNkLTNjNzEtNGJhNi1hNzE5LTNjNzE0YjNkNzNkMSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YzY5YzY5Yy02YzY5LTQ2YzktOWM2OS1jNjljNjljNjljNjkiLCJhdWQiOiI2YzY5YzY5YzZjNjljNjljNjljNjljNjljNjljNjljNjljNjkiLCJjb2duaXRvOnVzZXJuYW1lIjoiYWRtaW4iLCJnaXZlbl9uYW1lIjoiQWRtaW4iLCJmYW1pbHlfbmFtZSI6IlVzZXIiLCJlbWFpbCI6ImFkbWluQGNsaW5pYy5jb20iLCJwaG9uZV9udW1iZXIiOiIrNjE0MDAwMDAwMDAiLCJjdXN0b206dGVuYW50X2lkIjoiMSIsImV4cCI6MTczMTI5NzI5NCwiaWF0IjoxNzMxMjkzNjk0fQ.dummy';

async function makeRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': TENANT_ID,
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const result = await response.text();
  
  return {
    status: response.status,
    data: result ? JSON.parse(result) : null
  };
}

async function testPatientPUT() {
  console.log('🧪 Testing Patient PUT Operations\n');
  
  try {
    // 1. Get existing patients
    console.log('1. Fetching existing patients...');
    const patientsResponse = await makeRequest('GET', '/patients');
    
    if (patientsResponse.status !== 200) {
      console.error('❌ Failed to fetch patients:', patientsResponse.data);
      return;
    }
    
    const patients = patientsResponse.data;
    if (!patients || patients.length === 0) {
      console.log('⚠️  No existing patients found. Creating one first...');
      
      // Create a patient for testing
      const newPatient = {
        firstName: 'PUT',
        lastName: 'TestPatient',
        email: 'put-test@example.com',
        phoneNumber: '+61400000001',
        dateOfBirth: '1985-05-15',
        gender: 'Female',
        address: '456 PUT Test St',
        emergencyContactName: 'PUT Emergency',
        emergencyContactPhone: '+61400000002'
      };
      
      const createResponse = await makeRequest('POST', '/patients', newPatient);
      if (createResponse.status !== 201) {
        console.error('❌ Failed to create test patient:', createResponse.data);
        return;
      }
      
      console.log('✅ Created test patient:', createResponse.data.id);
      patients.push(createResponse.data);
    }
    
    const testPatient = patients[0];
    console.log(`✅ Using patient ID: ${testPatient.id}`);
    
    // 2. Test PUT update
    console.log('\n2. Testing PUT update...');
    const updatedData = {
      ...testPatient,
      firstName: 'Updated',
      lastName: 'PUTPatient',
      phoneNumber: '+61400999999',
      address: '999 Updated PUT Street'
    };
    
    const putResponse = await makeRequest('PUT', `/patients/${testPatient.id}`, updatedData);
    
    if (putResponse.status === 200) {
      console.log('✅ PUT update successful');
      console.log('Updated patient:', putResponse.data);
    } else {
      console.error('❌ PUT update failed:', putResponse.status, putResponse.data);
    }
    
    // 3. Verify the update
    console.log('\n3. Verifying update...');
    const verifyResponse = await makeRequest('GET', `/patients/${testPatient.id}`);
    
    if (verifyResponse.status === 200) {
      const updated = verifyResponse.data;
      console.log('✅ Verification successful');
      console.log(`Name: ${updated.firstName} ${updated.lastName}`);
      console.log(`Phone: ${updated.phoneNumber}`);
      console.log(`Address: ${updated.address}`);
    } else {
      console.error('❌ Verification failed:', verifyResponse.status, verifyResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testPatientPUT();
