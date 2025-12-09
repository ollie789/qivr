-- PROM Infrastructure Migration
-- Run this to add the new PROM tables and columns

-- Add new columns to prom_templates (ensure all required columns exist)
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS key VARCHAR(100);
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS frequency_hint VARCHAR(200);
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS instrument_id UUID;
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS scoring_rules JSONB;

-- Add unique index for versioned templates
CREATE UNIQUE INDEX IF NOT EXISTS ix_prom_templates_tenant_key_version 
    ON qivr.prom_templates(tenant_id, key, version) WHERE key IS NOT NULL;

-- Create instruments table
CREATE TABLE IF NOT EXISTS qivr.instruments (
    id UUID PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    instrument_family VARCHAR(100),
    clinical_domain VARCHAR(100),
    license_type TEXT NOT NULL,
    license_notes TEXT,
    is_global BOOLEAN NOT NULL DEFAULT false,
    tenant_id UUID REFERENCES qivr.tenants(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    reference_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_instruments_clinical_domain ON qivr.instruments(clinical_domain);
CREATE INDEX IF NOT EXISTS ix_instruments_tenant_id_is_global ON qivr.instruments(tenant_id, is_global);

-- Create template_questions table
CREATE TABLE IF NOT EXISTS qivr.template_questions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES qivr.prom_templates(id) ON DELETE CASCADE,
    question_key VARCHAR(100) NOT NULL,
    code VARCHAR(100),
    label VARCHAR(500) NOT NULL,
    question_text TEXT,
    question_type TEXT NOT NULL,
    section VARCHAR(100),
    order_index INTEGER NOT NULL DEFAULT 0,
    config_json TEXT,
    is_scored BOOLEAN NOT NULL DEFAULT true,
    score_weight NUMERIC NOT NULL DEFAULT 1,
    is_required BOOLEAN NOT NULL DEFAULT true,
    min_score NUMERIC,
    max_score NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_template_questions_template_id_question_key ON qivr.template_questions(template_id, question_key);
CREATE INDEX IF NOT EXISTS ix_template_questions_template_id_order_index ON qivr.template_questions(template_id, order_index);
CREATE INDEX IF NOT EXISTS ix_template_questions_code ON qivr.template_questions(code);
CREATE INDEX IF NOT EXISTS ix_template_questions_section ON qivr.template_questions(section);

-- Create summary_score_definitions table
CREATE TABLE IF NOT EXISTS qivr.summary_score_definitions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES qivr.prom_templates(id) ON DELETE CASCADE,
    score_key VARCHAR(50) NOT NULL,
    label VARCHAR(200) NOT NULL,
    description TEXT,
    scoring_method TEXT NOT NULL,
    range_min NUMERIC NOT NULL DEFAULT 0,
    range_max NUMERIC NOT NULL DEFAULT 100,
    higher_is_better BOOLEAN NOT NULL DEFAULT false,
    population_mean NUMERIC,
    population_std_dev NUMERIC,
    interpretation_bands JSONB,
    mcid NUMERIC,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_summary_score_definitions_template_id_score_key ON qivr.summary_score_definitions(template_id, score_key);
CREATE INDEX IF NOT EXISTS ix_summary_score_definitions_template_id_order_index ON qivr.summary_score_definitions(template_id, order_index);

-- Create prom_item_responses table
CREATE TABLE IF NOT EXISTS qivr.prom_item_responses (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    instance_id UUID NOT NULL REFERENCES qivr.prom_instances(id) ON DELETE CASCADE,
    template_question_id UUID NOT NULL REFERENCES qivr.template_questions(id) ON DELETE CASCADE,
    question_code VARCHAR(100),
    value_raw VARCHAR(2000),
    value_numeric NUMERIC,
    value_display VARCHAR(500),
    multi_select_values JSONB,
    is_skipped BOOLEAN NOT NULL DEFAULT false,
    response_time_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_prom_item_responses_instance_id_template_question_id ON qivr.prom_item_responses(instance_id, template_question_id);
CREATE INDEX IF NOT EXISTS ix_prom_item_responses_question_code ON qivr.prom_item_responses(question_code);
CREATE INDEX IF NOT EXISTS ix_prom_item_responses_tenant_id_question_code_created_at ON qivr.prom_item_responses(tenant_id, question_code, created_at);

-- Create prom_summary_scores table
CREATE TABLE IF NOT EXISTS qivr.prom_summary_scores (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    instance_id UUID NOT NULL REFERENCES qivr.prom_instances(id) ON DELETE CASCADE,
    definition_id UUID REFERENCES qivr.summary_score_definitions(id) ON DELETE SET NULL,
    score_key VARCHAR(50) NOT NULL,
    label VARCHAR(200),
    value NUMERIC NOT NULL,
    raw_value NUMERIC,
    range_min NUMERIC,
    range_max NUMERIC,
    higher_is_better BOOLEAN,
    interpretation_band VARCHAR(100),
    severity VARCHAR(50),
    item_count INTEGER,
    missing_item_count INTEGER,
    confidence_interval_lower NUMERIC,
    confidence_interval_upper NUMERIC,
    has_floor_effect BOOLEAN NOT NULL DEFAULT false,
    has_ceiling_effect BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_prom_summary_scores_instance_id_score_key ON qivr.prom_summary_scores(instance_id, score_key);
CREATE INDEX IF NOT EXISTS ix_prom_summary_scores_tenant_id_score_key_created_at ON qivr.prom_summary_scores(tenant_id, score_key, created_at);

-- Create summary_score_question_mappings table
CREATE TABLE IF NOT EXISTS qivr.summary_score_question_mappings (
    id UUID PRIMARY KEY,
    summary_score_definition_id UUID NOT NULL REFERENCES qivr.summary_score_definitions(id) ON DELETE CASCADE,
    template_question_id UUID NOT NULL REFERENCES qivr.template_questions(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL DEFAULT 1,
    is_reverse_scored BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_summary_score_question_mappings_definition_question ON qivr.summary_score_question_mappings(summary_score_definition_id, template_question_id);

-- Add foreign key from prom_templates to instruments
ALTER TABLE qivr.prom_templates 
    DROP CONSTRAINT IF EXISTS fk_prom_templates_instruments_instrument_id;
ALTER TABLE qivr.prom_templates 
    ADD CONSTRAINT fk_prom_templates_instruments_instrument_id 
    FOREIGN KEY (instrument_id) REFERENCES qivr.instruments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_prom_templates_instrument_id ON qivr.prom_templates(instrument_id);

-- Enable RLS on new tables
ALTER TABLE qivr.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE qivr.template_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qivr.summary_score_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qivr.prom_item_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE qivr.prom_summary_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for tenant isolation
CREATE POLICY IF NOT EXISTS instruments_tenant_isolation ON qivr.instruments
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR is_global = true);

CREATE POLICY IF NOT EXISTS template_questions_tenant_isolation ON qivr.template_questions
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY IF NOT EXISTS summary_score_definitions_tenant_isolation ON qivr.summary_score_definitions
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY IF NOT EXISTS prom_item_responses_tenant_isolation ON qivr.prom_item_responses
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY IF NOT EXISTS prom_summary_scores_tenant_isolation ON qivr.prom_summary_scores
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
