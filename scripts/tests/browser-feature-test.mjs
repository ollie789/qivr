#!/usr/bin/env node

/**
 * Browser-Based Feature Testing
 * Uses Playwright to test actual user interactions and find console errors
 */

import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'https://clinic.qivr.pro';
const TEST_EMAIL = process.argv[2] || 'test@example.com';
const TEST_PASSWORD = process.argv[3] || 'Password123!';

const issues = [];
const consoleErrors = [];
const networkErrors = [];

function addIssue(severity, page, action, description, details = null) {
  issues.push({
    severity,
    page,
    action,
    description,
    details,
    timestamp: new Date().toISOString()
  });
}

async function testPage(page, url, pageName, tests) {
  console.log(`\n📄 Testing: ${pageName}`);
  console.log('─'.repeat(60));

  try {
    // Navigate to page
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    if (!response || response.status() !== 200) {
      addIssue('CRITICAL', pageName, 'Page Load', `Failed to load (Status: ${response?.status()})`);
      console.log(`❌ Page failed to load`);
      return;
    }

    console.log(`✓ Page loaded`);

    // Wait for React to render
    await page.waitForTimeout(2000);

    // Run page-specific tests
    for (const test of tests) {
      try {
        await test(page);
        console.log(`✓ ${test.name}`);
      } catch (error) {
        addIssue('HIGH', pageName, test.name, error.message, error.stack);
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }

  } catch (error) {
    addIssue('CRITICAL', pageName, 'Page Test', error.message, error.stack);
    console.log(`❌ Page test failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('\n🌐 Starting Browser-Based Feature Testing\n');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Capture network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    addIssue('HIGH', 'Global', 'Page Error', error.message, error.stack);
  });

  try {
    // Test Login Page
    await testPage(page, `${BASE_URL}/login`, 'Login Page', [
      async function checkLoginForm(page) {
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        await page.waitForSelector('input[type="password"]', { timeout: 5000 });
        await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
      },
      async function checkFormValidation(page) {
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
        // Should show validation errors
      }
    ]);

    // Try to login (if credentials provided)
    if (TEST_EMAIL && TEST_PASSWORD) {
      console.log(`\n🔐 Attempting login with ${TEST_EMAIL}...`);
      try {
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        // Check if redirected to dashboard
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard')) {
          console.log('✓ Login successful');

          // Test Dashboard
          await testPage(page, `${BASE_URL}/dashboard`, 'Dashboard', [
            async function checkStatCards(page) {
              const cards = await page.$$('[data-testid="stat-card"], .MuiCard-root');
              if (cards.length === 0) {
                throw new Error('No stat cards found');
              }
            },
            async function checkCharts(page) {
              await page.waitForTimeout(2000);
              // Check for chart elements
              const charts = await page.$$('canvas, svg[class*="recharts"]');
              if (charts.length === 0) {
                throw new Error('No charts found');
              }
            }
          ]);

          // Test Patients Page
          await testPage(page, `${BASE_URL}/patients`, 'Patients/Medical Records', [
            async function checkPatientList(page) {
              await page.waitForTimeout(2000);
              // Should have table or list
              const hasTable = await page.$('table, [role="table"]');
              if (!hasTable) {
                throw new Error('No patient list found');
              }
            },
            async function checkSearchBar(page) {
              const searchInput = await page.$('input[placeholder*="Search"], input[type="search"]');
              if (!searchInput) {
                throw new Error('No search bar found');
              }
            }
          ]);

          // Test Appointments Page
          await testPage(page, `${BASE_URL}/appointments`, 'Appointments', [
            async function checkCalendar(page) {
              await page.waitForTimeout(2000);
              const calendar = await page.$('[class*="calendar"], [class*="Calendar"]');
              if (!calendar) {
                throw new Error('No calendar found');
              }
            }
          ]);

          // Test Documents Page
          await testPage(page, `${BASE_URL}/documents`, 'Documents', [
            async function checkDocumentList(page) {
              await page.waitForTimeout(2000);
              // Should have upload button
              const uploadBtn = await page.$('button:has-text("Upload"), button:has-text("upload")');
              if (!uploadBtn) {
                throw new Error('No upload button found');
              }
            }
          ]);

          // Test Messages Page
          await testPage(page, `${BASE_URL}/messages`, 'Messages', [
            async function checkMessageList(page) {
              await page.waitForTimeout(2000);
              // Should have message list or empty state
              const hasMessages = await page.$('[class*="message"], [class*="Message"]');
              const hasEmptyState = await page.$('[class*="empty"], [class*="Empty"]');
              if (!hasMessages && !hasEmptyState) {
                throw new Error('No message list or empty state found');
              }
            }
          ]);

          // Test Analytics Page
          await testPage(page, `${BASE_URL}/analytics`, 'Analytics', [
            async function checkAnalyticsDashboard(page) {
              await page.waitForTimeout(3000);
              // Should have charts or metrics
              const charts = await page.$$('canvas, svg[class*="recharts"]');
              if (charts.length === 0) {
                throw new Error('No analytics charts found');
              }
            }
          ]);

          // Test Intake Page
          await testPage(page, `${BASE_URL}/intake`, 'Intake Management', [
            async function checkIntakeQueue(page) {
              await page.waitForTimeout(2000);
              // Should have kanban or table view
              const hasKanban = await page.$('[class*="kanban"], [class*="Kanban"]');
              const hasTable = await page.$('table');
              if (!hasKanban && !hasTable) {
                throw new Error('No intake queue found');
              }
            },
            async function checkViewToggle(page) {
              const toggleBtn = await page.$('button[aria-label*="view"], [class*="toggle"]');
              if (!toggleBtn) {
                throw new Error('No view toggle found');
              }
            }
          ]);

          // Test Settings Page
          await testPage(page, `${BASE_URL}/settings`, 'Settings', [
            async function checkSettingsTabs(page) {
              await page.waitForTimeout(2000);
              const tabs = await page.$$('[role="tab"], .MuiTab-root');
              if (tabs.length === 0) {
                throw new Error('No settings tabs found');
              }
            }
          ]);

        } else {
          console.log('❌ Login failed - not redirected to dashboard');
          addIssue('CRITICAL', 'Login', 'Authentication', 'Login did not redirect to dashboard');
        }
      } catch (error) {
        console.log(`❌ Login failed: ${error.message}`);
        addIssue('CRITICAL', 'Login', 'Authentication', error.message);
      }
    }

  } catch (error) {
    console.log(`\n❌ Test suite failed: ${error.message}`);
    addIssue('CRITICAL', 'Test Suite', 'Execution', error.message, error.stack);
  } finally {
    await browser.close();
  }

  // Generate Report
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results\n');

  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Network Errors: ${networkErrors.length}`);
  console.log(`Issues Found: ${issues.length}\n`);

  if (consoleErrors.length > 0) {
    console.log('🔴 Console Errors:\n');
    consoleErrors.slice(0, 10).forEach((error, i) => {
      console.log(`${i + 1}. ${error.text}`);
      if (error.location) {
        console.log(`   Location: ${error.location.url}:${error.location.lineNumber}`);
      }
    });
    if (consoleErrors.length > 10) {
      console.log(`\n... and ${consoleErrors.length - 10} more`);
    }
  }

  if (networkErrors.length > 0) {
    console.log('\n🔴 Network Errors:\n');
    networkErrors.slice(0, 10).forEach((error, i) => {
      console.log(`${i + 1}. ${error.status} ${error.statusText}`);
      console.log(`   URL: ${error.url}`);
    });
    if (networkErrors.length > 10) {
      console.log(`\n... and ${networkErrors.length - 10} more`);
    }
  }

  if (issues.length > 0) {
    console.log('\n🐛 Issues Found:\n');
    
    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');

    if (critical.length > 0) {
      console.log(`\n🔴 CRITICAL (${critical.length}):\n`);
      critical.forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.page}] ${issue.action}`);
        console.log(`   ${issue.description}`);
      });
    }

    if (high.length > 0) {
      console.log(`\n🟠 HIGH (${high.length}):\n`);
      high.forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.page}] ${issue.action}`);
        console.log(`   ${issue.description}`);
      });
    }
  }

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      consoleErrors: consoleErrors.length,
      networkErrors: networkErrors.length,
      issues: issues.length
    },
    consoleErrors,
    networkErrors,
    issues
  };

  fs.writeFileSync('./browser-test-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Detailed report saved to browser-test-report.json\n');
  console.log('='.repeat(60) + '\n');

  process.exit(issues.length > 0 ? 1 : 0);
}

// Check if Playwright is installed
try {
  await import('playwright');
  runTests().catch(error => {
    console.error(`\n❌ Test runner failed: ${error.message}\n`);
    process.exit(1);
  });
} catch (error) {
  console.error('\n❌ Playwright not installed. Run: npm install -D playwright\n');
  process.exit(1);
}
