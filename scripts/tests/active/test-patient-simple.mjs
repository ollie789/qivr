#!/usr/bin/env node

import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const API_URL = 'https://clinic.qivr.pro/api';
const timestamp = Date.now();

// CloudWatch debugging function
async function debugOnFailure(operation, error) {
  console.log(`\n🔍 DEBUGGING: ${operation} failed - ${error.message}`);
  
  try {
    const { stdout } = await execAsync(
      `aws logs get-log-events --log-group-name "/ecs/qivr-api" --log-stream-name $(aws logs describe-log-streams --log-group-name "/ecs/qivr-api" --order-by LastEventTime --descending --limit 1 --region ap-southeast-2 --query 'logStreams[0].logStreamName' --output text) --start-time ${Date.now() - 300000} --region ap-southeast-2 --query 'events[-3:].[timestamp,message]' --output text`
    );
    console.log('📝 Recent logs:', stdout.split('\n').slice(-3).join('\n'));
  } catch (logError) {
    console.log('⚠️  Could not fetch debug logs');
  }
}

async function testPatientWorkflow() {
  console.log('\n🧪 SIMPLE PATIENT TEST');
  console.log(`API: ${API_URL}`);
  
  // Step 1: Register new clinic
  console.log('\n📋 Step 1: Register New Clinic');
  const registerResponse = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${timestamp}@clinic.test`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Doctor',
      clinicName: `Test Clinic ${timestamp}`
    }),
    credentials: 'include'
  });

  if (!registerResponse.ok) {
    throw new Error(`Registration failed: ${registerResponse.status}`);
  }

  const regData = await registerResponse.json();
  console.log('  ✅ Registration successful');
  console.log(`  📝 Tenant: ${regData.tenantId}`);

  // Step 2: Login
  console.log('\n📋 Step 2: Login');
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${timestamp}@clinic.test`,
      password: 'TestPassword123!'
    }),
    credentials: 'include'
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`);
  }

  const loginData = await loginResponse.json();
  const tenantId = loginData.userInfo.tenantId;
  const cookies = loginResponse.headers.get('set-cookie') || '';
  
  console.log('  ✅ Login successful');
  console.log(`  📝 Tenant: ${tenantId}`);

  // Step 3: Create Patient with unique data
  console.log('\n📋 Step 3: Create Patient');
  const randomId = Math.random().toString(36).substring(7);
  const patientData = {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    email: `patient-${timestamp}-${randomId}@test.com`,
    phoneNumber: `+614${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    gender: 'Male',
    address: `${Math.floor(Math.random() * 999)} Test Street`,
    emergencyContactName: 'Emergency Contact',
    emergencyContactPhone: `+614${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
  };

  const patientResponse = await fetch(`${API_URL}/patients`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookies,
      'X-Tenant-Id': tenantId
    },
    body: JSON.stringify(patientData),
    credentials: 'include'
  });

  if (!patientResponse.ok) {
    const errorText = await patientResponse.text();
    console.log(`❌ Patient creation failed: ${errorText}`);
    console.log(`❌ Status: ${patientResponse.status}`);
    throw new Error(`Patient creation failed: ${patientResponse.status}`);
  }

  const patient = await patientResponse.json();
  console.log('  ✅ Patient created successfully');
  console.log(`  📝 Patient ID: ${patient.id}`);
  console.log(`  📝 Patient: ${patient.firstName} ${patient.lastName}`);

  console.log('\n🎉 PATIENT TEST PASSED!');
  console.log('\n✅ Clinic registration works');
  console.log('✅ User login works');
  console.log('✅ Patient creation works');
}

try {
  await testPatientWorkflow();
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  await debugOnFailure('Patient Test', error);
  process.exit(1);
}
