-- Simple seeding without transactions

-- Create sample patients
INSERT INTO users (id, tenant_id, email, first_name, last_name, cognito_id, role, phone, metadata, created_at, updated_at)
VALUES 
    ('33333333-3333-4333-8333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'patient1@example.com', 'John', 'Smith', 'patient1-cognito-sub', 'Patient', '+61 400 123 456', '{}', NOW(), NOW()),
    ('44444444-4444-4444-8444-444444444444', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'patient2@example.com', 'Emma', 'Wilson', 'patient2-cognito-sub', 'Patient', '+61 400 789 012', '{}', NOW(), NOW()),
    ('55555555-5555-4555-8555-555555555555', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'patient3@example.com', 'Michael', 'Brown', 'patient3-cognito-sub', 'Patient', '+61 400 345 678', '{}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample appointments
INSERT INTO appointments (
    id, tenant_id, patient_id, provider_id, provider_profile_id, clinic_id,
    scheduled_start, scheduled_end, status, appointment_type, location_type,
    notes, created_at, updated_at
)
VALUES 
    ('aaaa1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'Scheduled', 'Initial Consultation', 'InPerson',
     'New patient consultation for lower back pain', NOW(), NOW()),
    
    ('aaaa2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours', 'Scheduled', 'Follow-up', 'InPerson',
     'Follow-up session for shoulder rehabilitation', NOW(), NOW()),
    
    ('aaaa3333-3333-4333-8333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() + INTERVAL '1 day' + INTERVAL '2 hours', NOW() + INTERVAL '1 day' + INTERVAL '3 hours', 'Scheduled', 'Treatment', 'InPerson',
     'Physiotherapy treatment session', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create medical conditions
INSERT INTO medical_conditions (id, tenant_id, patient_id, condition, icd10code, status, diagnosed_date, notes, created_at, updated_at)
VALUES 
    ('cccc1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', 'Lower Back Pain', 'M54.5', 'Active', NOW() - INTERVAL '30 days', 'Chronic lower back pain, likely mechanical', NOW(), NOW()),
    ('cccc2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', 'Shoulder Impingement', 'M75.4', 'Active', NOW() - INTERVAL '45 days', 'Right shoulder impingement syndrome', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample messages
INSERT INTO messages (id, tenant_id, sender_id, recipient_id, provider_profile_id, subject, content, message_type, status, created_at, updated_at)
VALUES 
    ('mmmm1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Question about exercises', 'Hi Dr. Johnson, I have a question about the exercises you prescribed. Should I continue if I feel mild discomfort?', 'PatientToProvider', 'Unread', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;
