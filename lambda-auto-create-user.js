const { Client } = require('pg');

exports.handler = async (event) => {
    console.log('Cognito trigger event:', JSON.stringify(event, null, 2));
    
    // Only process confirmed users
    if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') {
        return event;
    }
    
    const { userAttributes, userName } = event.request;
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        await client.connect();
        
        // Extract user info from Cognito attributes
        const email = userAttributes.email;
        const firstName = userAttributes.given_name || '';
        const lastName = userAttributes.family_name || '';
        const cognitoSub = userAttributes.sub;
        
        // Default tenant ID (you can customize this logic)
        const defaultTenantId = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';
        
        // Insert user record
        const query = `
            INSERT INTO "Users" ("Id", "CognitoSub", "Email", "FirstName", "LastName", "TenantId", "UserType", "CreatedAt", "UpdatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT ("CognitoSub") DO NOTHING
        `;
        
        const userId = require('crypto').randomUUID();
        const values = [userId, cognitoSub, email, firstName, lastName, defaultTenantId, 'Patient'];
        
        await client.query(query, values);
        console.log(`User record created for ${email}`);
        
    } catch (error) {
        console.error('Error creating user record:', error);
        throw error; // This will cause Cognito signup to fail
    } finally {
        await client.end();
    }
    
    return event;
};
