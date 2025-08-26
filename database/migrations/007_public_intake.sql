-- 007_public_intake.sql
-- Purpose: Allow anonymous/public intake submissions without disabling RLS
-- Strategy: 1) create dedicated role qivr_intake with limited privileges
--           2) grant only INSERT/SELECT on the three intake tables
--           3) add RLS policies for qivr_intake and qivr_user that permit
--              inserting rows for the default public tenant
--           4) (Optional) future migrations can revoke INSERT once full
--              auth flow is required.

-- === 1. Create dedicated intake role ===
DO $$
DECLARE
    intake_pwd TEXT := current_setting('qivr.intake_password', true);
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = 'qivr_intake'
    ) THEN
        IF intake_pwd IS NULL OR intake_pwd = '' THEN
            -- Create a locked-down role without login by default to avoid insecure defaults
            CREATE ROLE qivr_intake NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
        ELSE
            -- Create a login role using a password provided via `SET qivr.intake_password='...';`
            EXECUTE format(
                'CREATE ROLE qivr_intake LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT',
                intake_pwd
            );
        END IF;
    END IF;
END
$$;

-- === 2. Grant schema usage & table privileges ===
GRANT USAGE ON SCHEMA qivr TO qivr_intake;
GRANT INSERT, SELECT ON qivr.evaluations        TO qivr_intake;
GRANT INSERT, SELECT ON qivr.pain_maps          TO qivr_intake;
GRANT INSERT, SELECT ON qivr.intake_submissions TO qivr_intake;

-- Ensure future tables in schema are not exposed to qivr_intake by default
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA qivr
    REVOKE ALL ON TABLES FROM qivr_intake;

-- === 3. RLS policies ===
-- Default tenant UUID used for public submissions
DO $$
DECLARE
    public_tenant CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Evaluations ---------------------------------------------------------
    ALTER TABLE qivr.evaluations ENABLE ROW LEVEL SECURITY;

    -- Policy for dedicated intake role
    CREATE POLICY IF NOT EXISTS allow_public_intake_eval_intake_role
        ON qivr.evaluations
        FOR INSERT TO qivr_intake
        WITH CHECK (tenant_id = public_tenant);

    -- Policy for existing application role (qivr_user) in case it is used
    CREATE POLICY IF NOT EXISTS allow_public_intake_eval_app_role
        ON qivr.evaluations
        FOR INSERT TO qivr_user
        WITH CHECK (tenant_id = public_tenant);

    -- Pain Maps -----------------------------------------------------------
    ALTER TABLE qivr.pain_maps ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS allow_public_intake_painmap_intake_role
        ON qivr.pain_maps
        FOR INSERT TO qivr_intake
        WITH CHECK (tenant_id = public_tenant);

    CREATE POLICY IF NOT EXISTS allow_public_intake_painmap_app_role
        ON qivr.pain_maps
        FOR INSERT TO qivr_user
        WITH CHECK (tenant_id = public_tenant);

    -- Intake Submissions --------------------------------------------------
    ALTER TABLE qivr.intake_submissions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS allow_public_intake_submission_intake_role
        ON qivr.intake_submissions
        FOR INSERT TO qivr_intake
        WITH CHECK (tenant_id = public_tenant);

    CREATE POLICY IF NOT EXISTS allow_public_intake_submission_app_role
        ON qivr.intake_submissions
        FOR INSERT TO qivr_user
        WITH CHECK (tenant_id = public_tenant);
END
$$;

-- === 4. Audit ===
COMMENT ON POLICY allow_public_intake_eval_intake_role        ON qivr.evaluations        IS 'Permit public-intake role to insert only default-tenant rows';
COMMENT ON POLICY allow_public_intake_eval_app_role           ON qivr.evaluations        IS 'Permit existing app role to insert default-tenant rows (pre-login)';
COMMENT ON POLICY allow_public_intake_painmap_intake_role     ON qivr.pain_maps          IS 'Permit public-intake role to insert only default-tenant rows';
COMMENT ON POLICY allow_public_intake_painmap_app_role        ON qivr.pain_maps          IS 'Permit existing app role to insert default-tenant rows (pre-login)';
COMMENT ON POLICY allow_public_intake_submission_intake_role  ON qivr.intake_submissions IS 'Permit public-intake role to insert only default-tenant rows';
COMMENT ON POLICY allow_public_intake_submission_app_role     ON qivr.intake_submissions IS 'Permit existing app role to insert default-tenant rows (pre-login)';
