# Comprehensive Intake Questionnaire Structure

## Overview
The intake questionnaire collects comprehensive pain assessment data aligned with clinical best practices. All data is stored in the `evaluations` table with detailed responses in the `questionnaire_responses` JSONB column.

## Database Schema

### Evaluations Table
- `chief_complaint` (string): Main concern/complaint
- `symptoms` (string[]): Array of pain qualities
- `questionnaire_responses` (jsonb): Comprehensive questionnaire data
- `medical_history` (jsonb): Legacy field, data now in questionnaire_responses
- `ai_summary` (text): AI-generated triage summary
- `ai_risk_flags` (string[]): AI-identified risk factors
- `clinician_notes` (text): Staff notes added in intake queue

### QuestionnaireResponses Structure (JSONB)

```json
{
  // Pain Location & Characteristics
  "description": "Chief complaint text",
  "details": "Additional notes",
  "painIntensity": 7,
  "painQualities": ["Sharp", "Shooting", "Tingling"],
  "painStart": "After lifting heavy box at work",
  
  // Pain Timing & Pattern
  "onset": "sudden|gradual|after_injury|after_activity|unknown",
  "duration": "3 weeks",
  "pattern": "constant|intermittent|baseline_with_flares",
  "frequency": "always|daily|several_times_week|weekly|occasionally",
  "timeOfDay": ["Morning", "Evening"],
  
  // Aggravating & Relieving Factors
  "aggravatingFactors": ["Sitting", "Bending", "Lifting"],
  "relievingFactors": ["Rest", "Ice", "Medication"],
  
  // Medical History
  "previousTreatments": "Physical therapy, chiropractic",
  "currentMedications": "Ibuprofen 400mg as needed",
  "allergies": "Penicillin",
  "medicalConditions": "Hypertension, Type 2 Diabetes",
  "surgeries": "Appendectomy 2015",
  "treatmentGoals": "Return to work without pain, improve sleep",
  "notes": "Additional patient notes"
}
```

## Pain Map Data
Stored in `pain_maps` table with 3D body model data:
- `body_region`: Anatomical region name
- `pain_intensity`: 0-10 scale
- `pain_quality`: Array of qualities
- `drawing_data_json`: Full 3D pain map data including regions, intensities, qualities

## AI Integration
- AI triage analyzes all questionnaire data
- De-identification applied before sending to AI
- Results stored in `ai_summary` and `ai_risk_flags`
- Processed timestamp in `ai_processed_at`

## Analytics Aggregation
Analytics queries use:
- `chief_complaint` for condition grouping
- `questionnaire_responses.painIntensity` for pain trends
- `questionnaire_responses.painQualities` for symptom analysis
- `questionnaire_responses.duration` for chronicity analysis
- `pain_maps` for body region distribution

## Intake Queue Display
Cards show:
- Patient name
- Chief complaint (from `chief_complaint`)
- Pain qualities (from `symptoms` array)
- AI summary preview (first 80 chars)
- Risk flags (from `ai_risk_flags`)
- Severity/urgency indicator

## Notes
- All JSONB fields are flexible and can accommodate additional data
- No schema migration needed for new questionnaire fields
- Backward compatible with existing evaluations
- Clinician notes added via intake queue are stored in `clinician_notes`
