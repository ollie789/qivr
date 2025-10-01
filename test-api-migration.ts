#!/usr/bin/env npx tsx

/**
 * Comprehensive API Test Suite for QIVR Fetch Migration
 * Tests all migrated API services to ensure they work correctly with the new @qivr/http package
 */

import { createHttpClient, HttpError } from './packages/http/dist/index.js';

// Test configuration
const config = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
  testUserId: 'test-user-123',
  testClinicId: 'clinic-456',
  testPatientId: 'patient-789',
  authToken: process.env.AUTH_TOKEN || 'test-token'
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface EndpointDefinition {
  path: string;
  method: HttpMethod;
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

// Test result tracking
interface TestResult {
  service: string;
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  responseTime?: number;
  error?: string;
}

const testResults: TestResult[] = [];

// Helper function to log test results
function logTest(result: TestResult) {
  testResults.push(result);
  const statusColor = result.status === 'PASS' ? colors.green : 
                     result.status === 'FAIL' ? colors.red : colors.yellow;
  const statusIcon = result.status === 'PASS' ? '✓' : 
                     result.status === 'FAIL' ? '✗' : '○';
  
  console.log(
    `${statusColor}${statusIcon}${colors.reset} ${result.service} - ${result.method} ${result.endpoint}` +
    (result.responseTime ? ` (${result.responseTime}ms)` : '') +
    (result.error ? ` - ${colors.red}${result.error}${colors.reset}` : '')
  );
}

// Create HTTP client instance
const httpClient = createHttpClient({
  baseURL: config.baseURL,
  timeout: config.timeout,
  headers: {
    'Authorization': `Bearer ${config.authToken}`,
    'Content-Type': 'application/json'
  }
});

// Test Analytics API Service
async function testAnalyticsApi() {
  console.log(`\n${colors.cyan}${colors.bright}Testing Analytics API${colors.reset}`);
  
  const endpoints: EndpointDefinition[] = [
    { path: '/api/analytics/health-metrics', method: 'GET', params: { timeRange: '30days' } },
    { path: '/api/analytics/prom-analytics', method: 'GET' },
    { path: '/api/analytics/health-goals', method: 'GET' },
    { path: '/api/analytics/correlations', method: 'GET' },
    { path: '/api/analytics/patient-trends', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      await httpClient.request({
        url: endpoint.path,
        method: endpoint.method,
        params: endpoint.params,
        data: endpoint.body,
        headers: endpoint.headers
      });
      
      logTest({
        service: 'Analytics API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'PASS',
        responseTime: Date.now() - startTime
      });
    } catch (error) {
      logTest({
        service: 'Analytics API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Test Clinic Dashboard API Service
async function testClinicDashboardApi() {
  console.log(`\n${colors.cyan}${colors.bright}Testing Clinic Dashboard API${colors.reset}`);
  
  const endpoints: EndpointDefinition[] = [
    { path: '/api/clinic-dashboard/overview', method: 'GET' },
    { path: '/api/clinic-dashboard/schedule/weekly', method: 'GET' },
    { path: '/api/clinic-dashboard/metrics', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      await httpClient.request({
        url: endpoint.path,
        method: endpoint.method,
        params: endpoint.params,
        data: endpoint.body,
        headers: endpoint.headers
      });
      
      logTest({
        service: 'Clinic Dashboard API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'PASS',
        responseTime: Date.now() - startTime
      });
    } catch (error) {
      logTest({
        service: 'Clinic Dashboard API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Test Patient API Service
async function testPatientApi() {
  console.log(`\n${colors.cyan}${colors.bright}Testing Patient API${colors.reset}`);
  
  const endpoints: EndpointDefinition[] = [
    { path: '/api/patients', method: 'GET' },
    { path: `/api/patients/${config.testPatientId}`, method: 'GET' },
    { path: `/api/patients/${config.testPatientId}/medical-history`, method: 'GET' },
    { path: `/api/patients/${config.testPatientId}/appointments`, method: 'GET' },
    { path: `/api/patients/${config.testPatientId}/documents`, method: 'GET' },
    { path: '/api/patients/search', method: 'GET', params: { query: 'test', limit: 5 } }
  ];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      await httpClient.request({
        url: endpoint.path,
        method: endpoint.method,
        params: endpoint.params,
        data: endpoint.body,
        headers: endpoint.headers
      });
      
      logTest({
        service: 'Patient API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'PASS',
        responseTime: Date.now() - startTime
      });
    } catch (error) {
      logTest({
        service: 'Patient API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Test Auth Service
async function testAuthService() {
  console.log(`\n${colors.cyan}${colors.bright}Testing Auth Service${colors.reset}`);
  
  const refreshToken = process.env.AUTH_REFRESH_TOKEN;

  const endpoints: EndpointDefinition[] = [
    { path: '/api/auth/debug', method: 'GET' },
    { path: '/api/auth/user-info', method: 'GET' }
  ];

  if (refreshToken) {
    endpoints.push({
      path: '/api/auth/refresh-token',
      method: 'POST',
      body: { refreshToken }
    });
  } else {
    logTest({
      service: 'Auth Service',
      endpoint: '/api/auth/refresh-token',
      method: 'POST',
      status: 'SKIP',
      error: 'Set AUTH_REFRESH_TOKEN to exercise refresh flow'
    });
  }

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      await httpClient.request({
        url: endpoint.path,
        method: endpoint.method,
        params: endpoint.params,
        data: endpoint.body,
        headers: endpoint.headers
      });
      
      logTest({
        service: 'Auth Service',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'PASS',
        responseTime: Date.now() - startTime
      });
    } catch (error) {
      logTest({
        service: 'Auth Service',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Test PROM Instance API
async function testPromInstanceApi() {
  console.log(`\n${colors.cyan}${colors.bright}Testing PROM Instance API${colors.reset}`);
  
  const endpoints: EndpointDefinition[] = [
    { path: '/api/v1/proms/templates', method: 'GET' },
    { path: '/api/v1/proms/instances', method: 'GET' },
    { path: '/api/v1/proms/stats', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      await httpClient.request({
        url: endpoint.path,
        method: endpoint.method,
        params: endpoint.params,
        data: endpoint.body,
        headers: endpoint.headers
      });
      
      logTest({
        service: 'PROM Instance API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'PASS',
        responseTime: Date.now() - startTime
      });
    } catch (error) {
      logTest({
        service: 'PROM Instance API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Test Patient Dashboard APIs
async function testPatientDashboardApis() {
  console.log(`\n${colors.cyan}${colors.bright}Testing Patient Dashboard APIs${colors.reset}`);
  
  const endpoints: EndpointDefinition[] = [
    { path: '/api/patient-dashboard/overview', method: 'GET' },
    { path: '/api/patient-dashboard/appointments/history', method: 'GET', params: { page: 1, pageSize: 10 } },
    { path: '/api/patient-dashboard/health-summary', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      await httpClient.request({
        url: endpoint.path,
        method: endpoint.method,
        params: endpoint.params,
        data: endpoint.body,
        headers: endpoint.headers
      });
      
      logTest({
        service: 'Patient Dashboard API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'PASS',
        responseTime: Date.now() - startTime
      });
    } catch (error) {
      logTest({
        service: 'Patient Dashboard API',
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Test error handling
async function testErrorHandling() {
  console.log(`\n${colors.cyan}${colors.bright}Testing Error Handling${colors.reset}`);
  
  const errorScenarios = [
    { path: '/api/nonexistent', method: 'GET' as const, expectedStatus: 404 },
    { path: '/api/patients', method: 'POST' as const, body: {}, expectedStatus: 400 },
    { path: '/api/unauthorized', method: 'GET' as const, expectedStatus: 401 }
  ];

  for (const scenario of errorScenarios) {
    const startTime = Date.now();
    try {
      await httpClient.request({
        url: scenario.path,
        method: scenario.method,
        data: scenario.body
      });
      
      logTest({
        service: 'Error Handling',
        endpoint: scenario.path,
        method: scenario.method,
        status: 'FAIL',
        error: `Expected error ${scenario.expectedStatus} but request succeeded`
      });
    } catch (error) {
      if (error instanceof HttpError) {
        logTest({
          service: 'Error Handling',
          endpoint: scenario.path,
          method: scenario.method,
          status: 'PASS',
          responseTime: Date.now() - startTime
        });
      } else {
        logTest({
          service: 'Error Handling',
          endpoint: scenario.path,
          method: scenario.method,
          status: 'FAIL',
          error: 'Unexpected error type'
        });
      }
    }
  }
}

// Generate test report
function generateReport() {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}API MIGRATION TEST REPORT${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.status === 'PASS').length;
  const failedTests = testResults.filter(r => r.status === 'FAIL').length;
  const skippedTests = testResults.filter(r => r.status === 'SKIP').length;

  // Group results by service
  const serviceGroups = testResults.reduce((acc, result) => {
    if (!acc[result.service]) {
      acc[result.service] = [];
    }
    acc[result.service].push(result);
    return acc;
  }, {} as Record<string, TestResult[]>);

  // Display results by service
  Object.entries(serviceGroups).forEach(([service, results]) => {
    const servicePassed = results.filter(r => r.status === 'PASS').length;
    const serviceFailed = results.filter(r => r.status === 'FAIL').length;
    const serviceColor = serviceFailed === 0 ? colors.green : colors.red;
    
    console.log(`${colors.cyan}${service}:${colors.reset}`);
    console.log(`  ${serviceColor}Passed: ${servicePassed}/${results.length}${colors.reset}`);
    
    if (serviceFailed > 0) {
      console.log(`  ${colors.red}Failed endpoints:${colors.reset}`);
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`    - ${r.method} ${r.endpoint}: ${r.error}`);
      });
    }
    console.log();
  });

  // Calculate average response time for successful requests
  const successfulTests = testResults.filter(r => r.status === 'PASS' && r.responseTime);
  const avgResponseTime = successfulTests.length > 0
    ? Math.round(successfulTests.reduce((sum, r) => sum + (r.responseTime || 0), 0) / successfulTests.length)
    : 0;

  // Summary
  console.log(`${colors.bright}SUMMARY:${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${skippedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`Average Response Time: ${avgResponseTime}ms`);
  
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  // Return overall test status
  return failedTests === 0;
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bright}Starting API Migration Tests...${colors.reset}`);
  console.log(`Backend URL: ${config.baseURL}`);
  console.log(`Timeout: ${config.timeout}ms\n`);

  try {
    // Check if backend is healthy first
    console.log(`${colors.cyan}Checking backend health...${colors.reset}`);
    try {
      const healthResponse = await fetch(`${config.baseURL}/health`, { 
        signal: AbortSignal.timeout(5000) 
      });
      if (healthResponse.ok) {
        console.log(`${colors.green}✓ Backend is healthy${colors.reset}\n`);
      } else {
        console.log(`${colors.yellow}⚠ Backend returned status ${healthResponse.status}${colors.reset}\n`);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠ Backend health check failed - continuing with tests${colors.reset}\n`);
    }

    // Run all test suites
    await testAnalyticsApi();
    await testClinicDashboardApi();
    await testPatientApi();
    await testAuthService();
    await testPromInstanceApi();
    await testPatientDashboardApis();
    await testErrorHandling();

    // Generate and display report
    const allTestsPassed = generateReport();

    // Exit with appropriate code
    process.exit(allTestsPassed ? 0 : 1);
  } catch (error) {
    console.error(`${colors.red}Fatal error during test execution:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(console.error);
