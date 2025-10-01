-- Seed appointments for provider a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c
do
$$
begin
  if not exists (select 1 from appointments where id = '11111111-1111-1111-1111-111111111111') then
    insert into appointments (
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
    ) values (
      '11111111-1111-1111-1111-111111111111',
      'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
      '22222222-2222-2222-2222-222222222222',
      'b96ee4f8-7051-7098-213f-dafccafb06f9',
      'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c',
      now() + interval '1 hour',
      now() + interval '2 hour',
      'Consultation',
      'Scheduled',
      'Main Clinic',
      'Follow-up consultation',
      now(),
      now()
    );
  end if;

  if not exists (select 1 from appointments where id = '22222222-2222-2222-2222-222222222222') then
    insert into appointments (
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
    ) values (
      '22222222-2222-2222-2222-222222222222',
      'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
      '22222222-2222-2222-2222-222222222222',
      'b96ee4f8-7051-7098-213f-dafccafb06f9',
      'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c',
      now() - interval '2 day',
      now() - interval '2 day' + interval '1 hour',
      'Medication Review',
      'Completed',
      'Main Clinic',
      'Medication review session',
      now() - interval '2 day',
      now() - interval '2 day'
    );
  end if;
end
$$;

-- Seed PROM instances/responses
insert into prom_templates (id, tenant_id, name, created_at, updated_at)
select '33333333-3333-3333-3333-333333333333', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'Pain Assessment', now(), now()
where not exists (select 1 from prom_templates where id = '33333333-3333-3333-3333-333333333333');

insert into prom_instances (id, tenant_id, template_id, patient_id, status, created_at, updated_at)
select '44444444-4444-4444-4444-444444444444', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '33333333-3333-3333-3333-333333333333', 'b96ee4f8-7051-7098-213f-dafccafb06f9', 'Completed', now() - interval '1 day', now() - interval '1 day'
where not exists (select 1 from prom_instances where id = '44444444-4444-4444-4444-444444444444');

insert into prom_responses (id, tenant_id, prom_instance_id, score, created_at, updated_at)
select '55555555-5555-5555-5555-555555555555', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', '44444444-4444-4444-4444-444444444444', 78, now() - interval '1 day', now() - interval '1 day'
where not exists (select 1 from prom_responses where id = '55555555-5555-5555-5555-555555555555');
