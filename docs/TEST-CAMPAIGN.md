# Patient Flow Test Campaign

**Date:** 2025-11-26  
**Environment:** Production (https://clinic.qivr.pro)  
**Tester:** _____________

---

## Sprint 1: Core Flow (Intake → Medical Record → Treatment Plan → Appointment)

### Test 1.1: Intake Form Submission
**Patient Portal:** https://patient.qivr.pro

- [ ] Navigate to Intake Form
- [ ] Fill out all 5 steps (Personal Info, Medical History, Pain Map, Symptoms, Review)
- [ ] Submit intake form
- [ ] Verify success message
- [ ] **Expected:** Form submitted, appears in clinic intake queue

### Test 1.2: Intake Review & Medical Record Creation
**Clinic Dashboard:** https://clinic.qivr.pro

- [ ] Navigate to Intake Management
- [ ] Verify new intake appears in "New Submissions" column
- [ ] Click "View Details" on intake
- [ ] Click "Create Record & Plan" button
- [ ] **Expected:** Redirects to `/medical-records/new?intakeId={id}`
- [ ] Verify form is pre-filled with intake data (name, email, phone, chief complaint)
- [ ] Complete any missing fields
- [ ] Click "Create Patient"
- [ ] **Expected:** Patient created, Treatment Plan Dialog opens automatically

### Test 1.3: Treatment Plan Creation
**Clinic Dashboard** (continuing from 1.2)

- [ ] Verify Treatment Plan Dialog is open
- [ ] Fill in treatment goals (e.g., "Reduce pain", "Improve mobility")
- [ ] Set frequency: "2x per week"
- [ ] Set duration: "6 weeks"
- [ ] Set session length: 45 minutes
- [ ] Check modalities: Manual Therapy, Exercise Therapy
- [ ] Add home exercises
- [ ] Set PROM schedule: "Every 2 weeks"
- [ ] Click "Create & Schedule Appointment"
- [ ] **Expected:** Treatment plan created, Schedule Appointment Dialog opens

### Test 1.4: First Appointment Scheduling
**Clinic Dashboard** (continuing from 1.3)

- [ ] Verify Schedule Appointment Dialog is open
- [ ] Select date and time
- [ ] Select provider
- [ ] Set appointment type: "Initial Evaluation"
- [ ] Click "Schedule"
- [ ] **Expected:** Appointment created and linked to treatment plan
- [ ] Navigate to Appointments page
- [ ] Verify appointment appears in calendar

**✅ Sprint 1 Result:** Pass / Fail  
**Notes:** _______________________________________________

---

## Sprint 2: Patient Portal (Treatment Plan View & PROM)

### Test 2.1: Treatment Plan Card Display
**Patient Portal:** https://patient.qivr.pro

- [ ] Login as the patient created in Sprint 1
- [ ] Navigate to Dashboard
- [ ] Verify Treatment Plan Card appears at top
- [ ] **Expected:** Purple gradient card showing:
  - Treatment goals with progress bars
  - Schedule (frequency, duration, sessions completed)
  - Next appointment date
  - Home exercises
  - Overall progress percentage

### Test 2.2: PROM with 3D Pain Map Comparison
**Patient Portal**

- [ ] Navigate to PROMs page
- [ ] Click on an assigned PROM
- [ ] **Expected:** First step shows pain map comparison
- [ ] Verify "Initial Pain (Baseline)" shows on left with 3D pain map
- [ ] Verify "Current Pain" interactive 3D pain map on right
- [ ] Click on body regions to mark current pain
- [ ] Set pain intensity for each region
- [ ] **Expected:** Improvement percentage calculates automatically
- [ ] Complete remaining PROM questions
- [ ] Submit PROM

### Test 2.3: Smart Rebooking Dialog
**Patient Portal** (continuing from 2.2)

- [ ] After PROM submission, verify Rebooking Dialog appears
- [ ] **Expected:** Dialog shows:
  - Severity-based recommendation (error/warning/info)
  - Available appointment slots (next 5)
  - Provider names for each slot
- [ ] Click on a time slot
- [ ] **Expected:** Redirects to appointment booking with pre-selected slot
- [ ] OR click "View All Times" to see full calendar

**✅ Sprint 2 Result:** Pass / Fail  
**Notes:** _______________________________________________

---

## Sprint 3: Enhancements (Timeline, Pain Progression, Appointments)

### Test 3.1: Comprehensive Timeline
**Clinic Dashboard**

- [ ] Navigate to Medical Records
- [ ] Select the patient created in Sprint 1
- [ ] Click "Timeline" tab
- [ ] **Expected:** Timeline shows:
  - Appointments with provider names and status
  - PROM completions with scores
  - Treatment plan creation
  - Document uploads
  - Color-coded status badges
  - Timestamps with dates and times

### Test 3.2: Pain Progression Chart
**Clinic Dashboard**

- [ ] In Medical Records, navigate to Pain Progression section
- [ ] **Expected:** See:
  - Side-by-side 3D pain maps (Baseline vs Current)
  - Pain intensity for each (X/10)
  - Improvement percentage alert
  - Line chart showing pain level over time
  - Dates for each assessment

### Test 3.3: Appointment Links
**Clinic Dashboard**

- [ ] Navigate to Appointments page
- [ ] Select an appointment
- [ ] **Expected:** See action buttons:
  - Blue person icon → Click to view Medical Record
  - Purple treatment icon → Click to view Treatment Plan (if linked)
  - Primary notes icon → Session notes
  - Green checkmark → Complete appointment
  - Orange cancel → Cancel appointment

### Test 3.4: Enhanced Session Notes
**Clinic Dashboard**

- [ ] Click notes icon on an appointment
- [ ] **Expected:** Session Notes Dialog shows:
  - Treatment Modalities checkboxes (Manual Therapy, Exercise, Modalities, Education)
  - Pain Level slider (0-10)
  - Session notes text area
  - "Assign PROM for next visit" checkbox
- [ ] Check some modalities
- [ ] Set pain level
- [ ] Write session notes
- [ ] Check "Assign PROM"
- [ ] Click "Save Notes"
- [ ] **Expected:** Notes saved with formatted data including modalities and pain level

**✅ Sprint 3 Result:** Pass / Fail  
**Notes:** _______________________________________________

---

## Sprint 4: Automation & Notifications

### Test 4.1: Automated PROM Scheduling
**Backend Verification**

- [ ] Check database for `prom_instances` table
- [ ] Verify PROMs are created automatically for treatment plans
- [ ] **Expected:** PROMs scheduled at intervals matching treatment plan (Weekly/Every 2 weeks/Monthly)
- [ ] Check logs for "Scheduled PROMs for treatment plan" messages

### Test 4.2: Smart Notifications
**Patient Portal**

- [ ] Login as patient
- [ ] Check notifications (bell icon)
- [ ] **Expected:** See notifications for:
  - PROM due (if due date is today/tomorrow)
  - Appointment reminders (24 hours before)
- [ ] Click notification
- [ ] **Expected:** Navigates to relevant page (PROM or Appointments)

### Test 4.3: Analytics Dashboard
**Clinic Dashboard**

- [ ] Navigate to Analytics page
- [ ] **Expected:** See existing analytics:
  - Active patients count
  - Appointments this month
  - Completed PROMs
  - Average pain reduction
  - Treatment completion rate
  - Charts and trends

**✅ Sprint 4 Result:** Pass / Fail  
**Notes:** _______________________________________________

---

## Integration Tests (End-to-End Flow)

### Integration Test 1: Complete Patient Journey
**Time Required:** ~15 minutes

1. **Patient submits intake** (Patient Portal)
2. **Clinic reviews and creates medical record** (Clinic Dashboard)
3. **Clinic creates treatment plan** (Auto-opens dialog)
4. **Clinic schedules first appointment** (Auto-opens dialog)
5. **Patient views treatment plan on dashboard** (Patient Portal)
6. **Patient completes PROM with pain map** (Patient Portal)
7. **Patient books follow-up via rebooking dialog** (Patient Portal)
8. **Clinic views timeline and pain progression** (Clinic Dashboard)
9. **Clinic completes appointment with session notes** (Clinic Dashboard)
10. **Patient receives notifications** (Patient Portal)

**✅ Integration Test Result:** Pass / Fail  
**Notes:** _______________________________________________

---

## Backend API Tests

### API Test 1: Timeline Endpoint
```bash
GET /api/patients/{patientId}/timeline
```
- [ ] Returns appointments, PROMs, treatment plans, documents
- [ ] Sorted by date (newest first)
- [ ] Limited to 100 events
- [ ] Includes status and notes

### API Test 2: Pain Progression Endpoint
```bash
GET /api/patients/{patientId}/pain-progression
```
- [ ] Returns baseline pain map
- [ ] Returns current pain map
- [ ] Returns history array with dates and pain levels
- [ ] Includes drawing data JSON

### API Test 3: Available Slots Endpoint
```bash
GET /api/appointments/available-slots?days=14
```
- [ ] Returns available appointment slots
- [ ] Excludes weekends
- [ ] Excludes booked times
- [ ] Includes provider names
- [ ] Limited to 20 slots

### API Test 4: Baseline Pain Map Endpoint
```bash
GET /api/patients/me/baseline-pain-map
```
- [ ] Returns patient's first pain assessment
- [ ] Includes intensity, coordinates, drawing data
- [ ] Returns 404 if no baseline exists

**✅ API Tests Result:** Pass / Fail  
**Notes:** _______________________________________________

---

## Database Verification

### Database Test 1: Schema Changes
- [ ] `evaluations` table has `medical_record_id` column
- [ ] Index exists on `medical_record_id`
- [ ] Foreign key constraint to `users` table

### Database Test 2: Data Integrity
- [ ] Treatment plans linked to patients
- [ ] Appointments linked to treatment plans (if applicable)
- [ ] PROM instances created automatically
- [ ] Notifications created for due PROMs and appointments

**✅ Database Tests Result:** Pass / Fail  
**Notes:** _______________________________________________

---

## Performance Tests

### Performance Test 1: Page Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Medical Records page loads in < 3 seconds
- [ ] Timeline renders in < 2 seconds
- [ ] Pain progression chart loads in < 3 seconds

### Performance Test 2: API Response Times
- [ ] Timeline endpoint responds in < 500ms
- [ ] Pain progression endpoint responds in < 500ms
- [ ] Available slots endpoint responds in < 1s

**✅ Performance Tests Result:** Pass / Fail  
**Notes:** _______________________________________________

---

## Bug Tracking

### Issues Found:

| # | Sprint | Feature | Issue | Severity | Status |
|---|--------|---------|-------|----------|--------|
| 1 |        |         |       |          |        |
| 2 |        |         |       |          |        |
| 3 |        |         |       |          |        |

---

## Test Summary

**Total Tests:** 40+  
**Passed:** ___  
**Failed:** ___  
**Blocked:** ___  

**Overall Status:** ✅ Pass / ❌ Fail / ⚠️ Partial

**Critical Issues:** _______________________________________________

**Recommendations:** _______________________________________________

---

**Tested By:** _____________  
**Date Completed:** _____________  
**Sign-off:** _____________
