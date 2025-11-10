-- Create clinic for tenant b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11
BEGIN;

-- Ensure tenant exists
INSERT INTO tenants (id, name, slug, settings, created_at, updated_at)
VALUES (
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
    'QIVR Demo Clinic',
    'demo-clinic',
    '{"features": ["appointments", "analytics", "messaging"]}',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Create clinic
INSERT INTO clinics (id, tenant_id, name, email, phone, address, city, state, zip_code, country, is_active, metadata, created_at, updated_at)
VALUES (
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
    'QIVR Demo Clinic',
    'clinic@qivr.health',
    '+61 2 9876 5432',
    '123 Health Street',
    'Sydney',
    'NSW',
    '2000',
    'Australia',
    true,
    '{}',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

COMMIT;
