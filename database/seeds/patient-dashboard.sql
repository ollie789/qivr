-- Seed data to exercise patient dashboard endpoints
-- Covers upcoming appointments, historical visits, PROM responses, and unread messages

-- Appointments tailored for patient portal flows
DO
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM appointments WHERE id = '66666666-6666-6666-6666-666666666666') THEN
    INSERT INTO appointments (
      id,
      tenant_id,
      clinic_id,
      patient_id,
      provider_id,
      scheduled_start,
      scheduled_end,
      appointment_type,
      status,
      location,
      notes,
      created_at,
      updated_at
    ) VALUES (
      '66666666-6666-6666-6666-666666666666',
      'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
      '22222222-2222-2222-2222-222222222222',
      'b96ee4f8-7051-7098-213f-dafccafb06f9',
      'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c',
      NOW() + INTERVAL '3 day',
      NOW() + INTERVAL '3 day' + INTERVAL '45 minute',
      'Medication Review',
      'Scheduled',
      'Telehealth',
      'Metformin 500mg (Morning dose)',
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM appointments WHERE id = '77777777-7777-7777-7777-777777777777') THEN
    INSERT INTO appointments (
      id,
      tenant_id,
      clinic_id,
      patient_id,
      provider_id,
      scheduled_start,
      scheduled_end,
      appointment_type,
      status,
      location,
      notes,
      created_at,
      updated_at
    ) VALUES (
      '77777777-7777-7777-7777-777777777777',
      'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
      '22222222-2222-2222-2222-222222222222',
      'b96ee4f8-7051-7098-213f-dafccafb06f9',
      'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c',
      NOW() - INTERVAL '14 day',
      NOW() - INTERVAL '14 day' + INTERVAL '1 hour',
      'Physical Therapy Follow-up',
      'Completed',
      'Main Clinic',
      'Reviewed mobility goals after surgery',
      NOW() - INTERVAL '15 day',
      NOW() - INTERVAL '14 day'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM appointments WHERE id = '88888888-8888-8888-8888-888888888888') THEN
    INSERT INTO appointments (
      id,
      tenant_id,
      clinic_id,
      patient_id,
      provider_id,
      scheduled_start,
      scheduled_end,
      appointment_type,
      status,
      location,
      notes,
      created_at,
      updated_at
    ) VALUES (
      '88888888-8888-8888-8888-888888888888',
      'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
      '22222222-2222-2222-2222-222222222222',
      'b96ee4f8-7051-7098-213f-dafccafb06f9',
      'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c',
      NOW() - INTERVAL '7 day',
      NOW() - INTERVAL '7 day' + INTERVAL '45 minute',
      'Medication Review',
      'Completed',
      'Main Clinic',
      'Lisinopril 10mg (Evening dose)',
      NOW() - INTERVAL '8 day',
      NOW() - INTERVAL '7 day'
    );
  END IF;
END
$$;

-- Ensure the legacy medication review note is descriptive for the health summary view
UPDATE appointments
SET notes = 'Metformin 500mg (Evening dose)'
WHERE id = '22222222-2222-2222-2222-222222222222'
  AND (notes IS NULL OR notes != 'Metformin 500mg (Evening dose)');

-- PROM instances and responses to power metrics/trends
INSERT INTO prom_instances (
  id,
  tenant_id,
  template_id,
  patient_id,
  status,
  created_at,
  updated_at
)
SELECT
  '66666666-aaaa-4bbb-8ccc-111111111111',
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  '33333333-3333-3333-3333-333333333333',
  'b96ee4f8-7051-7098-213f-dafccafb06f9',
  'Completed',
  NOW() - INTERVAL '4 day',
  NOW() - INTERVAL '4 day'
WHERE NOT EXISTS (
  SELECT 1 FROM prom_instances WHERE id = '66666666-aaaa-4bbb-8ccc-111111111111'
);

INSERT INTO prom_instances (
  id,
  tenant_id,
  template_id,
  patient_id,
  status,
  created_at,
  updated_at
)
SELECT
  '66666666-bbbb-4ccc-8ddd-222222222222',
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  '33333333-3333-3333-3333-333333333333',
  'b96ee4f8-7051-7098-213f-dafccafb06f9',
  'Completed',
  NOW() - INTERVAL '12 day',
  NOW() - INTERVAL '12 day'
WHERE NOT EXISTS (
  SELECT 1 FROM prom_instances WHERE id = '66666666-bbbb-4ccc-8ddd-222222222222'
);

INSERT INTO prom_responses (
  id,
  tenant_id,
  prom_instance_id,
  score,
  created_at,
  updated_at
)
SELECT
  '66666666-cccc-4ddd-8eee-333333333333',
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  '66666666-aaaa-4bbb-8ccc-111111111111',
  88,
  NOW() - INTERVAL '6 hour',
  NOW() - INTERVAL '6 hour'
WHERE NOT EXISTS (
  SELECT 1 FROM prom_responses WHERE id = '66666666-cccc-4ddd-8eee-333333333333'
);

INSERT INTO prom_responses (
  id,
  tenant_id,
  prom_instance_id,
  score,
  created_at,
  updated_at
)
SELECT
  '66666666-dddd-4eee-8fff-444444444444',
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  '66666666-bbbb-4ccc-8ddd-222222222222',
  72,
  NOW() - INTERVAL '10 day',
  NOW() - INTERVAL '10 day'
WHERE NOT EXISTS (
  SELECT 1 FROM prom_responses WHERE id = '66666666-dddd-4eee-8fff-444444444444'
);

-- Backfill the original PROM response timestamp so trend maths consider the newer samples
UPDATE prom_responses
SET created_at = NOW() - INTERVAL '2 day',
    updated_at = NOW() - INTERVAL '2 day'
WHERE id = '55555555-5555-5555-5555-555555555555'
  AND created_at > NOW() - INTERVAL '2 day';

-- Unread provider-to-patient message to exercise badge counts
INSERT INTO messages (
  id,
  tenant_id,
  conversation_id,
  sender_id,
  direct_recipient_id,
  direct_subject,
  direct_message_type,
  direct_priority,
  content,
  sender_name,
  sender_role,
  sent_at,
  read_at,
  is_read,
  is_system_message,
  is_deleted,
  deleted_by_sender,
  deleted_by_recipient,
  created_at,
  updated_at
)
SELECT
  '99999999-9999-9999-9999-999999999999',
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  NULL,
  'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c',
  'b96ee4f8-7051-7098-213f-dafccafb06f9',
  'Medication review preparation',
  'Clinical',
  'Normal',
  'Hi there! Please complete the PROM before our appointment tomorrow so I can review the results ahead of time.',
  'Dr. Alan Smith',
  'Provider',
  NOW() - INTERVAL '5 hour',
  NULL,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  FALSE,
  NOW() - INTERVAL '5 hour',
  NOW() - INTERVAL '5 hour'
WHERE NOT EXISTS (
  SELECT 1 FROM messages WHERE id = '99999999-9999-9999-9999-999999999999'
);
