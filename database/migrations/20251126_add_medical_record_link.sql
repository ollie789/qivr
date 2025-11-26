-- Add medical record link to evaluations (intake forms)
-- This allows linking completed intake forms to created patient records

ALTER TABLE evaluations 
ADD COLUMN IF NOT EXISTS medical_record_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_evaluations_medical_record_id ON evaluations(medical_record_id);
