-- Migration: Add MCID tracking tables and features
-- Description: Support for Minimal Clinically Important Difference tracking

BEGIN;

-- Create MCID thresholds table
CREATE TABLE IF NOT EXISTS qivr.mcid_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prom_template_key VARCHAR(100) NOT NULL,
    measure_type VARCHAR(50) NOT NULL, -- 'improvement' or 'deterioration'
    threshold_value DECIMAL(10,2) NOT NULL,
    description TEXT,
    source VARCHAR(255), -- Reference source for the threshold
    is_clinic_specific BOOLEAN DEFAULT FALSE,
    clinic_id UUID REFERENCES qivr.clinics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES qivr.users(id),
    
    -- Unique constraint for template key and measure type (per clinic if specified)
    CONSTRAINT uq_mcid_threshold UNIQUE (prom_template_key, measure_type, clinic_id)
);

-- Create MCID achievement records table
CREATE TABLE IF NOT EXISTS qivr.mcid_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES qivr.patients(id) ON DELETE CASCADE,
    prom_template_id UUID NOT NULL REFERENCES qivr.prom_templates(id),
    baseline_instance_id UUID NOT NULL REFERENCES qivr.prom_instances(id),
    current_instance_id UUID NOT NULL REFERENCES qivr.prom_instances(id),
    baseline_score DECIMAL(10,2) NOT NULL,
    current_score DECIMAL(10,2) NOT NULL,
    score_change DECIMAL(10,2) NOT NULL,
    percentage_change DECIMAL(10,2),
    achieved_mcid BOOLEAN NOT NULL,
    mcid_direction VARCHAR(50), -- 'improvement' or 'deterioration'
    clinical_significance VARCHAR(100),
    analysis_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_mcid_patient (patient_id),
    INDEX idx_mcid_template (prom_template_id),
    INDEX idx_mcid_date (analysis_date)
);

-- Add scoring metadata to PROM templates
ALTER TABLE qivr.prom_templates 
ADD COLUMN IF NOT EXISTS scoring_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mcid_enabled BOOLEAN DEFAULT TRUE;

-- Insert default MCID thresholds for common PROM types
INSERT INTO qivr.mcid_thresholds (prom_template_key, measure_type, threshold_value, description, source)
VALUES 
    ('ODI', 'improvement', 10, 'Oswestry Disability Index improvement', 'Copay et al. 2008'),
    ('ODI', 'deterioration', -10, 'Oswestry Disability Index deterioration', 'Copay et al. 2008'),
    ('NPRS', 'improvement', 2, 'Numeric Pain Rating Scale improvement', 'Farrar et al. 2001'),
    ('NPRS', 'deterioration', -2, 'Numeric Pain Rating Scale deterioration', 'Farrar et al. 2001'),
    ('DASH', 'improvement', 10.2, 'Disabilities of Arm, Shoulder, Hand improvement', 'Beaton et al. 2001'),
    ('DASH', 'deterioration', -10.2, 'Disabilities of Arm, Shoulder, Hand deterioration', 'Beaton et al. 2001'),
    ('NDI', 'improvement', 5, 'Neck Disability Index improvement', 'Pool et al. 2007'),
    ('NDI', 'deterioration', -5, 'Neck Disability Index deterioration', 'Pool et al. 2007'),
    ('KOOS', 'improvement', 8, 'Knee Injury and Osteoarthritis Outcome Score improvement', 'Roos et al. 2003'),
    ('KOOS', 'deterioration', -8, 'Knee Injury and Osteoarthritis Outcome Score deterioration', 'Roos et al. 2003'),
    ('HOOS', 'improvement', 8, 'Hip Disability and Osteoarthritis Outcome Score improvement', 'Nilsdotter et al. 2003'),
    ('HOOS', 'deterioration', -8, 'Hip Disability and Osteoarthritis Outcome Score deterioration', 'Nilsdotter et al. 2003'),
    ('RMDQ', 'improvement', 2, 'Roland-Morris Disability Questionnaire improvement', 'Jordan et al. 2006'),
    ('RMDQ', 'deterioration', -2, 'Roland-Morris Disability Questionnaire deterioration', 'Jordan et al. 2006')
ON CONFLICT (prom_template_key, measure_type, clinic_id) DO NOTHING;

-- Add RLS policies for MCID tables
ALTER TABLE qivr.mcid_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE qivr.mcid_achievements ENABLE ROW LEVEL SECURITY;

-- MCID thresholds policies
CREATE POLICY mcid_thresholds_tenant_isolation ON qivr.mcid_thresholds
    FOR ALL
    USING (
        clinic_id IS NULL OR 
        clinic_id IN (
            SELECT c.id FROM qivr.clinics c 
            WHERE c.tenant_id = current_setting('app.tenant_id')::UUID
        )
    );

-- MCID achievements policies  
CREATE POLICY mcid_achievements_tenant_isolation ON qivr.mcid_achievements
    FOR ALL
    USING (
        patient_id IN (
            SELECT p.id FROM qivr.patients p
            JOIN qivr.clinics c ON p.clinic_id = c.id
            WHERE c.tenant_id = current_setting('app.tenant_id')::UUID
        )
    );

-- Create function to calculate MCID achievement
CREATE OR REPLACE FUNCTION qivr.calculate_mcid_achievement(
    p_patient_id UUID,
    p_prom_template_key VARCHAR
) RETURNS TABLE (
    achieved_mcid BOOLEAN,
    score_change DECIMAL,
    clinical_significance VARCHAR,
    baseline_date TIMESTAMP,
    current_date TIMESTAMP
) AS $$
DECLARE
    v_baseline_score DECIMAL;
    v_current_score DECIMAL;
    v_score_change DECIMAL;
    v_improvement_threshold DECIMAL;
    v_deterioration_threshold DECIMAL;
    v_baseline_date TIMESTAMP;
    v_current_date TIMESTAMP;
BEGIN
    -- Get baseline and current scores
    SELECT 
        SUM(CAST(pr.response_value AS DECIMAL)),
        pi.completed_at
    INTO v_baseline_score, v_baseline_date
    FROM qivr.prom_instances pi
    JOIN qivr.prom_templates pt ON pi.prom_template_id = pt.id
    JOIN qivr.prom_responses pr ON pi.id = pr.prom_instance_id
    WHERE pi.patient_id = p_patient_id
        AND pt.key = p_prom_template_key
        AND pi.status = 'completed'
    GROUP BY pi.id, pi.completed_at
    ORDER BY pi.completed_at ASC
    LIMIT 1;
    
    SELECT 
        SUM(CAST(pr.response_value AS DECIMAL)),
        pi.completed_at
    INTO v_current_score, v_current_date
    FROM qivr.prom_instances pi
    JOIN qivr.prom_templates pt ON pi.prom_template_id = pt.id
    JOIN qivr.prom_responses pr ON pi.id = pr.prom_instance_id
    WHERE pi.patient_id = p_patient_id
        AND pt.key = p_prom_template_key
        AND pi.status = 'completed'
    GROUP BY pi.id, pi.completed_at
    ORDER BY pi.completed_at DESC
    LIMIT 1;
    
    -- Calculate change
    v_score_change := v_current_score - v_baseline_score;
    
    -- Get thresholds
    SELECT threshold_value INTO v_improvement_threshold
    FROM qivr.mcid_thresholds
    WHERE prom_template_key = p_prom_template_key
        AND measure_type = 'improvement'
    LIMIT 1;
    
    SELECT threshold_value INTO v_deterioration_threshold
    FROM qivr.mcid_thresholds
    WHERE prom_template_key = p_prom_template_key
        AND measure_type = 'deterioration'
    LIMIT 1;
    
    -- Determine achievement and significance
    IF v_score_change >= COALESCE(v_improvement_threshold, 10) THEN
        RETURN QUERY SELECT 
            TRUE,
            v_score_change,
            'clinically_significant_improvement'::VARCHAR,
            v_baseline_date,
            v_current_date;
    ELSIF v_score_change <= COALESCE(v_deterioration_threshold, -10) THEN
        RETURN QUERY SELECT 
            TRUE,
            v_score_change,
            'clinically_significant_deterioration'::VARCHAR,
            v_baseline_date,
            v_current_date;
    ELSE
        RETURN QUERY SELECT 
            FALSE,
            v_score_change,
            CASE 
                WHEN v_score_change > 0 THEN 'minimal_improvement'
                WHEN v_score_change < 0 THEN 'minimal_deterioration'
                ELSE 'no_change'
            END::VARCHAR,
            v_baseline_date,
            v_current_date;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update timestamp
CREATE TRIGGER update_mcid_thresholds_updated_at
    BEFORE UPDATE ON qivr.mcid_thresholds
    FOR EACH ROW
    EXECUTE FUNCTION qivr.update_updated_at_column();

COMMIT;
