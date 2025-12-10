-- PROM System Rebuild Migration
-- Clean slate approach: removes old misaligned data and ensures schema is correct
-- Run this in development environments only

BEGIN;

-- ============================================
-- 1. ENSURE NEW TABLES EXIST FIRST
-- ============================================

-- Create instruments table
CREATE TABLE IF NOT EXISTS qivr.instruments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    instrument_family VARCHAR(100),
    clinical_domain VARCHAR(100),
    license_type TEXT NOT NULL DEFAULT 'Open',
    license_notes TEXT,
    is_global BOOLEAN NOT NULL DEFAULT true,
    tenant_id UUID REFERENCES qivr.tenants(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    reference_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create template_questions table
CREATE TABLE IF NOT EXISTS qivr.template_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES qivr.prom_templates(id) ON DELETE CASCADE,
    question_key VARCHAR(100) NOT NULL,
    code VARCHAR(100),
    label VARCHAR(500) NOT NULL,
    question_text TEXT,
    question_type TEXT NOT NULL DEFAULT 'SingleSelect',
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

-- Create summary_score_definitions table
CREATE TABLE IF NOT EXISTS qivr.summary_score_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES qivr.prom_templates(id) ON DELETE CASCADE,
    score_key VARCHAR(50) NOT NULL,
    label VARCHAR(200) NOT NULL,
    description TEXT,
    scoring_method TEXT NOT NULL DEFAULT 'Sum',
    range_min NUMERIC NOT NULL DEFAULT 0,
    range_max NUMERIC NOT NULL DEFAULT 100,
    higher_is_better BOOLEAN NOT NULL DEFAULT false,
    population_mean NUMERIC,
    population_std_dev NUMERIC,
    interpretation_bands JSONB,
    mcid NUMERIC,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    external_source VARCHAR(100),
    lookup_table_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create prom_item_responses table
CREATE TABLE IF NOT EXISTS qivr.prom_item_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create prom_summary_scores table
CREATE TABLE IF NOT EXISTS qivr.prom_summary_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create summary_score_question_mappings table
CREATE TABLE IF NOT EXISTS qivr.summary_score_question_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_score_definition_id UUID NOT NULL REFERENCES qivr.summary_score_definitions(id) ON DELETE CASCADE,
    template_question_id UUID NOT NULL REFERENCES qivr.template_questions(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL DEFAULT 1,
    is_reverse_scored BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create treatment_progress_feedbacks table if not exists
CREATE TABLE IF NOT EXISTS qivr.treatment_progress_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    prom_instance_id UUID NOT NULL REFERENCES qivr.prom_instances(id) ON DELETE CASCADE,
    treatment_plan_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    overall_effectiveness_rating INTEGER,
    pain_compared_to_start INTEGER,
    exercise_compliance TEXT,
    sessions_completed_this_week INTEGER,
    helpful_exercise_ids JSONB,
    problematic_exercise_ids JSONB,
    exercise_comments TEXT,
    barriers JSONB,
    suggestions TEXT,
    wants_clinician_discussion BOOLEAN,
    current_phase_number INTEGER,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. CLEAN OUT OLD PROM DATA (dev only)
-- ============================================

DELETE FROM qivr.prom_summary_scores;
DELETE FROM qivr.prom_item_responses;
DELETE FROM qivr.summary_score_question_mappings;
DELETE FROM qivr.summary_score_definitions;
DELETE FROM qivr.template_questions;
DELETE FROM qivr.treatment_progress_feedbacks;
DELETE FROM qivr.prom_booking_requests;
DELETE FROM qivr.prom_responses;
DELETE FROM qivr.prom_instances;
DELETE FROM qivr.prom_templates;
DELETE FROM qivr.instruments;

-- ============================================
-- 3. ADD NEW COLUMNS TO EXISTING TABLES
-- ============================================

ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft';
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS key VARCHAR(100);
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS frequency_hint VARCHAR(200);
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS instrument_id UUID;
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE qivr.prom_templates ADD COLUMN IF NOT EXISTS scoring_rules JSONB;

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS ix_instruments_clinical_domain ON qivr.instruments(clinical_domain);
CREATE INDEX IF NOT EXISTS ix_instruments_tenant_id_is_global ON qivr.instruments(tenant_id, is_global);

CREATE UNIQUE INDEX IF NOT EXISTS ix_template_questions_template_id_question_key ON qivr.template_questions(template_id, question_key);
CREATE INDEX IF NOT EXISTS ix_template_questions_template_id_order_index ON qivr.template_questions(template_id, order_index);
CREATE INDEX IF NOT EXISTS ix_template_questions_code ON qivr.template_questions(code);

CREATE UNIQUE INDEX IF NOT EXISTS ix_summary_score_definitions_template_id_score_key ON qivr.summary_score_definitions(template_id, score_key);
CREATE INDEX IF NOT EXISTS ix_summary_score_definitions_template_id_order_index ON qivr.summary_score_definitions(template_id, order_index);

CREATE UNIQUE INDEX IF NOT EXISTS ix_prom_item_responses_instance_id_template_question_id ON qivr.prom_item_responses(instance_id, template_question_id);
CREATE INDEX IF NOT EXISTS ix_prom_item_responses_question_code ON qivr.prom_item_responses(question_code);

CREATE UNIQUE INDEX IF NOT EXISTS ix_prom_summary_scores_instance_id_score_key ON qivr.prom_summary_scores(instance_id, score_key);

CREATE UNIQUE INDEX IF NOT EXISTS ix_summary_score_question_mappings_definition_question ON qivr.summary_score_question_mappings(summary_score_definition_id, template_question_id);

CREATE INDEX IF NOT EXISTS ix_prom_templates_status ON qivr.prom_templates(status);
CREATE INDEX IF NOT EXISTS ix_prom_templates_instrument_id ON qivr.prom_templates(instrument_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_prom_templates_tenant_key_version ON qivr.prom_templates(tenant_id, key, version) WHERE key IS NOT NULL;

-- ============================================
-- 5. ADD FOREIGN KEY CONSTRAINTS
-- ============================================

ALTER TABLE qivr.prom_templates 
    DROP CONSTRAINT IF EXISTS fk_prom_templates_instruments_instrument_id;
ALTER TABLE qivr.prom_templates 
    ADD CONSTRAINT fk_prom_templates_instruments_instrument_id 
    FOREIGN KEY (instrument_id) REFERENCES qivr.instruments(id) ON DELETE SET NULL;

COMMIT;
