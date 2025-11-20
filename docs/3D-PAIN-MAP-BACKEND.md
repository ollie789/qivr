# 3D Pain Map - Backend Integration

**Date:** November 20, 2025
**Status:** ✅ Complete

---

## Database Schema

### Existing Fields (No Migration Needed)

The `pain_maps` table already has all required fields:

```sql
CREATE TABLE qivr.pain_maps (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    evaluation_id UUID NOT NULL,
    body_region TEXT NOT NULL,
    anatomical_code TEXT,              -- SNOMED CT code
    coordinates JSONB,                 -- Legacy x,y,z
    pain_intensity INTEGER,            -- 0-10
    pain_type TEXT,
    pain_quality TEXT[],
    onset_date TIMESTAMP,
    notes TEXT,
    
    -- 3D Pain Map Fields
    avatar_type TEXT,                  -- male, female, child
    body_subdivision TEXT,             -- simple, dermatome, myotome
    view_orientation TEXT,             -- front, back, left, right
    depth_indicator TEXT,              -- superficial, deep
    submission_source TEXT,            -- portal, mobile, clinic
    drawing_data_json TEXT,            -- ✅ Stores 3D regions here
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Changes

### IntakeController.cs

**New DTOs Added:**

```csharp
public class PainMapDataDto
{
    public List<PainRegionDto> Regions { get; set; } = new();
    public string CameraView { get; set; } = "front";
    public string Timestamp { get; set; } = string.Empty;
}

public class PainRegionDto
{
    public string MeshName { get; set; } = string.Empty;
    public string? AnatomicalName { get; set; }
    public string Quality { get; set; } = string.Empty;
    public int Intensity { get; set; }
    public string? SnomedCode { get; set; }
}
```

**Request Format:**

```json
{
  "personalInfo": { ... },
  "contactInfo": { ... },
  "chiefComplaint": "Lower back pain",
  "painMapData": {
    "regions": [
      {
        "meshName": "back_left_lower_back",
        "anatomicalName": "Left Lower Back",
        "quality": "sharp",
        "intensity": 8,
        "snomedCode": "37822005"
      },
      {
        "meshName": "front_left_shoulder",
        "anatomicalName": "Left Shoulder (Front)",
        "quality": "dull",
        "intensity": 5,
        "snomedCode": "16982005"
      }
    ],
    "cameraView": "front",
    "timestamp": "2025-11-20T15:43:00Z"
  }
}
```

**Storage Logic:**

1. Receives `painMapData` with regions array
2. Serializes entire object to `drawing_data_json`
3. Extracts primary region (highest intensity) for `body_region` field
4. Stores SNOMED CT code in `anatomical_code`
5. Stores camera view in `view_orientation`

**Backward Compatibility:**

- Still accepts legacy `painPoints` array
- If `painMapData` exists, uses new format
- If only `painPoints`, uses old format
- Both can coexist during migration

---

## Data Flow

### Patient Submission

```
Patient Portal (IntakeForm)
    ↓
PainMap3D Component
    ↓
Selects regions: [{ meshName, quality, intensity }]
    ↓
POST /api/intake/submit
    ↓
IntakeController.SubmitIntake()
    ↓
Stores in pain_maps.drawing_data_json
```

### Clinician View

```
Clinic Dashboard (EvaluationViewer)
    ↓
GET /api/evaluations/{id}
    ↓
Returns evaluation with painMapData
    ↓
PainMap3DViewer Component
    ↓
Renders 3D model with highlighted regions
```

---

## Database Queries

### Insert 3D Pain Map

```sql
INSERT INTO qivr.pain_maps (
    id, tenant_id, evaluation_id,
    body_region, anatomical_code, pain_intensity,
    drawing_data_json, avatar_type, view_orientation,
    created_at, updated_at
) VALUES (
    @id, @tenantId, @evaluationId,
    'Left Lower Back',  -- Primary region
    '37822005',         -- SNOMED CT
    8,                  -- Max intensity
    '{
        "regions": [
            {
                "meshName": "back_left_lower_back",
                "anatomicalName": "Left Lower Back",
                "quality": "sharp",
                "intensity": 8,
                "snomedCode": "37822005"
            }
        ],
        "cameraView": "back",
        "timestamp": "2025-11-20T15:43:00Z"
    }'::jsonb,
    'male',
    'back',
    NOW(), NOW()
);
```

### Query by Region

```sql
-- Find all patients with lower back pain
SELECT e.id, e.patient_id, pm.pain_intensity
FROM qivr.evaluations e
JOIN qivr.pain_maps pm ON pm.evaluation_id = e.id
WHERE pm.drawing_data_json::jsonb @> 
    '{"regions": [{"meshName": "back_left_lower_back"}]}'::jsonb;
```

### Query by Pain Quality

```sql
-- Find all patients with sharp pain
SELECT e.id, e.patient_id, pm.body_region
FROM qivr.evaluations e
JOIN qivr.pain_maps pm ON pm.evaluation_id = e.id
WHERE pm.drawing_data_json::jsonb @> 
    '{"regions": [{"quality": "sharp"}]}'::jsonb;
```

### Aggregate by Region

```sql
-- Count pain reports by anatomical region
SELECT 
    region->>'anatomicalName' as region_name,
    COUNT(*) as report_count,
    AVG((region->>'intensity')::int) as avg_intensity
FROM qivr.pain_maps,
     jsonb_array_elements(drawing_data_json::jsonb->'regions') as region
WHERE drawing_data_json IS NOT NULL
GROUP BY region->>'anatomicalName'
ORDER BY report_count DESC;
```

---

## Frontend Integration

### Patient Portal (IntakeForm.tsx)

```typescript
const [formData, setFormData] = useState({
  painMapData: {
    regions: [],
    cameraView: 'front',
    timestamp: ''
  }
});

<PainMap3D
  value={formData.painMapData?.regions || []}
  onChange={(regions) =>
    setFormData({ 
      ...formData, 
      painMapData: { 
        regions,
        cameraView: 'front',
        timestamp: new Date().toISOString()
      } 
    })
  }
/>
```

### Clinic Dashboard (EvaluationViewer.tsx)

```typescript
{evaluation.painMapData?.regions ? (
  <PainMap3DViewer 
    regions={evaluation.painMapData.regions}
    cameraView={evaluation.painMapData.cameraView || 'front'}
    width={400}
    height={600}
  />
) : (
  // Legacy pain points display
)}
```

---

## Testing

### Test Submission

```bash
curl -X POST https://api.qivr.pro/api/intake/submit \
  -H "Content-Type: application/json" \
  -H "X-Clinic-Id: YOUR_TENANT_ID" \
  -d '{
    "personalInfo": {
      "firstName": "Test",
      "lastName": "Patient"
    },
    "contactInfo": {
      "email": "test@example.com",
      "phone": "0400000000"
    },
    "chiefComplaint": "Lower back pain",
    "painMapData": {
      "regions": [
        {
          "meshName": "back_left_lower_back",
          "anatomicalName": "Left Lower Back",
          "quality": "sharp",
          "intensity": 8,
          "snomedCode": "37822005"
        }
      ],
      "cameraView": "back",
      "timestamp": "2025-11-20T15:43:00Z"
    }
  }'
```

### Verify Database

```sql
SELECT 
    id,
    body_region,
    anatomical_code,
    pain_intensity,
    drawing_data_json::jsonb->'regions' as regions
FROM qivr.pain_maps
WHERE evaluation_id = 'YOUR_EVALUATION_ID';
```

---

## Migration Strategy

### Phase 1: Dual Support (Current)
- ✅ Accept both `painMapData` (new) and `painPoints` (legacy)
- ✅ Store new format in `drawing_data_json`
- ✅ Frontend uses new 3D component
- ✅ Backward compatible with old data

### Phase 2: Data Migration (Future)
- Convert existing `painPoints` to region format
- Map old body parts to mesh names
- Preserve intensity and quality data

### Phase 3: Deprecation (Future)
- Remove legacy `painPoints` support
- All submissions use 3D regions
- Clean up old coordinate-based data

---

## Benefits

✅ **Structured Data** - Queryable by region, quality, intensity
✅ **SNOMED CT Codes** - EHR interoperability ready
✅ **Backward Compatible** - Supports legacy pain points
✅ **No Migration Required** - Uses existing `drawing_data_json` field
✅ **Analytics Ready** - Easy aggregation by anatomical region
✅ **Clinical Accuracy** - 48 precise anatomical regions

---

## Next Steps

1. ✅ Backend API updated
2. ✅ Frontend integrated
3. ⬜ Test end-to-end submission
4. ⬜ Deploy to production
5. ⬜ Monitor data quality
6. ⬜ Build analytics queries
7. ⬜ Create region-based heat maps
