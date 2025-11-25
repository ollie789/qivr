-- Add missing columns to medical_conditions table
ALTER TABLE medical_conditions 
ADD COLUMN IF NOT EXISTS affected_area VARCHAR(200),
ADD COLUMN IF NOT EXISTS onset_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS previous_treatments TEXT,
ADD COLUMN IF NOT EXISTS aggravating_factors TEXT,
ADD COLUMN IF NOT EXISTS relieving_factors TEXT;
