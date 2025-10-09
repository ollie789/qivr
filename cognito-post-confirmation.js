const { Client } = require('pg');

exports.handler = async (event) => {
    console.log('Post-confirmation event:', JSON.stringify(event, null, 2));
    
    const { userPoolId, userName, request } = event;
    const { userAttributes } = request;
    
    // Extract user data from Cognito attributes
    const userData = {
        cognitoSub: userAttributes.sub,
        email: userAttributes.email,
        tenantId: userAttributes['custom:custom:tenant_id'],
        clinicId: userAttributes['custom:custom:clinic_id'],
        role: userAttributes['custom:custom:role'] || 'Clinician',
        firstName: userAttributes.given_name || 'User',
        lastName: userAttributes.family_name || 'Name'
    };
    
    // Skip if missing required attributes
    if (!userData.tenantId || !userData.email) {
        console.log('Missing required attributes, skipping database sync');
        return event;
    }
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        await client.connect();
        
        // Upsert user record
        const query = `
            INSERT INTO users (id, tenant_id, email, first_name, last_name, cognito_id, role, metadata, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, '{}', NOW(), NOW())
            ON CONFLICT (tenant_id, email) 
            DO UPDATE SET 
                cognito_id = EXCLUDED.cognito_id,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                role = EXCLUDED.role,
                updated_at = NOW()
            RETURNING id;
        `;
        
        const result = await client.query(query, [
            userData.tenantId,
            userData.email,
            userData.firstName,
            userData.lastName,
            userData.cognitoSub,
            userData.role
        ]);
        
        console.log('User synced successfully:', result.rows[0]);
        
        // If role is Clinician/Admin, create provider profile
        if (['Clinician', 'Admin'].includes(userData.role) && userData.clinicId) {
            const providerQuery = `
                INSERT INTO providers (id, tenant_id, user_id, clinic_id, title, specialty, is_active, created_at, updated_at)
                VALUES (gen_random_uuid(), $1, $2, $3, 'Dr.', 'General Practice', true, NOW(), NOW())
                ON CONFLICT (tenant_id, user_id) DO NOTHING;
            `;
            
            await client.query(providerQuery, [
                userData.tenantId,
                result.rows[0].id,
                userData.clinicId
            ]);
            
            console.log('Provider profile created');
        }
        
    } catch (error) {
        console.error('Database sync error:', error);
        // Don't fail the auth flow, just log the error
    } finally {
        await client.end();
    }
    
    return event;
};
