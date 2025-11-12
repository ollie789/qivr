-- Fix test data mismatch from clinic_id ≠ tenant_id era
-- This aligns all existing test data with the new unified model

BEGIN;

-- 1. Show current mismatch
SELECT 'BEFORE CLEANUP:' as status;
SELECT COUNT(*) as total_users, COUNT(DISTINCT tenant_id) as unique_tenants FROM users;
SELECT COUNT(*) as total_tenants FROM tenants;

-- 2. Delete orphaned users (users with tenant_id that doesn't exist)
DELETE FROM users 
WHERE tenant_id NOT IN (SELECT id FROM tenants);

-- 3. Delete test tenants that have no users
DELETE FROM tenants 
WHERE id NOT IN (SELECT DISTINCT tenant_id FROM users WHERE tenant_id IS NOT NULL)
AND name LIKE '%Test%' OR name LIKE '%Demo%' OR slug LIKE '%test%';

-- 4. Ensure we have one clean test tenant
INSERT INTO tenants (id, name, slug, settings, created_at, updated_at) 
VALUES (
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  'Clean Test Clinic', 
  'clean-test-clinic',
  '{}',
  NOW(), 
  NOW()
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug;

-- 5. Show after cleanup
SELECT 'AFTER CLEANUP:' as status;
SELECT COUNT(*) as total_users, COUNT(DISTINCT tenant_id) as unique_tenants FROM users;
SELECT COUNT(*) as total_tenants FROM tenants;

COMMIT;
