-- Patient Satisfaction Survey PROM Template
-- 5-point Likert scale, Yes/No, NPS (0-10), and free-text questions

INSERT INTO prom_templates (id, tenant_id, key, version, name, description, category, frequency, questions, scoring_method, scoring_rules, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    id as tenant_id,
    'patient-satisfaction-survey',
    1,
    'Patient Satisfaction Survey',
    'Comprehensive patient experience survey covering visit logistics, communication, care quality, and NPS',
    'Patient Experience',
    'Per Visit',
    '[
        {"id": "section1_header", "text": "Section 1 – About your visit", "type": "header"},
        {"id": "booking_ease", "text": "How easy was it to book or change your appointment?", "type": "scale", "min": 1, "max": 5, "labels": ["Very poor", "Poor", "Fair", "Good", "Excellent"]},
        {"id": "wait_time", "text": "How satisfied were you with the time you waited to be seen?", "type": "scale", "min": 1, "max": 5, "labels": ["Very poor", "Poor", "Fair", "Good", "Excellent"]},
        {"id": "reception_staff", "text": "How would you rate the friendliness and professionalism of the reception/front-desk staff?", "type": "scale", "min": 1, "max": 5, "labels": ["Very poor", "Poor", "Fair", "Good", "Excellent"]},
        {"id": "clinic_environment", "text": "How would you rate the cleanliness and comfort of the clinic?", "type": "scale", "min": 1, "max": 5, "labels": ["Very poor", "Poor", "Fair", "Good", "Excellent"]},
        
        {"id": "section2_header", "text": "Section 2 – Communication and care", "type": "header"},
        {"id": "explanation_quality", "text": "How well did your clinician explain your condition or concern in a way you could understand?", "type": "scale", "min": 1, "max": 5, "labels": ["Very poor", "Poor", "Fair", "Good", "Excellent"]},
        {"id": "listening_involvement", "text": "How well did your clinician listen to you and involve you in decisions about your care?", "type": "scale", "min": 1, "max": 5, "labels": ["Very poor", "Poor", "Fair", "Good", "Excellent"]},
        {"id": "treatment_confidence", "text": "How confident do you feel in the treatment or management plan after this visit?", "type": "scale", "min": 1, "max": 5, "labels": ["Very poor", "Poor", "Fair", "Good", "Excellent"]},
        {"id": "enough_time_questions", "text": "Did you have enough time to ask questions about your condition or treatment?", "type": "yesno"},
        
        {"id": "section3_header", "text": "Section 3 – Overall experience", "type": "header"},
        {"id": "overall_satisfaction", "text": "Overall, how satisfied are you with the care you received at this clinic today?", "type": "scale", "min": 1, "max": 5, "labels": ["Very poor", "Poor", "Fair", "Good", "Excellent"]},
        {"id": "nps", "text": "How likely are you to recommend this clinic to friends or family?", "type": "nps", "min": 0, "max": 10, "labels": ["Not at all likely", "", "", "", "", "", "", "", "", "", "Extremely likely"]},
        
        {"id": "section4_header", "text": "Section 4 – Open comments", "type": "header"},
        {"id": "what_went_well", "text": "What did we do well during your visit?", "type": "text"},
        {"id": "improvement_suggestions", "text": "What could we improve to make your experience better next time?", "type": "text"}
    ]',
    'weighted',
    '{
        "sections": {
            "visit": {"questions": ["booking_ease", "wait_time", "reception_staff", "clinic_environment"], "weight": 0.25},
            "communication": {"questions": ["explanation_quality", "listening_involvement", "treatment_confidence"], "weight": 0.35},
            "overall": {"questions": ["overall_satisfaction"], "weight": 0.40}
        },
        "nps": {"question": "nps", "promoters": [9, 10], "passives": [7, 8], "detractors": [0, 1, 2, 3, 4, 5, 6]},
        "maxScore": 45
    }',
    true,
    NOW(),
    NOW()
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM prom_templates WHERE name = 'Patient Satisfaction Survey' AND tenant_id = tenants.id
);
