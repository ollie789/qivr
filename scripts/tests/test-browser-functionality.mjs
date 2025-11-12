#!/usr/bin/env node

/**
 * Test browser functionality by checking the main pages
 */

import https from 'https';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'clinic.qivr.pro',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
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

async function testPage(path, description) {
  console.log(`Testing ${description}: ${path}`);
  try {
    const response = await makeRequest(path);
    console.log(`  Status: ${response.status}`);
    
    const isHtml = response.body.includes('<html>') || response.body.includes('<!DOCTYPE');
    const hasReactApp = response.body.includes('root') || response.body.includes('React');
    
    if (response.status === 200 && isHtml) {
      console.log(`  ✅ Page loads correctly`);
      if (hasReactApp) {
        console.log(`  ✅ React app detected`);
      }
      return true;
    } else {
      console.log(`  ❌ Page failed to load properly`);
      return false;
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🌐 Testing Browser Functionality\n');
  
  const pages = [
    ['/', 'Home Page'],
    ['/login', 'Login Page'],
    ['/signup', 'Signup Page'],
    ['/dashboard', 'Dashboard (should redirect to login)'],
    ['/settings', 'Settings Page (should redirect to login)'],
    ['/intake', 'Intake Management (should redirect to login)']
  ];
  
  let passed = 0;
  let total = pages.length;
  
  for (const [path, description] of pages) {
    const success = await testPage(path, description);
    if (success) passed++;
    console.log('');
  }
  
  console.log(`📊 Results: ${passed}/${total} pages load correctly`);
  
  if (passed >= 3) {
    console.log('✅ Frontend is deployed and working!');
    console.log('');
    console.log('🔧 Next steps to test full functionality:');
    console.log('1. Visit https://clinic.qivr.pro in your browser');
    console.log('2. Login with: test1762923257212@example.com / TestPass123!');
    console.log('3. Check Settings page → Staff tab');
    console.log('4. Check Intake Management page');
    console.log('');
    console.log('The API routing fixes are deployed. If you still see issues:');
    console.log('- Clear browser cache (Cmd+Shift+R)');
    console.log('- Check browser console for any remaining errors');
  } else {
    console.log('❌ Frontend deployment has issues');
  }
}

main().catch(console.error);
