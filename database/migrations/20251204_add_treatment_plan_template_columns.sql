-- Add template support columns to treatment_plans table
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS source_template_id UUID;
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS body_region VARCHAR(100);
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS condition_type VARCHAR(200);
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS template_source VARCHAR(50);
ALTER TABLE treatment_plans ADD COLUMN IF NOT EXISTS times_used INTEGER NOT NULL DEFAULT 0;

-- Add index for template queries
CREATE INDEX IF NOT EXISTS idx_treatment_plans_is_template ON treatment_plans(is_template) WHERE is_template = TRUE;
CREATE INDEX IF NOT EXISTS idx_treatment_plans_body_region ON treatment_plans(body_region) WHERE body_region IS NOT NULL;
