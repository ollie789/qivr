# 3D Pain Map Implementation

**Date:** November 20, 2025
**Status:** ✅ Integrated - Replacing SVG Drawing System

---

## Overview

Replaced freehand SVG drawing with professional 3D region-based pain mapping using CHOIRZONE.glb anatomical model.

## Key Improvements

### Before (SVG Drawing)
- ❌ Freehand drawing anywhere on 2D diagram
- ❌ Unstructured data (SVG paths)
- ❌ Low-quality stick figures
- ❌ Random marks off body
- ❌ Hard to query/analyze

### After (3D Region Selection)
- ✅ Click only on defined anatomical regions
- ✅ Structured data with mesh names
- ✅ Professional 3D anatomical model
- ✅ Clean, queryable data
- ✅ 48 precise body regions

---

## Technical Implementation

### Components Created

1. **PainMap3D** (`packages/design-system/src/components/pain-map/PainMap3D.tsx`)
   - Interactive 3D body model
   - Region selection by clicking meshes
   - 4 locked camera views (front/back/left/right)
   - Pain quality selector (6 types)
   - Intensity slider (1-10)

2. **PainMap3DViewer** (`packages/design-system/src/components/pain-map/PainMap3DViewer.tsx`)
   - Read-only viewer for clinic dashboard
   - Displays selected regions with colors
   - Shows anatomical names and pain details

3. **Anatomical Regions** (`packages/design-system/src/types/anatomical-regions.ts`)
   - 48 body regions mapped
   - Clinical display names
   - SNOMED CT codes
   - Categorized by body area

### Data Structure

```typescript
{
  regions: [
    {
      meshName: "front_left_shoulder",
      quality: "sharp",
      intensity: 8
    },
    {
      meshName: "back_right_lower_back",
      quality: "dull",
      intensity: 6
    }
  ],
  cameraView: "front",
  timestamp: "2025-11-20T15:43:00Z"
}
```

---

## 48 Anatomical Regions

### Head & Neck (4)
- back_head, front_head
- back_neck, front_neck

### Back - Left (11)
- back_left_buttocks
- back_left_foot
- back_left_knee
- back_left_lower_arm
- back_left_lower_back
- back_left_mid_back
- back_left_shin
- back_left_shoulder
- back_left_thigh
- back_left_upper_arm
- back_left_upper_back

### Back - Right (11)
- back_right_buttocks
- back_right_foot
- back_right_knee
- back_right_lower_arm
- back_right_lower_back
- back_right_mid_back
- back_right_shin
- back_right_shoulder
- back_right_thigh
- back_right_upper_arm
- back_right_upper_back

### Front - Left (11)
- front_left_foot
- front_left_hand
- front_left_knee
- front_left_lower_abdomen
- front_left_lower_arm
- front_left_lower_chest
- front_left_pelvis
- front_left_shoulder
- front_left_shin
- front_left_thigh
- front_left_upper_abdomen
- front_left_upper_arm
- front_left_upper_chest

### Front - Right (11)
- front_right_foot
- front_right_hand
- front_right_knee
- front_right_lower_abdomen
- front_right_lower_arm
- front_right_lower_chest
- front_right_pelvis
- front_right_shoulder
- front_right_shin
- front_right_thigh
- front_right_upper_abdomen
- front_right_upper_arm
- front_right_upper_chest

---

## Integration Points

### Patient Portal
- **IntakeForm.tsx** - Step 3: Pain Map
- Patients click on 3D body regions
- Select pain quality and intensity
- Data saved to evaluation

### Clinic Dashboard
- **EvaluationViewer.tsx** - Pain Map section
- Clinicians see selected regions highlighted
- View anatomical names and pain details
- Read-only visualization

---

## Files Modified

```
packages/design-system/
├── src/
│   ├── components/
│   │   └── pain-map/
│   │       ├── PainMap3D.tsx (NEW)
│   │       └── PainMap3DViewer.tsx (NEW)
│   └── types/
│       ├── anatomical-regions.ts (NEW)
│       └── pain-drawing.ts (UPDATED)

apps/patient-portal/
├── public/assets/body-model.glb (NEW)
└── src/pages/IntakeForm.tsx (UPDATED)

apps/clinic-dashboard/
├── public/assets/body-model.glb (NEW)
└── src/features/intake/components/EvaluationViewer.tsx (UPDATED)
```

---

## Dependencies Added

```json
{
  "three": "^0.160.0",
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x"
}
```

---

## Testing

**Patient Portal:** http://localhost:3005
1. Navigate to Intake Form
2. Go to Step 3: Pain Map
3. Click on body regions to select
4. Choose pain quality and intensity
5. Submit form

**Clinic Dashboard:** https://clinic.qivr.pro
1. View patient evaluation
2. See 3D pain map with highlighted regions
3. Review anatomical names and pain details

---

## Database Schema

Existing `drawing_data_json` field stores:
```json
{
  "regions": [...],
  "cameraView": "front",
  "timestamp": "..."
}
```

No migration needed - backward compatible with existing pain map data.

---

## Next Steps

1. ✅ Test in patient portal
2. ⬜ Deploy to production
3. ⬜ Update analytics to query by region
4. ⬜ Add region-based heat maps
5. ⬜ Bilateral symmetry analysis by region

---

## Benefits

- **Clinical Accuracy:** Precise anatomical regions
- **Data Quality:** Structured, queryable data
- **User Experience:** Professional 3D visualization
- **Analytics:** Easy to aggregate by body region
- **Interoperability:** SNOMED CT codes for EHR integration
