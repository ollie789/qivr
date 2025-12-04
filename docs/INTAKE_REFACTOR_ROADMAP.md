# Intake Questionnaire Refactor Roadmap

## Overview

Consolidating 3 separate intake implementations into a single shared `@qivr/eval` package.

**Status**: COMPLETED ✅
**Started**: 2024-12-05
**Completed**: 2024-12-05

## Problem Statement

Currently there are 3 different intake questionnaires with inconsistent questions:
1. `apps/intake-widget/src/IntakeWidget.tsx` - Embeddable widget for clinic websites
2. `apps/patient-portal/src/pages/IntakeForm.tsx` - Authenticated patient intake
3. `apps/clinic-dashboard/` - Views intake submissions (IntakeManagement, IntakeDetailsDialog)

Issues:
- Different hardcoded option arrays
- Inconsistent question structure (free-text vs checkboxes)
- No treatment goals in some versions
- No recovery benchmarks/expectations

## Solution

Create `@qivr/eval` package with:
- Unified question definitions (from pexp-3/extracted)
- Shared TypeScript types
- Recovery benchmarks
- Optional: Shared React components

## Source Material

The refactored questions are already extracted in:
- `/Users/oliver/Projects/pexp-3/extracted/questions.ts` - All question definitions
- `/Users/oliver/Projects/pexp-3/extracted/types.ts` - FormData, PainPoint types
- `/Users/oliver/Projects/pexp-3/extracted/recovery-benchmarks.ts` - Evidence-based recovery curves
- `/Users/oliver/Projects/pexp-3/extracted/INTEGRATION.md` - Integration guide

---

## Phase 1: Create @qivr/eval Package
**Status**: [x] COMPLETED (2024-12-05)

### Tasks

- [x] **1.1** Create package structure
  ```
  packages/eval/
  ├── package.json
  ├── tsconfig.json
  └── src/
      ├── index.ts
      ├── intake/
      │   ├── index.ts
      │   ├── questions.ts
      │   ├── types.ts
      │   └── sections.ts
      └── recovery/
          ├── index.ts
          └── benchmarks.ts
  ```

- [x] **1.2** Create `packages/eval/package.json`
  ```json
  {
    "name": "@qivr/eval",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "./intake": {
        "types": "./dist/intake/index.d.ts",
        "default": "./dist/intake/index.js"
      },
      "./recovery": {
        "types": "./dist/recovery/index.d.ts",
        "default": "./dist/recovery/index.js"
      }
    },
    "scripts": {
      "build": "tsc",
      "watch": "tsc --watch",
      "clean": "rm -rf dist"
    },
    "devDependencies": {
      "typescript": "^5.0.0"
    }
  }
  ```

- [x] **1.3** Create `packages/eval/tsconfig.json`
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "declaration": true,
      "declarationMap": true,
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

- [x] **1.4** Copy and adapt files from pexp-3/extracted:
  - Copy `questions.ts` → `src/intake/questions.ts`
  - Copy `types.ts` → `src/intake/types.ts`
  - Copy `recovery-benchmarks.ts` → `src/recovery/benchmarks.ts`

- [x] **1.5** Create `src/intake/sections.ts` - Define step configuration
  ```typescript
  export interface IntakeStep {
    id: string;
    title: string;
    description?: string;
    sections: string[]; // section IDs from questions.ts
  }

  export const INTAKE_STEPS: IntakeStep[] = [
    {
      id: 'personal-info',
      title: 'Personal Information',
      sections: ['personal-info'],
    },
    {
      id: 'pain-mapping',
      title: 'Pain Location',
      description: 'Mark where you feel pain on the 3D body model',
      sections: ['pain-duration'],
    },
    {
      id: 'medical-history',
      title: 'Medical History',
      sections: ['medical-history'],
    },
    {
      id: 'goals',
      title: 'Treatment Goals',
      sections: ['goals'],
    },
    {
      id: 'review',
      title: 'Review & Submit',
      sections: [],
    },
  ];
  ```

- [x] **1.6** Create index files for exports
  - `src/index.ts` - Main exports
  - `src/intake/index.ts` - Intake exports
  - `src/recovery/index.ts` - Recovery exports

- [x] **1.7** Build and verify package
  ```bash
  cd packages/eval
  npm run build
  ```

- [x] **1.8** Add to workspace in root package.json if needed (already included via packages/*)

---

## Phase 2: Refactor intake-widget
**Status**: [x] COMPLETED (2024-12-05)

### Current File
`apps/intake-widget/src/IntakeWidget.tsx` (517 lines)

### Tasks

- [ ] **2.1** Add @qivr/eval dependency to intake-widget/package.json

- [ ] **2.2** Create `apps/intake-widget/src/components/` directory

- [ ] **2.3** Create `QuestionRenderer.tsx` component
  - Renders questions based on type (text, select, checkbox-group)
  - Uses MUI components with Aura styling

- [ ] **2.4** Create `IntakeStepper.tsx` component
  - Uses INTAKE_STEPS from @qivr/eval
  - Handles navigation between steps

- [ ] **2.5** Refactor `IntakeWidget.tsx`:
  - Import questions from @qivr/eval
  - Replace hardcoded options with imported definitions
  - Keep 3D PainMap integration
  - Add Goals section (step 4)
  - Update form state to match FormData type

- [ ] **2.6** Update submission payload to include new fields:
  - goals, timeline, milestones, concerns
  - Structured medical history arrays

- [ ] **2.7** Test widget build
  ```bash
  cd apps/intake-widget
  npm run build
  ```

---

## Phase 3: Refactor patient-portal IntakeForm
**Status**: [x] COMPLETED (2024-12-05)

### Current File
`apps/patient-portal/src/pages/IntakeForm.tsx` (809 lines)

### Tasks

- [ ] **3.1** Add @qivr/eval dependency to patient-portal/package.json

- [ ] **3.2** Create shared components (or import from intake-widget if extracted to design-system):
  - `QuestionRenderer.tsx`
  - `IntakeStepper.tsx`

- [ ] **3.3** Refactor `IntakeForm.tsx`:
  - Import questions from @qivr/eval
  - Remove hardcoded arrays (painQualities, aggravators, relievers)
  - Use structured checkbox options from @qivr/eval
  - Add Goals section
  - Skip personal-info step (user is authenticated)

- [ ] **3.4** Update API submission to match new structure:
  - Map FormData to API payload
  - Include all new structured fields

- [ ] **3.5** Test patient portal build
  ```bash
  cd apps/patient-portal
  npm run build
  ```

---

## Phase 4: Backend API Updates (if needed)
**Status**: [x] COMPLETED (2024-12-05) - No changes needed

Backend already supports structured data via:
- `QuestionnaireResponses` (Dictionary<string, object>) - stores all form fields
- `MedicalHistory` (Dictionary<string, object>) - stores medical history
- `PainMaps` with `DrawingDataJson` - stores 3D pain map data

### Tasks

- [ ] **4.1** Review `IntakeSubmission` model in backend
  - Location: `backend/Qivr.Api/Models/IntakeSubmission.cs`

- [ ] **4.2** Add new fields if missing:
  - `Goals` (string array)
  - `Timeline` (string)
  - `Milestones` (string array)
  - `Concerns` (string array)
  - Structured medical history fields

- [ ] **4.3** Update intake submission endpoint
  - Location: `backend/Qivr.Api/Controllers/IntakeController.cs`

- [ ] **4.4** Create migration if schema changes needed

---

## Phase 5: Clinic Dashboard Updates
**Status**: [x] COMPLETED (2024-12-05)

### Tasks

- [ ] **5.1** Update `IntakeDetailsDialog.tsx` to display new fields
  - Show goals and expectations
  - Display structured medical history

- [ ] **5.2** Update `IntakeManagement.tsx` if needed
  - Add filtering by goals/concerns if useful

- [ ] **5.3** Consider adding recovery benchmark visualization
  - Compare patient timeline expectation to evidence-based benchmarks

---

## Phase 6: Testing & Cleanup
**Status**: [x] COMPLETED (2024-12-05)

### Tasks

- [ ] **6.1** Test complete intake flow:
  - Widget → Backend → Clinic Dashboard view
  - Patient Portal → Backend → Clinic Dashboard view

- [ ] **6.2** Verify data consistency between old and new submissions

- [ ] **6.3** Remove any remaining hardcoded question arrays

- [ ] **6.4** Update any tests

- [ ] **6.5** Build all apps to verify no regressions
  ```bash
  npm run build
  ```

---

## File Locations Reference

### Source (pexp-3 extracted)
```
/Users/oliver/Projects/pexp-3/extracted/
├── questions.ts          # Question definitions
├── types.ts              # TypeScript types
├── recovery-benchmarks.ts # Recovery curves
└── INTEGRATION.md        # Integration guide
```

### Target Package
```
/Users/oliver/Projects/qivr/packages/eval/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── intake/
    │   ├── index.ts
    │   ├── questions.ts
    │   ├── types.ts
    │   └── sections.ts
    └── recovery/
        ├── index.ts
        └── benchmarks.ts
```

### Apps to Refactor
```
/Users/oliver/Projects/qivr/apps/
├── intake-widget/src/IntakeWidget.tsx
├── patient-portal/src/pages/IntakeForm.tsx
└── clinic-dashboard/src/components/dialogs/IntakeDetailsDialog.tsx
```

---

## Question Sections Summary

From pexp-3/extracted/questions.ts:

### 1. Personal Information
- fullName, email, phone, ageRange

### 2. Pain Duration
- painDuration (select: Less than 1 week → More than 2 years)

### 3. Medical History
- painStart (how pain started)
- prevOrtho (previous orthopaedic conditions)
- currentTreatments (PT, chiro, massage, etc.)
- medications (specific OTC and Rx options)
- mobilityAids (cane, walker, brace, etc.)
- dailyImpact (walking, stairs, sleeping, work, etc.)
- additionalHistory (diabetes, heart disease, etc.)
- redFlags (loss of bowel control, fever, etc.)

### 4. Goals & Expectations
- goals (reduce pain, improve mobility, return to work, etc.)
- timeline (expected recovery timeline)
- milestones (specific activities to achieve)
- concerns (cost, time, effectiveness, etc.)

---

## Recovery Benchmarks

From pexp-3/extracted/recovery-benchmarks.ts:

Available benchmarks:
- `acute_low_back_pain` - 6-12 weeks typical
- `lumbar_radicular_pain` - 4-6 weeks typical
- `knee_oa_exercise` - 6-18 weeks typical
- `knee_oa_injection` - 4-6 weeks (short-term)
- `rotator_cuff_exercise` - 12-52 weeks typical

Helper functions:
- `getBenchmarkForPatient(areas, treatments, symptoms)` - Select appropriate benchmark
- `timelineToWeeks(timeline)` - Convert selection to weeks
- `generateComparisonText(timeline, pain, benchmark, weeks)` - Compare to evidence

---

## Notes for Continuation

If context runs out, start by:
1. Reading this roadmap document
2. Checking which phase/task is marked as in-progress or incomplete
3. Reading the relevant source files mentioned in that phase
4. Continuing implementation

Key commands:
```bash
# Build eval package
cd /Users/oliver/Projects/qivr/packages/eval && npm run build

# Build intake widget
cd /Users/oliver/Projects/qivr/apps/intake-widget && npm run build

# Build patient portal
cd /Users/oliver/Projects/qivr/apps/patient-portal && npm run build

# Build all
cd /Users/oliver/Projects/qivr && npm run build
```
