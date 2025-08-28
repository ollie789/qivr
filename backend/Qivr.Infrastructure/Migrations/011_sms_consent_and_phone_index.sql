-- Migration 011: SMS Consent and Audit Logging
-- Adds consent_sms flag to users table, phone number index, and audit logs table

BEGIN;

-- Add consent_sms column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'qivr' 
        AND table_name = 'users' 
        AND column_name = 'consent_sms'
    ) THEN
        ALTER TABLE qivr.users 
        ADD COLUMN consent_sms BOOLEAN NOT NULL DEFAULT true;
        
        COMMENT ON COLUMN qivr.users.consent_sms IS 'User consent for receiving SMS notifications';
    END IF;
END $$;

-- Create index on phone_e164 for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_e164 
    ON qivr.users(phone_e164) 
    WHERE phone_e164 IS NOT NULL;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS qivr.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES qivr.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id 
    ON qivr.audit_logs(tenant_id);
    
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
    ON qivr.audit_logs(user_id) 
    WHERE user_id IS NOT NULL;
    
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type 
    ON qivr.audit_logs(event_type);
    
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
    ON qivr.audit_logs(created_at DESC);

-- Enable RLS on audit_logs table
ALTER TABLE qivr.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON qivr.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_policy ON qivr.audit_logs;

-- Create RLS policy for tenant isolation (read)
CREATE POLICY audit_logs_tenant_isolation ON qivr.audit_logs
    FOR SELECT
    USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Create RLS policy for insert (system can insert for current tenant)
CREATE POLICY audit_logs_insert_policy ON qivr.audit_logs
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Add comments
COMMENT ON TABLE qivr.audit_logs IS 'Audit trail for system events and user actions';
COMMENT ON COLUMN qivr.audit_logs.event_type IS 'Type of event (e.g., CONSENT_SMS_OPTED_OUT, CONSENT_SMS_OPTED_IN)';
COMMENT ON COLUMN qivr.audit_logs.event_data IS 'Additional JSON data related to the event';

COMMIT;
