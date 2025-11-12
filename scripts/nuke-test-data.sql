-- NUKE ALL TEST DATA - Start Fresh
-- Since all data is from testing, we can be aggressive

BEGIN;

-- Show what we're about to delete
SELECT 'BEFORE NUKE:' as status;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tenants;
SELECT COUNT(*) FROM appointments;
SELECT COUNT(*) FROM providers;

-- Delete everything (cascade will handle related data)
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE tenants CASCADE;
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE providers CASCADE;
TRUNCATE TABLE medical_records CASCADE;
TRUNCATE TABLE messages CASCADE;

-- Create ONE clean test tenant with unified ID
INSERT INTO tenants (id, name, slug, settings, created_at, updated_at) 
VALUES (
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  'Fresh Test Clinic', 
  'fresh-test-clinic',
  '{}',
  NOW(), 
  NOW()
);

-- Create ONE test user
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
  'fresh-test-sub-123',
  'Admin',
  '["Admin"]',
  NOW(),
  NOW()
);

-- Show clean state
SELECT 'AFTER NUKE:' as status;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM tenants;
SELECT id, email, tenant_id FROM users;

COMMIT;
