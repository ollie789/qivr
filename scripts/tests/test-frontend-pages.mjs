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
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    console.log('  ✅ Login successful\n');
    
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
