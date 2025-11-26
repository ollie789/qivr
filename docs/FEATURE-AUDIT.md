# Feature Audit - Existing vs Roadmap

## Summary
Audit of existing features against the new unified patient flow roadmap. Many features exist but need to be connected in the correct flow.

---

## ✅ FULLY IMPLEMENTED

### 1. Intake Queue (Phase 1.2)
**Status:** ✅ Complete
**Location:** `apps/clinic-dashboard/src/pages/IntakeManagement.tsx`
**Features:**
- Kanban board with drag-and-drop
- Beautiful Aura-styled cards
- Status columns (New, Triaged, Scheduling, Scheduled, Archived)
- View details dialog
- AI triage integration
- Delete functionality

**What Works:**
- Patient submits intake with 3D pain map
- Appears in clinic intake queue
- Staff can review and triage
- Can update status

**Missing for Flow:**
- ❌ Direct "Create Medical Record" action
- ❌ Link to medical record after creation
- ❌ Auto-archive after record creation

---

### 2. Appointments (Phase 3.1)
**Status:** ✅ Complete
**Location:** `apps/clinic-dashboard/src/pages/Appointments.tsx`
**Features:**
- Calendar view with month navigation
- Appointment list for selected date
- Session notes dialog
- Complete appointment
- Cancel appointment
- Delete appointment
- Status badges

**What Works:**
- Full appointment CRUD
- Session notes documentation
- Status management

**Missing for Flow:**
- ❌ Link to treatment plan
- ❌ Link to patient medical record
- ❌ Auto-suggest PROM after appointment
- ❌ Treatment modality checkboxes in notes
- ❌ Progress tracking in session notes

---

### 3. Medical Records (Phase 5.1)
**Status:** 🟡 Exists but needs enhancement
**Location:** `apps/clinic-dashboard/src/pages/MedicalRecords.tsx`
**Features:**
- Patient list
- Patient details view
- Medical history
- Timeline view (basic)

**What Works:**
- View patient information
- Basic timeline

**Missing for Flow:**
- ❌ Create from intake data (auto-populate)
- ❌ Handle `?intakeId=` parameter
- ❌ Link to treatment plan
- ❌ Enhanced timeline with all events
- ❌ Pain progression visualization
- ❌ Quick actions (assign PROM, schedule appointment)
- ❌ Baseline pain map storage

---

### 4. Treatment Plans (Phase 1.4)
**Status:** 🟡 Backend exists, frontend needs work
**Backend:** `backend/Qivr.Api/Controllers/TreatmentPlansController.cs`
**Frontend:** `apps/clinic-dashboard/src/pages/TreatmentPlans.tsx`

**What Exists:**
- Backend API endpoints
- Database schema
- Basic frontend page

**Missing for Flow:**
- ❌ Create treatment plan dialog
- ❌ Link to medical record creation
- ❌ Pre-fill from intake goals
- ❌ Treatment modalities selection
- ❌ PROM schedule configuration
- ❌ Home exercise program
- ❌ Progress tracking
- ❌ Patient portal view

---

### 5. PROMs (Phase 4)
**Status:** 🟡 Exists but needs major enhancement
**Location:** `apps/clinic-dashboard/src/pages/PROM.tsx`
**Patient:** `apps/patient-portal/src/pages/PROM.tsx`

**What Exists:**
- PROM questionnaires
- Basic assignment
- Completion tracking
- PROMSender component

**Missing for Flow:**
- ❌ 3D pain map integration
- ❌ Baseline comparison
- ❌ Assign from appointment
- ❌ Assign from medical record
- ❌ Smart rebooking after completion
- ❌ Progress analysis
- ❌ Link to treatment plan

---

## 🔴 NOT IMPLEMENTED

### 6. Create Medical Record from Intake (Phase 1.3)
**Status:** ❌ Not implemented
**Priority:** HIGH - Critical for flow

**Needed:**
- Handle `?intakeId=` parameter in MedicalRecords page
- Fetch intake data via API
- Pre-fill patient form:
  - Name, email, phone, DOB
  - Chief complaint
  - Medical history
  - Medications, allergies
  - Baseline 3D pain map
- Create patient record
- Link intake to medical record
- Archive intake
- Proceed to treatment plan creation

**Implementation:**
```typescript
// MedicalRecords.tsx
const searchParams = useSearchParams();
const intakeId = searchParams.get('intakeId');

useEffect(() => {
  if (intakeId) {
    loadIntakeData(intakeId);
  }
}, [intakeId]);

const loadIntakeData = async (id: string) => {
  const intake = await intakeApi.getIntakeDetails(id);
  setFormData({
    firstName: intake.patient.name.split(' ')[0],
    lastName: intake.patient.name.split(' ')[1],
    email: intake.patient.email,
    phone: intake.patient.phone,
    dateOfBirth: intake.patient.dateOfBirth,
    chiefComplaint: intake.evaluation.chiefComplaint,
    baselinePainMap: intake.painMap,
    medicalHistory: intake.medicalHistory,
    // ...
  });
  setShowCreateForm(true);
};
```

---

### 7. Treatment Plan Creation Dialog (Phase 1.4)
**Status:** ❌ Not implemented
**Priority:** HIGH - Critical for flow

**Needed:**
- New component: `TreatmentPlanDialog.tsx`
- Form fields:
  - Goals (pre-filled from intake)
  - Frequency (e.g., "2x per week")
  - Duration (e.g., "6 weeks")
  - Session length
  - Treatment modalities (checkboxes)
  - Home exercises
  - Expected outcomes
  - PROM schedule
  - Review milestones
- Save to database
- Link to patient
- Proceed to appointment scheduling

---

### 8. 3D Pain Map in PROMs (Phase 4.2)
**Status:** ❌ Not implemented
**Priority:** HIGH - Core feature

**Needed:**
- Import PainMap3D component into PROM
- Show baseline pain map (read-only)
- Show current pain map (editable)
- Side-by-side comparison
- Calculate pain reduction %
- Store pain map with PROM response

**Implementation:**
```typescript
// PROM.tsx (Patient Portal)
<Box sx={{ display: 'flex', gap: 3 }}>
  <Box>
    <Typography variant="h6">Your Initial Pain</Typography>
    <PainMap3D 
      data={baselinePainMap}
      readOnly
    />
  </Box>
  <Box>
    <Typography variant="h6">Your Current Pain</Typography>
    <PainMap3D 
      data={currentPainMap}
      onChange={setCurrentPainMap}
    />
  </Box>
</Box>
```

---

### 9. Smart Rebooking After PROM (Phase 4.3)
**Status:** ❌ Not implemented
**Priority:** MEDIUM

**Needed:**
- Analyze PROM response
- Compare baseline vs current pain
- Calculate improvement %
- Generate recommendation
- Show available appointment slots
- One-click booking

---

### 10. Medical Record Timeline Enhancement (Phase 5.1)
**Status:** ❌ Not implemented
**Priority:** MEDIUM

**Needed:**
- Unified timeline component
- Show all events chronologically:
  - Initial evaluation
  - Treatment plan created
  - Appointments
  - PROMs
  - Status changes
- Visual indicators
- Quick actions on each event

---

### 11. Pain Progression Visualization (Phase 5.2)
**Status:** ❌ Not implemented
**Priority:** MEDIUM

**Needed:**
- Side-by-side 3D pain maps
- Heat map overlay
- Pain intensity trend graph
- Functional score trends
- Export report

---

### 12. Automated PROM Scheduling (Phase 6.1)
**Status:** ❌ Not implemented
**Priority:** LOW

**Needed:**
- Background job to create PROM assignments
- Based on treatment plan schedule
- Send notifications
- Track completion

---

### 13. Patient Portal Treatment Plan View (Phase 2.1)
**Status:** ❌ Not implemented
**Priority:** HIGH

**Needed:**
- Treatment plan card in patient dashboard
- Show goals with progress
- Appointment schedule
- Home exercises
- Next appointment
- Progress metrics

---

## 📊 IMPLEMENTATION PRIORITY

### Sprint 1 (Current) - Core Flow
**Priority: CRITICAL**

1. ✅ Intake queue enhancement (DONE)
2. 🔴 Medical record creation from intake
   - Handle `?intakeId=` parameter
   - Auto-populate form
   - Create patient record
   - Link intake
3. 🔴 Treatment plan creation dialog
   - New component
   - Form with all fields
   - Save and link to patient
4. 🟡 Link appointment scheduling
   - Auto-open after treatment plan
   - Pre-fill appointment type

**Estimated Time:** 2-3 days

---

### Sprint 2 - Patient Portal Integration
**Priority: HIGH**

5. 🔴 Patient portal treatment plan view
   - Display active plan
   - Show progress
   - Home exercises
6. 🔴 3D pain map in PROMs
   - Baseline comparison
   - Side-by-side view
   - Pain reduction calculation
7. 🔴 PROM completion flow
   - Enhanced questionnaire
   - Submit with pain map
8. 🔴 Smart rebooking
   - Analysis logic
   - Recommendation dialog
   - Available slots

**Estimated Time:** 3-4 days

---

### Sprint 3 - Progress Tracking
**Priority: MEDIUM**

9. 🔴 Medical record timeline
   - Unified view
   - All events
   - Quick actions
10. 🔴 Pain progression visualization
    - 3D map comparison
    - Trend graphs
11. 🟡 Session notes enhancement
    - Treatment modalities
    - Progress tracking
    - PROM triggers
12. 🟡 Treatment plan progress
    - Automatic calculations
    - Display in both portals

**Estimated Time:** 3-4 days

---

### Sprint 4 - Automation & Polish
**Priority: LOW**

13. 🔴 Automated PROM scheduling
14. 🔴 Smart notifications
15. 🔴 Progress reports (PDF)
16. 🔴 Analytics dashboard

**Estimated Time:** 4-5 days

---

## 🔧 MODIFICATION PLAN

### Existing Features to Modify

#### 1. IntakeDetailsDialog.tsx
**Current:** View details, delete
**Add:**
- ✅ "Create Record & Plan" button (DONE)
- Link to medical records with intakeId

#### 2. MedicalRecords.tsx
**Current:** List and view patients
**Add:**
- Handle `?intakeId=` parameter
- Auto-populate form from intake
- Create patient record
- Store baseline pain map
- Link to treatment plan creation

#### 3. Appointments.tsx
**Current:** Calendar, notes, complete, cancel
**Add:**
- Link to patient medical record
- Link to treatment plan
- Treatment modality checkboxes in notes
- "Assign PROM" button after completion

#### 4. PROM.tsx (Both portals)
**Current:** Basic questionnaires
**Add:**
- 3D pain map component
- Baseline comparison
- Pain reduction calculation
- Link to treatment plan

#### 5. TreatmentPlans.tsx
**Current:** Basic page
**Add:**
- Creation dialog
- Link to medical record
- Progress tracking
- Patient portal view

---

## 🗄️ DATABASE CHANGES NEEDED

### New Tables
```sql
-- Already exists, verify schema
treatment_plans (
  id, patient_id, goals, frequency, duration,
  modalities, home_exercises, prom_schedule, ...
)

-- Need to create
prom_assignments (
  id, patient_id, treatment_plan_id, prom_type,
  due_date, includes_pain_map, status, ...
)

prom_responses (
  id, assignment_id, patient_id, pain_map_data,
  pain_level, functional_scores, responses, ...
)
```

### Schema Modifications
```sql
-- Link intake to medical record
ALTER TABLE evaluations 
ADD COLUMN medical_record_id UUID REFERENCES users(id);

-- Link appointments to treatment plan
ALTER TABLE appointments 
ADD COLUMN treatment_plan_id UUID REFERENCES treatment_plans(id);

-- Store baseline pain map
ALTER TABLE users 
ADD COLUMN baseline_pain_map_id UUID REFERENCES pain_maps(id);
```

---

## 📝 API ENDPOINTS NEEDED

### Existing (verify)
- ✅ GET /api/evaluations
- ✅ POST /api/evaluations
- ✅ GET /api/treatment-plans/current
- ✅ GET /api/appointments
- ✅ POST /api/appointments

### Need to Create
- ❌ POST /api/medical-records/from-intake
- ❌ POST /api/treatment-plans (full CRUD)
- ❌ POST /api/prom-assignments
- ❌ POST /api/prom-assignments/:id/complete
- ❌ GET /api/patients/:id/timeline
- ❌ GET /api/patients/:id/pain-progression
- ❌ POST /api/appointments/suggest-slots

---

## 🎯 NEXT IMMEDIATE STEPS

### Step 1: Medical Record Creation (Today)
1. Modify `MedicalRecords.tsx` to handle `?intakeId=`
2. Fetch intake data
3. Pre-fill form
4. Create patient record
5. Store baseline pain map
6. Link intake to record

### Step 2: Treatment Plan Dialog (Today/Tomorrow)
1. Create `TreatmentPlanDialog.tsx`
2. Add form fields
3. Save to database
4. Link to patient
5. Open after medical record creation

### Step 3: Connect Appointment Scheduling (Tomorrow)
1. Auto-open schedule dialog after treatment plan
2. Pre-fill appointment type
3. Link appointment to treatment plan

---

**Last Updated:** 2025-11-26
**Current Sprint:** Sprint 1 - Core Flow
**Next Task:** Medical Record Creation from Intake
