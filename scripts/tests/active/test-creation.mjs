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

async function testRegistration() {
  console.log('\n📋 Test 1: Create New Clinic');
  
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${timestamp}@clinic.test`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Doctor',
      clinicName: `Test Clinic ${timestamp}`,
      role: 'admin'  // Clinic owner should be admin
    }),
    credentials: 'include'
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Registration failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log('  ✅ Registration successful');
  console.log(`  📝 Tenant: ${data.tenantId}`);
  console.log(`  📝 Email: test${timestamp}@clinic.test`);
  
  return data;
}

async function runTests() {
  try {
    console.log('\n🧪 CREATION TESTS');
    console.log(`API: ${API_URL}`);
    
    const registration = await testRegistration();
    
    console.log('\n🎉 CREATION TEST PASSED!');
    console.log('\n✅ New clinic created');
    console.log('✅ User registered');
    console.log('✅ Ready for functionality testing');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await debugOnFailure('Creation Test', error);
    process.exit(1);
  }
}

runTests();
