-- Manual user creation for Cognito sub: a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c
-- This will resolve the 403 Forbidden errors

-- First, ensure we have a default tenant
INSERT INTO tenants (id, name, slug, created_at, updated_at)
VALUES ('b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'Default Clinic', 'default-clinic', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create default clinic
INSERT INTO clinics (id, tenant_id, name, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'Default Clinic', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create the user with the Cognito sub
INSERT INTO users (id, cognito_sub, email, first_name, last_name, user_type, tenant_id, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c',
    'user-a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c@cognito.local',
    'Auto',
    'User',
    'Admin',
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
    NOW(),
    NOW()
) ON CONFLICT (cognito_sub) DO NOTHING;

-- Verify the user was created
SELECT id, cognito_sub, email, tenant_id, user_type FROM users WHERE cognito_sub = 'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c';
