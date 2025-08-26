-- Migration: Enhance Evaluations Table
-- Description: Add fields for triage, AI summary approval, and assignment tracking
-- Date: 2024-08-22

-- Add new columns to evaluations table if they don't exist
ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS triage_notes TEXT,
ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS triaged_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS triaged_at TIMESTAMPTZ,

-- AI Summary fields
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS ai_risk_score INTEGER CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100),
ADD COLUMN IF NOT EXISTS ai_flags TEXT[],
ADD COLUMN IF NOT EXISTS ai_recommended_actions TEXT[],
ADD COLUMN IF NOT EXISTS ai_confidence INTEGER CHECK (ai_confidence >= 0 AND ai_confidence <= 100),
ADD COLUMN IF NOT EXISTS ai_summary_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_summary_approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ai_summary_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_summary_notes TEXT,

-- Assignment tracking
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES practitioners(id),
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,

-- Enhanced status tracking
ADD COLUMN IF NOT EXISTS status_notes TEXT,
ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ,

-- Pain assessment details
ADD COLUMN IF NOT EXISTS pain_points JSONB,
ADD COLUMN IF NOT EXISTS pain_duration VARCHAR(100),
ADD COLUMN IF NOT EXISTS pain_triggers TEXT[],
ADD COLUMN IF NOT EXISTS pain_relievers TEXT[],

-- Medical history
ADD COLUMN IF NOT EXISTS medical_history TEXT,
ADD COLUMN IF NOT EXISTS current_medications JSONB,
ADD COLUMN IF NOT EXISTS allergies JSONB,
ADD COLUMN IF NOT EXISTS previous_treatments JSONB,

-- Referral tracking
ADD COLUMN IF NOT EXISTS referred_from VARCHAR(255),
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS referral_reason TEXT,
ADD COLUMN IF NOT EXISTS referral_date DATE;

-- Add urgency level constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_urgency_level'
    ) THEN
        ALTER TABLE evaluations 
        ADD CONSTRAINT valid_urgency_level 
        CHECK (urgency_level IN ('low', 'medium', 'high', 'urgent'));
    END IF;
END $$;

-- Create audit log table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create evaluation attachments table
CREATE TABLE IF NOT EXISTS evaluation_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    file_url TEXT NOT NULL,
    upload_type VARCHAR(50), -- 'image', 'document', 'video'
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create evaluation notes table for thread-based communication
CREATE TABLE IF NOT EXISTS evaluation_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    note_type VARCHAR(50) NOT NULL, -- 'clinical', 'internal', 'patient'
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create evaluation tags table
CREATE TABLE IF NOT EXISTS evaluation_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_color VARCHAR(7), -- Hex color code
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(evaluation_id, tag_name)
);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_evaluations_urgency_level ON evaluations(urgency_level);
CREATE INDEX IF NOT EXISTS idx_evaluations_assigned_to ON evaluations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_evaluations_triaged_by ON evaluations(triaged_by);
CREATE INDEX IF NOT EXISTS idx_evaluations_ai_risk_score ON evaluations(ai_risk_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_ai_summary_approved ON evaluations(ai_summary_approved);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_evaluation_attachments_evaluation_id ON evaluation_attachments(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_notes_evaluation_id ON evaluation_notes(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_tags_evaluation_id ON evaluation_tags(evaluation_id);

-- Create a view for evaluation summary with all related data
CREATE OR REPLACE VIEW evaluation_summary AS
SELECT 
    e.*,
    p.first_name || ' ' || p.last_name as patient_name,
    p.date_of_birth as patient_dob,
    p.email as patient_email,
    p.phone as patient_phone,
    pr.first_name || ' ' || pr.last_name as assigned_provider_name,
    pr.speciality as provider_speciality,
    t.name as tenant_name,
    COUNT(DISTINCT en.id) as note_count,
    COUNT(DISTINCT ea.id) as attachment_count,
    array_agg(DISTINCT et.tag_name) as tags
FROM evaluations e
LEFT JOIN patients p ON e.patient_id = p.id
LEFT JOIN practitioners pr ON e.assigned_to = pr.id
LEFT JOIN tenants t ON e.tenant_id = t.id
LEFT JOIN evaluation_notes en ON e.id = en.evaluation_id
LEFT JOIN evaluation_attachments ea ON e.id = ea.evaluation_id
LEFT JOIN evaluation_tags et ON e.id = et.evaluation_id
GROUP BY 
    e.id, p.id, p.first_name, p.last_name, p.date_of_birth, 
    p.email, p.phone, pr.id, pr.first_name, pr.last_name, 
    pr.speciality, t.id, t.name;

-- Add trigger for evaluation notes updated_at
CREATE TRIGGER update_evaluation_notes_updated_at BEFORE UPDATE ON evaluation_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON COLUMN evaluations.triage_notes IS 'Clinical triage notes added by staff';
COMMENT ON COLUMN evaluations.urgency_level IS 'Urgency level: low, medium, high, urgent';
COMMENT ON COLUMN evaluations.internal_notes IS 'Internal notes not visible to patients';
COMMENT ON COLUMN evaluations.ai_summary IS 'AI-generated summary of the evaluation';
COMMENT ON COLUMN evaluations.ai_risk_score IS 'AI-calculated risk score (0-100)';
COMMENT ON COLUMN evaluations.ai_flags IS 'Array of AI-identified risk flags';
COMMENT ON COLUMN evaluations.pain_points IS 'JSON structure of pain locations and intensities';
COMMENT ON TABLE audit_logs IS 'Audit trail for all system actions';
COMMENT ON TABLE evaluation_attachments IS 'File attachments for evaluations';
COMMENT ON TABLE evaluation_notes IS 'Thread-based notes and communication for evaluations';
COMMENT ON TABLE evaluation_tags IS 'Custom tags for categorizing evaluations';
COMMENT ON VIEW evaluation_summary IS 'Comprehensive view of evaluation with related data';
