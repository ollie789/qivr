-- Working seed data with all correct IDs

-- Create sample appointments
INSERT INTO appointments (
    id, tenant_id, patient_id, provider_id, provider_profile_id, clinic_id,
    scheduled_start, scheduled_end, status, appointment_type, location_type, location_details,
    is_paid, notes, created_at, updated_at
)
VALUES 
    ('aaaa1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', 'c6d5df09-0afc-4dc6-ada5-766d7214b8e5', '44444444-4444-4444-9444-444444444444', '33333333-3333-4333-9333-333333333333',
     NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'Scheduled', 'Initial Consultation', 'InPerson', '{}',
     false, 'New patient consultation for lower back pain', NOW(), NOW()),
    
    ('aaaa2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', 'c6d5df09-0afc-4dc6-ada5-766d7214b8e5', '44444444-4444-4444-9444-444444444444', '33333333-3333-4333-9333-333333333333',
     NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours', 'Scheduled', 'Follow-up', 'InPerson', '{}',
     false, 'Follow-up session for shoulder rehabilitation', NOW(), NOW()),
     
    ('aaaa3333-3333-4333-8333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '55555555-5555-4555-8555-555555555555', 'c6d5df09-0afc-4dc6-ada5-766d7214b8e5', '44444444-4444-4444-9444-444444444444', '33333333-3333-4333-9333-333333333333',
     NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'Scheduled', 'Treatment', 'InPerson', '{}',
     false, 'Physiotherapy treatment session', NOW(), NOW()),
     
    -- Past completed appointment
    ('aaaa4444-4444-4444-8444-444444444444', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', 'c6d5df09-0afc-4dc6-ada5-766d7214b8e5', '44444444-4444-4444-9444-444444444444', '33333333-3333-4333-9333-333333333333',
     NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 'Completed', 'Initial Consultation', 'InPerson', '{}',
     true, 'Completed initial assessment', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create medical conditions
INSERT INTO medical_conditions (id, tenant_id, patient_id, condition, icd10code, status, diagnosed_date, managed_by, last_reviewed, notes, created_at, updated_at)
VALUES 
    ('cccc1111-1111-4111-8111-111111111111', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-4333-8333-333333333333', 'Lower Back Pain', 'M54.5', 'Active', NOW() - INTERVAL '30 days', 'c6d5df09-0afc-4dc6-ada5-766d7214b8e5', NOW() - INTERVAL '7 days', 'Chronic lower back pain, likely mechanical', NOW(), NOW()),
    ('cccc2222-2222-4222-8222-222222222222', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-8444-444444444444', 'Shoulder Impingement', 'M75.4', 'Active', NOW() - INTERVAL '45 days', 'c6d5df09-0afc-4dc6-ada5-766d7214b8e5', NOW() - INTERVAL '14 days', 'Right shoulder impingement syndrome', NOW(), NOW()),
    ('cccc3333-3333-4333-8333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '55555555-5555-4555-8555-555555555555', 'Knee Osteoarthritis', 'M17.9', 'Active', NOW() - INTERVAL '60 days', 'c6d5df09-0afc-4dc6-ada5-766d7214b8e5', NOW() - INTERVAL '21 days', 'Bilateral knee osteoarthritis', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
