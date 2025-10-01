-- Update doctor@test.com with new Cognito sub
UPDATE users 
SET 
    cognito_id = 'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c',
    role = 'Admin',
    tenant_id = 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11'
WHERE email = 'doctor@test.com';

-- Update nurse@test.com with new Cognito sub  
UPDATE users
SET 
    cognito_id = '27f20e6c-d4a8-4d82-a576-d726038def7e',
    role = 'Staff',
    tenant_id = 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11'
WHERE email = 'nurse@test.com';

-- Verify the updates
SELECT id, email, cognito_id, role, tenant_id 
FROM users 
WHERE email IN ('doctor@test.com', 'nurse@test.com');
