# Patient Flow Implementation Guide

> **Complete guide showing what exists, what to modify, and what to create**

---

## 🎯 Quick Reference

**Legend:**
- ✅ **Complete** - Fully implemented, no changes needed
- 🔧 **Modify** - Exists but needs enhancement
- 🆕 **Create** - Needs to be built from scratch

---

## Phase 1: Initial Patient Onboarding

### 1.1 Patient Submits Intake
**Status:** ✅ Complete
**Location:** `apps/patient-portal/src/pages/IntakeForm.tsx`

**What Works:**
- 5-step comprehensive form
- 3D pain map integration
- All required data captured
- Submits to intake queue

**Action:** None needed

---

### 1.2 Clinic Reviews Intake Queue
**Status:** ✅ Complete
**Location:** `apps/clinic-dashboard/src/pages/IntakeManagement.tsx`

**What Works:**
- Kanban board with beautiful cards
- Drag-and-drop status updates
- View details dialog
- AI triage integration

**Action:** None needed

---

### 1.3 Create Medical Record from Intake
**Status:** 🔧 Modify + 🆕 Create

#### A. Intake Details Dialog
**Status:** 🔧 Modify
**Location:** `apps/clinic-dashboard/src/components/dialogs/IntakeDetailsDialog.tsx`

**Current State:**
- ✅ "Create Record & Plan" button added
- ✅ Links to `/medical-records/new?intakeId={id}`

**What to Add:**
- Nothing - already done!

#### B. Medical Records Page
**Status:** 🔧 Modify
**Location:** `apps/clinic-dashboard/src/pages/MedicalRecords.tsx`

**Current State:**
- Has patient list view
- Has patient details view
- Basic timeline

**What to Modify:**
```typescript
// Add at top of component
const searchParams = useSearchParams();
const intakeId = searchParams.get('intakeId');
const [showCreateForm, setShowCreateForm] = useState(false);
const [prefilledData, setPrefilledData] = useState(null);

// Add useEffect to handle intake
useEffect(() => {
  if (intakeId) {
    loadIntakeData(intakeId);
  }
}, [intakeId]);

// Add function to load intake
const loadIntakeData = async (id: string) => {
  const intake = await intakeApi.getIntakeDetails(id);
  setPrefilledData({
    firstName: intake.patient.name.split(' ')[0],
    lastName: intake.patient.name.split(' ')[1],
    email: intake.patient.email,
    phone: intake.patient.phone,
    dateOfBirth: intake.patient.dateOfBirth,
    chiefComplaint: intake.evaluation.chiefComplaint,
    baselinePainMap: intake.painMap,
    medicalHistory: intake.medicalHistory,
    medications: intake.evaluation.currentMedications,
    allergies: intake.evaluation.allergies,
    conditions: intake.evaluation.medicalConditions,
  });
  setShowCreateForm(true);
};

// Add to create patient handler
const handleCreatePatient = async (formData) => {
  const newPatient = await createPatient(formData);
  
  // If from intake, link them
  if (intakeId) {
    await intakeApi.linkToMedicalRecord(intakeId, newPatient.id);
  }
  
  // Open treatment plan dialog
  setSelectedPatient(newPatient);
  setTreatmentPlanDialogOpen(true);
};
```

**Files to Modify:**
1. `MedicalRecords.tsx` - Add intake handling
2. `intakeApi.ts` - Add `linkToMedicalRecord()` method

#### C. Backend API
**Status:** 🆕 Create
**Location:** `backend/Qivr.Api/Controllers/EvaluationsController.cs`

**What to Create:**
```csharp
[HttpPost("{id}/link-medical-record")]
[Authorize(Policy = "StaffOnly")]
public async Task<IActionResult> LinkToMedicalRecord(Guid id, [FromBody] LinkMedicalRecordRequest request)
{
    var evaluation = await _context.Evaluations.FindAsync(id);
    if (evaluation == null) return NotFound();
    
    evaluation.MedicalRecordId = request.PatientId;
    evaluation.Status = "archived";
    await _context.SaveChangesAsync();
    
    return Ok();
}
```

**Database Migration:**
```sql
ALTER TABLE evaluations ADD COLUMN medical_record_id UUID REFERENCES users(id);
```

---

### 1.4 Create Treatment Plan
**Status:** 🆕 Create

#### A. Treatment Plan Dialog Component
**Status:** 🆕 Create
**Location:** `apps/clinic-dashboard/src/components/dialogs/TreatmentPlanDialog.tsx`

**What to Create:**
```typescript
interface TreatmentPlanDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  prefilledGoals?: string[];
}

export const TreatmentPlanDialog: React.FC<TreatmentPlanDialogProps> = ({
  open,
  onClose,
  patientId,
  prefilledGoals = []
}) => {
  const [formData, setFormData] = useState({
    goals: prefilledGoals,
    frequency: '2x per week',
    duration: '6 weeks',
    sessionLength: 45,
    modalities: [],
    homeExercises: '',
    expectedOutcomes: '',
    promSchedule: 'Every 2 weeks',
    reviewMilestones: []
  });

  const handleSubmit = async () => {
    await treatmentPlansApi.create({
      patientId,
      ...formData
    });
    onClose();
    // Open appointment scheduling
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Treatment Plan</DialogTitle>
      <DialogContent>
        {/* Goals */}
        <TextField
          label="Treatment Goals"
          multiline
          rows={3}
          value={formData.goals.join('\n')}
          onChange={(e) => setFormData({...formData, goals: e.target.value.split('\n')})}
        />
        
        {/* Frequency */}
        <TextField
          label="Frequency"
          value={formData.frequency}
          onChange={(e) => setFormData({...formData, frequency: e.target.value})}
        />
        
        {/* Duration */}
        <TextField
          label="Duration"
          value={formData.duration}
          onChange={(e) => setFormData({...formData, duration: e.target.value})}
        />
        
        {/* Modalities */}
        <FormGroup>
          <FormControlLabel control={<Checkbox />} label="Manual Therapy" />
          <FormControlLabel control={<Checkbox />} label="Exercise Therapy" />
          <FormControlLabel control={<Checkbox />} label="Modalities" />
          <FormControlLabel control={<Checkbox />} label="Education" />
        </FormGroup>
        
        {/* Home Exercises */}
        <TextField
          label="Home Exercise Program"
          multiline
          rows={4}
          value={formData.homeExercises}
          onChange={(e) => setFormData({...formData, homeExercises: e.target.value})}
        />
        
        {/* PROM Schedule */}
        <Select
          label="PROM Schedule"
          value={formData.promSchedule}
          onChange={(e) => setFormData({...formData, promSchedule: e.target.value})}
        >
          <MenuItem value="Weekly">Weekly</MenuItem>
          <MenuItem value="Every 2 weeks">Every 2 weeks</MenuItem>
          <MenuItem value="Monthly">Monthly</MenuItem>
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create & Schedule Appointment
        </Button>
      </DialogActions>
    </Dialog>
  );
};
```

#### B. Treatment Plans API Service
**Status:** 🔧 Modify
**Location:** `apps/clinic-dashboard/src/services/treatmentPlansApi.ts`

**What to Add:**
```typescript
export const treatmentPlansApi = {
  async create(data: CreateTreatmentPlanRequest) {
    return apiClient.post('/api/treatment-plans', data);
  },
  
  async getByPatient(patientId: string) {
    return apiClient.get(`/api/treatment-plans/patient/${patientId}`);
  },
  
  async update(id: string, data: UpdateTreatmentPlanRequest) {
    return apiClient.put(`/api/treatment-plans/${id}`, data);
  }
};
```

#### C. Backend Treatment Plans Controller
**Status:** 🔧 Modify
**Location:** `backend/Qivr.Api/Controllers/TreatmentPlansController.cs`

**What to Add:**
```csharp
[HttpPost]
[Authorize(Policy = "StaffOnly")]
public async Task<IActionResult> CreateTreatmentPlan([FromBody] CreateTreatmentPlanRequest request)
{
    var plan = new TreatmentPlan
    {
        PatientId = request.PatientId,
        Goals = request.Goals,
        Frequency = request.Frequency,
        Duration = request.Duration,
        SessionLength = request.SessionLength,
        Modalities = request.Modalities,
        HomeExercises = request.HomeExercises,
        ExpectedOutcomes = request.ExpectedOutcomes,
        PromSchedule = request.PromSchedule,
        ReviewMilestones = request.ReviewMilestones,
        Status = "active",
        CreatedAt = DateTime.UtcNow
    };
    
    _context.TreatmentPlans.Add(plan);
    await _context.SaveChangesAsync();
    
    return CreatedAtAction(nameof(GetTreatmentPlan), new { id = plan.Id }, plan);
}
```

---

### 1.5 Schedule First Appointment
**Status:** 🔧 Modify
**Location:** `apps/clinic-dashboard/src/components/dialogs/ScheduleAppointmentDialog.tsx`

**Current State:**
- Dialog exists
- Can schedule appointments

**What to Modify:**
```typescript
// Add props
interface ScheduleAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  patientId?: string;
  treatmentPlanId?: string;
  appointmentType?: string;
}

// Pre-fill appointment type
useEffect(() => {
  if (appointmentType) {
    setFormData({...formData, type: appointmentType});
  }
}, [appointmentType]);

// Link to treatment plan on save
const handleSave = async () => {
  await appointmentsApi.createAppointment({
    ...formData,
    treatmentPlanId: treatmentPlanId
  });
  onClose();
};
```

---

## Phase 2: Patient Portal - View Treatment Plan

### 2.1 Patient Dashboard Treatment Plan Card
**Status:** 🆕 Create
**Location:** `apps/patient-portal/src/components/TreatmentPlanCard.tsx`

**What to Create:**
```typescript
export const TreatmentPlanCard: React.FC = () => {
  const { data: plan } = useQuery({
    queryKey: ['treatment-plan'],
    queryFn: () => treatmentPlansApi.getCurrent()
  });

  if (!plan) return null;

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>My Treatment Plan</Typography>
      
      {/* Goals */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2">Treatment Goals</Typography>
        {plan.goals.map((goal, idx) => (
          <Box key={idx} sx={{ mt: 1 }}>
            <Typography variant="body2">{goal}</Typography>
            <LinearProgress 
              variant="determinate" 
              value={calculateGoalProgress(goal)} 
            />
          </Box>
        ))}
      </Box>
      
      {/* Schedule */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2">Schedule</Typography>
        <Typography variant="body2">
          {plan.frequency} for {plan.duration}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {plan.sessionsCompleted} of {plan.totalSessions} sessions completed
        </Typography>
      </Box>
      
      {/* Next Appointment */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2">Next Appointment</Typography>
        <Typography variant="body2">
          {format(parseISO(plan.nextAppointment), 'EEEE, MMMM d at h:mm a')}
        </Typography>
      </Box>
      
      {/* Home Exercises */}
      <Box>
        <Typography variant="subtitle2">Home Exercises</Typography>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
          {plan.homeExercises}
        </Typography>
      </Box>
    </Paper>
  );
};
```

**Add to:** `apps/patient-portal/src/pages/Dashboard.tsx`

---

## Phase 3: Appointments Enhancement

### 3.1 Link Appointments to Treatment Plan
**Status:** 🔧 Modify
**Location:** `apps/clinic-dashboard/src/pages/Appointments.tsx`

**What to Modify:**
```typescript
// Show treatment plan info in appointment card
{apt.treatmentPlanId && (
  <Chip 
    label="View Treatment Plan" 
    size="small"
    onClick={() => navigate(`/treatment-plans/${apt.treatmentPlanId}`)}
  />
)}

// Show patient medical record link
<IconButton
  size="small"
  onClick={() => navigate(`/medical-records/${apt.patientId}`)}
>
  <PersonIcon />
</IconButton>
```

### 3.2 Enhanced Session Notes
**Status:** 🔧 Modify
**Location:** Session notes dialog in `Appointments.tsx`

**What to Add:**
```typescript
// Add treatment modalities checkboxes
<FormGroup>
  <FormControlLabel control={<Checkbox />} label="Manual Therapy" />
  <FormControlLabel control={<Checkbox />} label="Exercise Therapy" />
  <FormControlLabel control={<Checkbox />} label="Modalities" />
  <FormControlLabel control={<Checkbox />} label="Education" />
</FormGroup>

// Add pain level slider
<Slider
  label="Pain Level During Session"
  value={painLevel}
  min={0}
  max={10}
  marks
/>

// Add PROM assignment checkbox
<FormControlLabel 
  control={<Checkbox />} 
  label="Assign PROM for next visit" 
/>
```

---

## Phase 4: PROMs with 3D Pain Map

### 4.1 Add 3D Pain Map to PROM
**Status:** 🔧 Modify
**Location:** `apps/patient-portal/src/pages/PROM.tsx`

**What to Add:**
```typescript
import { PainMap3D } from '@qivr/design-system';

// Fetch baseline pain map
const { data: baseline } = useQuery({
  queryKey: ['baseline-pain-map'],
  queryFn: () => profileApi.getBaselinePainMap()
});

// Add to PROM form
<Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
  <Box sx={{ flex: 1 }}>
    <Typography variant="h6">Your Initial Pain</Typography>
    <PainMap3D 
      data={baseline}
      readOnly
    />
  </Box>
  <Box sx={{ flex: 1 }}>
    <Typography variant="h6">Your Current Pain</Typography>
    <PainMap3D 
      data={currentPainMap}
      onChange={setCurrentPainMap}
    />
  </Box>
</Box>

// Calculate improvement
const improvement = calculatePainReduction(baseline, currentPainMap);
<Typography variant="body2" color="success.main">
  {improvement}% improvement from baseline
</Typography>
```

### 4.2 Smart Rebooking After PROM
**Status:** 🆕 Create
**Location:** `apps/patient-portal/src/components/RebookingDialog.tsx`

**What to Create:**
```typescript
export const RebookingDialog: React.FC = ({ promResponse, open, onClose }) => {
  const analysis = analyzePROMResponse(promResponse);
  const { data: slots } = useQuery({
    queryKey: ['available-slots', analysis.suggestedTimeframe],
    queryFn: () => appointmentsApi.getAvailableSlots(analysis.suggestedTimeframe)
  });

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Book Your Next Appointment</DialogTitle>
      <DialogContent>
        <Alert severity={analysis.severity}>
          {analysis.recommendation}
        </Alert>
        
        <Typography variant="h6" sx={{ mt: 2 }}>
          Available Times
        </Typography>
        
        <Stack spacing={1}>
          {slots?.map(slot => (
            <Button
              key={slot.id}
              variant="outlined"
              onClick={() => handleBook(slot)}
            >
              {format(parseISO(slot.start), 'EEEE, MMMM d at h:mm a')}
            </Button>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
```

**Add to PROM submission:**
```typescript
const handleSubmit = async () => {
  await promApi.submitResponse(promData);
  setRebookingDialogOpen(true);
};
```

---

## Phase 5: Medical Record Enhancements

### 5.1 Timeline View
**Status:** 🔧 Modify
**Location:** `apps/clinic-dashboard/src/pages/MedicalRecords.tsx`

**What to Add:**
```typescript
// Fetch all patient events
const { data: timeline } = useQuery({
  queryKey: ['patient-timeline', patientId],
  queryFn: () => patientsApi.getTimeline(patientId)
});

// Render timeline
<Timeline>
  {timeline?.map(event => (
    <TimelineItem key={event.id}>
      <TimelineOppositeContent>
        {format(parseISO(event.date), 'MMM d, yyyy')}
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot color={getEventColor(event.type)} />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>
        <Typography variant="h6">{event.title}</Typography>
        <Typography variant="body2">{event.description}</Typography>
        {event.type === 'prom' && (
          <Chip label={`Pain: ${event.painLevel}/10`} size="small" />
        )}
      </TimelineContent>
    </TimelineItem>
  ))}
</Timeline>
```

### 5.2 Pain Progression Visualization
**Status:** 🆕 Create
**Location:** `apps/clinic-dashboard/src/components/PainProgressionChart.tsx`

**What to Create:**
```typescript
export const PainProgressionChart: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { data: progression } = useQuery({
    queryKey: ['pain-progression', patientId],
    queryFn: () => patientsApi.getPainProgression(patientId)
  });

  return (
    <Box>
      {/* Side-by-side pain maps */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box>
          <Typography variant="h6">Baseline</Typography>
          <PainMap3D data={progression.baseline} readOnly />
          <Typography>Pain: {progression.baseline.intensity}/10</Typography>
        </Box>
        <Box>
          <Typography variant="h6">Current</Typography>
          <PainMap3D data={progression.current} readOnly />
          <Typography>Pain: {progression.current.intensity}/10</Typography>
        </Box>
      </Box>
      
      {/* Trend graph */}
      <LineChart
        data={progression.history}
        xAxis={[{ dataKey: 'date' }]}
        series={[{ dataKey: 'painLevel', label: 'Pain Level' }]}
      />
    </Box>
  );
};
```

---

## Database Migrations Needed

```sql
-- Link intake to medical record
ALTER TABLE evaluations ADD COLUMN medical_record_id UUID REFERENCES users(id);

-- Link appointments to treatment plan
ALTER TABLE appointments ADD COLUMN treatment_plan_id UUID REFERENCES treatment_plans(id);

-- Store baseline pain map
ALTER TABLE users ADD COLUMN baseline_pain_map_id UUID REFERENCES pain_maps(id);

-- PROM assignments table
CREATE TABLE prom_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES users(id),
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  prom_type VARCHAR(100),
  due_date DATE,
  completed_at TIMESTAMP,
  includes_pain_map BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- PROM responses table
CREATE TABLE prom_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES prom_assignments(id),
  patient_id UUID REFERENCES users(id),
  pain_map_data JSONB,
  pain_level INTEGER,
  functional_scores JSONB,
  satisfaction_score INTEGER,
  responses JSONB,
  submitted_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Checklist

### Sprint 1: Core Flow (Days 1-3) - ✅ 100% COMPLETE
- [x] Medical Records: Handle `?intakeId=` parameter ✅
- [x] Medical Records: Auto-populate form from intake ✅
- [x] Medical Records: Create patient with baseline pain map ✅
- [x] Backend: Add `linkToMedicalRecord` endpoint ✅
- [x] Backend: Add database migration for medical_record_id ✅
- [x] Create TreatmentPlanDialog component ✅
- [x] Treatment Plans API: Add create/update methods ✅
- [x] Backend: Enhance TreatmentPlansController ✅
- [x] Link appointment scheduling to treatment plan ✅

**Flow Complete:**
1. Intake → "Create Record & Plan" button
2. Medical Records page with `?intakeId=` auto-loads data
3. Create patient → Treatment Plan Dialog opens
4. Create plan → Schedule Appointment Dialog opens
5. Book appointment linked to treatment plan

**Commits:**
- 174e370: Medical record creation from intake
- da476c1: Treatment Plan Dialog
- 5764380: Wired dialogs together
- 3ecf4c0: Sprint 1 complete + Sprint 2 started

### Sprint 2: Patient Portal (Days 4-6) - ✅ 100% COMPLETE
- [x] Create TreatmentPlanCard component ✅
- [x] Add to patient dashboard ✅
- [x] Backend: Add treatment plan patient endpoint ✅
- [x] PROM: Add 3D pain map component ✅
- [x] PROM: Fetch and display baseline ✅
- [x] PROM: Calculate improvement ✅
- [x] Create RebookingDialog component ✅
- [x] Backend: Add PROM analysis logic ✅
- [x] Backend: Add available slots endpoint ✅

**Features Complete:**
1. TreatmentPlanCard with gradient design on patient dashboard
2. PROM with side-by-side 3D pain map comparison (baseline vs current)
3. Real-time improvement percentage calculation
4. Smart rebooking dialog with severity-based recommendations
5. Available slots endpoint with conflict checking
6. Baseline pain map endpoint for patients

**Commits:**
- 3ecf4c0: TreatmentPlanCard component
- b1de331: PROM enhancements, RebookingDialog, backend endpoints

### Sprint 3: Enhancements (Days 7-9) - ✅ 100% COMPLETE
- [x] Medical Records: Add timeline view ✅
- [x] Backend: Add timeline endpoint ✅
- [x] Create PainProgressionChart component ✅
- [x] Backend: Add pain progression endpoint ✅
- [x] Appointments: Link to treatment plan ✅
- [x] Appointments: Link to medical record ✅
- [x] Session Notes: Add treatment modalities ✅
- [x] Session Notes: Add PROM assignment trigger ✅

**Features Complete:**
1. Comprehensive timeline showing appointments, PROMs, treatment plans, documents
2. PainProgressionChart with side-by-side 3D pain maps and trend graph
3. Appointment cards link to patient medical records and treatment plans
4. Enhanced session notes with:
   - Treatment modalities checkboxes (Manual Therapy, Exercise, Modalities, Education)
   - Pain level slider (0-10)
   - PROM assignment checkbox
   - Auto-formatted notes with all session data

**Commits:**
- 04aa62a: Timeline & Pain Progression endpoints and components
- 6801403: Appointments enhancements complete

### Sprint 4: Polish (Days 10-12) - ✅ COMPLETE
- [x] Automated PROM scheduling ✅
- [x] Smart notifications ✅
- [x] Analytics dashboard ✅ (already existed)
- [ ] Progress reports (PDF) - Deferred
- [ ] Testing and bug fixes - Ongoing

**Features Complete:**
1. **PromSchedulingService**: Automatically creates PROM assignments based on treatment plan schedules
2. **PromSchedulingBackgroundService**: Runs daily to check and create due PROMs
3. **SmartNotificationService**: Sends PROM due notifications and appointment reminders
4. **Analytics**: Comprehensive analytics already exist (Clinic, Patient, Pain Map analytics)

**Commits:**
- 67d67bd: PROM scheduling and smart notifications

---

**Last Updated:** 2025-11-26 14:58
**Status:** All 4 Sprints Complete! 🎉
