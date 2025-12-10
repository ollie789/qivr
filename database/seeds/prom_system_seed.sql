-- PROM System Seed Data
-- Comprehensive seed with instruments, templates, questions, and scoring definitions
-- Uses stable UUIDs for reproducibility

BEGIN;

-- ============================================
-- 1. INSTRUMENTS (Global Catalogue)
-- ============================================

INSERT INTO qivr.instruments (id, key, name, instrument_family, clinical_domain, license_type, is_global, is_active, description, reference_url, created_at, updated_at)
VALUES
    -- Spine
    ('11111111-0001-0001-0001-000000000001', 'odi', 'Oswestry Disability Index', 'Oswestry', 'spine', 'Open', true, true, 
     '10-item questionnaire measuring disability caused by low back pain. Score 0-100%, higher = more disability.', 
     'https://www.aaos.org/globalassets/quality-and-practice-resources/patient-reported-outcome-measures/spine/oswestry-2.pdf', NOW(), NOW()),
    
    ('11111111-0001-0001-0001-000000000002', 'ndi', 'Neck Disability Index', 'NDI', 'spine', 'Open', true, true,
     '10-item questionnaire measuring disability caused by neck pain. Score 0-100%, higher = more disability.',
     NULL, NOW(), NOW()),
    
    -- Knee
    ('11111111-0001-0001-0001-000000000003', 'koos', 'Knee Injury and Osteoarthritis Outcome Score', 'KOOS', 'knee', 'Open', true, true,
     '42-item questionnaire with 5 subscales: Pain, Symptoms, ADL, Sport/Recreation, QoL. Score 0-100, higher = better.',
     'http://www.koos.nu/', NOW(), NOW()),
    
    -- Hip  
    ('11111111-0001-0001-0001-000000000004', 'hoos', 'Hip Disability and Osteoarthritis Outcome Score', 'HOOS', 'hip', 'Open', true, true,
     '40-item questionnaire with 5 subscales. Score 0-100, higher = better.',
     'http://www.koos.nu/', NOW(), NOW()),
    
    -- Upper Limb
    ('11111111-0001-0001-0001-000000000005', 'quickdash', 'QuickDASH', 'DASH', 'upper_limb', 'Open', true, true,
     '11-item short form measuring upper limb function. Score 0-100, higher = more disability.',
     'http://www.dash.iwh.on.ca/', NOW(), NOW()),
    
    -- Mental Health
    ('11111111-0001-0001-0001-000000000006', 'phq9', 'Patient Health Questionnaire-9', 'PHQ', 'mental_health', 'Open', true, true,
     '9-item depression screening. Score 0-27, higher = more severe depression.',
     'https://www.phqscreeners.com/', NOW(), NOW()),
    
    ('11111111-0001-0001-0001-000000000007', 'gad7', 'Generalized Anxiety Disorder-7', 'GAD', 'mental_health', 'Open', true, true,
     '7-item anxiety screening. Score 0-21, higher = more severe anxiety.',
     'https://www.phqscreeners.com/', NOW(), NOW()),
    
    -- General Health (with external scoring example)
    ('11111111-0001-0001-0001-000000000008', 'eq5d', 'EuroQol 5-Dimension', 'EQ-5D', 'general_health', 'CommercialRequired', true, true,
     '5-dimension health utility measure. Index score requires country-specific value sets.',
     'https://euroqol.org/', NOW(), NOW()),
    
    -- Pain
    ('11111111-0001-0001-0001-000000000009', 'nprs', 'Numeric Pain Rating Scale', 'NPRS', 'pain', 'Open', true, true,
     'Single-item 0-10 pain intensity scale.',
     NULL, NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

COMMIT;
