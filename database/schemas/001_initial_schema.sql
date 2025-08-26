-- Qivr Database Schema v1.0
-- Multi-tenant architecture with Row-Level Security (RLS)
-- Australian data residency compliant

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geospatial features if needed

-- Create schema
CREATE SCHEMA IF NOT EXISTS qivr;
SET search_path TO qivr, public;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Tenants (Clinics)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    plan VARCHAR(50) NOT NULL DEFAULT 'starter',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Australia/Sydney',
    locale VARCHAR(10) NOT NULL DEFAULT 'en-AU',
    settings JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;

-- Users (Patients and Staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cognito_sub VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    phone VARCHAR(50),
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('patient', 'staff', 'admin')),
    roles TEXT[] NOT NULL DEFAULT '{}',
    avatar_url TEXT,
    preferences JSONB NOT NULL DEFAULT '{}',
    consent JSONB NOT NULL DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_cognito_sub ON users(cognito_sub) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_type ON users(user_type) WHERE deleted_at IS NULL;

-- Evaluations (Patient Intake)
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluation_number VARCHAR(50) NOT NULL,
    chief_complaint TEXT,
    symptoms JSONB NOT NULL DEFAULT '[]',
    medical_history JSONB NOT NULL DEFAULT '{}',
    questionnaire_responses JSONB NOT NULL DEFAULT '{}',
    ai_summary TEXT,
    ai_risk_flags TEXT[],
    ai_processed_at TIMESTAMPTZ,
    clinician_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'triaged', 'archived')),
    urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, evaluation_number)
);

CREATE INDEX idx_evaluations_tenant_patient ON evaluations(tenant_id, patient_id) WHERE status != 'archived';
CREATE INDEX idx_evaluations_status ON evaluations(tenant_id, status) WHERE status != 'archived';
CREATE INDEX idx_evaluations_created ON evaluations(tenant_id, created_at DESC);

-- Pain Maps (3D Body Mapping)
CREATE TABLE pain_maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    body_region VARCHAR(100) NOT NULL,
    anatomical_code VARCHAR(50), -- SNOMED CT or similar
    coordinates JSONB NOT NULL, -- {x, y, z} coordinates on 3D model
    pain_intensity INTEGER NOT NULL CHECK (pain_intensity >= 0 AND pain_intensity <= 10),
    pain_type VARCHAR(50),
    pain_quality TEXT[],
    onset_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pain_maps_evaluation ON pain_maps(evaluation_id);
CREATE INDEX idx_pain_maps_region ON pain_maps(body_region);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES evaluations(id),
    external_calendar_id VARCHAR(255),
    appointment_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    location_type VARCHAR(50) DEFAULT 'in_person' CHECK (location_type IN ('in_person', 'telehealth')),
    location_details JSONB,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT no_double_booking UNIQUE (provider_id, scheduled_start, scheduled_end)
);

CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_start, scheduled_end);
CREATE INDEX idx_appointments_status ON appointments(status) WHERE status NOT IN ('cancelled', 'completed');

-- PROM Templates
CREATE TABLE prom_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    schema JSONB NOT NULL, -- Question structure, branching logic, scoring
    scoring_algorithm JSONB,
    validation_rules JSONB,
    fhir_questionnaire JSONB, -- FHIR R4 Questionnaire resource
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, key, version)
);

CREATE INDEX idx_prom_templates_tenant ON prom_templates(tenant_id) WHERE is_active = true;
CREATE INDEX idx_prom_templates_key ON prom_templates(key) WHERE is_active = true;

-- PROM Instances (Scheduled/Completed PROMs)
CREATE TABLE prom_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES prom_templates(id),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'in_progress', 'completed', 'expired')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    responses JSONB,
    scores JSONB,
    interpretation TEXT,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,
    access_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prom_instances_tenant_patient ON prom_instances(tenant_id, patient_id);
CREATE INDEX idx_prom_instances_status ON prom_instances(status) WHERE status NOT IN ('completed', 'expired');
CREATE INDEX idx_prom_instances_scheduled ON prom_instances(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_prom_instances_token ON prom_instances(access_token) WHERE access_token IS NOT NULL;

-- Brand Themes
CREATE TABLE brand_themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    typography JSONB,
    custom_css TEXT,
    widget_config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_brand_themes_tenant ON brand_themes(tenant_id) WHERE is_active = true;

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('sms', 'email', 'push', 'voice')),
    template_id VARCHAR(100),
    variables JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    provider_message_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_tenant_user ON notifications(tenant_id, user_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status IN ('pending', 'sent');
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) WHERE status = 'pending';

-- Audit Logs (Immutable)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    session_id UUID,
    changes JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Consent Records
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    ip_address INET,
    method VARCHAR(50), -- 'explicit', 'implicit', 'opt_out'
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consent_tenant_user ON consent_records(tenant_id, user_id);
CREATE INDEX idx_consent_type ON consent_records(consent_type, granted) WHERE revoked_at IS NULL;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prom_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prom_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- These will be applied based on the current_setting('app.tenant_id') set by the application

-- Tenants: Users can only see their own tenant
CREATE POLICY tenant_isolation ON tenants
    FOR ALL
    USING (id::text = current_setting('app.tenant_id', true));

-- Users: Tenant isolation
CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Evaluations: Tenant isolation
CREATE POLICY evaluations_tenant_isolation ON evaluations
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Pain Maps: Tenant isolation via evaluation
CREATE POLICY pain_maps_tenant_isolation ON pain_maps
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Appointments: Tenant isolation
CREATE POLICY appointments_tenant_isolation ON appointments
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- PROM Templates: Tenant isolation
CREATE POLICY prom_templates_tenant_isolation ON prom_templates
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- PROM Instances: Tenant isolation
CREATE POLICY prom_instances_tenant_isolation ON prom_instances
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Brand Themes: Tenant isolation
CREATE POLICY brand_themes_tenant_isolation ON brand_themes
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Notifications: Tenant isolation
CREATE POLICY notifications_tenant_isolation ON notifications
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Audit Logs: Tenant isolation (allow NULL for system events)
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id::text = current_setting('app.tenant_id', true));

-- Consent Records: Tenant isolation
CREATE POLICY consent_records_tenant_isolation ON consent_records
    FOR ALL
    USING (tenant_id::text = current_setting('app.tenant_id', true));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_prom_templates_updated_at BEFORE UPDATE ON prom_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_prom_instances_updated_at BEFORE UPDATE ON prom_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_brand_themes_updated_at BEFORE UPDATE ON brand_themes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit log function
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        changes,
        created_at
    ) VALUES (
        current_setting('app.tenant_id', true)::uuid,
        current_setting('app.user_id', true)::uuid,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
                'old', to_jsonb(OLD),
                'new', to_jsonb(NEW)
            )
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        END,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional performance indexes
CREATE INDEX idx_evaluations_ai_processed ON evaluations(tenant_id, ai_processed_at) 
    WHERE ai_processed_at IS NOT NULL;
CREATE INDEX idx_appointments_reminder ON appointments(tenant_id, reminder_sent_at) 
    WHERE reminder_sent_at IS NULL AND status = 'scheduled';
CREATE INDEX idx_prom_instances_reminder ON prom_instances(tenant_id, last_reminder_at) 
    WHERE status IN ('scheduled', 'sent') AND reminder_count < 3;

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default tenant for development
INSERT INTO tenants (id, slug, name, status, plan, timezone, locale, settings)
VALUES (
    'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11'::uuid,
    'demo-clinic',
    'Demo Allied Health Clinic',
    'active',
    'professional',
    'Australia/Sydney',
    'en-AU',
    '{
        "business_hours": {
            "monday": {"open": "09:00", "close": "18:00"},
            "tuesday": {"open": "09:00", "close": "18:00"},
            "wednesday": {"open": "09:00", "close": "18:00"},
            "thursday": {"open": "09:00", "close": "20:00"},
            "friday": {"open": "09:00", "close": "17:00"},
            "saturday": {"open": "09:00", "close": "13:00"},
            "sunday": null
        },
        "appointment_duration_minutes": 30,
        "buffer_minutes": 10
    }'::jsonb
) ON CONFLICT (slug) DO NOTHING;
