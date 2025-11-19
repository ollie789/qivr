-- Create pain_assessments table
CREATE TABLE IF NOT EXISTS pain_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    evaluation_id UUID,
    recorded_at TIMESTAMP NOT NULL,
    recorded_by VARCHAR(255) NOT NULL,
    overall_pain_level INTEGER NOT NULL,
    functional_impact VARCHAR(50) NOT NULL DEFAULT 'none',
    pain_points_json TEXT,
    notes TEXT,
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    bmi DECIMAL(5,2),
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pain_assessments_patient_id ON pain_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_pain_assessments_tenant_id ON pain_assessments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pain_assessments_recorded_at ON pain_assessments(recorded_at);

-- Insert migration record
INSERT INTO __efmigrationshistory (migration_id, product_version)
VALUES ('20251119021937_AddPainAssessmentsAndVitalSigns', '8.0.0')
ON CONFLICT DO NOTHING;
