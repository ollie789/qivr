-- ODI (Oswestry Disability Index) Template Seed
-- 10-item questionnaire for low back pain disability
-- Scoring: 0-100%, higher = more disability
-- MCID: 10-12 points

-- NOTE: Run prom_system_seed.sql first to create instruments

-- You need a tenant_id to create templates. Replace with your dev tenant:
DO $$
DECLARE
    v_tenant_id UUID;
    v_template_id UUID := 'aaaaaaaa-0001-0001-0001-000000000001';
    v_instrument_id UUID := '11111111-0001-0001-0001-000000000001'; -- ODI instrument
BEGIN
    -- Get first tenant (dev environment)
    SELECT id INTO v_tenant_id FROM qivr.tenants LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant found. Create a tenant first.';
    END IF;

    -- Insert ODI template
    INSERT INTO qivr.prom_templates (
        id, tenant_id, key, version, name, description, category, frequency,
        status, instrument_id, schema_version, frequency_hint, tags,
        questions, scoring_method, scoring_rules, created_at, updated_at
    ) VALUES (
        v_template_id,
        v_tenant_id,
        'odi',
        1,
        'Oswestry Disability Index (ODI)',
        '10-item questionnaire measuring disability due to low back pain. Gold standard for lumbar spine outcomes.',
        'Spine',
        'monthly',
        'Active',
        v_instrument_id,
        1,
        'baseline, 6w, 3m, 6m, 12m',
        ARRAY['spine', 'low-back', 'disability', 'validated'],
        '[
            {"id": "odi_q1", "code": "ODI_PAIN_INTENSITY", "section": "pain", "label": "Pain Intensity", "text": "I have no pain at the moment", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "I have no pain at the moment"},
                {"value": 1, "label": "The pain is very mild at the moment"},
                {"value": 2, "label": "The pain is moderate at the moment"},
                {"value": 3, "label": "The pain is fairly severe at the moment"},
                {"value": 4, "label": "The pain is very severe at the moment"},
                {"value": 5, "label": "The pain is the worst imaginable at the moment"}
            ]},
            {"id": "odi_q2", "code": "ODI_PERSONAL_CARE", "section": "function", "label": "Personal Care", "text": "Personal care (washing, dressing, etc.)", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "I can look after myself normally without causing extra pain"},
                {"value": 1, "label": "I can look after myself normally but it causes extra pain"},
                {"value": 2, "label": "It is painful to look after myself and I am slow and careful"},
                {"value": 3, "label": "I need some help but manage most of my personal care"},
                {"value": 4, "label": "I need help every day in most aspects of self-care"},
                {"value": 5, "label": "I do not get dressed, wash with difficulty and stay in bed"}
            ]},
            {"id": "odi_q3", "code": "ODI_LIFTING", "section": "function", "label": "Lifting", "text": "Lifting objects", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "I can lift heavy weights without extra pain"},
                {"value": 1, "label": "I can lift heavy weights but it gives extra pain"},
                {"value": 2, "label": "Pain prevents me from lifting heavy weights off the floor but I can if conveniently positioned"},
                {"value": 3, "label": "Pain prevents me from lifting heavy weights but I can manage light weights if conveniently positioned"},
                {"value": 4, "label": "I can lift only very light weights"},
                {"value": 5, "label": "I cannot lift or carry anything at all"}
            ]},
            {"id": "odi_q4", "code": "ODI_WALKING", "section": "function", "label": "Walking", "text": "Walking ability", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Pain does not prevent me walking any distance"},
                {"value": 1, "label": "Pain prevents me walking more than 1 mile"},
                {"value": 2, "label": "Pain prevents me walking more than 1/2 mile"},
                {"value": 3, "label": "Pain prevents me walking more than 100 yards"},
                {"value": 4, "label": "I can only walk using a stick or crutches"},
                {"value": 5, "label": "I am in bed most of the time and have to crawl to the toilet"}
            ]},
            {"id": "odi_q5", "code": "ODI_SITTING", "section": "function", "label": "Sitting", "text": "Sitting tolerance", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "I can sit in any chair as long as I like"},
                {"value": 1, "label": "I can only sit in my favourite chair as long as I like"},
                {"value": 2, "label": "Pain prevents me sitting more than 1 hour"},
                {"value": 3, "label": "Pain prevents me from sitting more than 30 minutes"},
                {"value": 4, "label": "Pain prevents me from sitting more than 10 minutes"},
                {"value": 5, "label": "Pain prevents me from sitting at all"}
            ]},
            {"id": "odi_q6", "code": "ODI_STANDING", "section": "function", "label": "Standing", "text": "Standing tolerance", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "I can stand as long as I want without extra pain"},
                {"value": 1, "label": "I can stand as long as I want but it gives me extra pain"},
                {"value": 2, "label": "Pain prevents me from standing for more than 1 hour"},
                {"value": 3, "label": "Pain prevents me from standing for more than 30 minutes"},
                {"value": 4, "label": "Pain prevents me from standing for more than 10 minutes"},
                {"value": 5, "label": "Pain prevents me from standing at all"}
            ]},
            {"id": "odi_q7", "code": "ODI_SLEEPING", "section": "function", "label": "Sleeping", "text": "Sleep quality", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "My sleep is never disturbed by pain"},
                {"value": 1, "label": "My sleep is occasionally disturbed by pain"},
                {"value": 2, "label": "Because of pain I have less than 6 hours sleep"},
                {"value": 3, "label": "Because of pain I have less than 4 hours sleep"},
                {"value": 4, "label": "Because of pain I have less than 2 hours sleep"},
                {"value": 5, "label": "Pain prevents me from sleeping at all"}
            ]},
            {"id": "odi_q8", "code": "ODI_SEX_LIFE", "section": "function", "label": "Sex Life", "text": "Sex life (if applicable)", "type": "SingleSelect", "required": false, "options": [
                {"value": 0, "label": "My sex life is normal and causes no extra pain"},
                {"value": 1, "label": "My sex life is normal but causes some extra pain"},
                {"value": 2, "label": "My sex life is nearly normal but is very painful"},
                {"value": 3, "label": "My sex life is severely restricted by pain"},
                {"value": 4, "label": "My sex life is nearly absent because of pain"},
                {"value": 5, "label": "Pain prevents any sex life at all"}
            ]},
            {"id": "odi_q9", "code": "ODI_SOCIAL_LIFE", "section": "function", "label": "Social Life", "text": "Social activities", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "My social life is normal and gives me no extra pain"},
                {"value": 1, "label": "My social life is normal but increases the degree of pain"},
                {"value": 2, "label": "Pain has no significant effect on my social life apart from limiting my more energetic interests"},
                {"value": 3, "label": "Pain has restricted my social life and I do not go out as often"},
                {"value": 4, "label": "Pain has restricted my social life to my home"},
                {"value": 5, "label": "I have no social life because of pain"}
            ]},
            {"id": "odi_q10", "code": "ODI_TRAVELLING", "section": "function", "label": "Travelling", "text": "Travelling ability", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "I can travel anywhere without pain"},
                {"value": 1, "label": "I can travel anywhere but it gives me extra pain"},
                {"value": 2, "label": "Pain is bad but I manage journeys over 2 hours"},
                {"value": 3, "label": "Pain restricts me to journeys of less than 1 hour"},
                {"value": 4, "label": "Pain restricts me to short necessary journeys under 30 minutes"},
                {"value": 5, "label": "Pain prevents me from travelling except to receive treatment"}
            ]}
        ]'::jsonb,
        '{"type": "percentage", "maxRawScore": 50}'::jsonb,
        '{"formula": "(sum / maxAnswered) * 100"}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (tenant_id, key, version) DO UPDATE SET
        name = EXCLUDED.name,
        questions = EXCLUDED.questions,
        updated_at = NOW();

    -- Insert scoring definition
    INSERT INTO qivr.summary_score_definitions (
        id, tenant_id, template_id, score_key, label, description,
        scoring_method, range_min, range_max, higher_is_better,
        mcid, is_primary, order_index, interpretation_bands
    ) VALUES (
        'bbbbbbbb-0001-0001-0001-000000000001',
        v_tenant_id,
        v_template_id,
        'total',
        'ODI Total Score',
        'Overall disability percentage. Higher scores indicate greater disability.',
        'Percentage',
        0, 100, false,
        10, -- MCID of 10 points
        true,
        0,
        '[
            {"min": 0, "max": 20, "label": "Minimal Disability", "severity": "minimal", "color": "#4CAF50"},
            {"min": 21, "max": 40, "label": "Moderate Disability", "severity": "moderate", "color": "#FFC107"},
            {"min": 41, "max": 60, "label": "Severe Disability", "severity": "severe", "color": "#FF9800"},
            {"min": 61, "max": 80, "label": "Crippling Disability", "severity": "crippling", "color": "#F44336"},
            {"min": 81, "max": 100, "label": "Bed-bound/Exaggerating", "severity": "extreme", "color": "#9C27B0"}
        ]'::jsonb
    )
    ON CONFLICT (template_id, score_key) DO UPDATE SET
        interpretation_bands = EXCLUDED.interpretation_bands,
        updated_at = NOW();

    RAISE NOTICE 'ODI template created with ID: %', v_template_id;
END $$;
