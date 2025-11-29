-- Apply missing treatment plan columns
-- Run this against the production database

-- AI Generation Metadata
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS ai_generated_summary TEXT;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS ai_confidence DOUBLE PRECISION;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS source_evaluation_id UUID;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS ai_rationale TEXT;

-- Phase-based structure (JSONB)
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS phases JSONB DEFAULT '[]'::jsonb;

-- PROM Configuration (JSONB)
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS prom_config JSONB;

-- Progress Tracking
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS completed_sessions INTEGER DEFAULT 0;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS progress_percentage NUMERIC DEFAULT 0;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 0;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS exercise_streak INTEGER DEFAULT 0;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- Milestones (JSONB)
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb;

-- Daily Check-ins (JSONB)
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS check_ins JSONB DEFAULT '[]'::jsonb;

-- Approval Workflow
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Create index for source evaluation lookup
CREATE INDEX IF NOT EXISTS ix_treatment_plans_source_evaluation_id ON treatment_plans(source_evaluation_id);

-- Record migration in EF migrations history
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251129120000_EnhanceTreatmentPlanWithPhasesAndMilestones', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Also add exercise templates table if missing
CREATE TABLE IF NOT EXISTS exercise_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    default_sets INTEGER DEFAULT 3,
    default_reps INTEGER DEFAULT 10,
    default_hold_seconds INTEGER,
    default_frequency VARCHAR(50) DEFAULT 'Daily',
    video_url TEXT,
    thumbnail_url TEXT,
    image_url TEXT,
    category VARCHAR(100) NOT NULL,
    body_region VARCHAR(100) NOT NULL,
    difficulty INTEGER DEFAULT 0,
    target_conditions JSONB DEFAULT '[]'::jsonb,
    contraindications JSONB DEFAULT '[]'::jsonb,
    equipment JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    is_system_exercise BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_exercise_templates_tenant_id ON exercise_templates(tenant_id);
CREATE INDEX IF NOT EXISTS ix_exercise_templates_category ON exercise_templates(category);
CREATE INDEX IF NOT EXISTS ix_exercise_templates_body_region ON exercise_templates(body_region);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251129130000_AddExerciseTemplates', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;
