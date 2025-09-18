# QIVR Workflow Testing Guide

## 🎉 FIXED ISSUES SUMMARY

### ✅ Analytics Page - FIXED
- Resolved TypeScript compilation errors in both portals
- Fixed `ProviderPerformance` interface type mismatch
- Analytics now displays correctly with proper data visualization

### ✅ PROM Flow - FIXED  
- Created proper API endpoints for PROM management
- Fixed import errors in patient portal CompletePROM page
- Established correct API routes: `/api/v1/proms/*`
- PROMs can now flow from doctor dashboard to patient portal

### ✅ Patient Search - FIXED
- Created new `PatientsController` with search functionality
- Endpoint: `GET /api/patients/search?query={searchTerm}`
- Doctors can now find registered patients to send PROMs

### ✅ Patient Registration - VERIFIED
- Registration flow creates users in database
- Cognito integration working with email verification
- Patient records properly stored with correct tenant association

## Services Running
1. **Backend API**: http://localhost:5249 (or 5001)
2. **Patient Portal**: http://localhost:3005
3. **Clinic Dashboard**: http://localhost:3010

## Test Workflow: Doctor to Patient Flow

### 1. Doctor Login (Clinic Dashboard)
- Open http://localhost:3010
- Login with doctor credentials
- You should see the main dashboard

### 2. Create/Send a PROM to Patient
**From Clinic Dashboard:**
1. Navigate to "PROMs" section
2. Click "Create New PROM"
3. Select a patient from the list
4. Choose a PROM template (e.g., Pain Assessment, Quality of Life)
5. Set due date
6. Click "Send to Patient"

### 3. Patient Receives PROM
**From Patient Portal:**
1. Open http://localhost:3005
2. Login with patient credentials
3. Navigate to Dashboard - should see notification of pending PROM
4. Or go to "Assessments" page
5. Click on the pending PROM to fill it out

### 4. Patient Completes PROM
1. Fill out all questions in the PROM
2. Submit the assessment
3. Should see confirmation message

### 5. Results Appear in Doctor Dashboard
**Back in Clinic Dashboard:**
1. Navigate to "PROMs" → "Completed"
2. Should see the patient's completed assessment
3. Click to view detailed results
4. Results should also update in:
   - Patient's profile
   - Analytics dashboard
   - Reports section

### 6. Patient Books Appointment
**From Patient Portal:**
1. Navigate to "Appointments"
2. Click "Book Appointment"
3. Select provider (doctor)
4. Choose date and time
5. Add reason for visit
6. Confirm booking

### 7. Doctor Sees Appointment
**From Clinic Dashboard:**
1. Navigate to "Schedule" or "Appointments"
2. Should see the new appointment
3. Can view patient details
4. Can see recent PROM results linked to patient

### 8. Analytics Update
**Both portals should show updated analytics:**

**Patient Portal:**
- Medical Records page shows PROM history
- Analytics page shows health trends
- Documents page shows any uploaded files

**Clinic Dashboard:**
- Patient analytics updated with PROM scores
- Clinic-wide analytics include new data
- Reports can be generated with latest information

## Test User Accounts

### For Testing (if needed to create):
**Doctor Account:**
- Email: doctor@qivr.health
- Role: Provider

**Patient Account:**
- Email: patient@qivr.health  
- Role: Patient

## Common API Endpoints Used

### Patient Search (NEW)
- GET `/api/patients/search?query={searchTerm}` - Search for patients
- GET `/api/patients` - List all patients
- GET `/api/patients/{patientId}` - Get patient details

### PROMs (UPDATED)
- GET `/api/v1/proms/templates` - List PROM templates
- POST `/api/v1/proms/schedule` - Schedule PROM for patient
- GET `/api/v1/proms/instances` - Get patient's PROMs
- GET `/api/v1/proms/instances/{id}` - Get specific PROM instance
- POST `/api/v1/proms/instances/{id}/answers` - Submit PROM answers

### Appointments
- GET `/api/Appointments` - List appointments
- POST `/api/Appointments` - Create appointment
- PUT `/api/Appointments/{id}` - Update appointment

### Medical Records
- GET `/api/MedicalRecords` - Get patient records
- GET `/api/MedicalRecords/vitals` - Get vital signs
- GET `/api/MedicalRecords/medications` - Get medications

### Analytics
- GET `/api/Analytics/health-metrics` - Get health metrics
- GET `/api/Analytics/prom-analytics` - Get PROM analytics

## Troubleshooting

### If API calls fail:
1. Check if backend is running: `curl http://localhost:5249/api/health`
2. Check browser console for specific errors
3. Ensure you're logged in (check for auth token in localStorage)
4. Check network tab for API response details

### If login fails:
1. Verify Cognito credentials in .env files
2. Check if user is confirmed in Cognito
3. Try the email verification flow

### If data doesn't sync:
1. Refresh both portals
2. Check if both are using same API endpoint
3. Clear browser cache and re-login

## Success Indicators
✅ Doctor can send PROM to patient
✅ Patient receives and can complete PROM
✅ Completed PROM appears in doctor's dashboard
✅ Patient can book appointment
✅ Appointment appears in doctor's schedule
✅ Analytics update in both portals
✅ All data persists after page refresh