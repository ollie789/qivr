-- NPRS (Numeric Pain Rating Scale) Template Seed
-- Single-item 0-10 pain intensity scale
-- Simple, quick, universally understood

DO $$
DECLARE
    v_tenant_id UUID;
    v_template_id UUID := 'aaaaaaaa-0001-0001-0001-000000000003';
    v_instrument_id UUID := '11111111-0001-0001-0001-000000000009'; -- NPRS instrument
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
        'nprs',
        1,
        'Numeric Pain Rating Scale (NPRS)',
        'Simple 0-10 pain intensity scale. Quick assessment of current pain level.',
        'Pain',
        'daily',
        'Active',
        v_instrument_id,
        1,
        'daily, pre/post treatment, as needed',
        ARRAY['pain', 'quick', 'validated', 'public-domain'],
        '[
            {"id": "nprs_q1", "code": "NPRS_CURRENT", "section": "pain", "label": "Current Pain Level", "text": "On a scale of 0 to 10, where 0 is no pain and 10 is the worst pain imaginable, how would you rate your pain RIGHT NOW?", "type": "Slider", "required": true, "min": 0, "max": 10, "step": 1, "labels": {"0": "No Pain", "5": "Moderate", "10": "Worst Pain"}}
        ]'::jsonb,
        '{"type": "direct", "maxScore": 10}'::jsonb,
        '{"formula": "value"}'::jsonb,
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
        'bbbbbbbb-0001-0001-0001-000000000003',
        v_tenant_id,
        v_template_id,
        'total',
        'Pain Intensity',
        'Current pain level on 0-10 scale.',
        'Sum',
        0, 10, false,
        2, -- MCID of 2 points
        true,
        0,
        '[
            {"min": 0, "max": 0, "label": "No Pain", "severity": "none", "color": "#4CAF50"},
            {"min": 1, "max": 3, "label": "Mild Pain", "severity": "mild", "color": "#8BC34A"},
            {"min": 4, "max": 6, "label": "Moderate Pain", "severity": "moderate", "color": "#FFC107"},
            {"min": 7, "max": 10, "label": "Severe Pain", "severity": "severe", "color": "#F44336"}
        ]'::jsonb
    )
    ON CONFLICT (template_id, score_key) DO UPDATE SET
        interpretation_bands = EXCLUDED.interpretation_bands,
        updated_at = NOW();

    RAISE NOTICE 'NPRS template created with ID: %', v_template_id;
END $$;
