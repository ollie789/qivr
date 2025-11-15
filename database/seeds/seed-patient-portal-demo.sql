-- Seed data for patient1762923257212@example.com
-- Run this to populate appointments, PROMs, and messages for testing

DO
$$
DECLARE
  v_patient_id UUID;
  v_tenant_id UUID;
  v_clinic_id UUID;
  v_provider_id UUID;
  v_template_id UUID;
BEGIN
  -- Find the patient by email
  SELECT id, tenant_id INTO v_patient_id, v_tenant_id
  FROM patients
  WHERE email = 'patient1762923257212@example.com'
  LIMIT 1;

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Patient not found with email patient1762923257212@example.com';
  END IF;

  -- Get clinic and provider from tenant
  SELECT id INTO v_clinic_id FROM tenants WHERE id = v_tenant_id LIMIT 1;
  SELECT id INTO v_provider_id FROM providers WHERE tenant_id = v_tenant_id LIMIT 1;
  SELECT id INTO v_template_id FROM prom_templates WHERE tenant_id = v_tenant_id LIMIT 1;

  RAISE NOTICE 'Seeding data for patient % in tenant %', v_patient_id, v_tenant_id;

  -- Upcoming appointment
  INSERT INTO appointments (
    id, tenant_id, clinic_id, patient_id, provider_id,
    scheduled_start, scheduled_end,
    appointment_type, status, location, notes,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_tenant_id, v_clinic_id, v_patient_id, v_provider_id,
    NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '30 minutes',
    'Follow-up', 'Scheduled', 'Main Clinic', 'Post-surgery check',
    NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Recent completed appointment
  INSERT INTO appointments (
    id, tenant_id, clinic_id, patient_id, provider_id,
    scheduled_start, scheduled_end,
    appointment_type, status, location, notes,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_tenant_id, v_clinic_id, v_patient_id, v_provider_id,
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '45 minutes',
    'Consultation', 'Completed', 'Telehealth', 'Initial assessment completed',
    NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'
  ) ON CONFLICT DO NOTHING;

  -- Another past appointment
  INSERT INTO appointments (
    id, tenant_id, clinic_id, patient_id, provider_id,
    scheduled_start, scheduled_end,
    appointment_type, status, location, notes,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_tenant_id, v_clinic_id, v_patient_id, v_provider_id,
    NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days' + INTERVAL '1 hour',
    'Physical Exam', 'Completed', 'Main Clinic', 'Annual checkup',
    NOW() - INTERVAL '22 days', NOW() - INTERVAL '21 days'
  ) ON CONFLICT DO NOTHING;

  -- PROM instances if template exists
  IF v_template_id IS NOT NULL THEN
    -- Recent PROM
    INSERT INTO prom_instances (
      id, tenant_id, template_id, patient_id,
      status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_tenant_id, v_template_id, v_patient_id,
      'Completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
    ) ON CONFLICT DO NOTHING
    RETURNING id INTO v_template_id;

    -- PROM response
    INSERT INTO prom_responses (
      id, tenant_id, prom_instance_id, score,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_tenant_id, v_template_id, 85,
      NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
    ) ON CONFLICT DO NOTHING;
  END IF;

  -- Message from provider
  IF v_provider_id IS NOT NULL THEN
    INSERT INTO messages (
      id, tenant_id, sender_id, direct_recipient_id,
      direct_subject, direct_message_type, direct_priority,
      content, sender_name, sender_role,
      sent_at, is_read, is_system_message, is_deleted,
      deleted_by_sender, deleted_by_recipient,
      created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_tenant_id, v_provider_id, v_patient_id,
      'Appointment Reminder', 'Clinical', 'Normal',
      'Looking forward to seeing you at your upcoming appointment. Please bring any questions you may have.',
      'Dr. Smith', 'Provider',
      NOW() - INTERVAL '1 day', FALSE, FALSE, FALSE,
      FALSE, FALSE,
      NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
    ) ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Seeding completed successfully';
END
$$;
