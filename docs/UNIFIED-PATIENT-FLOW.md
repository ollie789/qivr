# Unified Patient Flow - Complete Implementation Guide

> **Combined Roadmap & Feature Audit**
> This document contains the complete patient flow roadmap with feature audit showing what exists, what needs modification, and what's missing.

---

# Part 1: Patient Flow Roadmap - Unified Clinical Journey

## Overview
Complete patient journey from initial intake through ongoing care, integrating evaluations, treatment plans, appointments, PROMs, and 3D pain mapping.

---

## Phase 1: Initial Patient Onboarding

### 1.1 Patient Portal - Initial Intake Submission
**Status:** ✅ Complete
- [x] Comprehensive intake form with 5 steps
- [x] 3D pain map integration (baseline)
- [x] Pain characteristics, timing, aggravators, relievers
- [x] Medical history
- [x] Submit to intake queue

**Data Captured:**
- Patient demographics
- Chief complaint
- 3D pain map (baseline visualization)
- Pain intensity (0-10 scale)
- Pain qualities (sharp, dull, burning, etc.)
- Onset, duration, pattern, frequency
- Aggravating/relieving factors
- Medical history, medications, allergies
- Treatment goals

---

### 1.2 Clinic Dashboard - Intake Queue Review
**Status:** ✅ Complete
- [x] Kanban board with status columns (New, Triaged, Scheduling, Scheduled, Archived)
- [x] Beautiful Aura-styled cards
- [x] AI triage analysis
- [x] View full intake details
- [x] Drag-and-drop status updates

**Current Actions:**
- View details
- Schedule appointment
- Update status
- Delete intake

---

### 1.3 Clinic Dashboard - Create Medical Record from Intake
**Status:** 🚧 In Progress
- [x] "Create Record & Plan" button in intake dialog
- [ ] Medical Records page handles `?intakeId=` parameter
- [ ] Auto-populate patient data from intake:
  - Name, email, phone, DOB
  - Chief complaint
  - Initial 3D pain map (stored as baseline)
  - Medical history
  - Medications, allergies
  - Treatment goals
- [ ] Create patient record in database
- [ ] Link intake to medical record
- [ ] Archive intake after record creation

**Implementation:**
```typescript
// Medical Records page
const searchParams = useSearchParams();
const intakeId = searchParams.get('intakeId');

useEffect(() => {
  if (intakeId) {
    // Fetch intake data
    const intake = await intakeApi.getIntakeDetails(intakeId);
    
    // Pre-fill form
    setPatientData({
      firstName: intake.patient.name.split(' ')[0],
      lastName: intake.patient.name.split(' ')[1],
      email: intake.patient.email,
      phone: intake.patient.phone,
      dateOfBirth: intake.patient.dateOfBirth,
      chiefComplaint: intake.evaluation.chiefComplaint,
      baselinePainMap: intake.painMap, // Store as baseline
      medicalHistory: intake.medicalHistory,
      // ... etc
    });
  }
}, [intakeId]);
```

---

### 1.4 Clinic Dashboard - Create Treatment Plan
**Status:** ⏳ Not Started

**New Component:** `TreatmentPlanDialog.tsx`

**Fields:**
- Treatment goals (from intake)
- Recommended frequency (e.g., "2x per week for 6 weeks")
- Session duration (e.g., "45 minutes")
- Treatment modalities:
  - Manual therapy
  - Exercise therapy
  - Modalities (heat, ice, TENS, etc.)
  - Education
- Home exercise program
- Expected outcomes
- Review milestones (e.g., "Re-assess after 6 sessions")
- PROM schedule (e.g., "Every 2 weeks")

**Implementation:**
```typescript
interface TreatmentPlan {
  patientId: string;
  goals: string[];
  frequency: string; // "2x per week"
  duration: string; // "6 weeks"
  sessionLength: number; // minutes
  modalities: string[];
  homeExercises: string;
  expectedOutcomes: string;
  promSchedule: string; // "Every 2 weeks"
  reviewMilestones: string[];
}
```

**Flow:**
1. After creating medical record, show "Create Treatment Plan" dialog
2. Pre-fill goals from intake
3. Clinician adds treatment details
4. Save treatment plan linked to patient
5. Proceed to schedule first appointment

---

### 1.5 Clinic Dashboard - Schedule First Appointment
**Status:** ✅ Exists, needs integration

**Enhancement:**
- [ ] Auto-open schedule dialog after treatment plan creation
- [ ] Pre-fill appointment type: "Initial Consultation"
- [ ] Suggest time slots based on treatment frequency
- [ ] Link appointment to treatment plan
- [ ] Send confirmation to patient

---

## Phase 2: Patient Portal - View Treatment Plan

### 2.1 Patient Dashboard Enhancement
**Status:** ⏳ Not Started

**New Section:** "My Treatment Plan"

**Display:**
- Treatment goals (visual progress bars)
- Appointment frequency and schedule
- Next appointment date/time
- Home exercises (with videos/images)
- Progress metrics:
  - Sessions completed / total planned
  - Pain reduction (baseline vs current)
  - Functional improvement
- Upcoming PROMs

**Implementation:**
```typescript
// Patient Dashboard
<TreatmentPlanCard>
  <Typography variant="h6">My Treatment Plan</Typography>
  
  {/* Goals with progress */}
  {plan.goals.map(goal => (
    <GoalProgress 
      goal={goal}
      baseline={baselinePainMap}
      current={latestPROM}
    />
  ))}
  
  {/* Schedule */}
  <Typography>
    {plan.frequency} for {plan.duration}
  </Typography>
  
  {/* Next appointment */}
  <NextAppointment date={nextAppt.date} />
  
  {/* Home exercises */}
  <ExerciseList exercises={plan.homeExercises} />
</TreatmentPlanCard>
```

---

## Phase 3: Ongoing Care - Appointments

### 3.1 Clinic Dashboard - Appointment Management
**Status:** ✅ Complete
- [x] Calendar view
- [x] Session notes dialog
- [x] Complete appointment
- [x] Cancel appointment
- [x] Delete appointment

**Enhancement Needed:**
- [ ] Link appointments to treatment plan
- [ ] Show treatment plan goals in appointment view
- [ ] Track sessions completed vs planned
- [ ] Auto-suggest PROM assignment after appointment

---

### 3.2 Clinic Dashboard - Session Notes Enhancement
**Status:** 🚧 Needs Enhancement

**Add to Session Notes:**
- [ ] Treatment provided (checkboxes for modalities)
- [ ] Patient response
- [ ] Pain level during session
- [ ] Functional improvements observed
- [ ] Home exercise compliance
- [ ] Next session plan
- [ ] Flag for PROM assignment

**Template:**
```
Session X of Y

Treatment Provided:
☐ Manual therapy
☐ Exercise therapy
☐ Modalities
☐ Education

Patient Response: [text]
Pain Level: [0-10 slider]
Functional Status: [improved/same/declined]
HEP Compliance: [good/fair/poor]

Next Session: [plan]
☐ Assign PROM for next visit
```

---

## Phase 4: PROMs - Progress Tracking

### 4.1 Clinic Dashboard - PROM Assignment
**Status:** ⏳ Not Started

**New Feature:** Assign PROM from Medical Record or Appointment

**Implementation:**
- [ ] "Assign PROM" button in medical record
- [ ] Select PROM type (pain, function, quality of life)
- [ ] Set due date
- [ ] Include 3D pain map
- [ ] Send notification to patient
- [ ] Track completion status

**PROM Types:**
- Pain Assessment (with 3D pain map)
- Functional Assessment (Oswestry, DASH, etc.)
- Quality of Life (SF-36, EQ-5D)
- Treatment Satisfaction

---

### 4.2 Patient Portal - PROM Completion
**Status:** 🚧 Needs 3D Pain Map Integration

**Current:** Basic PROM questionnaires exist

**Enhancement:**
- [ ] Add 3D pain map to pain PROMs
- [ ] Show baseline pain map for comparison
- [ ] Pain intensity slider
- [ ] Functional questions
- [ ] Treatment satisfaction
- [ ] Submit and trigger rebooking flow

**PROM with 3D Pain Map:**
```typescript
<PROMQuestionnaire>
  {/* Pain Map Comparison */}
  <PainMapComparison>
    <PainMap3D 
      title="Your Initial Pain (Baseline)"
      data={baselinePainMap}
      readOnly
    />
    <PainMap3D 
      title="Your Current Pain"
      data={currentPainMap}
      onChange={setCurrentPainMap}
    />
  </PainMapComparison>
  
  {/* Pain Intensity */}
  <Slider 
    label="Current Pain Level"
    value={painLevel}
    min={0}
    max={10}
  />
  
  {/* Functional Questions */}
  <FunctionalAssessment />
  
  {/* Treatment Satisfaction */}
  <SatisfactionRating />
</PROMQuestionnaire>
```

---

### 4.3 Patient Portal - Smart Rebooking After PROM
**Status:** ⏳ Not Started

**Flow:**
1. Patient completes PROM
2. System analyzes response:
   - Compare pain map (baseline vs current)
   - Calculate pain reduction %
   - Assess functional improvement
   - Check treatment plan progress
3. Generate rebooking recommendation:
   - **Significant improvement:** "Great progress! Schedule follow-up in 4 weeks"
   - **Moderate improvement:** "Continue treatment. Book next session in 1 week"
   - **No change:** "Let's review your plan. Book earlier appointment"
   - **Worsening:** "We noticed increased pain. Please book urgent appointment"
4. Show available appointment slots
5. One-click booking

**Implementation:**
```typescript
// After PROM submission
const analysis = analyzePROMResponse({
  baseline: baselinePainMap,
  current: currentPainMap,
  painLevel: painLevel,
  functional: functionalScores,
  treatmentPlan: activePlan
});

// Show rebooking dialog
<RebookingDialog
  recommendation={analysis.recommendation}
  suggestedTimeframe={analysis.suggestedTimeframe}
  availableSlots={getAvailableSlots(analysis.suggestedTimeframe)}
  onBook={handleBookAppointment}
/>
```

---

## Phase 5: Medical Record - Central Hub

### 5.1 Medical Record Timeline View
**Status:** 🚧 Needs Enhancement

**Current:** Basic patient information

**Enhancement - Unified Timeline:**
```
┌─────────────────────────────────────────┐
│ Patient: John Doe                       │
│ Active Treatment Plan: Lower Back Pain  │
│ Progress: 6/12 sessions completed       │
└─────────────────────────────────────────┘

Timeline:
├─ Initial Evaluation (Jan 1, 2025)
│  └─ 3D Pain Map (baseline)
│  └─ Pain Level: 8/10
│  └─ Chief Complaint: Lower back pain
│
├─ Treatment Plan Created (Jan 1, 2025)
│  └─ Goals: Reduce pain, improve mobility
│  └─ Frequency: 2x/week for 6 weeks
│
├─ Appointment #1 (Jan 3, 2025)
│  └─ Manual therapy, exercises
│  └─ Pain during session: 7/10
│
├─ PROM #1 (Jan 10, 2025)
│  └─ 3D Pain Map (comparison)
│  └─ Pain Level: 6/10 (↓ 25%)
│  └─ Functional: Improved
│
├─ Appointment #2 (Jan 10, 2025)
│  └─ Continued treatment
│
├─ PROM #2 (Jan 24, 2025)
│  └─ 3D Pain Map (comparison)
│  └─ Pain Level: 4/10 (↓ 50%)
│  └─ Functional: Significantly improved
│
└─ Current Status
   └─ Next appointment: Jan 31, 2025
   └─ Next PROM due: Feb 7, 2025
```

**Implementation:**
- [ ] Timeline component showing all events
- [ ] Initial evaluation at top (baseline)
- [ ] Treatment plan milestones
- [ ] Appointments with session notes
- [ ] PROMs with pain map comparisons
- [ ] Visual progress indicators
- [ ] Quick actions (schedule, assign PROM, update plan)

---

### 5.2 Pain Progression Visualization
**Status:** ⏳ Not Started

**New Component:** `PainProgressionChart.tsx`

**Features:**
- [ ] Side-by-side 3D pain maps (baseline vs current)
- [ ] Heat map overlay showing improvement areas
- [ ] Pain intensity trend line graph
- [ ] Functional score trends
- [ ] Treatment satisfaction over time
- [ ] Export report for patient

**Visualization:**
```
┌─────────────────────────────────────────┐
│ Pain Progression                        │
├─────────────────────────────────────────┤
│                                         │
│  Baseline (Jan 1)    Current (Feb 1)   │
│  ┌──────────┐       ┌──────────┐       │
│  │  🔴🔴🔴  │       │  🟡      │       │
│  │  🔴🔴🔴  │  →    │  🟡      │       │
│  │  🔴🔴🔴  │       │          │       │
│  └──────────┘       └──────────┘       │
│                                         │
│  Pain Level: 8/10    Pain Level: 4/10  │
│                      ↓ 50% improvement  │
│                                         │
│  Pain Intensity Trend:                 │
│  10 ┤                                   │
│   8 ┤●                                  │
│   6 ┤  ●                                │
│   4 ┤    ●─●                            │
│   2 ┤                                   │
│   0 └────────────────────────────      │
│     Jan 1  Jan 10  Jan 24  Feb 1       │
└─────────────────────────────────────────┘
```

---

## Phase 6: Integration & Automation

### 6.1 Automated PROM Scheduling
**Status:** ⏳ Not Started

**Feature:** Auto-assign PROMs based on treatment plan

**Logic:**
- Treatment plan specifies PROM frequency (e.g., "Every 2 weeks")
- System automatically creates PROM assignments
- Sends notifications to patient
- Tracks completion
- Flags overdue PROMs

**Implementation:**
```typescript
// When treatment plan is created
if (plan.promSchedule === "Every 2 weeks") {
  scheduleRecurringPROM({
    patientId: patient.id,
    frequency: "2 weeks",
    startDate: plan.startDate,
    endDate: plan.endDate,
    includesPainMap: true
  });
}
```

---

### 6.2 Treatment Plan Progress Tracking
**Status:** ⏳ Not Started

**Feature:** Automatic progress calculation

**Metrics:**
- Sessions completed / total planned
- Pain reduction % (baseline vs latest PROM)
- Functional improvement score
- Treatment adherence (appointments kept)
- PROM completion rate
- Goal achievement status

**Display in Both Portals:**
- Clinic: Progress dashboard in medical record
- Patient: Progress card in dashboard

---

### 6.3 Smart Notifications
**Status:** ⏳ Not Started

**Clinic Notifications:**
- [ ] New intake submitted
- [ ] PROM completed (with analysis)
- [ ] Patient pain worsening (flag)
- [ ] Overdue PROM
- [ ] Treatment plan milestone reached

**Patient Notifications:**
- [ ] Appointment reminder (24h before)
- [ ] PROM assignment
- [ ] PROM due reminder
- [ ] Treatment plan update
- [ ] Progress milestone achieved

---

## Phase 7: Reporting & Analytics

### 7.1 Patient Progress Report
**Status:** ⏳ Not Started

**Generate PDF Report:**
- Patient information
- Treatment plan summary
- Initial evaluation (baseline)
- All PROM results with pain maps
- Pain progression chart
- Functional improvement graph
- Session attendance
- Treatment outcomes
- Clinician notes summary

**Use Cases:**
- Share with patient
- Insurance documentation
- Referral to specialist
- Discharge summary

---

### 7.2 Clinic Analytics Dashboard
**Status:** ⏳ Not Started

**Aggregate Metrics:**
- Average pain reduction across patients
- Treatment plan completion rates
- PROM completion rates
- Patient satisfaction scores
- Most effective treatment modalities
- Common pain patterns (3D heat map aggregation)
- Appointment attendance rates
- Revenue per treatment plan

---

## Implementation Priority

### Sprint 1: Core Flow (Week 1-2)
1. ✅ Intake queue with beautiful cards
2. 🚧 Medical record creation from intake
3. ⏳ Treatment plan creation dialog
4. ⏳ Link to first appointment scheduling

### Sprint 2: Patient Portal (Week 3-4)
5. ⏳ Display treatment plan in patient portal
6. ⏳ Add 3D pain map to PROMs
7. ⏳ PROM completion flow
8. ⏳ Smart rebooking after PROM

### Sprint 3: Progress Tracking (Week 5-6)
9. ⏳ Medical record timeline view
10. ⏳ Pain progression visualization
11. ⏳ Treatment plan progress metrics
12. ⏳ Session notes enhancement

### Sprint 4: Automation (Week 7-8)
13. ⏳ Automated PROM scheduling
14. ⏳ Smart notifications
15. ⏳ Progress calculations
16. ⏳ Reporting & analytics

---

## Technical Architecture

### Database Schema Updates Needed

```sql
-- Link intake to medical record
ALTER TABLE evaluations ADD COLUMN medical_record_id UUID REFERENCES users(id);

-- Treatment plans
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  goals TEXT[],
  frequency VARCHAR(100),
  duration VARCHAR(100),
  session_length INTEGER,
  modalities TEXT[],
  home_exercises TEXT,
  expected_outcomes TEXT,
  prom_schedule VARCHAR(100),
  review_milestones TEXT[],
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Link appointments to treatment plan
ALTER TABLE appointments ADD COLUMN treatment_plan_id UUID REFERENCES treatment_plans(id);

-- PROM assignments
CREATE TABLE prom_assignments (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES users(id),
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  prom_type VARCHAR(100),
  due_date DATE,
  completed_at TIMESTAMP,
  includes_pain_map BOOLEAN,
  status VARCHAR(50),
  created_at TIMESTAMP
);

-- PROM responses (with pain map)
CREATE TABLE prom_responses (
  id UUID PRIMARY KEY,
  assignment_id UUID REFERENCES prom_assignments(id),
  patient_id UUID REFERENCES users(id),
  pain_map_data JSONB,
  pain_level INTEGER,
  functional_scores JSONB,
  satisfaction_score INTEGER,
  responses JSONB,
  submitted_at TIMESTAMP
);

-- Store baseline pain map reference
ALTER TABLE users ADD COLUMN baseline_pain_map_id UUID REFERENCES pain_maps(id);
```

---

## API Endpoints Needed

### Treatment Plans
- `POST /api/treatment-plans` - Create plan
- `GET /api/treatment-plans/:patientId` - Get patient's plan
- `PUT /api/treatment-plans/:id` - Update plan
- `GET /api/treatment-plans/:id/progress` - Get progress metrics

### PROM Assignments
- `POST /api/prom-assignments` - Assign PROM
- `GET /api/prom-assignments/patient/:patientId` - Get patient's PROMs
- `POST /api/prom-assignments/:id/complete` - Submit PROM response
- `GET /api/prom-assignments/:id/comparison` - Get baseline vs current

### Progress Tracking
- `GET /api/patients/:id/timeline` - Get full patient timeline
- `GET /api/patients/:id/pain-progression` - Get pain map history
- `GET /api/patients/:id/progress-report` - Generate PDF report

### Rebooking
- `POST /api/appointments/suggest-slots` - Get recommended slots based on PROM
- `POST /api/appointments/quick-book` - One-click booking from PROM

---

## Success Metrics

### Clinical Outcomes
- Average pain reduction: Target 40%+
- Treatment plan completion: Target 80%+
- PROM completion rate: Target 90%+
- Patient satisfaction: Target 4.5/5+

### Operational Efficiency
- Time from intake to first appointment: Target <48 hours
- PROM response time: Target <24 hours
- Appointment attendance: Target 95%+
- Documentation completion: Target 100%

### Patient Engagement
- Treatment plan view rate: Target 80%+
- Home exercise compliance: Target 70%+
- PROM completion without reminder: Target 60%+
- Self-rebooking rate: Target 50%+

---

## Notes

- All 3D pain maps stored with consistent format for comparison
- Baseline pain map is immutable reference point
- PROM pain maps compared against baseline
- Treatment plan is living document (can be updated)
- Timeline shows complete patient journey
- Smart rebooking uses AI analysis of PROM responses
- Notifications are configurable per patient preference
- Reports can be generated at any time
- Analytics aggregate across all patients for insights

---

**Last Updated:** 2025-11-26
**Status:** Phase 1 (Sprint 1) - 40% Complete
---

# Part 2: Feature Audit - Existing vs Roadmap

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
