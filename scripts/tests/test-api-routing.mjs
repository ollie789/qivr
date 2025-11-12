#!/usr/bin/env node

/**
 * Test API routing fixes for intake management and settings
 */

import https from 'https';

const BASE_URL = 'https://clinic.qivr.pro';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'clinic.qivr.pro',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Script/1.0'
      }
    };

    const req = https.request(options, (res) => {
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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function testEndpoint(path, description) {
  console.log(`Testing ${description}: ${path}`);
  try {
    const response = await makeRequest(path);
    console.log(`  Status: ${response.status}`);
    
    if (response.body) {
      try {
        const json = JSON.parse(response.body);
        if (json.error) {
          console.log(`  Response: ${json.error}`);
        } else {
          console.log(`  Response: Valid JSON (${Object.keys(json).length} keys)`);
        }
      } catch (e) {
        console.log(`  Response: ${response.body.substring(0, 100)}...`);
      }
    }
    
    // Check if it's a proper API response (not 404/403 HTML)
    const isApiResponse = response.status !== 404 && 
                         !response.body.includes('<html>') && 
                         !response.body.includes('<!DOCTYPE');
    
    console.log(`  API Routing: ${isApiResponse ? '✅ Working' : '❌ Failed'}`);
    return isApiResponse;
    
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing API Routing Fixes\n');
  
  const tests = [
    ['/api/evaluations', 'Intake Management (evaluations)'],
    ['/api/providers', 'Settings Page (providers)'],
    ['/api/proms/templates', 'PROMS Templates'],
    ['/api/patients', 'Patients API'],
    ['/api/appointments', 'Appointments API']
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [path, description] of tests) {
    const success = await testEndpoint(path, description);
    if (success) passed++;
    console.log('');
  }
  
  console.log(`📊 Results: ${passed}/${total} endpoints have correct routing`);
  
  if (passed === total) {
    console.log('✅ All API routing fixes are working correctly!');
  } else {
    console.log('❌ Some API endpoints still have routing issues');
  }
}

main().catch(console.error);
