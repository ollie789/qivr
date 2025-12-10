-- QuickDASH (Disabilities of Arm, Shoulder and Hand) Template Seed
-- 11-item upper extremity function measure
-- Scoring: 0-100, higher = more disability
-- Free for non-commercial use

DO $$
DECLARE
    v_tenant_id UUID;
    v_template_id UUID := 'aaaaaaaa-0001-0001-0001-000000000004';
    v_instrument_id UUID := '11111111-0001-0001-0001-000000000005'; -- QuickDASH instrument
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
        'quickdash',
        1,
        'QuickDASH',
        '11-item questionnaire measuring upper extremity function and symptoms. Covers arm, shoulder, and hand disabilities.',
        'Upper Extremity',
        'monthly',
        'Active',
        v_instrument_id,
        1,
        'baseline, 6w, 3m, 6m',
        ARRAY['upper-limb', 'shoulder', 'arm', 'hand', 'validated'],
        '[
            {"id": "qdash_q1", "code": "QDASH_JAR", "section": "function", "label": "Open a tight jar", "text": "Please rate your ability to do the following activities in the last week: Open a tight or new jar", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "No difficulty"},
                {"value": 2, "label": "Mild difficulty"},
                {"value": 3, "label": "Moderate difficulty"},
                {"value": 4, "label": "Severe difficulty"},
                {"value": 5, "label": "Unable"}
            ]},
            {"id": "qdash_q2", "code": "QDASH_HEAVY_CHORES", "section": "function", "label": "Heavy household chores", "text": "Do heavy household chores (e.g., wash walls, floors)", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "No difficulty"},
                {"value": 2, "label": "Mild difficulty"},
                {"value": 3, "label": "Moderate difficulty"},
                {"value": 4, "label": "Severe difficulty"},
                {"value": 5, "label": "Unable"}
            ]},
            {"id": "qdash_q3", "code": "QDASH_CARRY_BAG", "section": "function", "label": "Carry a shopping bag", "text": "Carry a shopping bag or briefcase", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "No difficulty"},
                {"value": 2, "label": "Mild difficulty"},
                {"value": 3, "label": "Moderate difficulty"},
                {"value": 4, "label": "Severe difficulty"},
                {"value": 5, "label": "Unable"}
            ]},
            {"id": "qdash_q4", "code": "QDASH_WASH_BACK", "section": "function", "label": "Wash your back", "text": "Wash your back", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "No difficulty"},
                {"value": 2, "label": "Mild difficulty"},
                {"value": 3, "label": "Moderate difficulty"},
                {"value": 4, "label": "Severe difficulty"},
                {"value": 5, "label": "Unable"}
            ]},
            {"id": "qdash_q5", "code": "QDASH_KNIFE", "section": "function", "label": "Use a knife to cut food", "text": "Use a knife to cut food", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "No difficulty"},
                {"value": 2, "label": "Mild difficulty"},
                {"value": 3, "label": "Moderate difficulty"},
                {"value": 4, "label": "Severe difficulty"},
                {"value": 5, "label": "Unable"}
            ]},
            {"id": "qdash_q6", "code": "QDASH_RECREATIONAL", "section": "function", "label": "Recreational activities with arm force", "text": "Recreational activities which require some force or impact through your arm, shoulder or hand (e.g., golf, hammering, tennis)", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "No difficulty"},
                {"value": 2, "label": "Mild difficulty"},
                {"value": 3, "label": "Moderate difficulty"},
                {"value": 4, "label": "Severe difficulty"},
                {"value": 5, "label": "Unable"}
            ]},
            {"id": "qdash_q7", "code": "QDASH_SOCIAL_INTERFERENCE", "section": "symptoms", "label": "Social activities interference", "text": "During the past week, to what extent has your arm, shoulder or hand problem interfered with your normal social activities with family, friends, neighbours or groups?", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "Not at all"},
                {"value": 2, "label": "Slightly"},
                {"value": 3, "label": "Moderately"},
                {"value": 4, "label": "Quite a bit"},
                {"value": 5, "label": "Extremely"}
            ]},
            {"id": "qdash_q8", "code": "QDASH_WORK_LIMITATION", "section": "symptoms", "label": "Work or daily activities limitation", "text": "During the past week, were you limited in your work or other regular daily activities as a result of your arm, shoulder or hand problem?", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "Not limited at all"},
                {"value": 2, "label": "Slightly limited"},
                {"value": 3, "label": "Moderately limited"},
                {"value": 4, "label": "Very limited"},
                {"value": 5, "label": "Unable"}
            ]},
            {"id": "qdash_q9", "code": "QDASH_PAIN", "section": "symptoms", "label": "Arm/shoulder/hand pain", "text": "Rate the severity of your arm, shoulder or hand pain in the past week", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "None"},
                {"value": 2, "label": "Mild"},
                {"value": 3, "label": "Moderate"},
                {"value": 4, "label": "Severe"},
                {"value": 5, "label": "Extreme"}
            ]},
            {"id": "qdash_q10", "code": "QDASH_TINGLING", "section": "symptoms", "label": "Tingling (pins and needles)", "text": "Rate the severity of tingling (pins and needles) in your arm, shoulder or hand in the past week", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "None"},
                {"value": 2, "label": "Mild"},
                {"value": 3, "label": "Moderate"},
                {"value": 4, "label": "Severe"},
                {"value": 5, "label": "Extreme"}
            ]},
            {"id": "qdash_q11", "code": "QDASH_SLEEP", "section": "symptoms", "label": "Sleep difficulty due to pain", "text": "During the past week, how much difficulty have you had sleeping because of the pain in your arm, shoulder or hand?", "type": "SingleSelect", "required": true, "options": [
                {"value": 1, "label": "No difficulty"},
                {"value": 2, "label": "Mild difficulty"},
                {"value": 3, "label": "Moderate difficulty"},
                {"value": 4, "label": "Severe difficulty"},
                {"value": 5, "label": "So much difficulty I cannot sleep"}
            ]}
        ]'::jsonb,
        '{"type": "quickdash", "formula": "((sum/n) - 1) * 25"}'::jsonb,
        '{"minItems": 10}'::jsonb,
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
        'bbbbbbbb-0001-0001-0001-000000000004',
        v_tenant_id,
        v_template_id,
        'total',
        'QuickDASH Score',
        'Upper extremity disability score. Formula: ((sum/n) - 1) * 25. Higher = more disability.',
        'Custom',
        0, 100, false,
        11, -- MCID of ~11 points
        true,
        0,
        '[
            {"min": 0, "max": 25, "label": "Minimal Disability", "severity": "minimal", "color": "#4CAF50"},
            {"min": 26, "max": 50, "label": "Mild Disability", "severity": "mild", "color": "#8BC34A"},
            {"min": 51, "max": 75, "label": "Moderate Disability", "severity": "moderate", "color": "#FFC107"},
            {"min": 76, "max": 100, "label": "Severe Disability", "severity": "severe", "color": "#F44336"}
        ]'::jsonb
    )
    ON CONFLICT (template_id, score_key) DO UPDATE SET
        interpretation_bands = EXCLUDED.interpretation_bands,
        updated_at = NOW();

    RAISE NOTICE 'QuickDASH template created with ID: %', v_template_id;
END $$;
