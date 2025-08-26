-- Migration: Create PROM Tables
-- Description: Tables for Patient-Reported Outcome Measures (PROMs)
-- Date: 2024-08-22

-- PROM Categories
CREATE TABLE IF NOT EXISTS prom_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES prom_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- PROM Templates (questionnaire definitions)
CREATE TABLE IF NOT EXISTS prom_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES prom_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, archived
    
    -- JSON fields for complex data
    questions JSONB NOT NULL, -- Array of question objects
    scoring JSONB, -- Scoring configuration
    schedule JSONB, -- Scheduling rules
    conditions JSONB, -- Conditional logic
    metadata JSONB, -- Additional metadata
    
    -- FHIR compatibility
    fhir_questionnaire_id VARCHAR(255),
    fhir_resource JSONB,
    
    -- Publishing info
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES users(id),
    
    -- Tracking
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'active', 'archived'))
);

-- PROM Template Versions (for version history)
CREATE TABLE IF NOT EXISTS prom_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES prom_templates(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    scoring JSONB,
    schedule JSONB,
    conditions JSONB,
    metadata JSONB,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    archived_by UUID REFERENCES users(id),
    UNIQUE(template_id, version)
);

-- PROM Instances (assigned questionnaires to patients)
CREATE TABLE IF NOT EXISTS prom_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES prom_templates(id),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    
    -- Instance data
    questions JSONB NOT NULL, -- Copy of questions at time of creation
    responses JSONB, -- Patient responses
    scores JSONB, -- Calculated scores
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, sent, in_progress, completed, expired
    sent_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expired_at TIMESTAMPTZ,
    
    -- Completion metrics
    completion_rate DECIMAL(5,2), -- Percentage of questions answered
    time_to_complete INTEGER, -- In seconds
    
    -- Clinical review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    -- Metadata
    metadata JSONB,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'sent', 'in_progress', 'completed', 'expired'))
);

-- PROM Response History (for tracking changes)
CREATE TABLE IF NOT EXISTS prom_response_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES prom_instances(id) ON DELETE CASCADE,
    question_id VARCHAR(255) NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by UUID REFERENCES users(id)
);

-- PROM Scoring Rules (reusable scoring configurations)
CREATE TABLE IF NOT EXISTS prom_scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- sum, average, weighted, custom
    configuration JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROM Schedule Templates (reusable scheduling patterns)
CREATE TABLE IF NOT EXISTS prom_schedule_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(50) NOT NULL, -- appointment, intake, interval, manual
    configuration JSONB NOT NULL, -- Detailed schedule configuration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROM Analytics (aggregated data for reporting)
CREATE TABLE IF NOT EXISTS prom_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES prom_templates(id),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metrics
    total_instances INTEGER DEFAULT 0,
    completed_instances INTEGER DEFAULT 0,
    average_score DECIMAL(10,2),
    min_score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    score_trend VARCHAR(20), -- improving, stable, declining
    completion_rate DECIMAL(5,2),
    average_time_to_complete INTEGER, -- in seconds
    
    -- Clinical significance
    mcid_achieved BOOLEAN, -- Minimal Clinically Important Difference
    clinical_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, template_id, patient_id, period_start, period_end)
);

-- Question Library (reusable questions across templates)
CREATE TABLE IF NOT EXISTS prom_question_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(100),
    question_code VARCHAR(100) UNIQUE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL, -- text, radio, checkbox, scale, date, etc.
    options JSONB, -- For multiple choice questions
    validation_rules JSONB,
    help_text TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prom_categories_tenant_id ON prom_categories(tenant_id);
CREATE INDEX idx_prom_templates_tenant_id ON prom_templates(tenant_id);
CREATE INDEX idx_prom_templates_status ON prom_templates(status);
CREATE INDEX idx_prom_templates_category_id ON prom_templates(category_id);
CREATE INDEX idx_prom_template_versions_template_id ON prom_template_versions(template_id);
CREATE INDEX idx_prom_instances_tenant_id ON prom_instances(tenant_id);
CREATE INDEX idx_prom_instances_template_id ON prom_instances(template_id);
CREATE INDEX idx_prom_instances_patient_id ON prom_instances(patient_id);
CREATE INDEX idx_prom_instances_status ON prom_instances(status);
CREATE INDEX idx_prom_instances_scheduled_for ON prom_instances(scheduled_for);
CREATE INDEX idx_prom_instances_due_date ON prom_instances(due_date);
CREATE INDEX idx_prom_response_history_instance_id ON prom_response_history(instance_id);
CREATE INDEX idx_prom_analytics_tenant_id ON prom_analytics(tenant_id);
CREATE INDEX idx_prom_analytics_template_id ON prom_analytics(template_id);
CREATE INDEX idx_prom_analytics_patient_id ON prom_analytics(patient_id);
CREATE INDEX idx_prom_question_library_tenant_id ON prom_question_library(tenant_id);
CREATE INDEX idx_prom_question_library_question_code ON prom_question_library(question_code);

-- Full text search indexes
CREATE INDEX idx_prom_templates_search ON prom_templates USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_prom_question_library_search ON prom_question_library USING gin(to_tsvector('english', question_text));

-- Triggers for updated_at
CREATE TRIGGER update_prom_categories_updated_at BEFORE UPDATE ON prom_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prom_templates_updated_at BEFORE UPDATE ON prom_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prom_instances_updated_at BEFORE UPDATE ON prom_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prom_scoring_rules_updated_at BEFORE UPDATE ON prom_scoring_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prom_schedule_templates_updated_at BEFORE UPDATE ON prom_schedule_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prom_analytics_updated_at BEFORE UPDATE ON prom_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prom_question_library_updated_at BEFORE UPDATE ON prom_question_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE prom_templates IS 'Patient-Reported Outcome Measure templates/questionnaires';
COMMENT ON TABLE prom_instances IS 'Individual PROM assignments to patients';
COMMENT ON TABLE prom_analytics IS 'Aggregated PROM data for reporting and analytics';
COMMENT ON TABLE prom_question_library IS 'Reusable question bank for building PROMs';
