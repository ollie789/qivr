#!/usr/bin/env node

// Simple provider creation test with known tenant ID
const API_BASE = 'https://clinic.qivr.pro/api';
const TENANT_ID = 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11'; // Known tenant from DB

async function testProviderCreation() {
  console.log('\n🧪 PROVIDER CREATION TEST');
  console.log(`API: ${API_BASE}`);
  console.log(`Tenant: ${TENANT_ID}`);

  const providerData = {
    firstName: 'Dr. Test',
    lastName: 'Provider',
    title: 'MD',
    specialty: 'General Practice',
    email: `provider-${Date.now()}@clinic.test`,
    phone: '+61412345678',
    licenseNumber: `LIC${Date.now()}`,
    isActive: true
  };

  try {
    const response = await fetch(`${API_BASE}/clinic-management/providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Id': TENANT_ID,
        'Authorization': 'Bearer test-token' // Mock auth for testing
      },
      body: JSON.stringify(providerData)
    });

    console.log(`\n📋 Provider Creation Response: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Provider created successfully');
      console.log(`📝 Provider ID: ${result.id}`);
      console.log(`📝 Name: ${result.firstName} ${result.lastName}`);
    } else {
      const error = await response.text();
      console.log(`❌ Provider creation failed: ${response.status}`);
      console.log(`📝 Error: ${error.substring(0, 200)}...`);
    }

  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
}

testProviderCreation().catch(console.error);
