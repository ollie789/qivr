#!/usr/bin/env node

/**
 * Test Settings page functionality with authentication
 */

import https from 'https';

const BASE_URL = 'https://clinic.qivr.pro';

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'clinic.qivr.pro',
      path: path,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Test-Script/1.0',
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function testLogin() {
  console.log('🔐 Testing login...');
  
  // Try to login with a test user
  const loginData = {
    email: 'test1762923257212@example.com',
    password: 'TestPass123!'
  };
  
  try {
    const response = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: loginData
    });
    
    console.log(`  Login Status: ${response.status}`);
    
    if (response.status === 200) {
      try {
        const loginResult = JSON.parse(response.body);
        if (loginResult.userInfo && loginResult.userInfo.tenantId) {
          console.log('  ✅ Login successful, got user info');
          console.log(`  TenantId: ${loginResult.userInfo.tenantId}`);
          
          // Check for auth cookies
          const cookies = response.headers['set-cookie'];
          if (cookies) {
            const authCookie = cookies.find(c => c.includes('auth-token'));
            if (authCookie) {
              const token = authCookie.split(';')[0];
              return token;
            }
          }
          
          // If no cookie, we might need to use a different auth method
          console.log('  ⚠️  No auth cookie found, but login was successful');
          return 'auth-token=logged-in'; // Placeholder for testing
        }
      } catch (e) {
        console.log(`  ❌ Invalid JSON response: ${e.message}`);
      }
    }
    
    console.log(`  ❌ Login failed: ${response.body}`);
    return null;
    
  } catch (error) {
    console.log(`  ❌ Login error: ${error.message}`);
    return null;
  }
}

async function testProvidersAPI(authCookie) {
  console.log('👥 Testing providers API...');
  
  try {
    const response = await makeRequest('/api/providers', {
      headers: {
        'Cookie': authCookie
      }
    });
    
    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      try {
        const providers = JSON.parse(response.body);
        console.log(`  ✅ Providers API working: ${providers.length} providers found`);
        return true;
      } catch (e) {
        console.log(`  ❌ Invalid JSON response`);
        return false;
      }
    } else {
      console.log(`  ❌ Providers API failed: ${response.body}`);
      return false;
    }
    
  } catch (error) {
    console.log(`  ❌ Providers API error: ${error.message}`);
    return false;
  }
}

async function testEvaluationsAPI(authCookie) {
  console.log('📋 Testing evaluations API (intake management)...');
  
  try {
    const response = await makeRequest('/api/evaluations', {
      headers: {
        'Cookie': authCookie
      }
    });
    
    console.log(`  Status: ${response.status}`);
    
    if (response.status === 200) {
      try {
        const evaluations = JSON.parse(response.body);
        console.log(`  ✅ Evaluations API working: ${evaluations.length} evaluations found`);
        return true;
      } catch (e) {
        console.log(`  ❌ Invalid JSON response`);
        return false;
      }
    } else {
      console.log(`  ❌ Evaluations API failed: ${response.body}`);
      return false;
    }
    
  } catch (error) {
    console.log(`  ❌ Evaluations API error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Settings Page & Intake Management\n');
  
  // Test login first
  const authCookie = await testLogin();
  if (!authCookie) {
    console.log('\n❌ Cannot test authenticated endpoints without login');
    console.log('💡 Make sure test1762923257212@example.com user exists with password TestPass123!');
    return;
  }
  
  console.log('');
  
  // Test providers API (Settings page)
  const providersWorking = await testProvidersAPI(authCookie);
  
  console.log('');
  
  // Test evaluations API (Intake management)
  const evaluationsWorking = await testEvaluationsAPI(authCookie);
  
  console.log('\n📊 Summary:');
  console.log(`  Settings Page (Providers): ${providersWorking ? '✅ Working' : '❌ Failed'}`);
  console.log(`  Intake Management (Evaluations): ${evaluationsWorking ? '✅ Working' : '❌ Failed'}`);
  
  if (providersWorking && evaluationsWorking) {
    console.log('\n🎉 All functionality is working correctly!');
    console.log('   - Staff management in Settings should now work');
    console.log('   - Intake management should now load real data');
  } else {
    console.log('\n⚠️  Some issues remain - check authentication or API endpoints');
  }
}

main().catch(console.error);
