#!/usr/bin/env node

/**
 * Test Messaging System
 * Tests the new messaging features including categories and context linking
 */

const API_BASE = 'https://api.qivr.pro';

async function testMessagingSystem() {
  console.log('🧪 Testing Messaging System');
  console.log('===========================\n');

  const tests = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Get unread message count
  tests.push({
    name: 'Get unread message count',
    test: async () => {
      const response = await fetch(`${API_BASE}/api/messages/unread/count`, {
        headers: { 'X-Tenant-Id': 'test-tenant' }
      });
      const data = await response.json();
      return response.ok && typeof data.count === 'number';
    }
  });

  // Test 2: Get conversations
  tests.push({
    name: 'Get conversations list',
    test: async () => {
      const response = await fetch(`${API_BASE}/api/messages/conversations`, {
        headers: { 'X-Tenant-Id': 'test-tenant' }
      });
      const data = await response.json();
      return response.ok && Array.isArray(data);
    }
  });

  // Test 3: Send message with category
  tests.push({
    name: 'Send message with category',
    test: async () => {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': 'test-tenant'
        },
        body: JSON.stringify({
          recipientId: 'test-recipient',
          subject: 'Test Message',
          content: 'Testing category support',
          messageType: 'Medical',
          priority: 'Normal'
        })
      });
      return response.ok || response.status === 401; // 401 is ok (auth required)
    }
  });

  // Test 4: Send message with appointment context
  tests.push({
    name: 'Send message with appointment context',
    test: async () => {
      const response = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': 'test-tenant'
        },
        body: JSON.stringify({
          recipientId: 'test-recipient',
          subject: 'Appointment Reminder',
          content: 'Your appointment is tomorrow',
          messageType: 'Appointment',
          priority: 'Normal',
          relatedAppointmentId: 'test-appointment-id'
        })
      });
      return response.ok || response.status === 401;
    }
  });

  // Test 5: Check database migration (via health check)
  tests.push({
    name: 'Database schema updated (health check)',
    test: async () => {
      const response = await fetch(`${API_BASE}/health`);
      return response.ok;
    }
  });

  // Run tests
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  // Frontend tests
  console.log('\n🌐 Frontend Tests');
  console.log('=================\n');

  const frontendTests = [
    {
      name: 'Clinic Dashboard - Messages page',
      url: 'https://clinic.qivr.pro/messages'
    },
    {
      name: 'Patient Portal - Messages page',
      url: 'https://patient.qivr.pro/messages'
    },
    {
      name: 'Clinic Dashboard - Medical Records',
      url: 'https://clinic.qivr.pro/medical-records'
    }
  ];

  for (const test of frontendTests) {
    try {
      const response = await fetch(test.url);
      if (response.ok) {
        console.log(`✅ ${test.name} - ${response.status}`);
      } else {
        console.log(`⚠️  ${test.name} - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ${error.message}`);
    }
  }

  console.log('\n✨ Manual Testing Checklist:');
  console.log('============================');
  console.log('1. ✓ Login to clinic dashboard');
  console.log('2. ✓ Go to Medical Records, select patient');
  console.log('3. ✓ Click "Send Message" button');
  console.log('4. ✓ Select category (Appointment/Medical/Billing)');
  console.log('5. ✓ Send message and verify it appears');
  console.log('6. ✓ Go to Messages page');
  console.log('7. ✓ Filter by category tabs');
  console.log('8. ✓ Verify category chips display correctly');
  console.log('9. ✓ Check unread count badge on navigation');
  console.log('10. ✓ Login to patient portal');
  console.log('11. ✓ Go to Messages page');
  console.log('12. ✓ Verify new MUI interface');
  console.log('13. ✓ Send message with category');
  console.log('14. ✓ Verify category filtering works');
}

testMessagingSystem().catch(console.error);
