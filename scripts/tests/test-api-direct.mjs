#!/usr/bin/env node

/**
 * Direct API test using fetch with real auth tokens
 */

import { execSync } from 'child_process';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configuration
const REGION = "ap-southeast-2";
const POOL_ID = "ap-southeast-2_b48ZBE35F";
const CLIENT_ID = "3u1j21aero8u8c7a4gh52g9qhb";
const CLIENT_SECRET = "1sfitrb0486vqg0gqve60q7neqnhkkrfkulkkptnvfkgv1v74amm";

async function getAuthToken() {
  console.log(`${colors.blue}Getting fresh auth token from Cognito...${colors.reset}`);
  
  try {
    // Use AWS CLI to get tokens
    const command = `
      SECRET_HASH=$(echo -n "doctor@test.com${CLIENT_ID}" | openssl dgst -sha256 -hmac "${CLIENT_SECRET}" -binary | base64)
      
      aws cognito-idp initiate-auth \
        --region "${REGION}" \
        --auth-flow USER_PASSWORD_AUTH \
        --client-id "${CLIENT_ID}" \
        --auth-parameters USERNAME="doctor@test.com",PASSWORD="TestPass123!",SECRET_HASH="$SECRET_HASH" \
        --output json
    `;
    
    const result = execSync(command, { shell: '/bin/bash', encoding: 'utf8' });
    const authResponse = JSON.parse(result);
    
    if (authResponse.AuthenticationResult) {
      return {
        idToken: authResponse.AuthenticationResult.IdToken,
        accessToken: authResponse.AuthenticationResult.AccessToken,
        refreshToken: authResponse.AuthenticationResult.RefreshToken
      };
    }
  } catch (error) {
    console.error(`${colors.red}Failed to get auth token:${colors.reset}`, error.message);
    throw error;
  }
}

function parseJwtToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  try {
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function testEndpoint(url, token, tenantId) {
  console.log(`\n${colors.blue}Testing: ${url}${colors.reset}`);
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`${colors.green}✓ SUCCESS (${response.status}) - ${responseTime}ms${colors.reset}`);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('  Response preview:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
      }
      return true;
    } else {
      console.log(`${colors.red}✗ FAILED (${response.status} ${response.statusText}) - ${responseTime}ms${colors.reset}`);
      const text = await response.text();
      console.log('  Error:', text.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ ERROR: ${error.message}${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.cyan}${colors.bright}QIVR API Direct Test Suite${colors.reset}\n`);
  
  try {
    // Step 1: Get authentication token
    console.log(`${colors.yellow}Step 1: Authenticate with Cognito${colors.reset}`);
    const auth = await getAuthToken();
    console.log(`${colors.green}✓ Authentication successful${colors.reset}`);
    
    // Step 2: Parse token to get claims
    console.log(`\n${colors.yellow}Step 2: Parse JWT claims${colors.reset}`);
    const claims = parseJwtToken(auth.idToken);
    
    if (claims) {
      console.log(`  Email: ${claims.email}`);
      console.log(`  Role: ${claims['custom:role']}`);
      console.log(`  Tenant ID: ${claims['custom:tenant_id']}`);
      console.log(`  Clinic ID: ${claims['custom:clinic_id']}`);
    }
    
    const tenantId = claims?.['custom:tenant_id'] || 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11';
    
    // Step 3: Test API endpoints
    console.log(`\n${colors.yellow}Step 3: Test API Endpoints${colors.reset}`);
    
    const endpoints = [
      'http://localhost:5050/api/auth/debug',
      'http://localhost:5050/api/tenants',
      'http://localhost:5050/api/clinic-dashboard/overview',
      'http://localhost:5050/api/appointments',
      'http://localhost:5050/api/medical-records',
      'http://localhost:5050/api/notifications'
    ];
    
    let successCount = 0;
    let totalCount = endpoints.length;
    
    for (const endpoint of endpoints) {
      const success = await testEndpoint(endpoint, auth.idToken, tenantId);
      if (success) successCount++;
    }
    
    // Step 4: Test refresh token
    if (auth.refreshToken) {
      console.log(`\n${colors.yellow}Step 4: Test Token Refresh${colors.reset}`);
      
      try {
        const refreshCommand = `
          aws cognito-idp initiate-auth \
            --region "${REGION}" \
            --auth-flow REFRESH_TOKEN_AUTH \
            --client-id "${CLIENT_ID}" \
            --auth-parameters REFRESH_TOKEN="${auth.refreshToken}" \
            --output json
        `;
        
        const refreshResult = execSync(refreshCommand, { shell: '/bin/bash', encoding: 'utf8' });
        const refreshResponse = JSON.parse(refreshResult);
        
        if (refreshResponse.AuthenticationResult?.AccessToken) {
          console.log(`${colors.green}✓ Token refresh successful${colors.reset}`);
        }
      } catch (error) {
        console.log(`${colors.red}✗ Token refresh failed${colors.reset}`);
      }
    }
    
    // Summary
    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}TEST SUMMARY${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`Total endpoints tested: ${totalCount}`);
    console.log(`${colors.green}Successful: ${successCount}${colors.reset}`);
    console.log(`${colors.red}Failed: ${totalCount - successCount}${colors.reset}`);
    console.log(`Success rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
    if (successCount === totalCount) {
      console.log(`\n${colors.green}${colors.bright}✅ All tests passed!${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}${colors.bright}⚠️ Some tests failed${colors.reset}`);
    }
    
    process.exit(successCount === totalCount ? 0 : 1);
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);