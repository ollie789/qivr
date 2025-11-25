#!/usr/bin/env node

// Test analytics endpoint after StaffOnly policy fix

const BASE_URL = 'https://api.qivr.pro';

async function testAnalytics() {
  console.log('🔍 Testing analytics endpoint fix...\n');
  
  // Test without auth - should get 401, not 500
  try {
    const response = await fetch(`${BASE_URL}/api/clinic-analytics/dashboard`);
    console.log(`📊 Analytics endpoint status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Correct! Returns 401 Unauthorized (not 500)');
      console.log('   StaffOnly policy is registered and working');
      return true;
    } else if (response.status === 500) {
      console.log('❌ Still returning 500 - policy not registered');
      const text = await response.text();
      console.log(`   Error: ${text.substring(0, 200)}`);
      return false;
    } else {
      console.log(`⚠️  Unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

testAnalytics();
