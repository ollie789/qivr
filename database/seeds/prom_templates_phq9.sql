-- PHQ-9 (Patient Health Questionnaire-9) Template Seed
-- 9-item depression screening and severity measure
-- Scoring: 0-27, higher = more severe depression
-- Public domain - free to use

DO $$
DECLARE
    v_tenant_id UUID;
    v_template_id UUID := 'aaaaaaaa-0001-0001-0001-000000000002';
    v_instrument_id UUID := '11111111-0001-0001-0001-000000000006'; -- PHQ-9 instrument
BEGIN
    SELECT id INTO v_tenant_id FROM qivr.tenants LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No tenant found.';
    END IF;

    INSERT INTO qivr.prom_templates (
        id, tenant_id, key, version, name, description, category, frequency,
        status, instrument_id, schema_version, frequency_hint, tags,
        questions, scoring_method, scoring_rules, created_at, updated_at
    ) VALUES (
        v_template_id,
        v_tenant_id,
        'phq9',
        1,
        'Patient Health Questionnaire-9 (PHQ-9)',
        '9-item depression screening tool. Assesses frequency of depressive symptoms over the past 2 weeks.',
        'Mental Health',
        'weekly',
        'Active',
        v_instrument_id,
        1,
        'baseline, weekly during treatment, monthly maintenance',
        ARRAY['mental-health', 'depression', 'screening', 'validated', 'public-domain'],
        '[
            {"id": "phq9_q1", "code": "PHQ9_INTEREST", "section": "mood", "label": "Little interest or pleasure", "text": "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]},
            {"id": "phq9_q2", "code": "PHQ9_DEPRESSED", "section": "mood", "label": "Feeling down, depressed, or hopeless", "text": "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]},
            {"id": "phq9_q3", "code": "PHQ9_SLEEP", "section": "somatic", "label": "Trouble with sleep", "text": "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]},
            {"id": "phq9_q4", "code": "PHQ9_ENERGY", "section": "somatic", "label": "Feeling tired or having little energy", "text": "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]},
            {"id": "phq9_q5", "code": "PHQ9_APPETITE", "section": "somatic", "label": "Poor appetite or overeating", "text": "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]},
            {"id": "phq9_q6", "code": "PHQ9_SELF_ESTEEM", "section": "cognitive", "label": "Feeling bad about yourself", "text": "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself — or that you are a failure or have let yourself or your family down?", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]},
            {"id": "phq9_q7", "code": "PHQ9_CONCENTRATION", "section": "cognitive", "label": "Trouble concentrating", "text": "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things, such as reading the newspaper or watching television?", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]},
            {"id": "phq9_q8", "code": "PHQ9_PSYCHOMOTOR", "section": "somatic", "label": "Moving or speaking slowly/being fidgety", "text": "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ]},
            {"id": "phq9_q9", "code": "PHQ9_SELF_HARM", "section": "cognitive", "label": "Thoughts of self-harm", "text": "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead or of hurting yourself in some way?", "type": "SingleSelect", "required": true, "options": [
                {"value": 0, "label": "Not at all"},
                {"value": 1, "label": "Several days"},
                {"value": 2, "label": "More than half the days"},
                {"value": 3, "label": "Nearly every day"}
            ], "alert": true, "alertThreshold": 1}
        ]'::jsonb,
        '{"type": "sum", "maxScore": 27}'::jsonb,
        '{"formula": "sum(all_items)"}'::jsonb,
        NOW(),
        NOW()
    )
    ON CONFLICT (tenant_id, key, version) DO UPDATE SET
        name = EXCLUDED.name,
        questions = EXCLUDED.questions,
        updated_at = NOW();

    -- Scoring definition
    INSERT INTO qivr.summary_score_definitions (
        id, tenant_id, template_id, score_key, label, description,
        scoring_method, range_min, range_max, higher_is_better,
        mcid, is_primary, order_index, interpretation_bands
    ) VALUES (
        'bbbbbbbb-0001-0001-0001-000000000002',
        v_tenant_id,
        v_template_id,
        'total',
        'PHQ-9 Total Score',
        'Sum of all 9 items. Higher scores indicate more severe depression.',
        'Sum',
        0, 27, false,
        5, -- MCID of 5 points
        true,
        0,
        '[
            {"min": 0, "max": 4, "label": "Minimal/None", "severity": "minimal", "color": "#4CAF50"},
            {"min": 5, "max": 9, "label": "Mild Depression", "severity": "mild", "color": "#8BC34A"},
            {"min": 10, "max": 14, "label": "Moderate Depression", "severity": "moderate", "color": "#FFC107"},
            {"min": 15, "max": 19, "label": "Moderately Severe", "severity": "moderately_severe", "color": "#FF9800"},
            {"min": 20, "max": 27, "label": "Severe Depression", "severity": "severe", "color": "#F44336"}
        ]'::jsonb
    )
    ON CONFLICT (template_id, score_key) DO UPDATE SET
        interpretation_bands = EXCLUDED.interpretation_bands,
        updated_at = NOW();

    RAISE NOTICE 'PHQ-9 template created with ID: %', v_template_id;
END $$;
