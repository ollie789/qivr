-- Add users that match Cognito user pool
INSERT INTO users (email, first_name, last_name, cognito_id, tenant_id, role) 
VALUES 
  ('doctor@test.com', 'Test', 'Doctor', 'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'admin'),
  ('nurse@test.com', 'Test', 'Nurse', '27f20e6c-d4a8-4d82-a576-d726038def7e', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'practitioner')
ON CONFLICT (tenant_id, email) DO UPDATE SET 
  cognito_id = EXCLUDED.cognito_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = NOW();
