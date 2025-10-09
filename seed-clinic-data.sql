-- Comprehensive clinic portal data seeding
-- Aligns with tenant: b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11
-- Test user: test.doctor@clinic.com (cognito_sub: 9c69c69c-c69c-469c-9c69-c69c69c69c69)

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
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Ensure clinic exists
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
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Ensure test doctor user exists
INSERT INTO users (id, tenant_id, email, first_name, last_name, cognito_id, role, metadata, created_at, updated_at)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
    'test.doctor@clinic.com',
    'Dr. Sarah',
    'Johnson',
    '9c69c69c-c69c-469c-9c69-c69c69c69c69',
    'Clinician',
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    cognito_id = EXCLUDED.cognito_id,
    updated_at = NOW();

-- Create provider profile for test doctor
INSERT INTO providers (id, tenant_id, user_id, clinic_id, title, specialty, license_number, is_active, created_at, updated_at)
VALUES (
    '22222222-2222-4222-8222-222222222222',
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
    '11111111-1111-4111-8111-111111111111',
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
    'Dr.',
    'Physiotherapy',
    'PHYS12345',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    specialty = EXCLUDED.specialty,
    license_number = EXCLUDED.license_number,
    updated_at = NOW();

-- Create sample patients
INSERT INTO users (id, tenant_id, email, first_name, last_name, cognito_id, role, phone, metadata, created_at, updated_at)
VALUES 
    ('33333333-3333-4333-8333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'patient1@example.com', 'John', 'Smith', 'patient1-cognito-sub', 'Patient', '+61 400 123 456', '{}', NOW(), NOW()),
    ('44444444-4444-4444-8444-444444444444', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'patient2@example.com', 'Emma', 'Wilson', 'patient2-cognito-sub', 'Patient', '+61 400 789 012', '{}', NOW(), NOW()),
    ('55555555-5555-4555-8555-555555555555', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'patient3@example.com', 'Michael', 'Brown', 'patient3-cognito-sub', 'Patient', '+61 400 345 678', '{}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample appointments (mix of past, current, and future)
INSERT INTO appointments (
    id, tenant_id, patient_id, provider_id, provider_profile_id, clinic_id,
    scheduled_start, scheduled_end, status, appointment_type, location_type,
    notes, created_at, updated_at
)
VALUES 
    -- Today's appointments
    ('aaaa1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'Scheduled', 'Initial Consultation', 'InPerson',
     'New patient consultation for lower back pain', NOW(), NOW()),
    
    ('aaaa2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours', 'Scheduled', 'Follow-up', 'InPerson',
     'Follow-up session for shoulder rehabilitation', NOW(), NOW()),
    
    -- Tomorrow's appointments
    ('aaaa3333-3333-4333-8333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() + INTERVAL '1 day' + INTERVAL '2 hours', NOW() + INTERVAL '1 day' + INTERVAL '3 hours', 'Scheduled', 'Treatment', 'InPerson',
     'Physiotherapy treatment session', NOW(), NOW()),
    
    -- Past completed appointment
    ('aaaa4444-4444-4444-8444-444444444444', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 'Completed', 'Initial Consultation', 'InPerson',
     'Completed initial assessment', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create medical conditions for patients
INSERT INTO medical_conditions (id, tenant_id, patient_id, condition, icd10code, status, diagnosed_date, notes, created_at, updated_at)
VALUES 
    ('cccc1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', 'Lower Back Pain', 'M54.5', 'Active', NOW() - INTERVAL '30 days', 'Chronic lower back pain, likely mechanical', NOW(), NOW()),
    ('cccc2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', 'Shoulder Impingement', 'M75.4', 'Active', NOW() - INTERVAL '45 days', 'Right shoulder impingement syndrome', NOW(), NOW()),
    ('cccc3333-3333-4333-8333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '55555555-5555-4555-8555-555555555555', 'Knee Osteoarthritis', 'M17.9', 'Active', NOW() - INTERVAL '60 days', 'Bilateral knee osteoarthritis', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create recent vitals
INSERT INTO medical_vitals (id, tenant_id, patient_id, recorded_at, systolic, diastolic, heart_rate, weight_kilograms, height_centimetres, created_at, updated_at)
VALUES 
    ('vvvv1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', NOW() - INTERVAL '1 day', 120, 80, 72, 75.5, 175, NOW(), NOW()),
    ('vvvv2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', NOW() - INTERVAL '2 days', 118, 78, 68, 62.0, 165, NOW(), NOW()),
    ('vvvv3333-3333-4333-8333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '55555555-5555-4555-8555-555555555555', NOW() - INTERVAL '3 days', 125, 82, 75, 80.2, 180, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create PROM templates for physiotherapy
INSERT INTO prom_templates (id, tenant_id, key, name, version, category, description, questions, scoring_method, scoring_rules, is_active, created_at, updated_at)
VALUES (
    'pppp1111-1111-4111-8111-111111111111',
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
    'oswestry-disability-index',
    'Oswestry Disability Index',
    1,
    'Back Pain',
    'Assessment of disability due to lower back pain',
    '[{"id": "pain_intensity", "text": "How would you rate your pain right now?", "type": "scale", "min": 0, "max": 5, "labels": ["No pain", "Mild", "Moderate", "Fairly severe", "Very severe", "Worst possible"]}]',
    '{"type": "percentage", "max_score": 50}',
    '{"mild": {"min": 0, "max": 20}, "moderate": {"min": 21, "max": 40}, "severe": {"min": 41, "max": 60}, "crippled": {"min": 61, "max": 80}, "bed_bound": {"min": 81, "max": 100}}',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample PROM instances
INSERT INTO prom_instances (id, tenant_id, patient_id, template_id, status, scheduled_for, due_date, created_at, updated_at)
VALUES 
    ('iiii1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', 'pppp1111-1111-4111-8111-111111111111', 'Pending', NOW() + INTERVAL '1 day', NOW() + INTERVAL '3 days', NOW(), NOW()),
    ('iiii2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', 'pppp1111-1111-4111-8111-111111111111', 'Completed', NOW() - INTERVAL '1 day', NOW() + INTERVAL '2 days', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sample messages
INSERT INTO messages (id, tenant_id, sender_id, recipient_id, provider_profile_id, subject, content, message_type, status, created_at, updated_at)
VALUES 
    ('mmmm1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 'Question about exercises', 'Hi Dr. Johnson, I have a question about the exercises you prescribed. Should I continue if I feel mild discomfort?', 'PatientToProvider', 'Unread', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    ('mmmm2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222', 'Re: Question about exercises', 'Hi John, mild discomfort is normal as you build strength. Stop if you experience sharp pain. See you at your next appointment.', 'ProviderToPatient', 'Read', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- Create notifications for the clinic dashboard
INSERT INTO notifications (id, tenant_id, user_id, title, message, type, status, data, created_at, updated_at)
VALUES 
    ('nnnn1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '11111111-1111-4111-8111-111111111111', 'New Patient Message', 'John Smith sent you a message about exercises', 'Message', 'Unread', '{"message_id": "mmmm1111-1111-4111-8111-111111111111"}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    ('nnnn2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '11111111-1111-4111-8111-111111111111', 'Upcoming Appointment', 'Appointment with John Smith in 2 hours', 'Appointment', 'Unread', '{"appointment_id": "aaaa1111-1111-4111-8111-111111111111"}', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

COMMIT;
