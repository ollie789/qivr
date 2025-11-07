-- Comprehensive Analytics Test Data
-- Creates complete patient journeys with appointments, PROMs, documents, messages
-- Run this against the production database to populate analytics

-- Get the default tenant ID
DO $$
DECLARE
    v_tenant_id UUID := 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11';
    v_clinic_id UUID;
    v_provider1_id UUID;
    v_provider2_id UUID;
    v_patient1_id UUID;
    v_patient2_id UUID;
    v_patient3_id UUID;
    v_patient4_id UUID;
    v_patient5_id UUID;
    v_appt1_id UUID;
    v_appt2_id UUID;
    v_appt3_id UUID;
    v_appt4_id UUID;
    v_appt5_id UUID;
    v_prom_template_id UUID;
    v_prom_instance1_id UUID;
    v_prom_instance2_id UUID;
BEGIN
    -- Get existing clinic
    SELECT id INTO v_clinic_id FROM clinics WHERE tenant_id = v_tenant_id LIMIT 1;
    
    -- Get or create providers
    SELECT id INTO v_provider1_id FROM users 
    WHERE email = 'test.doctor@clinic.com' AND tenant_id = v_tenant_id;
    
    IF v_provider1_id IS NULL THEN
        INSERT INTO users (id, tenant_id, email, first_name, last_name, user_type, email_verified, created_at, updated_at)
        VALUES (gen_random_uuid(), v_tenant_id, 'test.doctor@clinic.com', 'Dr. Sarah', 'Thompson', 'Provider', true, NOW(), NOW())
        RETURNING id INTO v_provider1_id;
    END IF;
    
    -- Create second provider
    INSERT INTO users (id, tenant_id, email, first_name, last_name, user_type, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'dr.james@clinic.com', 'Dr. James', 'Wilson', 'Provider', true, NOW(), NOW())
    RETURNING id INTO v_provider2_id
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW() RETURNING id INTO v_provider2_id;
    
    -- Create 5 complete patients with varied data
    
    -- Patient 1: Active with recent appointments
    INSERT INTO users (id, tenant_id, email, first_name, last_name, phone, date_of_birth, gender, user_type, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'john.smith@example.com', 'John', 'Smith', '+61412345001', '1985-03-15', 'Male', 'Patient', true, NOW() - INTERVAL '60 days', NOW())
    RETURNING id INTO v_patient1_id
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW() RETURNING id INTO v_patient1_id;
    
    -- Patient 2: Regular visitor
    INSERT INTO users (id, tenant_id, email, first_name, last_name, phone, date_of_birth, gender, user_type, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'emily.jones@example.com', 'Emily', 'Jones', '+61412345002', '1992-07-22', 'Female', 'Patient', true, NOW() - INTERVAL '90 days', NOW())
    RETURNING id INTO v_patient2_id
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW() RETURNING id INTO v_patient2_id;
    
    -- Patient 3: New patient
    INSERT INTO users (id, tenant_id, email, first_name, last_name, phone, date_of_birth, gender, user_type, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'michael.brown@example.com', 'Michael', 'Brown', '+61412345003', '1978-11-08', 'Male', 'Patient', true, NOW() - INTERVAL '14 days', NOW())
    RETURNING id INTO v_patient3_id
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW() RETURNING id INTO v_patient3_id;
    
    -- Patient 4: Long-term patient
    INSERT INTO users (id, tenant_id, email, first_name, last_name, phone, date_of_birth, gender, user_type, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'sarah.davis@example.com', 'Sarah', 'Davis', '+61412345004', '1988-05-20', 'Female', 'Patient', true, NOW() - INTERVAL '180 days', NOW())
    RETURNING id INTO v_patient4_id
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW() RETURNING id INTO v_patient4_id;
    
    -- Patient 5: Inactive patient
    INSERT INTO users (id, tenant_id, email, first_name, last_name, phone, date_of_birth, gender, user_type, email_verified, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'david.wilson@example.com', 'David', 'Wilson', '+61412345005', '1995-09-12', 'Male', 'Patient', true, NOW() - INTERVAL '120 days', NOW())
    RETURNING id INTO v_patient5_id
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW() RETURNING id INTO v_patient5_id;
    
    -- Create appointments across different time periods
    
    -- Patient 1: Recent completed appointment
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient1_id, v_provider1_id, v_clinic_id, 
            NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '1 hour', 
            'Initial Consultation', 'Completed', 'Lower back pain assessment', NOW() - INTERVAL '10 days', NOW())
    RETURNING id INTO v_appt1_id;
    
    -- Patient 1: Upcoming appointment
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient1_id, v_provider1_id, v_clinic_id, 
            NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '1 hour', 
            'Follow-up', 'Scheduled', NOW(), NOW());
    
    -- Patient 2: Multiple completed appointments
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient2_id, v_provider2_id, v_clinic_id, 
            NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '1 hour', 
            'Initial Consultation', 'Completed', 'Knee injury assessment', NOW() - INTERVAL '65 days', NOW())
    RETURNING id INTO v_appt2_id;
    
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient2_id, v_provider2_id, v_clinic_id, 
            NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '1 hour', 
            'Follow-up', 'Completed', 'Progress check', NOW() - INTERVAL '35 days', NOW())
    RETURNING id INTO v_appt3_id;
    
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient2_id, v_provider2_id, v_clinic_id, 
            NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '1 hour', 
            'Follow-up', 'Scheduled', NOW(), NOW());
    
    -- Patient 3: First appointment
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient3_id, v_provider1_id, v_clinic_id, 
            NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '1 hour', 
            'Initial Consultation', 'Completed', 'Shoulder pain assessment', NOW() - INTERVAL '14 days', NOW())
    RETURNING id INTO v_appt4_id;
    
    -- Patient 4: Regular appointments
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient4_id, v_provider1_id, v_clinic_id, 
            NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days' + INTERVAL '1 hour', 
            'Initial Consultation', 'Completed', 'Chronic pain management', NOW() - INTERVAL '95 days', NOW());
    
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient4_id, v_provider1_id, v_clinic_id, 
            NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '1 hour', 
            'Follow-up', 'Completed', 'Treatment progress', NOW() - INTERVAL '65 days', NOW());
    
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient4_id, v_provider1_id, v_clinic_id, 
            NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '1 hour', 
            'Follow-up', 'Completed', 'Ongoing treatment', NOW() - INTERVAL '35 days', NOW())
    RETURNING id INTO v_appt5_id;
    
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient4_id, v_provider1_id, v_clinic_id, 
            NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days' + INTERVAL '1 hour', 
            'Follow-up', 'Scheduled', NOW(), NOW());
    
    -- Patient 5: Old appointment (inactive)
    INSERT INTO appointments (id, tenant_id, patient_id, provider_id, clinic_id, scheduled_start, scheduled_end, appointment_type, status, notes, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient5_id, v_provider2_id, v_clinic_id, 
            NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days' + INTERVAL '1 hour', 
            'Initial Consultation', 'Completed', 'Initial assessment', NOW() - INTERVAL '105 days', NOW());
    
    -- Create PROM template
    INSERT INTO prom_templates (id, tenant_id, name, description, category, questions, scoring_algorithm, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'Pain Assessment Scale', 'Standard pain assessment questionnaire', 'Pain', 
            '[{"id":"q1","text":"Rate your pain level (0-10)","type":"scale","min":0,"max":10},{"id":"q2","text":"How does pain affect daily activities?","type":"scale","min":0,"max":10}]'::jsonb,
            '{"type":"sum","max":20}'::jsonb, NOW(), NOW())
    RETURNING id INTO v_prom_template_id
    ON CONFLICT (name, tenant_id) DO UPDATE SET updated_at = NOW() RETURNING id INTO v_prom_template_id;
    
    -- Create PROM instances for patients
    
    -- Patient 1: Completed PROM
    INSERT INTO prom_instances (id, tenant_id, patient_id, template_id, appointment_id, status, sent_at, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient1_id, v_prom_template_id, v_appt1_id, 'Completed', 
            NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days', NOW())
    RETURNING id INTO v_prom_instance1_id;
    
    INSERT INTO prom_responses (id, prom_instance_id, question_id, response_value, score, created_at)
    VALUES 
        (gen_random_uuid(), v_prom_instance1_id, 'q1', '7', 7, NOW() - INTERVAL '5 days'),
        (gen_random_uuid(), v_prom_instance1_id, 'q2', '6', 6, NOW() - INTERVAL '5 days');
    
    -- Patient 2: Multiple PROMs showing improvement
    INSERT INTO prom_instances (id, tenant_id, patient_id, template_id, appointment_id, status, sent_at, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient2_id, v_prom_template_id, v_appt2_id, 'Completed', 
            NOW() - INTERVAL '61 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '61 days', NOW())
    RETURNING id INTO v_prom_instance2_id;
    
    INSERT INTO prom_responses (id, prom_instance_id, question_id, response_value, score, created_at)
    VALUES 
        (gen_random_uuid(), v_prom_instance2_id, 'q1', '8', 8, NOW() - INTERVAL '60 days'),
        (gen_random_uuid(), v_prom_instance2_id, 'q2', '7', 7, NOW() - INTERVAL '60 days');
    
    INSERT INTO prom_instances (id, tenant_id, patient_id, template_id, appointment_id, status, sent_at, completed_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient2_id, v_prom_template_id, v_appt3_id, 'Completed', 
            NOW() - INTERVAL '31 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '31 days', NOW())
    RETURNING id INTO v_prom_instance2_id;
    
    INSERT INTO prom_responses (id, prom_instance_id, question_id, response_value, score, created_at)
    VALUES 
        (gen_random_uuid(), v_prom_instance2_id, 'q1', '4', 4, NOW() - INTERVAL '30 days'),
        (gen_random_uuid(), v_prom_instance2_id, 'q2', '3', 3, NOW() - INTERVAL '30 days');
    
    -- Patient 3: Pending PROM
    INSERT INTO prom_instances (id, tenant_id, patient_id, template_id, appointment_id, status, sent_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_patient3_id, v_prom_template_id, v_appt4_id, 'Sent', 
            NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW());
    
    -- Create documents for patients
    INSERT INTO documents (id, tenant_id, patient_id, uploaded_by, title, file_name, file_size, mime_type, storage_path, category, created_at, updated_at)
    VALUES 
        (gen_random_uuid(), v_tenant_id, v_patient1_id, v_provider1_id, 'X-Ray Results', 'xray_lower_back.pdf', 245678, 'application/pdf', 'documents/patient1/xray.pdf', 'Imaging', NOW() - INTERVAL '5 days', NOW()),
        (gen_random_uuid(), v_tenant_id, v_patient1_id, v_provider1_id, 'Treatment Plan', 'treatment_plan.pdf', 123456, 'application/pdf', 'documents/patient1/plan.pdf', 'Treatment Plan', NOW() - INTERVAL '4 days', NOW()),
        (gen_random_uuid(), v_tenant_id, v_patient2_id, v_provider2_id, 'MRI Scan', 'mri_knee.pdf', 567890, 'application/pdf', 'documents/patient2/mri.pdf', 'Imaging', NOW() - INTERVAL '60 days', NOW()),
        (gen_random_uuid(), v_tenant_id, v_patient2_id, v_provider2_id, 'Progress Notes', 'progress_notes.pdf', 98765, 'application/pdf', 'documents/patient2/notes.pdf', 'Clinical Notes', NOW() - INTERVAL '30 days', NOW()),
        (gen_random_uuid(), v_tenant_id, v_patient4_id, v_provider1_id, 'Initial Assessment', 'assessment.pdf', 156789, 'application/pdf', 'documents/patient4/assessment.pdf', 'Assessment', NOW() - INTERVAL '90 days', NOW());
    
    -- Create conversations and messages
    DECLARE
        v_conv1_id UUID;
        v_conv2_id UUID;
    BEGIN
        -- Conversation between Patient 1 and Provider 1
        INSERT INTO conversations (id, tenant_id, created_at, updated_at)
        VALUES (gen_random_uuid(), v_tenant_id, NOW() - INTERVAL '3 days', NOW())
        RETURNING id INTO v_conv1_id;
        
        INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
        VALUES 
            (v_conv1_id, v_patient1_id, NOW() - INTERVAL '3 days'),
            (v_conv1_id, v_provider1_id, NOW() - INTERVAL '3 days');
        
        INSERT INTO messages (id, conversation_id, sender_id, content, sent_at, read_at, created_at)
        VALUES 
            (gen_random_uuid(), v_conv1_id, v_patient1_id, 'Hi, I have a question about my treatment plan', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),
            (gen_random_uuid(), v_conv1_id, v_provider1_id, 'Of course! What would you like to know?', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
            (gen_random_uuid(), v_conv1_id, v_patient1_id, 'Should I continue the exercises daily?', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'),
            (gen_random_uuid(), v_conv1_id, v_provider1_id, 'Yes, daily exercises are important. Start with 10 minutes and gradually increase.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
        
        -- Conversation between Patient 2 and Provider 2
        INSERT INTO conversations (id, tenant_id, created_at, updated_at)
        VALUES (gen_random_uuid(), v_tenant_id, NOW() - INTERVAL '10 days', NOW())
        RETURNING id INTO v_conv2_id;
        
        INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
        VALUES 
            (v_conv2_id, v_patient2_id, NOW() - INTERVAL '10 days'),
            (v_conv2_id, v_provider2_id, NOW() - INTERVAL '10 days');
        
        INSERT INTO messages (id, conversation_id, sender_id, content, sent_at, read_at, created_at)
        VALUES 
            (gen_random_uuid(), v_conv2_id, v_patient2_id, 'My knee is feeling much better!', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
            (gen_random_uuid(), v_conv2_id, v_provider2_id, 'That''s great to hear! Keep up with the exercises.', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days');
    END;
    
    RAISE NOTICE 'Analytics test data created successfully!';
    RAISE NOTICE 'Created 5 patients with appointments, PROMs, documents, and messages';
    RAISE NOTICE 'Patient 1 (John Smith): Recent activity, 2 appointments, 1 PROM, 2 documents, 4 messages';
    RAISE NOTICE 'Patient 2 (Emily Jones): Regular visitor, 3 appointments, 2 PROMs, 2 documents, 2 messages';
    RAISE NOTICE 'Patient 3 (Michael Brown): New patient, 1 appointment, 1 pending PROM';
    RAISE NOTICE 'Patient 4 (Sarah Davis): Long-term, 4 appointments, 1 document';
    RAISE NOTICE 'Patient 5 (David Wilson): Inactive, 1 old appointment';
END $$;
