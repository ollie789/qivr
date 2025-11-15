-- Quick seed for patient1762923257212@example.com
DO $$
DECLARE
  v_patient_id UUID;
  v_tenant_id UUID;
  v_provider_id UUID;
BEGIN
  -- Users table with role = 'Patient'
  SELECT id, tenant_id INTO v_patient_id, v_tenant_id 
  FROM users 
  WHERE email = 'patient1762923257212@example.com' AND role = 'Patient'
  LIMIT 1;
  
  -- Get a provider from same tenant
  SELECT id INTO v_provider_id 
  FROM users 
  WHERE tenant_id = v_tenant_id AND role = 'Provider'
  LIMIT 1;
  
  IF v_patient_id IS NOT NULL THEN
    INSERT INTO appointments (id, tenant_id, clinic_id, patient_id, provider_id, scheduled_start, scheduled_end, appointment_type, status, location, notes, created_at, updated_at)
    VALUES 
      (gen_random_uuid(), v_tenant_id, v_tenant_id, v_patient_id, v_provider_id, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 30 minutes', 'Follow-up', 'Scheduled', 'Main Clinic', 'Post-surgery check', NOW(), NOW()),
      (gen_random_uuid(), v_tenant_id, v_tenant_id, v_patient_id, v_provider_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '45 minutes', 'Consultation', 'Completed', 'Telehealth', 'Initial assessment', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
      (gen_random_uuid(), v_tenant_id, v_tenant_id, v_patient_id, v_provider_id, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days' + INTERVAL '1 hour', 'Physical Exam', 'Completed', 'Main Clinic', 'Annual checkup', NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Seeded 3 appointments for patient % in tenant %', v_patient_id, v_tenant_id;
  ELSE
    RAISE NOTICE 'Patient not found with email patient1762923257212@example.com';
  END IF;
END $$;
