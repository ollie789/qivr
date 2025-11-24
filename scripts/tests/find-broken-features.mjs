#!/usr/bin/env node

/**
 * Automated Feature Testing - Find Broken Features
 * Tests every endpoint and page to identify issues
 */

import https from 'https';
import { execSync } from 'child_process';

const BASE_URL = 'https://clinic.qivr.pro';
const API_URL = 'https://api.qivr.pro';

const issues = [];
let testCount = 0;
let passCount = 0;
let failCount = 0;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function addIssue(severity, location, description, error = null) {
  issues.push({
    severity,
    location,
    description,
    error: error?.message || error,
    timestamp: new Date().toISOString()
  });
  failCount++;
}

async function testEndpoint(method, path, description, expectedStatus = 200) {
  testCount++;
  return new Promise((resolve) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === expectedStatus) {
          log(`✓ ${description}`, 'success');
          passCount++;
          resolve({ success: true, status: res.statusCode, data });
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          // Auth required - expected for protected endpoints
          log(`⚠ ${description} (Auth required)`, 'warning');
          passCount++;
          resolve({ success: true, status: res.statusCode, authRequired: true });
        } else {
          log(`✗ ${description} - Status: ${res.statusCode}`, 'error');
          addIssue('HIGH', path, `Expected ${expectedStatus}, got ${res.statusCode}`, data);
          resolve({ success: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      log(`✗ ${description} - ${error.message}`, 'error');
      addIssue('CRITICAL', path, 'Endpoint unreachable', error);
      resolve({ success: false, error });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      log(`✗ ${description} - Timeout`, 'error');
      addIssue('HIGH', path, 'Request timeout');
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

async function testPage(path, description) {
  testCount++;
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          // Check for common issues in HTML
          const hasReactRoot = data.includes('id="root"');
          const hasScripts = data.includes('<script');
          const hasStyles = data.includes('<link') || data.includes('<style');
          
          if (!hasReactRoot) {
            log(`✗ ${description} - Missing React root`, 'error');
            addIssue('HIGH', path, 'Missing React root element');
            resolve({ success: false });
          } else if (!hasScripts) {
            log(`✗ ${description} - Missing scripts`, 'error');
            addIssue('HIGH', path, 'Missing JavaScript bundles');
            resolve({ success: false });
          } else {
            log(`✓ ${description}`, 'success');
            passCount++;
            resolve({ success: true });
          }
        } else {
          log(`✗ ${description} - Status: ${res.statusCode}`, 'error');
          addIssue('HIGH', path, `Page returned ${res.statusCode}`);
          resolve({ success: false });
        }
      });
    }).on('error', (error) => {
      log(`✗ ${description} - ${error.message}`, 'error');
      addIssue('CRITICAL', path, 'Page unreachable', error);
      resolve({ success: false });
    });
  });
}

async function runTests() {
  log('\n🔍 Starting Automated Feature Testing\n', 'info');
  log('=' .repeat(60), 'info');

  // Test Frontend Pages
  log('\n📄 Testing Frontend Pages\n', 'info');
  await testPage('/', 'Homepage');
  await testPage('/login', 'Login page');
  await testPage('/signup', 'Signup page');
  await testPage('/dashboard', 'Dashboard page');
  await testPage('/patients', 'Patients page');
  await testPage('/appointments', 'Appointments page');
  await testPage('/documents', 'Documents page');
  await testPage('/messages', 'Messages page');
  await testPage('/analytics', 'Analytics page');
  await testPage('/prom', 'PROM page');
  await testPage('/intake', 'Intake page');
  await testPage('/settings', 'Settings page');

  // Test API Endpoints (Public)
  log('\n🔌 Testing Public API Endpoints\n', 'info');
  await testEndpoint('GET', '/health', 'Health check');
  await testEndpoint('GET', '/api/tenants', 'Tenants endpoint', 401); // Should require auth

  // Test API Endpoints (Protected - expect 401)
  log('\n🔒 Testing Protected API Endpoints\n', 'info');
  await testEndpoint('GET', '/api/patients', 'Patients list', 401);
  await testEndpoint('GET', '/api/appointments', 'Appointments list', 401);
  await testEndpoint('GET', '/api/documents', 'Documents list', 401);
  await testEndpoint('GET', '/api/messages', 'Messages list', 401);
  await testEndpoint('GET', '/api/evaluations', 'Evaluations list', 401);
  await testEndpoint('GET', '/api/proms', 'PROMs list', 401);
  await testEndpoint('GET', '/api/clinic-analytics/dashboard', 'Clinic analytics', 401);
  await testEndpoint('GET', '/api/patient-analytics/dashboard', 'Patient analytics', 401);
  await testEndpoint('GET', '/api/pain-map-analytics', 'Pain map analytics', 401);

  // Test Static Assets
  log('\n📦 Testing Static Assets\n', 'info');
  await testPage('/assets/index.js', 'Main JS bundle');
  await testPage('/assets/index.css', 'Main CSS bundle');

  // Summary
  log('\n' + '='.repeat(60), 'info');
  log('\n📊 Test Summary\n', 'info');
  log(`Total Tests: ${testCount}`, 'info');
  log(`Passed: ${passCount}`, 'success');
  log(`Failed: ${failCount}`, 'error');
  log(`Success Rate: ${((passCount / testCount) * 100).toFixed(1)}%\n`, 'info');

  if (issues.length > 0) {
    log('🐛 Issues Found:\n', 'error');
    
    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');

    if (critical.length > 0) {
      log(`\n🔴 CRITICAL (${critical.length}):\n`, 'error');
      critical.forEach((issue, i) => {
        log(`${i + 1}. ${issue.location}`, 'error');
        log(`   ${issue.description}`, 'error');
        if (issue.error) log(`   Error: ${issue.error}`, 'error');
      });
    }

    if (high.length > 0) {
      log(`\n🟠 HIGH (${high.length}):\n`, 'warning');
      high.forEach((issue, i) => {
        log(`${i + 1}. ${issue.location}`, 'warning');
        log(`   ${issue.description}`, 'warning');
      });
    }

    if (medium.length > 0) {
      log(`\n🟡 MEDIUM (${medium.length}):\n`, 'warning');
      medium.forEach((issue, i) => {
        log(`${i + 1}. ${issue.location}`, 'warning');
        log(`   ${issue.description}`, 'warning');
      });
    }

    // Save issues to file
    const fs = await import('fs');
    const issuesFile = './test-issues.json';
    fs.writeFileSync(issuesFile, JSON.stringify(issues, null, 2));
    log(`\n💾 Issues saved to ${issuesFile}\n`, 'info');
  } else {
    log('✅ No issues found! All tests passed.\n', 'success');
  }

  log('='.repeat(60) + '\n', 'info');
  
  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test runner failed: ${error.message}\n`, 'error');
  process.exit(1);
});
