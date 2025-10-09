-- Final working seed data with all required fields

-- Create sample appointments
INSERT INTO appointments (
    id, tenant_id, patient_id, provider_id, provider_profile_id, clinic_id,
    scheduled_start, scheduled_end, status, appointment_type, location_type, location_details,
    is_paid, notes, created_at, updated_at
)
VALUES 
    ('aaaa1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'Scheduled', 'Initial Consultation', 'InPerson', '{}',
     false, 'New patient consultation for lower back pain', NOW(), NOW()),
    
    ('aaaa2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours', 'Scheduled', 'Follow-up', 'InPerson', '{}',
     false, 'Follow-up session for shoulder rehabilitation', NOW(), NOW()),
     
    ('aaaa3333-3333-4333-8333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'Scheduled', 'Treatment', 'InPerson', '{}',
     false, 'Physiotherapy treatment session', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create medical conditions with all required fields
INSERT INTO medical_conditions (id, tenant_id, patient_id, condition, icd10code, status, diagnosed_date, managed_by, last_reviewed, notes, created_at, updated_at)
VALUES 
    ('cccc1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', 'Lower Back Pain', 'M54.5', 'Active', NOW() - INTERVAL '30 days', '11111111-1111-4111-8111-111111111111', NOW() - INTERVAL '7 days', 'Chronic lower back pain, likely mechanical', NOW(), NOW()),
    ('cccc2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', 'Shoulder Impingement', 'M75.4', 'Active', NOW() - INTERVAL '45 days', '11111111-1111-4111-8111-111111111111', NOW() - INTERVAL '14 days', 'Right shoulder impingement syndrome', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create some vitals
INSERT INTO medical_vitals (id, tenant_id, patient_id, recorded_at, systolic, diastolic, heart_rate, weight_kilograms, height_centimetres, created_at, updated_at)
VALUES 
    ('vvvv1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', NOW() - INTERVAL '1 day', 120, 80, 72, 75.5, 175, NOW(), NOW()),
    ('vvvv2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', NOW() - INTERVAL '2 days', 118, 78, 68, 62.0, 165, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
