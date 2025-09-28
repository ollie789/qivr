-- Seed Medical Records Data
-- This script populates medical record tables with sample data for testing

-- Get the tenant and patient IDs
DO $$
DECLARE
    tenant_id UUID;
    patient_id UUID;
BEGIN
    -- Get the demo-clinic tenant
    SELECT id INTO tenant_id FROM qivr.tenants WHERE slug = 'demo-clinic' LIMIT 1;
    
    -- Get the patient user (Ollie)
    SELECT id INTO patient_id FROM qivr.users 
    WHERE email = 'ollie.bingemann@gmail.com' 
       OR cognito_id = '3c614b4e-c762-4b61-8d04-b8bb5df96e08' 
    LIMIT 1;
    
    IF tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant demo-clinic not found';
    END IF;
    
    IF patient_id IS NULL THEN
        RAISE EXCEPTION 'Patient user not found';
    END IF;
    
    -- Insert medical conditions
    INSERT INTO qivr.medical_conditions (id, tenant_id, patient_id, condition, icd10_code, diagnosed_date, status, managed_by, last_reviewed, notes, created_at, updated_at)
    VALUES
        (gen_random_uuid(), tenant_id, patient_id, 'Hypertension', 'I10', '2022-03-14', 'managed', 'Dr. Alicia Thornton', '2025-08-10', 'Blood pressure stable with current medication', NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, 'Type 2 Diabetes', 'E11.9', '2023-01-20', 'active', 'Dr. Omar Rahman', '2025-07-15', 'Continuing low GI diet and Metformin', NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    -- Insert vital signs
    INSERT INTO qivr.medical_vitals (id, tenant_id, patient_id, recorded_at, systolic, diastolic, heart_rate, temperature_celsius, weight_kilograms, height_centimetres, oxygen_saturation, respiratory_rate, created_at, updated_at)
    VALUES
        (gen_random_uuid(), tenant_id, patient_id, '2025-09-18 02:30:00+00', 118, 76, 68, 36.6, 78.2, 175.0, 98, 16, NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, '2025-08-04 01:45:00+00', 120, 78, 70, 36.7, 78.9, 175.0, 97, 16, NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, '2025-07-10 03:00:00+00', 122, 80, 72, 36.5, 79.1, 175.0, 98, 15, NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    -- Insert lab results
    INSERT INTO qivr.medical_lab_results (id, tenant_id, patient_id, result_date, category, test_name, value, unit, reference_range, status, ordered_by, notes, created_at, updated_at)
    VALUES
        (gen_random_uuid(), tenant_id, patient_id, '2025-07-22', 'Comprehensive Metabolic Panel', 'Glucose', '96', 'mg/dL', '70-99', 'normal', 'Dr. Omar Rahman', NULL, NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, '2025-07-22', 'Comprehensive Metabolic Panel', 'ALT', '31', 'U/L', '0-55', 'normal', 'Dr. Omar Rahman', NULL, NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, '2025-07-22', 'Comprehensive Metabolic Panel', 'Creatinine', '0.9', 'mg/dL', '0.7-1.3', 'normal', 'Dr. Omar Rahman', NULL, NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, '2025-05-03', 'Lipid Panel', 'Total Cholesterol', '180', 'mg/dL', '<200', 'normal', 'Qivr Diagnostics', NULL, NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, '2025-05-03', 'Lipid Panel', 'LDL', '105', 'mg/dL', '<100', 'high', 'Qivr Diagnostics', 'Slightly elevated', NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, '2025-05-03', 'Lipid Panel', 'HDL', '55', 'mg/dL', '>40', 'normal', 'Qivr Diagnostics', NULL, NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    -- Insert medications
    INSERT INTO qivr.medical_medications (id, tenant_id, patient_id, name, dosage, frequency, start_date, end_date, status, prescribed_by, instructions, refills_remaining, last_filled, pharmacy, created_at, updated_at)
    VALUES
        (gen_random_uuid(), tenant_id, patient_id, 'Metformin', '500 mg', 'Twice daily', '2023-02-01', NULL, 'active', 'Dr. Omar Rahman', 'Take with meals', 3, '2025-08-20', 'Priceline Pharmacy', NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, 'Lisinopril', '10 mg', 'Once daily', '2022-03-20', NULL, 'active', 'Dr. Alicia Thornton', 'Take in the morning', 5, '2025-09-01', 'Chemist Warehouse', NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, 'Atorvastatin', '20 mg', 'Once daily', '2023-06-15', NULL, 'active', 'Dr. Omar Rahman', 'Take at bedtime', 2, '2025-07-30', 'Priceline Pharmacy', NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    -- Insert allergies
    INSERT INTO qivr.medical_allergies (id, tenant_id, patient_id, allergen, type, severity, reaction, diagnosed_date, notes, created_at, updated_at)
    VALUES
        (gen_random_uuid(), tenant_id, patient_id, 'Penicillin', 'medication', 'moderate', 'Rash and hives', '2015-06-10', 'Documented reaction during childhood', NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, 'Peanuts', 'food', 'life-threatening', 'Anaphylaxis', '2010-03-22', 'Carries EpiPen', NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, 'Dust mites', 'environmental', 'mild', 'Sneezing, runny nose', '2018-09-15', 'Managed with antihistamines', NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    -- Insert immunizations
    INSERT INTO qivr.medical_immunizations (id, tenant_id, patient_id, vaccine, date, next_due, provider, facility, lot_number, series, created_at, updated_at)
    VALUES
        (gen_random_uuid(), tenant_id, patient_id, 'Influenza', '2025-07-28', '2026-07-01', 'Nurse Taylor', 'Qivr Clinic', 'FLU-2024-118', NULL, NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, 'COVID-19 Booster', '2025-01-28', NULL, 'Dr. Alicia Thornton', 'Qivr Clinic', NULL, 'Moderna Booster', NOW(), NOW()),
        (gen_random_uuid(), tenant_id, patient_id, 'Tetanus-Diphtheria', '2020-11-15', '2030-11-15', 'Dr. James Mitchell', 'Sydney Medical Centre', 'TD-2020-445', NULL, NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Medical records seeded successfully for tenant % and patient %', tenant_id, patient_id;
END $$;