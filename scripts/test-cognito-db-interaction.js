#!/usr/bin/env node

/**
 * Test script to demonstrate Cognito-DB tenant ID interaction
 * This shows how the system works when adding tenant IDs to users
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'ap-southeast-2' });
const cognito = new AWS.CognitoIdentityServiceProvider();

async function testCognitoDbInteraction() {
    console.log('🧪 Testing Cognito-DB Tenant ID Interaction');
    console.log('='.repeat(50));

    try {
        // 1. Check current Cognito user pool structure
        console.log('\n1. Checking Cognito User Pool Structure...');
        const userPool = await cognito.describeUserPool({
            UserPoolId: 'ap-southeast-2_VHnD5yZaA'
        }).promise();

        console.log(`   Pool Name: ${userPool.UserPool.Name}`);
        console.log(`   Schema Attributes: ${userPool.UserPool.SchemaAttributes.length}`);
        
        // Check for tenant-related attributes
        const tenantAttrs = userPool.UserPool.SchemaAttributes.filter(attr => 
            attr.Name.toLowerCase().includes('tenant')
        );
        console.log(`   Tenant-related attributes: ${tenantAttrs.length}`);

        // 2. List current users
        console.log('\n2. Current Users in Cognito Pool...');
        const users = await cognito.listUsers({
            UserPoolId: 'ap-southeast-2_VHnD5yZaA'
        }).promise();

        console.log(`   Total users: ${users.Users.length}`);
        users.Users.forEach(user => {
            console.log(`   - ${user.Username} (${user.Attributes.find(a => a.Name === 'email')?.Value})`);
            console.log(`     Status: ${user.UserStatus}`);
            console.log(`     CognitoSub: ${user.Attributes.find(a => a.Name === 'sub')?.Value}`);
        });

        // 3. Test API endpoints to check database interaction
        console.log('\n3. Testing API Database Interaction...');
        
        // Test health endpoint first
        const healthResponse = await fetch('https://d2xnv2zqtx1fym.cloudfront.net/health');
        console.log(`   Health check: ${healthResponse.status} ${healthResponse.statusText}`);

        // Test tenants endpoint (should be public)
        try {
            const tenantsResponse = await fetch('https://d2xnv2zqtx1fym.cloudfront.net/api/tenants');
            const tenantsData = await tenantsResponse.json();
            console.log(`   Tenants endpoint: ${tenantsResponse.status}`);
            if (tenantsResponse.ok) {
                console.log(`   Available tenants: ${tenantsData.length || 'N/A'}`);
            } else {
                console.log(`   Error: ${tenantsData.error || tenantsData.message}`);
            }
        } catch (error) {
            console.log(`   Tenants endpoint error: ${error.message}`);
        }

        // 4. Demonstrate the tenant assignment process
        console.log('\n4. Tenant Assignment Process...');
        console.log('   In the QIVR system:');
        console.log('   - Users are created in Cognito with standard attributes (email, name)');
        console.log('   - User records are created in the database with TenantId field');
        console.log('   - TenantId links users to their organization/clinic');
        console.log('   - Authentication middleware extracts tenant context from JWT or headers');
        console.log('   - Database queries are filtered by tenant for multi-tenancy');

        // 5. Show the simplified Cognito structure
        console.log('\n5. Simplified Cognito Structure Benefits...');
        console.log('   ✅ No complex custom:custom:tenant_id attributes');
        console.log('   ✅ Standard JWT claims for authentication');
        console.log('   ✅ Database-driven tenant relationships');
        console.log('   ✅ Easier token parsing in frontend');
        console.log('   ✅ Cleaner user management');

        console.log('\n✅ Cognito-DB interaction test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

testCognitoDbInteraction();
