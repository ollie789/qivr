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
- `pain_intensity`: 0-10 scale (max intensity from all marked regions)
- `pain_quality`: Array of qualities from marked regions
- `drawing_data_json`: Full 3D pain map data including regions, intensities, qualities
- `avatar_type`: male/female/child
- `view_orientation`: front/back/side + camera state
- `submission_source`: portal/mobile/clinic

### 3D Body Map Analytics Integration

**Data Flow:**
1. Patient marks pain regions on 3D body model in intake form
2. Each region includes: anatomicalName, intensity (0-10), quality (Sharp, Aching, etc.)
3. Data stored in `pain_maps.drawing_data_json` as complete 3D model state
4. Analytics service processes this data for:

**Available Analytics:**

1. **Heat Map Generation** (`/api/pain-map-analytics/heatmap`)
   - Aggregates all pain drawings into 100x100 grid
   - Shows frequency and average intensity per body area
   - Filterable by date range, avatar type, view orientation

2. **Pain Metrics** (`/api/pain-map-analytics/metrics`)
   - Total pain maps submitted
   - Average pain intensity across all submissions
   - Most common body regions affected
   - Pain intensity distribution (0-10 scale)
   - Pain quality distribution (Sharp, Aching, Burning, etc.)

3. **Patient Progression** (`/api/pain-map-analytics/progression/{patientId}`)
   - Tracks individual patient's pain over time
   - Shows changes in location, intensity, and quality
   - Useful for treatment effectiveness monitoring

4. **Bilateral Symmetry Analysis** (`/api/pain-map-analytics/symmetry`)
   - Compares left vs right side pain patterns
   - Identifies asymmetric pain distributions
   - Useful for detecting compensation patterns

**Integration with Comprehensive Questionnaire:**
- Pain map data is linked to evaluation via `evaluation_id`
- All questionnaire responses (timing, aggravators, relievers) are accessible alongside pain map data
- Analytics can correlate pain locations with:
  - Pain qualities from questionnaire
  - Aggravating factors (sitting, standing, etc.)
  - Duration and onset patterns
  - Treatment goals and outcomes

**Example Query:**
```sql
SELECT 
  pm.body_region,
  pm.pain_intensity,
  pm.pain_quality,
  e.questionnaire_responses->>'painQualities' as reported_qualities,
  e.questionnaire_responses->>'aggravatingFactors' as aggravators,
  e.questionnaire_responses->>'duration' as duration
FROM pain_maps pm
JOIN evaluations e ON pm.evaluation_id = e.id
WHERE e.tenant_id = :tenant_id
  AND pm.created_at >= :start_date;
```

This allows comprehensive analysis of:
- Which body regions correlate with specific pain qualities
- How aggravating factors relate to pain locations
- Pain progression patterns over time
- Treatment effectiveness by body region

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
