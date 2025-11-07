-- Sample Data for QIVR Platform
-- Creates demo patients, appointments, and medical records for testing

-- Note: This assumes users, tenants, and clinics already exist via auto-creation middleware
-- Run this after logging in with test.doctor@clinic.com

-- Get the first available clinic and provider
DO $$
DECLARE
    v_clinic_id UUID;
    v_provider_id UUID;
    v_tenant_id UUID;
    v_patient1_id UUID;
    v_patient2_id UUID;
    v_patient3_id UUID;
BEGIN
    -- Get first clinic
    SELECT id, tenant_id INTO v_clinic_id, v_tenant_id FROM clinics LIMIT 1;
    
    IF v_clinic_id IS NULL THEN
        RAISE EXCEPTION 'No clinic found. Please log in to create a clinic first.';
    END IF;

    -- Get first provider
    SELECT id INTO v_provider_id FROM users WHERE user_type = 'Provider' LIMIT 1;
    
    IF v_provider_id IS NULL THEN
        RAISE EXCEPTION 'No provider found. Please log in as a provider first.';
    END IF;

    -- Create sample patients
    INSERT INTO patients (id, first_name, last_name, email, phone, date_of_birth, gender, address, city, state, postal_code, country, emergency_contact_name, emergency_contact_phone, clinic_id, tenant_id, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), 'Sarah', 'Johnson', 'sarah.johnson@example.com', '+61412345678', '1985-03-15', 'Female', '123 Main St', 'Sydney', 'NSW', '2000', 'Australia', 'John Johnson', '+61412345679', v_clinic_id, v_tenant_id, NOW(), NOW()),
        (gen_random_uuid(), 'Michael', 'Chen', 'michael.chen@example.com', '+61423456789', '1990-07-22', 'Male', '456 George St', 'Melbourne', 'VIC', '3000', 'Australia', 'Lisa Chen', '+61423456790', v_clinic_id, v_tenant_id, NOW(), NOW()),
        (gen_random_uuid(), 'Emma', 'Williams', 'emma.williams@example.com', '+61434567890', '1978-11-08', 'Female', '789 Queen St', 'Brisbane', 'QLD', '4000', 'Australia', 'David Williams', '+61434567891', v_clinic_id, v_tenant_id, NOW(), NOW())
    RETURNING id INTO v_patient1_id;

    -- Get patient IDs
    SELECT id INTO v_patient1_id FROM patients WHERE email = 'sarah.johnson@example.com';
    SELECT id INTO v_patient2_id FROM patients WHERE email = 'michael.chen@example.com';
    SELECT id INTO v_patient3_id FROM patients WHERE email = 'emma.williams@example.com';

    -- Create appointments
    INSERT INTO appointments (id, patient_id, provider_id, clinic_id, tenant_id, appointment_date, duration_minutes, appointment_type, status, notes, created_at, updated_at)
    VALUES 
        -- Past appointments
        (gen_random_uuid(), v_patient1_id, v_provider_id, v_clinic_id, v_tenant_id, NOW() - INTERVAL '7 days', 60, 'Initial Consultation', 'Completed', 'Patient presented with lower back pain. Prescribed exercises.', NOW(), NOW()),
        (gen_random_uuid(), v_patient2_id, v_provider_id, v_clinic_id, v_tenant_id, NOW() - INTERVAL '3 days', 45, 'Follow-up', 'Completed', 'Shoulder mobility improving. Continue current treatment plan.', NOW(), NOW()),
        
        -- Upcoming appointments
        (gen_random_uuid(), v_patient1_id, v_provider_id, v_clinic_id, v_tenant_id, NOW() + INTERVAL '2 days', 60, 'Follow-up', 'Scheduled', 'Follow-up for back pain treatment', NOW(), NOW()),
        (gen_random_uuid(), v_patient3_id, v_provider_id, v_clinic_id, v_tenant_id, NOW() + INTERVAL '5 days', 60, 'Initial Consultation', 'Scheduled', 'New patient - knee pain assessment', NOW(), NOW()),
        (gen_random_uuid(), v_patient2_id, v_provider_id, v_clinic_id, v_tenant_id, NOW() + INTERVAL '10 days', 45, 'Follow-up', 'Scheduled', 'Continue shoulder rehabilitation', NOW(), NOW());

    -- Create medical records
    INSERT INTO medical_records (id, patient_id, provider_id, clinic_id, tenant_id, record_type, title, description, record_date, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), v_patient1_id, v_provider_id, v_clinic_id, v_tenant_id, 'Assessment', 'Initial Assessment - Lower Back Pain', 'Patient reports chronic lower back pain for 3 months. Pain rated 6/10. Limited range of motion. Prescribed stretching exercises and follow-up in 2 weeks.', NOW() - INTERVAL '7 days', NOW(), NOW()),
        (gen_random_uuid(), v_patient2_id, v_provider_id, v_clinic_id, v_tenant_id, 'Assessment', 'Shoulder Mobility Assessment', 'Reduced shoulder abduction. Likely rotator cuff strain. Treatment plan: manual therapy + home exercises.', NOW() - INTERVAL '3 days', NOW(), NOW()),
        (gen_random_uuid(), v_patient1_id, v_provider_id, v_clinic_id, v_tenant_id, 'Treatment Plan', 'Back Pain Treatment Plan', 'Week 1-2: Daily stretching, ice therapy. Week 3-4: Strengthen core muscles. Week 5-6: Return to normal activities gradually.', NOW() - INTERVAL '7 days', NOW(), NOW());

    -- Create medical conditions
    INSERT INTO medical_conditions (id, patient_id, condition_name, diagnosis_date, status, notes, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), v_patient1_id, 'Chronic Lower Back Pain', NOW() - INTERVAL '3 months', 'Active', 'Ongoing treatment with physiotherapy', NOW(), NOW()),
        (gen_random_uuid(), v_patient2_id, 'Rotator Cuff Strain', NOW() - INTERVAL '1 month', 'Active', 'Improving with treatment', NOW(), NOW()),
        (gen_random_uuid(), v_patient3_id, 'Osteoarthritis - Knee', NOW() - INTERVAL '2 years', 'Chronic', 'Managed with exercise and pain relief', NOW(), NOW());

    RAISE NOTICE 'Sample data created successfully!';
    RAISE NOTICE 'Clinic ID: %', v_clinic_id;
    RAISE NOTICE 'Provider ID: %', v_provider_id;
    RAISE NOTICE 'Created 3 patients, 5 appointments, 3 medical records, and 3 conditions';
END $$;
