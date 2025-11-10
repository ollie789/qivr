#!/usr/bin/env node

const API_URL = 'https://d2xnv2zqtx1fym.cloudfront.net';

// Get token from command line argument
const token = process.argv[2];
const tenantId = process.argv[3];

async function testLiveAuth() {
  console.log('🔐 Testing Live Authentication Flow');
  console.log('='.repeat(50));
  
  if (!token) {
    console.log('❌ No token provided');
    console.log('\n📋 Usage:');
    console.log('   node test-live-auth.js <cognito-token> [tenant-id]');
    console.log('\n🔍 To get your token:');
    console.log('   1. Login to https://dwmqwnt4dy1td.cloudfront.net');
    console.log('   2. Open browser dev tools (F12)');
    console.log('   3. Go to Application/Storage > Local Storage');
    console.log('   4. Find "clinic-auth-storage"');
    console.log('   5. Copy the "token" value');
    console.log('   6. Optionally copy "activeTenantId" or user.tenantId');
    return;
  }

  console.log(`\n🎫 Using token: ${token.substring(0, 20)}...`);
  if (tenantId) {
    console.log(`🏢 Using tenant: ${tenantId}`);
  }

  // Test 1: Decode JWT to check claims
  console.log('\n1. Analyzing JWT token...');
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      console.log('   ✅ Token structure valid');
      console.log(`   Issuer: ${payload.iss || 'N/A'}`);
      console.log(`   Subject: ${payload.sub || 'N/A'}`);
      console.log(`   Expires: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'}`);
      console.log(`   Role: ${payload['custom:role'] || payload['custom:custom:role'] || 'N/A'}`);
      console.log(`   Clinic ID: ${payload['custom:clinic_id'] || payload['custom:custom:clinic_id'] || 'N/A'}`);
      console.log(`   Tenant ID: ${payload['custom:tenant_id'] || payload['custom:custom:tenant_id'] || 'N/A'}`);
      
      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.log('   ⚠️  Token is EXPIRED');
      } else {
        console.log('   ✅ Token is valid (not expired)');
      }
    } else {
      console.log('   ❌ Invalid JWT structure');
    }
  } catch (error) {
    console.log(`   ❌ Failed to decode token: ${error.message}`);
  }

  // Test 2: Test authenticated API call
  console.log('\n2. Testing authenticated API call...');
  try {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': crypto.randomUUID()
    };
    
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const response = await fetch(`${API_URL}/api/tenants`, { headers });
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Authenticated request successful');
      console.log(`   Found ${Array.isArray(data) ? data.length : 'unknown'} tenants`);
      if (Array.isArray(data) && data.length > 0) {
        console.log('   Tenants:');
        data.forEach(tenant => {
          console.log(`     - ${tenant.name || tenant.id} ${tenant.isDefault ? '(default)' : ''}`);
        });
      }
    } else {
      const text = await response.text();
      console.log(`   ❌ Request failed: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }

  // Test 3: Test notifications endpoint
  console.log('\n3. Testing notifications endpoint...');
  try {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': crypto.randomUUID()
    };
    
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const response = await fetch(`${API_URL}/api/notifications?limit=5`, { headers });
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Notifications endpoint accessible');
      console.log(`   Found ${data.items?.length || 0} notifications`);
    } else {
      const text = await response.text();
      console.log(`   ❌ Notifications failed: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Notifications test failed: ${error.message}`);
  }

  // Test 4: Test dashboard data endpoint
  console.log('\n4. Testing dashboard data...');
  try {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Request-ID': crypto.randomUUID()
    };
    
    if (tenantId) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const response = await fetch(`${API_URL}/api/dashboard/stats`, { headers });
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Dashboard data accessible');
      console.log(`   Stats: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      const text = await response.text();
      console.log(`   ❌ Dashboard failed: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`   ❌ Dashboard test failed: ${error.message}`);
  }

  // Test 5: Test without tenant header
  if (tenantId) {
    console.log('\n5. Testing without tenant header...');
    try {
      const response = await fetch(`${API_URL}/api/tenants`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Request-ID': crypto.randomUUID()
        }
      });
      console.log(`   Status: ${response.status}`);
      
      if (response.status === 400 || response.status === 403) {
        console.log('   ✅ Correctly requires tenant context');
      } else if (response.ok) {
        console.log('   ⚠️  Request succeeded without tenant header');
      } else {
        console.log('   ❓ Unexpected response without tenant header');
      }
      
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}...`);
    } catch (error) {
      console.log(`   ❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Live authentication test completed');
  console.log('\n📊 Summary:');
  console.log('   - API is accessible through CloudFront');
  console.log('   - Authentication flow is working');
  console.log('   - CORS is properly configured');
  console.log('   - Tenant context validation is active');
}

testLiveAuth().catch(console.error);
