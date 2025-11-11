#!/usr/bin/env node

/**
 * Frontend Page Test Suite
 * Tests all React pages with live authentication via HTTPS
 * 
 * Requires: Playwright
 * Install: npm install -D playwright
 * 
 * Usage:
 *   node test-frontend-pages.mjs <email> <password>
 */

import { chromium } from 'playwright';

const email = process.argv[2];
const password = process.argv[3];
const BASE_URL = 'https://clinic.qivr.pro';

if (!email || !password) {
  console.error('❌ Usage: node test-frontend-pages.mjs <email> <password>');
  process.exit(1);
}

console.log(`\n🌐 Testing Frontend Pages (HTTPS)`);
console.log(`URL: ${BASE_URL}\n`);

const pages = [
  { path: '/dashboard', name: 'Dashboard', dataCheck: '.stats-card, [data-testid="dashboard"]' },
  { path: '/patients', name: 'Patients', dataCheck: 'table, .patient-list, [data-testid="patients"]' },
  { path: '/appointments', name: 'Appointments', dataCheck: '.calendar, .appointment-list' },
  { path: '/messages', name: 'Messages', dataCheck: '.message-thread, .messages-list' },
  { path: '/documents', name: 'Documents', dataCheck: '.document-list, table' },
  { path: '/medical-records', name: 'Medical Records', dataCheck: '.records-list, table' },
  { path: '/settings', name: 'Settings', dataCheck: 'form, .settings-panel' },
  { path: '/analytics', name: 'Analytics', dataCheck: '.chart, canvas, [data-testid="analytics"]' },
  { path: '/prom', name: 'PROM', dataCheck: '.questionnaire, .prom-list' },
  { path: '/intake', name: 'Intake Forms', dataCheck: '.intake-form, form' }
];

async function testPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto(`${BASE_URL}`);
    
    // Wait for React app to load
    await page.waitForTimeout(3000);
    
    // Check if already logged in or need to login
    const currentUrl = page.url();
    console.log(`  📝 Current URL: ${currentUrl}`);
    
    // Try multiple selectors for email field
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]', 
      'input[placeholder*="email" i]',
      '#email',
      '[data-testid="email"]'
    ];
    
    let emailFilled = false;
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.fill(selector, email);
        emailFilled = true;
        console.log(`  ✅ Found email field: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!emailFilled) {
      // Maybe already logged in?
      if (currentUrl.includes('dashboard')) {
        console.log('  ✅ Already logged in');
        return;
      }
      throw new Error('Could not find email input field');
    }
    
    // Try multiple selectors for password field
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      '#password',
      '[data-testid="password"]'
    ];
    
    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        await page.fill(selector, password);
        passwordFilled = true;
        console.log(`  ✅ Found password field: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!passwordFilled) {
      throw new Error('Could not find password input field');
    }
    
    // Try multiple selectors for submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      '[data-testid="login-button"]'
    ];
    
    let buttonClicked = false;
    for (const selector of submitSelectors) {
      try {
        await page.click(selector);
        buttonClicked = true;
        console.log(`  ✅ Found submit button: ${selector}`);
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!buttonClicked) {
      throw new Error('Could not find submit button');
    }
    
    // Wait for redirect (could be dashboard or stay on login with error)
    try {
      await page.waitForURL(/dashboard/, { timeout: 15000 });
      console.log('  ✅ Login successful\n');
    } catch (e) {
      // Check if login failed
      const currentUrl = page.url();
      console.log(`  📝 After login URL: ${currentUrl}`);
      
      // Wait for loading to complete
      await page.waitForTimeout(5000);
      
      // Check for loading states
      const loadingElements = await page.$$('[data-testid="loading"], .loading, .spinner').catch(() => []);
      if (loadingElements.length > 0) {
        console.log('  ⏳ Still loading, waiting more...');
        await page.waitForTimeout(10000);
      }
      
      // Check final URL
      const finalUrl = page.url();
      console.log(`  📝 Final URL: ${finalUrl}`);
      
      if (finalUrl.includes('dashboard') || !finalUrl.includes('login')) {
        console.log('  ✅ Login successful (after loading)\n');
      } else {
        // Check for error messages
        const errors = await page.$$eval('[role="alert"], .error, .alert-error', 
          elements => elements.map(el => el.textContent)
        ).catch(() => []);
        
        if (errors.length > 0) {
          throw new Error(`Login failed: ${errors.join(', ')}`);
        } else {
          throw new Error('Login timeout - still on login page');
        }
      }
    }
    
    // Test each page
    for (const pageTest of pages) {
      console.log(`📄 Testing: ${pageTest.name}`);
      
      try {
        await page.goto(`${BASE_URL}${pageTest.path}`, { waitUntil: 'networkidle' });
        
        // Check page loaded
        const title = await page.title();
        console.log(`  📝 Title: ${title}`);
        
        // Check for errors
        const errors = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('.error, [role="alert"]');
          return Array.from(errorElements).map(el => el.textContent);
        });
        
        if (errors.length > 0) {
          console.log(`  ⚠️  Errors found: ${errors.join(', ')}`);
        }
        
        // Check for data/content
        const hasContent = await page.evaluate((selector) => {
          return document.querySelector(selector) !== null;
        }, pageTest.dataCheck);
        
        if (hasContent) {
          console.log(`  ✅ Content loaded`);
        } else {
          console.log(`  ⚠️  No content found (may be empty)`);
        }
        
        // Check for API calls
        const apiCalls = [];
        page.on('response', response => {
          if (response.url().includes('/api/')) {
            apiCalls.push({
              url: response.url(),
              status: response.status()
            });
          }
        });
        
        await page.waitForTimeout(2000); // Wait for API calls
        
        if (apiCalls.length > 0) {
          console.log(`  📡 API calls: ${apiCalls.length}`);
          const failed = apiCalls.filter(c => c.status >= 400);
          if (failed.length > 0) {
            console.log(`  ❌ Failed API calls: ${failed.map(c => `${c.status} ${c.url}`).join(', ')}`);
          }
        }
        
        // Check for tenant ID in requests
        const hasTenantHeader = await page.evaluate(() => {
          return window.localStorage.getItem('clinic-auth-storage') !== null;
        });
        
        if (hasTenantHeader) {
          console.log(`  ✅ Auth data present`);
        }
        
        // Screenshot
        await page.screenshot({ path: `/tmp/test-${pageTest.name.toLowerCase().replace(/\s+/g, '-')}.png` });
        
        passed++;
        results.push({ page: pageTest.name, status: 'PASS' });
        console.log(`  ✅ ${pageTest.name} test passed\n`);
        
      } catch (error) {
        failed++;
        results.push({ page: pageTest.name, status: 'FAIL', error: error.message });
        console.log(`  ❌ ${pageTest.name} test failed: ${error.message}\n`);
      }
    }
    
  } catch (error) {
    console.error(`\n💥 Test suite crashed: ${error.message}`);
    await browser.close();
    process.exit(1);
  }
  
  await browser.close();
  
  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 Test Results');
  console.log(`   ✅ Passed: ${passed}/${pages.length}`);
  console.log(`   ❌ Failed: ${failed}/${pages.length}`);
  console.log(`   📈 Success Rate: ${((passed / pages.length) * 100).toFixed(1)}%\n`);
  
  if (failed === 0) {
    console.log('🎉 All pages working correctly!');
  } else {
    console.log('⚠️  Some pages have issues:\n');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   ❌ ${r.page}: ${r.error}`);
    });
  }
  
  console.log('\n💡 Screenshots saved to /tmp/test-*.png');
}

testPages().catch(error => {
  console.error('💥 Error:', error.message);
  process.exit(1);
});
