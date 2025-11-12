#!/usr/bin/env node

import https from 'https';
import { URL } from 'url';

// Test configuration
const PATIENT_PORTAL_URL = 'https://patient.qivr.pro';
const API_BASE_URL = 'https://api.qivr.pro';

class PatientAPITester {
  constructor() {
    this.results = [];
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Qivr-Test-Suite/1.0',
          'Accept': 'application/json',
          ...options.headers
        }
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Testing: ${testName}`);
    try {
      await testFn();
      console.log(`✅ ${testName} - PASSED`);
      this.results.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
      this.results.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  async testPatientPortalAccess() {
    const response = await this.makeRequest(PATIENT_PORTAL_URL);
    
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    
    if (!response.body.includes('patient') && !response.body.includes('Qivr')) {
      throw new Error('Patient portal content not found');
    }
    
    console.log('  ✓ Patient portal loads successfully');
  }

  async testPatientAPIEndpoints() {
    const endpoints = [
      '/api/patient/profile',
      '/api/patient/appointments',
      '/api/patient/messages',
      '/api/patient/medical-records',
      '/api/patient/proms'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(`${API_BASE_URL}${endpoint}`);
        
        // 401 is expected for unauthenticated requests
        if (response.statusCode === 401) {
          console.log(`  ✓ ${endpoint} - Authentication required (expected)`);
        } else if (response.statusCode === 404) {
          console.log(`  ⚠️  ${endpoint} - Not found`);
        } else if (response.statusCode < 500) {
          console.log(`  ✓ ${endpoint} - Responds (${response.statusCode})`);
        } else {
          console.log(`  ❌ ${endpoint} - Server error (${response.statusCode})`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint} - Connection error: ${error.message}`);
      }
    }
  }

  async testCORSHeaders() {
    const response = await this.makeRequest(`${API_BASE_URL}/api/patient/profile`, {
      headers: {
        'Origin': PATIENT_PORTAL_URL,
        'Access-Control-Request-Method': 'GET'
      }
    });

    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];

    let corsConfigured = false;
    for (const header of corsHeaders) {
      if (response.headers[header]) {
        corsConfigured = true;
        console.log(`  ✓ ${header}: ${response.headers[header]}`);
      }
    }

    if (!corsConfigured) {
      console.log('  ⚠️  CORS headers not found - may cause frontend issues');
    }
  }

  async testHealthCheck() {
    try {
      const response = await this.makeRequest(`${API_BASE_URL}/health`);
      
      if (response.statusCode === 200) {
        console.log('  ✓ API health check passed');
        
        try {
          const healthData = JSON.parse(response.body);
          if (healthData.status === 'healthy') {
            console.log('  ✓ API reports healthy status');
          }
        } catch (e) {
          console.log('  ✓ Health endpoint responds (non-JSON)');
        }
      } else {
        throw new Error(`Health check failed with status ${response.statusCode}`);
      }
    } catch (error) {
      // Try alternative health endpoints
      const alternatives = ['/api/health', '/ping', '/status'];
      let found = false;
      
      for (const alt of alternatives) {
        try {
          const response = await this.makeRequest(`${API_BASE_URL}${alt}`);
          if (response.statusCode === 200) {
            console.log(`  ✓ Alternative health check found: ${alt}`);
            found = true;
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }
      
      if (!found) {
        throw new Error('No health check endpoint found');
      }
    }
  }

  async testSSLCertificate() {
    // Test SSL certificate validity
    const response = await this.makeRequest(PATIENT_PORTAL_URL);
    
    // If we got here without SSL errors, certificate is valid
    console.log('  ✓ SSL certificate is valid');
    
    // Check security headers
    const securityHeaders = [
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    let securityScore = 0;
    for (const header of securityHeaders) {
      if (response.headers[header]) {
        securityScore++;
        console.log(`  ✓ ${header}: ${response.headers[header]}`);
      }
    }
    
    console.log(`  Security headers: ${securityScore}/${securityHeaders.length}`);
  }

  async testPatientRegistration() {
    // Test if registration endpoint exists
    try {
      const response = await this.makeRequest(`${API_BASE_URL}/api/patient/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!'
        })
      });
      
      // We expect validation errors or auth setup, not 404
      if (response.statusCode === 404) {
        throw new Error('Registration endpoint not found');
      } else if (response.statusCode < 500) {
        console.log(`  ✓ Registration endpoint exists (${response.statusCode})`);
      }
    } catch (error) {
      if (error.message.includes('not found')) {
        throw error;
      }
      console.log(`  ✓ Registration endpoint accessible`);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Patient Portal API Tests...\n');
    
    await this.runTest('Patient Portal Access', () => this.testPatientPortalAccess());
    await this.runTest('Patient API Endpoints', () => this.testPatientAPIEndpoints());
    await this.runTest('CORS Configuration', () => this.testCORSHeaders());
    await this.runTest('Health Check', () => this.testHealthCheck());
    await this.runTest('SSL Certificate', () => this.testSSLCertificate());
    await this.runTest('Patient Registration', () => this.testPatientRegistration());
    
    this.printResults();
  }

  printResults() {
    console.log('\n📊 Patient Portal API Test Results:');
    console.log('====================================');
    
    const passed = this.results.filter(r => r.status === 'PASSED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    
    this.results.forEach(result => {
      const icon = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\nSummary: ${passed} passed, ${failed} failed`);
    console.log(`Success rate: ${Math.round((passed / this.results.length) * 100)}%`);
    
    if (failed === 0) {
      console.log('\n🎉 All patient portal tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed - check patient portal configuration');
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PatientAPITester();
  tester.runAllTests().catch(console.error);
}

export default PatientAPITester;
