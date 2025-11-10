#!/usr/bin/env node

const API_URL = 'https://d2xnv2zqtx1fym.cloudfront.net';

async function testAuth() {
  console.log('🔐 Testing Frontend to Backend Authentication Flow');
  console.log('='.repeat(50));
  
  // Test 1: API Health Check
  console.log('\n1. Testing API Health...');
  try {
    const response = await fetch(`${API_URL}/health`);
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const data = await response.text();
      console.log(`   ✅ API is healthy: ${data}`);
    } else {
      console.log(`   ❌ API health check failed`);
    }
  } catch (error) {
    console.log(`   ❌ API unreachable: ${error.message}`);
  }

  // Test 2: Unauthenticated API call
  console.log('\n2. Testing unauthenticated API call...');
  try {
    const response = await fetch(`${API_URL}/api/tenants`, {
      headers: {
        'Accept': 'application/json',
        'X-Request-ID': crypto.randomUUID()
      }
    });
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ Correctly returns 401 Unauthorized');
    } else if (response.status === 403) {
      console.log('   ⚠️  Returns 403 Forbidden (tenant context required)');
    } else {
      console.log(`   ❓ Unexpected status: ${response.status}`);
    }
    
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 200)}...`);
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }

  // Test 3: Test with invalid token
  console.log('\n3. Testing with invalid token...');
  try {
    const response = await fetch(`${API_URL}/api/tenants`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer invalid-token',
        'X-Tenant-Id': 'test-tenant',
        'X-Request-ID': crypto.randomUUID()
      }
    });
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ✅ Correctly rejects invalid token');
    } else {
      console.log(`   ❓ Unexpected response to invalid token`);
    }
    
    const text = await response.text();
    console.log(`   Response: ${text.substring(0, 200)}...`);
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }

  // Test 4: CORS preflight
  console.log('\n4. Testing CORS preflight...');
  try {
    const response = await fetch(`${API_URL}/api/tenants`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://dwmqwnt4dy1td.cloudfront.net',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,x-tenant-id'
      }
    });
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 || response.status === 204) {
      console.log('   ✅ CORS preflight successful');
      console.log(`   CORS Headers:`);
      console.log(`     Access-Control-Allow-Origin: ${response.headers.get('access-control-allow-origin')}`);
      console.log(`     Access-Control-Allow-Methods: ${response.headers.get('access-control-allow-methods')}`);
      console.log(`     Access-Control-Allow-Headers: ${response.headers.get('access-control-allow-headers')}`);
    } else {
      console.log('   ❌ CORS preflight failed');
    }
  } catch (error) {
    console.log(`   ❌ CORS test failed: ${error.message}`);
  }

  // Test 5: Frontend accessibility
  console.log('\n5. Testing frontend accessibility...');
  try {
    const response = await fetch('https://dwmqwnt4dy1td.cloudfront.net');
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      if (html.includes('Qivr') || html.includes('clinic')) {
        console.log('   ✅ Frontend loads successfully');
      } else {
        console.log('   ⚠️  Frontend loads but content unexpected');
      }
    } else {
      console.log('   ❌ Frontend not accessible');
    }
  } catch (error) {
    console.log(`   ❌ Frontend test failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Authentication flow test completed');
  console.log('\n💡 To test with real Cognito tokens:');
  console.log('   1. Login to https://dwmqwnt4dy1td.cloudfront.net');
  console.log('   2. Open browser dev tools');
  console.log('   3. Check localStorage for "clinic-auth-storage"');
  console.log('   4. Use the token from there for authenticated API calls');
}

testAuth().catch(console.error);
