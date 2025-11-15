-- Insert test evaluation for tenant d1466419-46e4-4594-b6d9-523668431e06
-- First, get a patient from this tenant
DO $$
DECLARE
    v_tenant_id UUID := 'd1466419-46e4-4594-b6d9-523668431e06';
    v_patient_id UUID;
    v_eval_id UUID := gen_random_uuid();
BEGIN
    -- Get first patient from tenant
    SELECT id INTO v_patient_id 
    FROM users 
    WHERE tenant_id = v_tenant_id 
    AND role = 'Patient'
    LIMIT 1;
    
    -- If no patient exists, create one
    IF v_patient_id IS NULL THEN
        v_patient_id := gen_random_uuid();
        INSERT INTO users (
            id, tenant_id, cognito_id, email, first_name, last_name, 
            role, created_at, updated_at
        ) VALUES (
            v_patient_id,
            v_tenant_id,
            'test-patient-' || v_patient_id::text,
            'testpatient@example.com',
            'Test',
            'Patient',
            'Patient',
            NOW(),
            NOW()
        );
    END IF;
    
    -- Insert evaluation
    INSERT INTO evaluations (
        id,
        tenant_id,
        patient_id,
        evaluation_number,
        chief_complaint,
        symptoms,
        medical_history,
        questionnaire_responses,
        status,
        urgency,
        created_at,
        updated_at
    ) VALUES (
        v_eval_id,
        v_tenant_id,
        v_patient_id,
        'EVAL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
        'Lower back pain',
        '["Back pain", "Stiffness", "Limited mobility"]'::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        'Pending',
        'Medium',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Created evaluation % for patient %', v_eval_id, v_patient_id;
END $$;
