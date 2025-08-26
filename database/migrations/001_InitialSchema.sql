-- Initial Database Schema with Row-Level Security for Multi-tenancy
-- Version: 001
-- Date: 2024-08-21

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS qivr;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set default schema
SET search_path TO qivr, public;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    cognito_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'patient',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Clinics table
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address JSONB DEFAULT '{}',
    phone VARCHAR(50),
    email VARCHAR(255),
    settings JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    evaluation_id UUID,
    appointment_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'requested',
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    location_type VARCHAR(50),
    location_details JSONB DEFAULT '{}',
    notes TEXT,
    external_calendar_id VARCHAR(255),
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_double_booking UNIQUE (provider_id, scheduled_start, scheduled_end)
);

-- Evaluations table
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id),
    clinic_id UUID REFERENCES clinics(id),
    evaluation_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'in_progress',
    responses JSONB DEFAULT '{}',
    pain_map_data JSONB DEFAULT '{}',
    ai_summary TEXT,
    ai_summary_reviewed_at TIMESTAMPTZ,
    ai_summary_reviewed_by UUID REFERENCES users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROM Templates table
CREATE TABLE IF NOT EXISTS prom_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    version INTEGER DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL,
    scoring_method VARCHAR(50),
    scoring_rules JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, key, version)
);

-- PROM Instances table
CREATE TABLE IF NOT EXISTS prom_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES prom_templates(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    responses JSONB DEFAULT '{}',
    score DECIMAL(10,2),
    score_interpretation VARCHAR(255),
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id),
    sender_id UUID REFERENCES users(id),
    type VARCHAR(100) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    title VARCHAR(255),
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Records table
CREATE TABLE IF NOT EXISTS patient_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES users(id),
    medical_record_number VARCHAR(100),
    demographics JSONB DEFAULT '{}',
    medical_history JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    insurance_info JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, patient_id)
);

-- Audit Log table (in audit schema)
CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,
    user_id UUID,
    entity_type VARCHAR(100),
    entity_id UUID,
    action VARCHAR(50),
    changes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_appointments_tenant_id ON appointments(tenant_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_scheduled_start ON appointments(scheduled_start);
CREATE INDEX idx_evaluations_tenant_id ON evaluations(tenant_id);
CREATE INDEX idx_evaluations_patient_id ON evaluations(patient_id);
CREATE INDEX idx_prom_instances_tenant_id ON prom_instances(tenant_id);
CREATE INDEX idx_prom_instances_patient_id ON prom_instances(patient_id);
CREATE INDEX idx_prom_instances_status ON prom_instances(status);
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_entity ON audit.audit_logs(entity_type, entity_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prom_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prom_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;

-- Create application role
CREATE ROLE qivr_app_user;

-- RLS Policies for multi-tenancy
-- Each user can only access data from their tenant

-- Tenants: Only accessible to users in that tenant
CREATE POLICY tenant_isolation ON tenants
    FOR ALL
    TO qivr_app_user
    USING (id = current_setting('app.tenant_id')::UUID);

-- Users: Only accessible within same tenant
CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    TO qivr_app_user
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Clinics: Only accessible within same tenant
CREATE POLICY clinics_tenant_isolation ON clinics
    FOR ALL
    TO qivr_app_user
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Appointments: Only accessible within same tenant
CREATE POLICY appointments_tenant_isolation ON appointments
    FOR ALL
    TO qivr_app_user
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Evaluations: Only accessible within same tenant
CREATE POLICY evaluations_tenant_isolation ON evaluations
    FOR ALL
    TO qivr_app_user
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- PROM Templates: Only accessible within same tenant
CREATE POLICY prom_templates_tenant_isolation ON prom_templates
    FOR ALL
    TO qivr_app_user
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- PROM Instances: Only accessible within same tenant
CREATE POLICY prom_instances_tenant_isolation ON prom_instances
    FOR ALL
    TO qivr_app_user
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Notifications: Only accessible within same tenant
CREATE POLICY notifications_tenant_isolation ON notifications
    FOR ALL
    TO qivr_app_user
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Patient Records: Only accessible within same tenant
CREATE POLICY patient_records_tenant_isolation ON patient_records
    FOR ALL
    TO qivr_app_user
    USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prom_templates_updated_at BEFORE UPDATE ON prom_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prom_instances_updated_at BEFORE UPDATE ON prom_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_records_updated_at BEFORE UPDATE ON patient_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit.audit_logs (
        tenant_id,
        user_id,
        entity_type,
        entity_id,
        action,
        changes,
        created_at
    ) VALUES (
        current_setting('app.tenant_id', true)::UUID,
        current_setting('app.user_id', true)::UUID,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        TG_OP,
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
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_appointments AFTER INSERT OR UPDATE OR DELETE ON appointments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_evaluations AFTER INSERT OR UPDATE OR DELETE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_patient_records AFTER INSERT OR UPDATE OR DELETE ON patient_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default tenant for development
INSERT INTO tenants (id, name, slug, settings)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Demo Clinic', 'demo-clinic', 
     '{"timezone": "Australia/Sydney", "locale": "en-AU"}')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA qivr TO qivr_app_user;
GRANT USAGE ON SCHEMA audit TO qivr_app_user;
GRANT ALL ON ALL TABLES IN SCHEMA qivr TO qivr_app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA qivr TO qivr_app_user;
GRANT INSERT ON audit.audit_logs TO qivr_app_user;
