-- Migration: 006_AddRowLevelSecurity.sql
-- Purpose: Implement Row-Level Security (RLS) for multi-tenant data isolation
-- Date: 2024-12-26
-- Critical: Prevents cross-tenant data exposure

-- Enable RLS on all PHI tables
DO $$ 
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'evaluations', 'pain_maps', 'appointments', 'patients', 
            'prom_templates', 'prom_instances', 'prom_responses',
            'notifications', 'audit_logs', 'consent_records',
            'provider_availability', 'calendar_events', 'clinic_settings',
            'brand_themes', 'intake_submissions'
        )
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        
        -- Create tenant isolation policy for SELECT/UPDATE/DELETE
        EXECUTE format('
            CREATE POLICY tenant_isolation_policy ON %I
            FOR ALL
            USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid)',
            tbl.tablename
        );
        
        -- Create tenant insert policy to prevent wrong tenant inserts
        EXECUTE format('
            CREATE POLICY tenant_insert_policy ON %I
            FOR INSERT
            WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)',
            tbl.tablename
        );
    END LOOP;
END $$;

-- Create function to set tenant context for each connection
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.tenant_id', p_tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current tenant context
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS uuid AS $$
BEGIN
    RETURN current_setting('app.tenant_id', true)::uuid;
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for tenant_id on all tables for performance
DO $$ 
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'evaluations', 'pain_maps', 'appointments', 'patients', 
            'prom_templates', 'prom_instances', 'prom_responses',
            'notifications', 'audit_logs', 'consent_records',
            'provider_availability', 'calendar_events', 'clinic_settings',
            'brand_themes', 'intake_submissions'
        )
    LOOP
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS idx_%I_tenant_id 
            ON %I(tenant_id)',
            tbl.tablename, tbl.tablename
        );
    END LOOP;
END $$;

-- Create audit trigger to track RLS bypasses (for monitoring)
CREATE TABLE IF NOT EXISTS rls_bypass_audit (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    occurred_at timestamp DEFAULT CURRENT_TIMESTAMP,
    user_name text DEFAULT current_user,
    table_name text,
    operation text,
    row_data jsonb,
    tenant_id uuid
);

-- Function to audit potential RLS issues
CREATE OR REPLACE FUNCTION audit_rls_bypass()
RETURNS event_trigger AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM pg_event_trigger_ddl_commands()
    LOOP
        IF r.command_tag IN ('ALTER TABLE', 'DISABLE ROW LEVEL SECURITY') THEN
            INSERT INTO rls_bypass_audit (table_name, operation, user_name)
            VALUES (r.object_identity, r.command_tag, current_user);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create event trigger for RLS monitoring
DROP EVENT TRIGGER IF EXISTS monitor_rls_changes;
CREATE EVENT TRIGGER monitor_rls_changes
ON ddl_command_end
EXECUTE FUNCTION audit_rls_bypass();

-- Add unique constraint for double-booking prevention
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_provider_time
ON appointments (provider_id, scheduled_start, scheduled_end, tenant_id)
WHERE status NOT IN ('cancelled', 'no-show');

-- Add check constraint to ensure tenant_id is never null
DO $$ 
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'evaluations', 'pain_maps', 'appointments', 'patients', 
            'prom_templates', 'prom_instances', 'prom_responses'
        )
    LOOP
        EXECUTE format('
            ALTER TABLE %I 
            ADD CONSTRAINT chk_%I_tenant_id_not_null 
            CHECK (tenant_id IS NOT NULL)',
            tbl.tablename, tbl.tablename
        );
    END LOOP;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Constraint already exists
END $$;

-- Create view for testing RLS (will return empty if working correctly)
CREATE OR REPLACE VIEW v_rls_test AS
SELECT 
    'evaluations' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT tenant_id) as unique_tenants,
    CASE 
        WHEN COUNT(DISTINCT tenant_id) > 1 THEN 'FAIL - Multiple tenants visible'
        WHEN COUNT(*) = 0 THEN 'OK - No data visible without tenant context'
        ELSE 'OK - Single tenant visible'
    END as rls_status
FROM evaluations
UNION ALL
SELECT 
    'appointments' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT tenant_id) as unique_tenants,
    CASE 
        WHEN COUNT(DISTINCT tenant_id) > 1 THEN 'FAIL - Multiple tenants visible'
        WHEN COUNT(*) = 0 THEN 'OK - No data visible without tenant context'
        ELSE 'OK - Single tenant visible'
    END as rls_status
FROM appointments
UNION ALL
SELECT 
    'patients' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT tenant_id) as unique_tenants,
    CASE 
        WHEN COUNT(DISTINCT tenant_id) > 1 THEN 'FAIL - Multiple tenants visible'
        WHEN COUNT(*) = 0 THEN 'OK - No data visible without tenant context'
        ELSE 'OK - Single tenant visible'
    END as rls_status
FROM patients;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION set_tenant_context(uuid) TO qivr_api_user;
GRANT EXECUTE ON FUNCTION get_current_tenant() TO qivr_api_user;
GRANT SELECT ON v_rls_test TO qivr_api_user;

COMMENT ON FUNCTION set_tenant_context IS 'Sets the current tenant context for RLS. Must be called at the beginning of each database connection.';
COMMENT ON VIEW v_rls_test IS 'Test view to verify RLS is working. Should show no data or single tenant only.';
