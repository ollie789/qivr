-- 010_intake_idempotency_and_csp.sql
-- Idempotency table for SQS consumer (intake pipeline)
create table if not exists qivr.intake_dedupe (
  message_id text primary key,
  processed_at timestamptz default now()
);
