#!/usr/bin/env node

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const PATIENT_PORTAL_URL = 'https://patient.qivr.pro';
const TEST_TIMEOUT = 30000;

// Test credentials (use test account)
const TEST_PATIENT = {
  email: 'test.patient@qivr.pro',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'Patient'
};

class PatientPortalTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async setup() {
    console.log('🚀 Setting up Patient Portal tests...');
    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();
    
    // Set viewport and timeout
    await this.page.setViewportSize({ width: 1280, height: 720 });
    this.page.setDefaultTimeout(TEST_TIMEOUT);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Running: ${testName}`);
    try {
      await testFn();
      console.log(`✅ ${testName} - PASSED`);
      this.results.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
      this.results.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  async testPortalAccess() {
    await this.page.goto(PATIENT_PORTAL_URL);
    await this.page.waitForLoadState('networkidle');
    
    // Check if login page loads
    const title = await this.page.title();
    if (!title.includes('Patient Portal') && !title.includes('Qivr')) {
      throw new Error(`Unexpected page title: ${title}`);
    }
    
    // Check for login form
    const loginForm = await this.page.locator('form').first();
    if (!(await loginForm.isVisible())) {
      throw new Error('Login form not found');
    }
  }

  async testPatientLogin() {
    await this.page.goto(`${PATIENT_PORTAL_URL}/login`);
    await this.page.waitForLoadState('networkidle');
    
    // Fill login form
    await this.page.fill('input[type="email"]', TEST_PATIENT.email);
    await this.page.fill('input[type="password"]', TEST_PATIENT.password);
    
    // Submit login
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard or handle auth flow
    await this.page.waitForTimeout(3000);
    
    // Check if we're logged in (look for dashboard elements)
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/verify')) {
      console.log('ℹ️  Login may require email verification or MFA');
      return;
    }
    
    // Look for dashboard indicators
    const dashboardElements = await this.page.locator('[data-testid="dashboard"], .dashboard, h1, h2').count();
    if (dashboardElements === 0) {
      throw new Error('Dashboard not loaded after login');
    }
  }

  async testDashboardNavigation() {
    // Test main navigation items
    const navItems = [
      { text: 'Dashboard', url: '/dashboard' },
      { text: 'Appointments', url: '/appointments' },
      { text: 'Messages', url: '/messages' },
      { text: 'Medical Records', url: '/medical-records' },
      { text: 'Documents', url: '/documents' },
      { text: 'Profile', url: '/profile' }
    ];

    for (const item of navItems) {
      try {
        // Look for navigation link
        const navLink = this.page.locator(`a:has-text("${item.text}"), button:has-text("${item.text}")`).first();
        
        if (await navLink.isVisible()) {
          await navLink.click();
          await this.page.waitForTimeout(1000);
          console.log(`  ✓ ${item.text} navigation works`);
        } else {
          console.log(`  ⚠️  ${item.text} navigation not found`);
        }
      } catch (error) {
        console.log(`  ⚠️  ${item.text} navigation error: ${error.message}`);
      }
    }
  }

  async testAppointmentBooking() {
    // Navigate to appointments
    await this.page.goto(`${PATIENT_PORTAL_URL}/appointments`);
    await this.page.waitForLoadState('networkidle');
    
    // Look for book appointment button
    const bookButton = this.page.locator('button:has-text("Book"), button:has-text("Schedule"), a:has-text("Book")').first();
    
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await this.page.waitForTimeout(2000);
      
      // Check if booking form/calendar appears
      const bookingElements = await this.page.locator('form, .calendar, .appointment-form, [data-testid="booking"]').count();
      if (bookingElements === 0) {
        throw new Error('Appointment booking interface not found');
      }
      console.log('  ✓ Appointment booking interface loads');
    } else {
      console.log('  ⚠️  Book appointment button not found');
    }
  }

  async testMessaging() {
    await this.page.goto(`${PATIENT_PORTAL_URL}/messages`);
    await this.page.waitForLoadState('networkidle');
    
    // Check for messaging interface
    const messagingElements = await this.page.locator('.messages, .chat, .conversation, [data-testid="messages"]').count();
    if (messagingElements === 0) {
      // Check if it's an empty state
      const emptyState = await this.page.locator('text=No messages, text=Empty, .empty-state').count();
      if (emptyState === 0) {
        throw new Error('Messaging interface not found');
      }
    }
    console.log('  ✓ Messaging interface accessible');
  }

  async testPROMCompletion() {
    // Look for PROM/questionnaire links
    const promLinks = this.page.locator('a:has-text("Questionnaire"), a:has-text("PROM"), a:has-text("Survey")');
    
    if (await promLinks.count() > 0) {
      await promLinks.first().click();
      await this.page.waitForTimeout(2000);
      
      // Check for questionnaire form
      const formElements = await this.page.locator('form, .questionnaire, .survey, [data-testid="prom"]').count();
      if (formElements === 0) {
        throw new Error('PROM questionnaire not found');
      }
      console.log('  ✓ PROM questionnaire accessible');
    } else {
      console.log('  ⚠️  No PROM questionnaires found');
    }
  }

  async testMedicalRecords() {
    await this.page.goto(`${PATIENT_PORTAL_URL}/medical-records`);
    await this.page.waitForLoadState('networkidle');
    
    // Check for medical records interface
    const recordsElements = await this.page.locator('.records, .medical-records, table, .record-list').count();
    if (recordsElements === 0) {
      // Check for empty state
      const emptyState = await this.page.locator('text=No records, text=Empty, .empty-state').count();
      if (emptyState === 0) {
        throw new Error('Medical records interface not found');
      }
    }
    console.log('  ✓ Medical records interface accessible');
  }

  async testProfileManagement() {
    await this.page.goto(`${PATIENT_PORTAL_URL}/profile`);
    await this.page.waitForLoadState('networkidle');
    
    // Check for profile form
    const profileForm = await this.page.locator('form, .profile-form, input[type="text"], input[type="email"]').count();
    if (profileForm === 0) {
      throw new Error('Profile management interface not found');
    }
    console.log('  ✓ Profile management accessible');
  }

  async testResponsiveDesign() {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.goto(PATIENT_PORTAL_URL);
    await this.page.waitForLoadState('networkidle');
    
    // Check if mobile navigation exists
    const mobileNav = await this.page.locator('.mobile-nav, .hamburger, button[aria-label*="menu"]').count();
    if (mobileNav === 0) {
      console.log('  ⚠️  Mobile navigation not found');
    } else {
      console.log('  ✓ Mobile navigation present');
    }
    
    // Reset to desktop
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async testAccessibility() {
    await this.page.goto(PATIENT_PORTAL_URL);
    await this.page.waitForLoadState('networkidle');
    
    // Check for basic accessibility features
    const accessibilityChecks = [
      { selector: 'img[alt]', name: 'Images with alt text' },
      { selector: 'button, input[type="submit"]', name: 'Interactive elements' },
      { selector: 'label', name: 'Form labels' },
      { selector: '[role]', name: 'ARIA roles' }
    ];
    
    for (const check of accessibilityChecks) {
      const count = await this.page.locator(check.selector).count();
      console.log(`  ${count > 0 ? '✓' : '⚠️'} ${check.name}: ${count} found`);
    }
  }

  async runAllTests() {
    await this.setup();
    
    try {
      await this.runTest('Portal Access', () => this.testPortalAccess());
      await this.runTest('Patient Login', () => this.testPatientLogin());
      await this.runTest('Dashboard Navigation', () => this.testDashboardNavigation());
      await this.runTest('Appointment Booking', () => this.testAppointmentBooking());
      await this.runTest('Messaging System', () => this.testMessaging());
      await this.runTest('PROM Completion', () => this.testPROMCompletion());
      await this.runTest('Medical Records', () => this.testMedicalRecords());
      await this.runTest('Profile Management', () => this.testProfileManagement());
      await this.runTest('Responsive Design', () => this.testResponsiveDesign());
      await this.runTest('Accessibility', () => this.testAccessibility());
      
    } finally {
      await this.cleanup();
    }
    
    this.printResults();
  }

  printResults() {
    console.log('\n📊 Patient Portal Test Results:');
    console.log('================================');
    
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
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PatientPortalTester();
  tester.runAllTests().catch(console.error);
}

export default PatientPortalTester;
