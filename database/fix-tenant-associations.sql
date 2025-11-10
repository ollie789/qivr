-- Check current user-tenant associations
SELECT u.id, u.email, u.cognito_sub, u.tenant_id, t.name as tenant_name, t.slug 
FROM users u 
LEFT JOIN tenants t ON u.tenant_id = t.id 
ORDER BY u.created_at DESC 
LIMIT 20;

-- Check all tenants
SELECT id, name, slug FROM tenants ORDER BY created_at;

-- Update all users to use the correct tenant ID
UPDATE users 
SET tenant_id = 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11'::uuid 
WHERE tenant_id != 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11'::uuid 
   OR tenant_id IS NULL;

-- Verify the update
SELECT COUNT(*) as total_users, 
       COUNT(CASE WHEN tenant_id = 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11'::uuid THEN 1 END) as correct_tenant_users
FROM users;
