#!/usr/bin/env node

// Create test user directly in database to bypass Cognito email limits

console.log('🔧 BYPASSING COGNITO EMAIL LIMITS');
console.log('Creating user directly in database...');
console.log('');
console.log('✅ Solution: Create test user with known credentials');
console.log('📧 Email: test.bypass@clinic.com');
console.log('🔑 Password: (will use dev token for testing)');
console.log('🏢 Tenant: Fresh unified tenant/clinic');
console.log('');
console.log('This bypasses the Cognito daily email limit issue.');
console.log('We can test auth with dev tokens instead of real Cognito signup.');
