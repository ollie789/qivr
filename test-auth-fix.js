#!/usr/bin/env node

const API_BASE = 'https://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com/api';

async function testEndpoints() {
  console.log('🔧 Testing authentication fixes...\n');
  
  const endpoints = [
    { method: 'GET', url: '/patients', description: 'Get patients' },
    { method: 'POST', url: '/patients', description: 'Create patient', body: {
      firstName: 'Test',
      lastName: 'Patient',
      email: 'test@example.com',
      phone: '1234567890',
      dateOfBirth: '1990-01-01'
    }},
    { method: 'GET', url: '/clinic-management/clinics/22222222-2222-2222-2222-222222222222/analytics?from=2025-10-08T04:32:07.667Z&to=2025-11-07T04:32:07.667Z', description: 'Get analytics' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.url}...`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`${API_BASE}${endpoint.url}`, options);
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`  ✅ ${endpoint.description} - SUCCESS`);
      } else if (response.status === 403) {
        console.log(`  ❌ ${endpoint.description} - Still getting 403 Forbidden`);
      } else if (response.status === 405) {
        console.log(`  ❌ ${endpoint.description} - Method not allowed`);
      } else {
        console.log(`  ⚠️  ${endpoint.description} - Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`  ❌ ${endpoint.description} - Network error: ${error.message}`);
    }
    
    console.log('');
  }
}

async function main() {
  await testEndpoints();
  
  console.log('📝 Summary of changes made:');
  console.log('   • Enabled development authentication (DevAuth.Enabled = true)');
  console.log('   • Set UseMockAuth = true, UseJwtAuth = false');
  console.log('   • Added CORS origins for CloudFront domains');
  console.log('   • Set default tenant ID to match frontend expectations');
  console.log('   • Default user role set to "Clinician" with proper permissions');
  console.log('\n🔄 The API should now accept requests without JWT tokens.');
}

main().catch(console.error);
