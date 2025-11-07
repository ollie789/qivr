-- Quick seed script to add appointments for analytics
-- Run after patients are created by intake worker

DO $$
DECLARE
    v_tenant_id UUID := 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11';
    v_clinic_id UUID;
    v_provider_id UUID;
    v_patient_id UUID;
    v_count INT;
BEGIN
    -- Get clinic and provider
    SELECT id INTO v_clinic_id FROM clinics WHERE tenant_id = v_tenant_id LIMIT 1;
    SELECT id INTO v_provider_id FROM users WHERE email = 'test.doctor@clinic.com' AND tenant_id = v_tenant_id LIMIT 1;
    
    -- Wait a moment and check if patients exist
    SELECT COUNT(*) INTO v_count FROM users 
    WHERE tenant_id = v_tenant_id 
    AND user_type = 'Patient' 
    AND email IN ('john.smith@example.com', 'emily.jones@example.com', 'michael.brown@example.com', 'sarah.davis@example.com', 'david.wilson@example.com');
    
    RAISE NOTICE 'Found % patients to seed', v_count;
    
    -- John Smith - 2 appointments
    SELECT id INTO v_patient_id FROM users WHERE email = 'john.smith@example.com' AND tenant_id = v_tenant_id;
    IF v_patient_id IS NOT NULL THEN
        INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
        VALUES 
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '1 hour', 'Initial Consultation', 'Completed', 'Lower back pain assessment', NOW(), NOW()),
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '1 hour', 'Follow-up', 'Scheduled', NOW(), NOW());
        RAISE NOTICE '✓ John Smith: 2 appointments';
    END IF;
    
    -- Emily Jones - 3 appointments
    SELECT id INTO v_patient_id FROM users WHERE email = 'emily.jones@example.com' AND tenant_id = v_tenant_id;
    IF v_patient_id IS NOT NULL THEN
        INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
        VALUES 
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '1 hour', 'Initial Consultation', 'Completed', 'Knee injury assessment', NOW(), NOW()),
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '1 hour', 'Follow-up', 'Completed', 'Progress check', NOW(), NOW()),
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '1 hour', 'Follow-up', 'Scheduled', NOW(), NOW());
        RAISE NOTICE '✓ Emily Jones: 3 appointments';
    END IF;
    
    -- Michael Brown - 1 appointment
    SELECT id INTO v_patient_id FROM users WHERE email = 'michael.brown@example.com' AND tenant_id = v_tenant_id;
    IF v_patient_id IS NOT NULL THEN
        INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
        VALUES (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '1 hour', 'Initial Consultation', 'Completed', 'Shoulder pain assessment', NOW(), NOW());
        RAISE NOTICE '✓ Michael Brown: 1 appointment';
    END IF;
    
    -- Sarah Davis - 4 appointments
    SELECT id INTO v_patient_id FROM users WHERE email = 'sarah.davis@example.com' AND tenant_id = v_tenant_id;
    IF v_patient_id IS NOT NULL THEN
        INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
        VALUES 
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days' + INTERVAL '1 hour', 'Initial Consultation', 'Completed', 'Chronic pain management', NOW(), NOW()),
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '1 hour', 'Follow-up', 'Completed', 'Treatment progress', NOW(), NOW()),
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '1 hour', 'Follow-up', 'Completed', 'Ongoing treatment', NOW(), NOW()),
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '1 hour', 'Follow-up', 'Scheduled', NOW(), NOW());
        RAISE NOTICE '✓ Sarah Davis: 4 appointments';
    END IF;
    
    -- David Wilson - 1 old appointment
    SELECT id INTO v_patient_id FROM users WHERE email = 'david.wilson@example.com' AND tenant_id = v_tenant_id;
    IF v_patient_id IS NOT NULL THEN
        INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
        VALUES (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days' + INTERVAL '1 hour', 'Initial Consultation', 'Completed', 'Initial assessment', NOW(), NOW());
        RAISE NOTICE '✓ David Wilson: 1 appointment';
    END IF;
    
    -- Also add some for the original 3 test patients
    SELECT id INTO v_patient_id FROM users WHERE email = 'sarah.johnson@example.com' AND tenant_id = v_tenant_id;
    IF v_patient_id IS NOT NULL THEN
        INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
        VALUES 
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 hour', 'Initial Consultation', 'Completed', 'Back pain consultation', NOW(), NOW()),
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days' + INTERVAL '1 hour', 'Follow-up', 'Scheduled', NOW(), NOW());
        RAISE NOTICE '✓ Sarah Johnson: 2 appointments';
    END IF;
    
    SELECT id INTO v_patient_id FROM users WHERE email = 'michael.chen@example.com' AND tenant_id = v_tenant_id;
    IF v_patient_id IS NOT NULL THEN
        INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
        VALUES 
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 'Initial Consultation', 'Completed', 'Knee assessment', NOW(), NOW()),
            (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '1 hour', 'Follow-up', 'Scheduled', NOW(), NOW());
        RAISE NOTICE '✓ Michael Chen: 2 appointments';
    END IF;
    
    SELECT id INTO v_patient_id FROM users WHERE email = 'emma.williams@example.com' AND tenant_id = v_tenant_id;
    IF v_patient_id IS NOT NULL THEN
        INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
        VALUES (gen_random_uuid(), v_tenant_id, v_patient_id, v_provider_id, v_clinic_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '1 hour', 'Initial Consultation', 'Completed', 'Ergonomics assessment', NOW(), NOW());
        RAISE NOTICE '✓ Emma Williams: 1 appointment';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Analytics seed completed!';
    RAISE NOTICE 'Created 16 appointments across 8 patients';
    RAISE NOTICE 'Mix of completed and scheduled appointments';
    RAISE NOTICE 'Date range: 100 days ago to 21 days ahead';
    RAISE NOTICE '========================================';
END $$;
