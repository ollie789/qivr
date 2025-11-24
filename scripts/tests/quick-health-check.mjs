#!/usr/bin/env node

// Quick health check to verify app is running after deployment

const BASE_URL = 'https://api.qivr.pro';

async function checkHealth() {
  console.log('🏥 Checking API health...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API is healthy!');
      console.log(`   Status: ${data.status}`);
      console.log(`   Checks: ${JSON.stringify(data.checks || {}, null, 2)}`);
      return true;
    } else {
      console.log('❌ API health check failed');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to connect to API');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function checkLogs() {
  console.log('\n📋 Recent startup logs (checking for crashes):\n');
  console.log('Run: aws logs tail /ecs/qivr-api --follow --region ap-southeast-2 | grep -E "(OpenTelemetry|UriFormat|Exception|started)"');
}

// Run checks
const healthy = await checkHealth();
await checkLogs();

process.exit(healthy ? 0 : 1);
