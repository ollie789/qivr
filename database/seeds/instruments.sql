-- Seed standard PROM instruments
-- These are clinically validated questionnaires

INSERT INTO qivr.instruments (id, key, name, instrument_family, clinical_domain, license_type, is_global, is_active, description, reference_url, created_at, updated_at)
VALUES
  -- Spine
  (gen_random_uuid(), 'odi', 'Oswestry Disability Index', 'Oswestry', 'spine', 'Open', true, true, '10-item questionnaire measuring disability caused by low back pain', 'https://www.aaos.org/globalassets/quality-and-practice-resources/patient-reported-outcome-measures/spine/oswestry-2.pdf', NOW(), NOW()),
  (gen_random_uuid(), 'ndi', 'Neck Disability Index', 'NDI', 'spine', 'Open', true, true, '10-item questionnaire measuring disability caused by neck pain', NULL, NOW(), NOW()),
  
  -- Knee
  (gen_random_uuid(), 'koos', 'Knee Injury and Osteoarthritis Outcome Score', 'KOOS', 'knee', 'Open', true, true, '42-item questionnaire with 5 subscales: Pain, Symptoms, ADL, Sport/Recreation, QoL', 'http://www.koos.nu/', NOW(), NOW()),
  (gen_random_uuid(), 'koos-jr', 'KOOS, JR (Joint Replacement)', 'KOOS', 'knee', 'Open', true, true, '7-item short form derived from KOOS for knee arthroplasty patients', NULL, NOW(), NOW()),
  
  -- Hip
  (gen_random_uuid(), 'hoos', 'Hip Disability and Osteoarthritis Outcome Score', 'HOOS', 'hip', 'Open', true, true, '40-item questionnaire with 5 subscales: Pain, Symptoms, ADL, Sport/Recreation, QoL', 'http://www.koos.nu/', NOW(), NOW()),
  (gen_random_uuid(), 'hoos-jr', 'HOOS, JR (Joint Replacement)', 'HOOS', 'hip', 'Open', true, true, '6-item short form derived from HOOS for hip arthroplasty patients', NULL, NOW(), NOW()),
  
  -- Upper Limb / Shoulder
  (gen_random_uuid(), 'dash', 'Disabilities of the Arm, Shoulder and Hand', 'DASH', 'upper_limb', 'Open', true, true, '30-item questionnaire measuring upper limb function', 'http://www.dash.iwh.on.ca/', NOW(), NOW()),
  (gen_random_uuid(), 'quickdash', 'QuickDASH', 'DASH', 'upper_limb', 'Open', true, true, '11-item short form of the DASH', 'http://www.dash.iwh.on.ca/', NOW(), NOW()),
  
  -- Foot/Ankle
  (gen_random_uuid(), 'faam', 'Foot and Ankle Ability Measure', 'FAAM', 'foot_ankle', 'Open', true, true, '29-item questionnaire with ADL and Sports subscales', NULL, NOW(), NOW()),
  
  -- Mental Health
  (gen_random_uuid(), 'phq9', 'Patient Health Questionnaire-9', 'PHQ', 'mental_health', 'Open', true, true, '9-item depression screening and severity measure', 'https://www.phqscreeners.com/', NOW(), NOW()),
  (gen_random_uuid(), 'gad7', 'Generalized Anxiety Disorder-7', 'GAD', 'mental_health', 'Open', true, true, '7-item anxiety screening measure', 'https://www.phqscreeners.com/', NOW(), NOW()),
  
  -- General Health
  (gen_random_uuid(), 'sf36', '36-Item Short Form Survey', 'SF', 'general_health', 'NonCommercial', true, true, '36-item health survey with 8 scales measuring physical and mental health', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'sf12', '12-Item Short Form Survey', 'SF', 'general_health', 'NonCommercial', true, true, '12-item short form of SF-36', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'eq5d', 'EuroQol 5-Dimension', 'EQ-5D', 'general_health', 'CommercialRequired', true, true, '5-dimension health status measure with VAS', 'https://euroqol.org/', NOW(), NOW()),
  
  -- Pain
  (gen_random_uuid(), 'nprs', 'Numeric Pain Rating Scale', 'NPRS', 'pain', 'Open', true, true, 'Single-item 0-10 pain intensity scale', NULL, NOW(), NOW()),
  (gen_random_uuid(), 'bpi', 'Brief Pain Inventory', 'BPI', 'pain', 'Open', true, true, 'Assesses pain severity and interference with daily functions', NULL, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
