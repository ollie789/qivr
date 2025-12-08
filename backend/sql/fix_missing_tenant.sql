-- Insert missing tenant if it doesn't exist
INSERT INTO tenants (id, slug, name, status, plan, timezone, locale, settings, metadata, created_at, updated_at, is_active)
SELECT 
    'd1466419-46e4-4594-b6d9-523668431e06'::uuid,
    'demo-clinic',
    'Demo Clinic',
    0, -- Active
    'starter',
    'Australia/Sydney',
    'en-AU',
    '{}'::jsonb,
    '{}'::jsonb,
    NOW(),
    NOW(),
    true
WHERE NOT EXISTS (
    SELECT 1 FROM tenants WHERE id = 'd1466419-46e4-4594-b6d9-523668431e06'
);
