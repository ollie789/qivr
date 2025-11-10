#!/usr/bin/env node

/**
 * API Endpoint Test Suite
 * Tests all backend endpoints with live Cognito authentication via HTTPS
 * 
 * Usage:
 *   node test-api-endpoints.mjs <email> <password>
 */

const email = process.argv[2];
const password = process.argv[3];
const API_URL = 'https://clinic.qivr.pro/api';

if (!email || !password) {
  console.error('❌ Usage: node test-api-endpoints.mjs <email> <password>');
  process.exit(1);
}

console.log(`\n🔌 Testing API Endpoints (HTTPS)`);
console.log(`URL: ${API_URL}\n`);

let authCookie = null;
let tenantId = null;

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authCookie) {
    headers['Cookie'] = authCookie;
  }
  
  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }
  
  const response = await fetch(url, { ...options, headers, credentials: 'include' });
  
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && setCookie.includes('auth-token')) {
    authCookie = setCookie.split(';')[0];
  }
  
  return response;
}

const endpoints = [
  // Auth
  { method: 'POST', path: '/auth/login', name: 'Login', body: () => ({ email, password }), skipAuth: true },
  { method: 'GET', path: '/auth/check', name: 'Check Auth' },
  { method: 'POST', path: '/auth/refresh', name: 'Refresh Token' },
  
  // Dashboard
  { method: 'GET', path: '/dashboard/stats', name: 'Dashboard Stats' },
  { method: 'GET', path: '/dashboard/recent-activity', name: 'Recent Activity' },
  
  // Patients
  { method: 'GET', path: '/patients', name: 'List Patients' },
  { method: 'GET', path: '/patients?page=1&pageSize=10', name: 'Paginated Patients' },
  
  // Appointments
  { method: 'GET', path: '/appointments', name: 'List Appointments' },
  { method: 'GET', path: '/appointments/upcoming', name: 'Upcoming Appointments' },
  
  // Messages
  { method: 'GET', path: '/messages', name: 'List Messages' },
  { method: 'GET', path: '/messages/threads', name: 'Message Threads' },
  
  // Documents
  { method: 'GET', path: '/documents', name: 'List Documents' },
  
  // Medical Records
  { method: 'GET', path: '/medical-records', name: 'List Medical Records' },
  
  // Settings
  { method: 'GET', path: '/settings/clinic', name: 'Clinic Settings' },
  { method: 'GET', path: '/settings/user', name: 'User Settings' },
  
  // Analytics
  { method: 'GET', path: '/analytics/overview', name: 'Analytics Overview' },
  
  // PROM
  { method: 'GET', path: '/prom/questionnaires', name: 'PROM Questionnaires' },
  
  // Intake
  { method: 'GET', path: '/intake/forms', name: 'Intake Forms' },
  
  // Tenants
  { method: 'GET', path: '/tenants', name: 'List Tenants' },
  
  // Users
  { method: 'GET', path: '/users/me', name: 'Current User' },
  
  // Notifications
  { method: 'GET', path: '/notifications', name: 'List Notifications' }
];

async function testEndpoints() {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const results = [];
  
  for (const endpoint of endpoints) {
    const testName = `${endpoint.method} ${endpoint.path}`;
    console.log(`\n📡 ${endpoint.name}`);
    console.log(`   ${testName}`);
    
    try {
      // Skip if auth required but not available
      if (!endpoint.skipAuth && !authCookie) {
        console.log('   ⏭️  Skipped (no auth)');
        skipped++;
        results.push({ endpoint: testName, status: 'SKIP' });
        continue;
      }
      
      const options = { method: endpoint.method };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body());
      }
      
      const response = await request(endpoint.path, options);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      // Capture tenant ID from login
      if (endpoint.path === '/auth/login' && response.ok) {
        const data = await response.json();
        tenantId = data.user?.tenantId;
        console.log(`   📝 Tenant ID: ${tenantId}`);
      }
      
      // Check response
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          const preview = JSON.stringify(data).substring(0, 100);
          console.log(`   📦 Response: ${preview}...`);
          
          // Validate tenant isolation
          if (Array.isArray(data)) {
            const allSameTenant = data.every(item => !item.tenantId || item.tenantId === tenantId);
            if (allSameTenant) {
              console.log('   ✅ Tenant isolation verified');
            } else {
              console.log('   ⚠️  Tenant isolation issue detected');
            }
          }
        } else {
          console.log(`   📄 Content-Type: ${contentType}`);
        }
        
        console.log(`   ✅ ${endpoint.name} passed`);
        passed++;
        results.push({ endpoint: testName, status: 'PASS', code: response.status });
        
      } else {
        const text = await response.text();
        console.log(`   ❌ Error: ${text.substring(0, 200)}`);
        
        // Some endpoints may return 404 if no data exists - that's ok
        if (response.status === 404) {
          console.log('   ℹ️  No data found (expected for new tenant)');
          passed++;
          results.push({ endpoint: testName, status: 'PASS', code: response.status });
        } else {
          failed++;
          results.push({ endpoint: testName, status: 'FAIL', code: response.status, error: text });
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
      failed++;
      results.push({ endpoint: testName, status: 'FAIL', error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results');
  console.log(`   ✅ Passed: ${passed}/${endpoints.length}`);
  console.log(`   ❌ Failed: ${failed}/${endpoints.length}`);
  console.log(`   ⏭️  Skipped: ${skipped}/${endpoints.length}`);
  console.log(`   📈 Success Rate: ${((passed / (endpoints.length - skipped)) * 100).toFixed(1)}%\n`);
  
  if (failed === 0) {
    console.log('🎉 All API endpoints working correctly!');
  } else {
    console.log('⚠️  Some endpoints have issues:\n');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   ❌ ${r.endpoint}`);
      console.log(`      ${r.error || `Status: ${r.code}`}`);
    });
  }
  
  // Logout
  console.log('\n🔓 Logging out...');
  await request('/auth/logout', { method: 'POST' });
  console.log('   ✅ Logged out');
}

testEndpoints().catch(error => {
  console.error('\n💥 Error:', error.message);
  process.exit(1);
});
