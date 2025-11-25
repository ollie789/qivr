-- Add common PROM questionnaire templates
-- Run this after deployment to add standard templates

-- KOOS (Knee injury and Osteoarthritis Outcome Score)
INSERT INTO prom_templates (id, tenant_id, name, description, category, questions, scoring_algorithm, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    id as tenant_id,
    'KOOS',
    'Knee injury and Osteoarthritis Outcome Score - Comprehensive knee assessment',
    'Orthopedic',
    '[
        {"id": "pain1", "text": "How often is your knee painful?", "type": "scale", "min": 0, "max": 4, "labels": ["Never", "Monthly", "Weekly", "Daily", "Always"]},
        {"id": "pain2", "text": "Twisting/pivoting on your knee", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "pain3", "text": "Straightening knee fully", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "pain4", "text": "Going up or down stairs", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "function1", "text": "Rising from sitting", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "function2", "text": "Standing", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "qol1", "text": "How much are you troubled with lack of confidence in your knee?", "type": "scale", "min": 0, "max": 4, "labels": ["Not at all", "Mildly", "Moderately", "Severely", "Extremely"]}
    ]'::jsonb,
    '{"type": "sum", "maxScore": 28, "normalize": true}'::jsonb,
    NOW(),
    NOW()
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM prom_templates WHERE name = 'KOOS' AND tenant_id = tenants.id
);

-- WOMAC (Western Ontario and McMaster Universities Osteoarthritis Index)
INSERT INTO prom_templates (id, tenant_id, name, description, category, questions, scoring_algorithm, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    id as tenant_id,
    'WOMAC',
    'Western Ontario and McMaster Universities Osteoarthritis Index - Hip and knee arthritis',
    'Orthopedic',
    '[
        {"id": "pain1", "text": "Pain walking on flat surface", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "pain2", "text": "Pain going up or down stairs", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "pain3", "text": "Pain at night while in bed", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "stiff1", "text": "Morning stiffness", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "function1", "text": "Difficulty descending stairs", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "function2", "text": "Difficulty ascending stairs", "type": "scale", "min": 0, "max": 4, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]}
    ]'::jsonb,
    '{"type": "sum", "maxScore": 24, "normalize": true}'::jsonb,
    NOW(),
    NOW()
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM prom_templates WHERE name = 'WOMAC' AND tenant_id = tenants.id
);

-- NDI (Neck Disability Index)
INSERT INTO prom_templates (id, tenant_id, name, description, category, questions, scoring_algorithm, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    id as tenant_id,
    'NDI',
    'Neck Disability Index - Neck pain and disability assessment',
    'Spine',
    '[
        {"id": "pain", "text": "Neck pain intensity", "type": "scale", "min": 0, "max": 5, "labels": ["No pain", "Mild", "Moderate", "Fairly severe", "Very severe", "Worst imaginable"]},
        {"id": "personal", "text": "Personal care (washing, dressing)", "type": "scale", "min": 0, "max": 5, "labels": ["No difficulty", "Mild difficulty", "Moderate difficulty", "Fairly difficult", "Very difficult", "Impossible"]},
        {"id": "lifting", "text": "Lifting", "type": "scale", "min": 0, "max": 5, "labels": ["No difficulty", "Mild difficulty", "Moderate difficulty", "Fairly difficult", "Very difficult", "Impossible"]},
        {"id": "reading", "text": "Reading", "type": "scale", "min": 0, "max": 5, "labels": ["No difficulty", "Mild difficulty", "Moderate difficulty", "Fairly difficult", "Very difficult", "Impossible"]},
        {"id": "headaches", "text": "Headaches", "type": "scale", "min": 0, "max": 5, "labels": ["No headaches", "Mild", "Moderate", "Fairly severe", "Very severe", "Worst imaginable"]},
        {"id": "concentration", "text": "Concentration", "type": "scale", "min": 0, "max": 5, "labels": ["No difficulty", "Mild difficulty", "Moderate difficulty", "Fairly difficult", "Very difficult", "Impossible"]}
    ]'::jsonb,
    '{"type": "sum", "maxScore": 30, "normalize": true}'::jsonb,
    NOW(),
    NOW()
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM prom_templates WHERE name = 'NDI' AND tenant_id = tenants.id
);

-- QuickDASH (Disabilities of the Arm, Shoulder and Hand)
INSERT INTO prom_templates (id, tenant_id, name, description, category, questions, scoring_algorithm, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    id as tenant_id,
    'QuickDASH',
    'Quick Disabilities of the Arm, Shoulder and Hand - Upper extremity function',
    'Upper Extremity',
    '[
        {"id": "open_jar", "text": "Open a tight or new jar", "type": "scale", "min": 1, "max": 5, "labels": ["No difficulty", "Mild", "Moderate", "Severe", "Unable"]},
        {"id": "heavy_object", "text": "Carry a heavy object (over 10 lbs)", "type": "scale", "min": 1, "max": 5, "labels": ["No difficulty", "Mild", "Moderate", "Severe", "Unable"]},
        {"id": "wash_back", "text": "Wash your back", "type": "scale", "min": 1, "max": 5, "labels": ["No difficulty", "Mild", "Moderate", "Severe", "Unable"]},
        {"id": "knife", "text": "Use a knife to cut food", "type": "scale", "min": 1, "max": 5, "labels": ["No difficulty", "Mild", "Moderate", "Severe", "Unable"]},
        {"id": "pain", "text": "Arm, shoulder or hand pain", "type": "scale", "min": 1, "max": 5, "labels": ["None", "Mild", "Moderate", "Severe", "Extreme"]},
        {"id": "interference", "text": "Interference with normal social activities", "type": "scale", "min": 1, "max": 5, "labels": ["Not at all", "Slightly", "Moderately", "Quite a bit", "Extremely"]}
    ]'::jsonb,
    '{"type": "sum", "maxScore": 30, "normalize": true}'::jsonb,
    NOW(),
    NOW()
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM prom_templates WHERE name = 'QuickDASH' AND tenant_id = tenants.id
);

-- ODI (Oswestry Disability Index)
INSERT INTO prom_templates (id, tenant_id, name, description, category, questions, scoring_algorithm, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    id as tenant_id,
    'ODI',
    'Oswestry Disability Index - Low back pain and disability',
    'Spine',
    '[
        {"id": "pain", "text": "Pain intensity", "type": "scale", "min": 0, "max": 5, "labels": ["No pain", "Mild", "Moderate", "Fairly severe", "Very severe", "Worst imaginable"]},
        {"id": "personal_care", "text": "Personal care", "type": "scale", "min": 0, "max": 5, "labels": ["No difficulty", "Mild difficulty", "Moderate difficulty", "Need help", "Need help for most", "Cannot do"]},
        {"id": "lifting", "text": "Lifting", "type": "scale", "min": 0, "max": 5, "labels": ["No difficulty", "Mild difficulty", "Moderate difficulty", "Very difficult", "Can only lift light", "Cannot lift"]},
        {"id": "walking", "text": "Walking", "type": "scale", "min": 0, "max": 5, "labels": ["No difficulty", "Mild difficulty", "Moderate difficulty", "Can walk short distances", "Can only walk with aid", "Bed/chair bound"]},
        {"id": "sitting", "text": "Sitting", "type": "scale", "min": 0, "max": 5, "labels": ["No difficulty", "Mild difficulty", "Moderate difficulty", "Can sit short periods", "Can sit very short periods", "Cannot sit"]},
        {"id": "standing", "text": "Standing", "type": "scale", "min": 0, "max": 5, "labels": ["No difficulty", "Mild difficulty", "Moderate difficulty", "Can stand short periods", "Can stand very short periods", "Cannot stand"]}
    ]'::jsonb,
    '{"type": "sum", "maxScore": 30, "normalize": true}'::jsonb,
    NOW(),
    NOW()
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM prom_templates WHERE name = 'ODI' AND tenant_id = tenants.id
);
