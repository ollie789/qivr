-- Add sample intake data for testing
-- First create a patient, then an evaluation

-- Add a test patient
INSERT INTO users (
  id, cognito_id, email, first_name, last_name, role, tenant_id, metadata, created_at, updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'test-patient-intake',
  'test.patient@example.com',
  'Test',
  'Patient',
  'Patient',
  'd1466419-46e4-4594-b6d9-523668431e06',
  '{}',
  NOW(),
  NOW()
);

-- Add an evaluation for this patient
INSERT INTO evaluations (
  id, patient_id, evaluation_number, chief_complaint, symptoms, 
  medical_history, questionnaire_responses, status, urgency, 
  ai_risk_flags, tenant_id, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'EVAL-0001',
  'Back pain consultation',
  ARRAY['Lower back pain', 'Stiffness in morning'],
  'No significant medical history',
  '{}',
  'pending',
  'moderate',
  ARRAY[]::text[],
  'd1466419-46e4-4594-b6d9-523668431e06',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
);
