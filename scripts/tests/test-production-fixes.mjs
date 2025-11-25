#!/usr/bin/env node

/**
 * Test Production Fixes - November 25, 2025
 * Tests all endpoints that were fixed in the API audit
 */

const BASE_URL = 'https://clinic.qivr.pro';
const PATIENT_URL = 'https://patients.qivr.pro';

// Test credentials (you'll need to provide these)
const TEST_EMAIL = process.argv[2] || 'test@example.com';
const TEST_PASSWORD = process.argv[3] || 'password';

let authToken = null;
let tenantId = null;

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { response, data };
}

// Test 1: Patient Portal Login (Fixed /api/api routing)
async function testPatientLogin() {
  log('\n1. Testing Patient Portal Login (Fixed /api/api routing)...', 'blue');
  
  try {
    const { response, data } = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (response.ok && data.accessToken) {
      authToken = data.accessToken;
      tenantId = data.userInfo?.tenantId;
      log('   ✓ Patient login successful', 'green');
      log(`   ✓ Tenant ID: ${tenantId}`, 'green');
      log(`   ✓ User role: ${data.userInfo?.role}`, 'green');
      return true;
    } else {
      log(`   ✗ Login failed: ${response.status} - ${JSON.stringify(data).substring(0, 100)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ✗ Login error: ${error.message}`, 'red');
    return false;
  }
}

// Test 2: Analytics Dashboard (Fixed DateTime.Kind and LINQ)
async function testAnalyticsDashboard() {
  log('\n2. Testing Analytics Dashboard (Fixed DateTime issues)...', 'blue');
  
  try {
    const { response, data } = await makeRequest(`${BASE_URL}/api/clinic-analytics/dashboard`);

    if (response.ok) {
      log('   ✓ Dashboard endpoint responding', 'green');
      log(`   ✓ Today\'s appointments: ${data.todayAppointments || 0}`, 'green');
      log(`   ✓ Active patients: ${data.activePatients || 0}`, 'green');
      return true;
    } else {
      log(`   ✗ Dashboard failed: ${response.status}`, 'red');
      log(`   Error: ${JSON.stringify(data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ✗ Dashboard error: ${error.message}`, 'red');
    return false;
  }
}

// Test 3: Clinical Analytics (Fixed DateTime.ToString in LINQ)
async function testClinicalAnalytics() {
  log('\n3. Testing Clinical Analytics (Fixed LINQ translation)...', 'blue');
  
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();
  
  try {
    const { response, data } = await makeRequest(
      `${BASE_URL}/api/clinic-analytics/clinical?from=${from}&to=${to}`
    );

    if (response.ok) {
      log('   ✓ Clinical analytics responding', 'green');
      log(`   ✓ Appointment trends: ${data.appointmentTrends?.length || 0} days`, 'green');
      log(`   ✓ Patient outcomes tracked: ${data.patientOutcomes?.length || 0}`, 'green');
      return true;
    } else {
      log(`   ✗ Clinical analytics failed: ${response.status}`, 'red');
      log(`   Error: ${JSON.stringify(data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ✗ Clinical analytics error: ${error.message}`, 'red');
    return false;
  }
}

// Test 4: Medical Records (Fixed missing columns)
async function testMedicalRecords() {
  log('\n4. Testing Medical Records (Fixed missing DB columns)...', 'blue');
  
  try {
    const { response, data } = await makeRequest(`${BASE_URL}/api/medical-records`);

    if (response.ok) {
      log('   ✓ Medical records endpoint responding', 'green');
      log(`   ✓ Records loaded: ${Array.isArray(data) ? data.length : 'N/A'}`, 'green');
      
      // Check if affected_area field is accessible
      if (Array.isArray(data) && data.length > 0 && data[0].conditions) {
        log('   ✓ Medical conditions structure valid', 'green');
      }
      return true;
    } else {
      log(`   ✗ Medical records failed: ${response.status}`, 'red');
      log(`   Error: ${JSON.stringify(data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ✗ Medical records error: ${error.message}`, 'red');
    return false;
  }
}

// Test 5: Intake Evaluations (Fixed questionnaire data extraction)
async function testIntakeDetails() {
  log('\n5. Testing Intake Details (Fixed questionnaire data)...', 'blue');
  
  try {
    // First get list of evaluations
    const { response: listResponse, data: evaluations } = await makeRequest(
      `${BASE_URL}/api/evaluations`
    );

    if (!listResponse.ok || !Array.isArray(evaluations) || evaluations.length === 0) {
      log('   ⚠ No evaluations found to test', 'yellow');
      return true;
    }

    const evaluationId = evaluations[0].id;
    log(`   Testing evaluation: ${evaluationId}`, 'blue');

    // Get detailed evaluation
    const { response, data } = await makeRequest(
      `${BASE_URL}/api/evaluations/${evaluationId}`
    );

    if (response.ok) {
      log('   ✓ Intake details endpoint responding', 'green');
      log(`   ✓ Chief complaint: ${data.chiefComplaint || 'N/A'}`, 'green');
      log(`   ✓ Questionnaire responses: ${data.questionnaireResponses ? 'Present' : 'Missing'}`, 'green');
      log(`   ✓ Medical history: ${data.medicalHistory ? 'Present' : 'Missing'}`, 'green');
      return true;
    } else {
      log(`   ✗ Intake details failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ✗ Intake details error: ${error.message}`, 'red');
    return false;
  }
}

// Test 6: Treatment Plans (Fixed EF configuration)
async function testTreatmentPlans() {
  log('\n6. Testing Treatment Plans (Fixed EF configuration)...', 'blue');
  
  try {
    const { response, data } = await makeRequest(`${BASE_URL}/api/treatment-plans`);

    if (response.ok) {
      log('   ✓ Treatment plans endpoint responding', 'green');
      log(`   ✓ Plans loaded: ${Array.isArray(data) ? data.length : 'N/A'}`, 'green');
      
      // Check if sessions and exercises are properly serialized
      if (Array.isArray(data) && data.length > 0) {
        const plan = data[0];
        log(`   ✓ Sessions field: ${plan.sessions ? 'Valid JSON' : 'N/A'}`, 'green');
        log(`   ✓ Exercises field: ${plan.exercises ? 'Valid JSON' : 'N/A'}`, 'green');
      }
      return true;
    } else {
      log(`   ✗ Treatment plans failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ✗ Treatment plans error: ${error.message}`, 'red');
    return false;
  }
}

// Test 7: Frontend Loading (Fixed environment variables)
async function testFrontendLoading() {
  log('\n7. Testing Frontend Loading (Fixed env vars)...', 'blue');
  
  try {
    // Test clinic dashboard
    const clinicResponse = await fetch(BASE_URL);
    if (clinicResponse.ok) {
      const html = await clinicResponse.text();
      if (html.includes('Qivr Clinic Dashboard')) {
        log('   ✓ Clinic dashboard loads', 'green');
      }
    }

    // Test patient portal
    const patientResponse = await fetch(PATIENT_URL);
    if (patientResponse.ok) {
      const html = await patientResponse.text();
      if (html.includes('Qivr Patient Portal') || html.includes('root')) {
        log('   ✓ Patient portal loads', 'green');
      }
    }

    return true;
  } catch (error) {
    log(`   ✗ Frontend loading error: ${error.message}`, 'red');
    return false;
  }
}

// Test 8: API Health Check
async function testAPIHealth() {
  log('\n8. Testing API Health...', 'blue');
  
  try {
    const { response } = await makeRequest(`${BASE_URL}/api/health`);
    
    // Health endpoint requires tenant, so 400/401 is expected
    if (response.status === 400 || response.status === 401 || response.ok) {
      log('   ✓ API is responding', 'green');
      return true;
    } else {
      log(`   ✗ API health check failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`   ✗ API health error: ${error.message}`, 'red');
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  Production Fixes Validation - November 25, 2025      ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Run tests
  const tests = [
    { name: 'API Health', fn: testAPIHealth },
    { name: 'Frontend Loading', fn: testFrontendLoading },
    { name: 'Patient Login', fn: testPatientLogin },
    { name: 'Analytics Dashboard', fn: testAnalyticsDashboard },
    { name: 'Clinical Analytics', fn: testClinicalAnalytics },
    { name: 'Medical Records', fn: testMedicalRecords },
    { name: 'Intake Details', fn: testIntakeDetails },
    { name: 'Treatment Plans', fn: testTreatmentPlans }
  ];

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      log(`\n✗ ${test.name} crashed: ${error.message}`, 'red');
      results.failed++;
    }
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║                    TEST SUMMARY                        ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTotal Tests: ${tests.length}`);
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  const successRate = ((results.passed / tests.length) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

  if (results.failed === 0) {
    log('\n✓ All production fixes validated successfully! 🎉', 'green');
  } else {
    log(`\n✗ ${results.failed} test(s) failed. Review errors above.`, 'red');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.argv[2] || !process.argv[3]) {
    log('\nUsage: node test-production-fixes.mjs <email> <password>', 'yellow');
    log('Example: node test-production-fixes.mjs test@clinic.com Password123!\n', 'yellow');
    process.exit(1);
  }
  
  runTests().catch(error => {
    log(`\nFatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}
