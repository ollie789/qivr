#!/usr/bin/env node

/**
 * Patient Flow API Test Script
 * Tests all new endpoints added in Sprints 1-4
 */

const API_BASE = process.env.API_URL || 'https://api.qivr.pro';
const TENANT_ID = process.env.TENANT_ID || 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11';

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

let passCount = 0;
let failCount = 0;

async function testEndpoint(name, url, options = {}) {
  try {
    log.info(`Testing: ${name}`);
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'X-Tenant-Id': TENANT_ID,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.ok) {
      const data = await response.json();
      log.success(`${name} - Status: ${response.status}`);
      passCount++;
      return { success: true, data };
    } else {
      log.error(`${name} - Status: ${response.status}`);
      failCount++;
      return { success: false, status: response.status };
    }
  } catch (error) {
    log.error(`${name} - Error: ${error.message}`);
    failCount++;
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Patient Flow API Test Campaign');
  console.log('='.repeat(60) + '\n');

  // Sprint 1: Core Flow Endpoints
  console.log('\n📋 Sprint 1: Core Flow\n');
  
  await testEndpoint(
    'Get Intake Forms',
    '/api/evaluations?status=pending'
  );

  await testEndpoint(
    'Get Treatment Plans',
    '/api/treatment-plans'
  );

  // Sprint 2: Patient Portal Endpoints
  console.log('\n📋 Sprint 2: Patient Portal\n');

  await testEndpoint(
    'Get Current Treatment Plan',
    '/api/treatment-plans/current'
  );

  await testEndpoint(
    'Get Available Appointment Slots',
    '/api/appointments/available-slots?days=14'
  );

  // Sprint 3: Enhancement Endpoints
  console.log('\n📋 Sprint 3: Enhancements\n');

  // Note: These require a valid patient ID
  const testPatientId = '11111111-1111-4111-8111-111111111111';

  await testEndpoint(
    'Get Patient Timeline',
    `/api/patients/${testPatientId}/timeline`
  );

  await testEndpoint(
    'Get Pain Progression',
    `/api/patients/${testPatientId}/pain-progression`
  );

  // Sprint 4: Automation (check services are registered)
  console.log('\n📋 Sprint 4: Automation\n');
  
  log.info('PROM Scheduling Service - Background service (check logs)');
  log.info('Smart Notifications Service - Background service (check logs)');
  log.warn('These services run automatically - check application logs');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);
  console.log(`Total: ${passCount + failCount}`);
  
  const successRate = ((passCount / (passCount + failCount)) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  if (failCount === 0) {
    console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Check the output above.${colors.reset}\n`);
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
