-- 011_sms_consent_and_phone_index.sql
-- Add consent flag for SMS opt-out and index on normalized phone for fast lookup

-- Add consent_sms column to users table (since we don't have a separate patients table)
alter table if exists qivr.users
  add column if not exists consent_sms boolean not null default true,
  add column if not exists phone_e164 text;

-- Create index for fast phone lookup
create index if not exists ix_users_phone_e164 on qivr.users (phone_e164);

-- Add audit_logs table for tracking consent changes and other events
create table if not exists qivr.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  event_type text not null,
  subject_type text not null,
  subject_id uuid,
  metadata jsonb,
  occurred_at timestamptz not null default now(),
  created_by uuid,
  
  -- Add RLS policy reference
  constraint fk_audit_tenant foreign key (tenant_id) references qivr.tenants(id)
);

-- Create index for audit log queries
create index if not exists ix_audit_logs_tenant_event on qivr.audit_logs (tenant_id, event_type, occurred_at desc);
create index if not exists ix_audit_logs_subject on qivr.audit_logs (subject_type, subject_id);

-- Enable RLS on audit_logs
alter table qivr.audit_logs enable row level security;

-- RLS policy for audit_logs (read-only for tenant members)
create policy audit_logs_tenant_read on qivr.audit_logs
  for select
  using (tenant_id::text = current_setting('app.tenant_id', true));
