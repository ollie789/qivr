-- Add oliver@qivr.io as admin user
INSERT INTO users (id, cognito_id, email, first_name, last_name, phone, role, tenant_id, created_at, updated_at, metadata)
VALUES (
    gen_random_uuid(),
    '62fa9aba-a2f2-423d-8654-73cbdbb4428a',
    'oliver@qivr.io',
    'Oliver',
    'Bingemann',
    '+61428598466',
    'Admin',
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
    NOW(),
    NOW(),
    '{}'::jsonb
)
ON CONFLICT (cognito_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();
