#!/usr/bin/env node

import fetch from 'node-fetch';

const API_BASE = 'https://api.qivr.pro/api';

// Test with a known patient ID from database
const PATIENT_ID = '1'; // Assuming we have a patient with ID 1

async function testPUT() {
  console.log('🧪 Testing Patient PUT with existing patient\n');
  
  const updatedData = {
    id: PATIENT_ID,
    firstName: 'Updated',
    lastName: 'TestPatient',
    email: 'updated@example.com',
    phoneNumber: '+61400888888',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    address: '888 Updated Street',
    emergencyContactName: 'Updated Emergency',
    emergencyContactPhone: '+61400888889'
  };
  
  try {
    const response = await fetch(`${API_BASE}/patients/${PATIENT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': '1',
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjFkZGJkNzNkLTNjNzEtNGJhNi1hNzE5LTNjNzE0YjNkNzNkMSIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YzY5YzY5Yy02YzY5LTQ2YzktOWM2OS1jNjljNjljNjljNjkiLCJhdWQiOiI2YzY5YzY5YzZjNjljNjljNjljNjljNjljNjljNjljNjljNjkiLCJjb2duaXRvOnVzZXJuYW1lIjoiYWRtaW4iLCJnaXZlbl9uYW1lIjoiQWRtaW4iLCJmYW1pbHlfbmFtZSI6IlVzZXIiLCJlbWFpbCI6ImFkbWluQGNsaW5pYy5jb20iLCJwaG9uZV9udW1iZXIiOiIrNjE0MDAwMDAwMDAiLCJjdXN0b206dGVuYW50X2lkIjoiMSIsImV4cCI6MTczMTI5NzI5NCwiaWF0IjoxNzMxMjkzNjk0fQ.dummy'
      },
      body: JSON.stringify(updatedData)
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result}`);
    
    if (response.status === 200) {
      console.log('✅ PUT operation successful');
    } else {
      console.log('❌ PUT operation failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPUT();
