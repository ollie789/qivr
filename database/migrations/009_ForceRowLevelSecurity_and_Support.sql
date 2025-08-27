-- Migration: 009_ForceRowLevelSecurity_and_Support.sql
-- Purpose:
--  1) FORCE ROW LEVEL SECURITY on all PHI-bearing tables
--  2) Add idempotency_keys table for API Idempotency-Key middleware
--  3) Add calendar_sync_states and webhook_events for calendar/webhook skeletons
--  4) Update appointments double-booking constraint to partial unique index
-- Date: 2025-01-15

SET search_path TO qivr, public;

-- 1) FORCE RLS on PHI tables (only if table exists)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users',
        'evaluations',
        'pain_maps',
        'appointments',
        'prom_templates',
        'prom_instances',
        'patient_records',
        'notifications',
        'consent_records'
    ]
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'qivr' AND table_name = t
        ) THEN
            EXECUTE format('ALTER TABLE qivr.%I ENABLE ROW LEVEL SECURITY', t);
            BEGIN
                EXECUTE format('ALTER TABLE qivr.%I FORCE ROW LEVEL SECURITY', t);
            EXCEPTION WHEN undefined_object THEN
                -- Older Postgres versions might not support FORCE; ignore
                NULL;
            END;
        END IF;
    END LOOP;
END $$;

-- 2) Idempotency table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    idempotency_key TEXT NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    request_hash TEXT,
    status_code INTEGER,
    response_body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_idempotency_key
    ON idempotency_keys(tenant_id, idempotency_key, method, path);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'qivr' AND tablename = 'idempotency_keys' AND policyname = 'idempotency_keys_tenant_isolation'
    ) THEN
        CREATE POLICY idempotency_keys_tenant_isolation ON idempotency_keys
            FOR ALL
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
    END IF;
END $$;

-- 3) Calendar sync state and webhook events
CREATE TABLE IF NOT EXISTS calendar_sync_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google','microsoft')),
    calendar_id TEXT,
    next_sync_token TEXT,
    delta_token TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, user_id, provider)
);

ALTER TABLE calendar_sync_states ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'qivr' AND tablename = 'calendar_sync_states' AND policyname = 'calendar_sync_states_tenant_isolation'
    ) THEN
        CREATE POLICY calendar_sync_states_tenant_isolation ON calendar_sync_states
            FOR ALL
            USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
            WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    event_id TEXT NOT NULL,
    idempotency_key TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}',
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    UNIQUE(provider, event_id)
);

-- 4) Double-booking: partial unique index; drop old constraint if exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'qivr' AND table_name = 'appointments' AND constraint_name = 'no_double_booking'
    ) THEN
        ALTER TABLE appointments DROP CONSTRAINT no_double_booking;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_provider_time
ON appointments (provider_id, scheduled_start, scheduled_end, tenant_id)
WHERE status <> 'cancelled';

-- Ensure tenant_id is indexed for the new tables
CREATE INDEX IF NOT EXISTS idx_idempotency_tenant ON idempotency_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_tenant ON calendar_sync_states(tenant_id);

COMMENT ON TABLE idempotency_keys IS 'Stores idempotency results keyed by Idempotency-Key per tenant and route.';
COMMENT ON TABLE calendar_sync_states IS 'Persists calendar sync tokens (Google nextSyncToken / Microsoft delta).';
COMMENT ON TABLE webhook_events IS 'Stores inbound webhook deliveries to ensure idempotent processing.';

