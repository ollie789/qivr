-- 008_create_prom_tables.sql
-- Purpose: Ensure PROM tables and RLS policies exist; allow public scheduling for default tenant
-- Date: 2025-08-26

DO $$
BEGIN
	-- prom_templates minimal columns (if not already created by prior migrations)
	CREATE TABLE IF NOT EXISTS qivr.prom_templates (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		tenant_id UUID NOT NULL REFERENCES qivr.tenants(id) ON DELETE CASCADE,
		key VARCHAR(100) NOT NULL,
		version INTEGER NOT NULL DEFAULT 1,
		name VARCHAR(255) NOT NULL,
		description TEXT,
		questions JSONB NOT NULL DEFAULT '[]'::jsonb,
		scoring_method VARCHAR(50),
		scoring_rules JSONB DEFAULT '{}'::jsonb,
		is_active BOOLEAN NOT NULL DEFAULT true,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		UNIQUE(tenant_id, key, version)
	);

	-- prom_instances minimal columns
	CREATE TABLE IF NOT EXISTS qivr.prom_instances (
		id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
		tenant_id UUID NOT NULL REFERENCES qivr.tenants(id) ON DELETE CASCADE,
		template_id UUID NOT NULL REFERENCES qivr.prom_templates(id),
		patient_id UUID NOT NULL REFERENCES qivr.users(id),
		status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
		scheduled_for TIMESTAMPTZ,
		due_date TIMESTAMPTZ,
		responses JSONB DEFAULT '{}'::jsonb,
		score DECIMAL(10,2),
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);
END$$;

-- Enable RLS
ALTER TABLE qivr.prom_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE qivr.prom_instances ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies (idempotent)
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname = 'qivr' AND tablename = 'prom_templates' AND policyname = 'prom_templates_tenant_isolation'
	) THEN
		CREATE POLICY prom_templates_tenant_isolation ON qivr.prom_templates
			FOR ALL
			USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
			WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname = 'qivr' AND tablename = 'prom_instances' AND policyname = 'prom_instances_tenant_isolation'
	) THEN
		CREATE POLICY prom_instances_tenant_isolation ON qivr.prom_instances
			FOR ALL
			USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
			WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
	END IF;
END$$;

-- Default-tenant public scheduling insert policy (mirrors intake approach)
DO $$
DECLARE
	public_tenant CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_policies WHERE schemaname = 'qivr' AND tablename = 'prom_instances' AND policyname = 'allow_public_prom_schedule_app_role'
	) THEN
		CREATE POLICY allow_public_prom_schedule_app_role
			ON qivr.prom_instances
			FOR INSERT
			TO qivr_user
			WITH CHECK (tenant_id = public_tenant);
	END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_prom_templates_tenant_key ON qivr.prom_templates(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_prom_instances_tenant_patient ON qivr.prom_instances(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_prom_instances_status ON qivr.prom_instances(status);

-- Update triggers
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_trigger WHERE tgname = 'update_prom_templates_updated_at'
	) THEN
		CREATE TRIGGER update_prom_templates_updated_at BEFORE UPDATE ON qivr.prom_templates
			FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
	END IF;
	IF NOT EXISTS (
		SELECT 1 FROM pg_trigger WHERE tgname = 'update_prom_instances_updated_at'
	) THEN
		CREATE TRIGGER update_prom_instances_updated_at BEFORE UPDATE ON qivr.prom_instances
			FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
	END IF;
END$$;