-- Create test user for auth debugging
-- This creates the user that the tests expect to exist

BEGIN;

-- Ensure default tenant exists
INSERT INTO tenants (id, name, slug, settings, created_at, updated_at) 
VALUES (
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  'Test Clinic', 
  'test-clinic',
  '{}',
  NOW(), 
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test user
INSERT INTO users (
  id, 
  tenant_id, 
  email, 
  first_name, 
  last_name, 
  cognito_sub, 
  user_type, 
  roles,
  created_at, 
  updated_at
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  'test.doctor@clinic.com',
  'Test',
  'Doctor',
  'test-cognito-sub-123',
  'Admin',
  '["Admin"]',
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  user_type = EXCLUDED.user_type,
  roles = EXCLUDED.roles;

COMMIT;

-- Verify user was created
SELECT id, email, tenant_id, user_type, roles FROM users WHERE email = 'test.doctor@clinic.com';
