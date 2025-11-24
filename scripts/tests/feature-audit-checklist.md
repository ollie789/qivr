# Feature Audit Checklist - Granular Testing

**Date:** 2025-11-24  
**Goal:** Identify every broken, half-working, or visually incorrect feature

---

## 🔍 Testing Methodology

### 1. Manual Testing (User Perspective)

- Test every button, link, form
- Check every page load
- Verify all data displays correctly
- Test error states
- Check responsive design

### 2. Console Monitoring

- Check browser console for errors
- Monitor network tab for failed requests
- Check for 404s, 500s, CORS errors

### 3. Visual Inspection

- Alignment issues
- Missing styles
- Broken layouts
- Inconsistent spacing
- Color/theme issues

---

## 📋 CLINIC DASHBOARD - Detailed Checklist

### Login & Auth

- [ ] Login form submits
- [ ] Error messages display
- [ ] Remember me works
- [ ] Forgot password link works
- [ ] Redirect after login works
- [ ] Session persistence works
- [ ] Logout works
- [ ] Token refresh works

### Dashboard Page

- [ ] Page loads without errors
- [ ] All stat cards display data
- [ ] Charts render correctly
- [ ] Recent activity shows
- [ ] Quick actions work
- [ ] Notifications display
- [ ] Loading states work
- [ ] Empty states work

### Patients/Medical Records

- [ ] Patient list loads
- [ ] Search works
- [ ] Filters work
- [ ] Pagination works
- [ ] Sort columns work
- [ ] Add patient button works
- [ ] Add patient form submits
- [ ] Form validation works
- [ ] Patient detail page loads
- [ ] Edit patient works
- [ ] Delete patient works (with confirmation)
- [ ] Patient tabs all work:
  - [ ] Overview tab
  - [ ] Medications tab
  - [ ] Allergies tab
  - [ ] Conditions tab
  - [ ] Documents tab
  - [ ] Appointments tab
  - [ ] PROMs tab
  - [ ] Notes tab
- [ ] Add medication works
- [ ] Add allergy works
- [ ] Add condition works
- [ ] Timeline displays correctly
- [ ] Export patient data works

### Appointments

- [ ] Calendar loads
- [ ] Month view works
- [ ] Week view works
- [ ] Day view works
- [ ] Create appointment modal opens
- [ ] Create appointment form submits
- [ ] Form validation works
- [ ] Appointment appears on calendar
- [ ] Click appointment shows details
- [ ] Edit appointment works
- [ ] Delete appointment works
- [ ] Reschedule works
- [ ] Status changes work
- [ ] Patient selection works
- [ ] Clinician selection works
- [ ] Time slot validation works
- [ ] Recurring appointments work
- [ ] Appointment reminders work
- [ ] Calendar sync works
- [ ] Export calendar works

### Documents

- [ ] Document list loads
- [ ] Upload button works
- [ ] File selection works
- [ ] Upload progress shows
- [ ] Upload completes
- [ ] Document appears in list
- [ ] Document preview works
- [ ] Download works
- [ ] Delete works
- [ ] OCR processing works
- [ ] OCR results display
- [ ] Search documents works
- [ ] Filter by type works
- [ ] Filter by patient works
- [ ] Bulk actions work

### Messages

- [ ] Message list loads
- [ ] Unread count displays
- [ ] Click message opens detail
- [ ] Message content displays
- [ ] Reply works
- [ ] Compose new message works
- [ ] Recipient selection works
- [ ] Send message works
- [ ] Attachments work
- [ ] Mark as read works
- [ ] Delete message works
- [ ] Search messages works
- [ ] Filter by patient works
- [ ] Real-time updates work

### Analytics

- [ ] Page loads without errors
- [ ] Dashboard metrics load
- [ ] Date range picker works
- [ ] Filter by date works
- [ ] Clinical analytics load
- [ ] Pain map analytics load
- [ ] Charts render correctly
- [ ] Export data works
- [ ] Refresh data works
- [ ] Loading states work
- [ ] Empty states work

### PROM

- [ ] PROM list loads
- [ ] Create PROM template works
- [ ] Template form submits
- [ ] Question builder works
- [ ] Add question works
- [ ] Remove question works
- [ ] Reorder questions works
- [ ] Scoring rules work
- [ ] Assign PROM to patient works
- [ ] Patient selection works
- [ ] PROM instances list loads
- [ ] View responses works
- [ ] Score calculation works
- [ ] Charts display correctly
- [ ] Export results works

### Intake Management

- [ ] Intake queue loads
- [ ] Kanban view works
- [ ] Table view works
- [ ] Switch views works
- [ ] Intake cards display:
  - [ ] Patient name
  - [ ] Email
  - [ ] Phone number
  - [ ] Symptoms (first 2)
  - [ ] Pain level
  - [ ] Severity badge
  - [ ] AI summary icon
  - [ ] AI summary tooltip
- [ ] Click card opens details
- [ ] Details dialog loads
- [ ] Full evaluation data displays:
  - [ ] Patient info
  - [ ] Chief complaint
  - [ ] Symptoms
  - [ ] Pain map
  - [ ] Medical history
  - [ ] Medications
  - [ ] Allergies
  - [ ] AI summary
  - [ ] Risk flags
  - [ ] Triage notes
- [ ] Drag and drop works
- [ ] Status change works
- [ ] Schedule appointment works
- [ ] Assign to clinician works
- [ ] Add notes works
- [ ] Filter by status works
- [ ] Filter by urgency works
- [ ] Search works
- [ ] Export works
- [ ] Metrics cards show correct totals

### Settings

- [ ] Settings page loads
- [ ] Profile tab works
- [ ] Edit profile works
- [ ] Change password works
- [ ] Upload avatar works
- [ ] Clinic settings tab works
- [ ] Edit clinic info works
- [ ] Working hours work
- [ ] Services list works
- [ ] Add service works
- [ ] Users tab works
- [ ] User list loads
- [ ] Invite user works
- [ ] Edit user role works
- [ ] Deactivate user works
- [ ] Integrations tab works
- [ ] API keys display
- [ ] Generate API key works
- [ ] Revoke API key works
- [ ] Notifications tab works
- [ ] Email preferences work
- [ ] SMS preferences work
- [ ] Billing tab works (if implemented)

---

## 📋 PATIENT PORTAL - Detailed Checklist

### Login & Registration

- [ ] Login works
- [ ] Registration works
- [ ] Email verification works
- [ ] Password reset works
- [ ] Social login works (if implemented)

### Dashboard

- [ ] Page loads
- [ ] Welcome message displays
- [ ] Upcoming appointments show
- [ ] Recent PROMs show
- [ ] Progress chart displays
- [ ] Achievements display
- [ ] Points/level display
- [ ] Quick actions work

### Appointments

- [ ] Appointments list loads
- [ ] Upcoming appointments show
- [ ] Past appointments show
- [ ] Book appointment button works
- [ ] Available slots load
- [ ] Select time slot works
- [ ] Confirm booking works
- [ ] Cancel appointment works
- [ ] Reschedule works
- [ ] Add to calendar works

### Intake Form

- [ ] Form loads
- [ ] Step 1 (Personal Info) works
- [ ] Step 2 (Chief Complaint) works
- [ ] Step 3 (Pain Map) works:
  - [ ] 3D body model loads
  - [ ] Click to add pain point works
  - [ ] Pain intensity slider works
  - [ ] Pain type selection works
  - [ ] Multiple pain points work
  - [ ] Remove pain point works
- [ ] Step 4 (Symptoms) works
- [ ] Step 5 (Medical History) works
- [ ] Step 6 (Review) works
- [ ] Form validation works
- [ ] Submit works
- [ ] Confirmation shows
- [ ] Form saves progress
- [ ] Resume form works

### PROMs

- [ ] PROM list loads
- [ ] Pending PROMs show
- [ ] Completed PROMs show
- [ ] Start PROM works
- [ ] Questions display correctly
- [ ] Answer selection works
- [ ] Navigation works
- [ ] Progress bar works
- [ ] Submit PROM works
- [ ] View results works
- [ ] Score displays
- [ ] Charts display
- [ ] History shows

### Documents

- [ ] Document list loads
- [ ] Upload document works
- [ ] View document works
- [ ] Download document works
- [ ] Document categories work
- [ ] Search works

### Messages

- [ ] Message list loads
- [ ] Read message works
- [ ] Reply works
- [ ] Compose new works
- [ ] Send works
- [ ] Unread count updates

### Medical Records

- [ ] Records page loads
- [ ] Medications display
- [ ] Allergies display
- [ ] Conditions display
- [ ] Lab results display
- [ ] Imaging reports display
- [ ] Timeline displays

### Profile

- [ ] Profile page loads
- [ ] Edit profile works
- [ ] Change password works
- [ ] Upload photo works
- [ ] Notification preferences work
- [ ] Privacy settings work

### Progress/Analytics

- [ ] Progress page loads
- [ ] Charts display
- [ ] Achievements show
- [ ] Streaks display
- [ ] Points history shows
- [ ] Level progress shows

---

## 🔧 API ENDPOINTS - Test Each One

### Auth Endpoints

```bash
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/verify-email
```

### Patient Endpoints

```bash
GET /api/patients
GET /api/patients/{id}
POST /api/patients
PUT /api/patients/{id}
DELETE /api/patients/{id}
GET /api/patients/{id}/medications
POST /api/patients/{id}/medications
GET /api/patients/{id}/allergies
POST /api/patients/{id}/allergies
```

### Appointment Endpoints

```bash
GET /api/appointments
GET /api/appointments/{id}
POST /api/appointments
PUT /api/appointments/{id}
DELETE /api/appointments/{id}
PATCH /api/appointments/{id}/status
```

### Document Endpoints

```bash
GET /api/documents
GET /api/documents/{id}
POST /api/documents/upload
DELETE /api/documents/{id}
GET /api/documents/{id}/download
POST /api/documents/{id}/ocr
```

### Message Endpoints

```bash
GET /api/messages
GET /api/messages/{id}
POST /api/messages
PATCH /api/messages/{id}/read
DELETE /api/messages/{id}
GET /api/messages/unread-count
```

### Analytics Endpoints

```bash
GET /api/clinic-analytics/dashboard
GET /api/clinic-analytics/clinical
GET /api/pain-map-analytics
GET /api/patient-analytics/dashboard
GET /api/patient-analytics/progress
```

### PROM Endpoints

```bash
GET /api/proms
GET /api/proms/{id}
POST /api/proms
PUT /api/proms/{id}
DELETE /api/proms/{id}
GET /api/prom-instances
POST /api/prom-instances
GET /api/prom-instances/{id}
POST /api/prom-instances/{id}/submit
```

### Intake/Evaluation Endpoints

```bash
GET /api/evaluations
GET /api/evaluations/{id}
POST /api/evaluations
PATCH /api/evaluations/{id}/status
POST /api/evaluations/{id}/analyze
```

---

## 🐛 Common Issues to Check

### Frontend Issues

- [ ] Console errors (React warnings, JS errors)
- [ ] Network errors (404, 500, CORS)
- [ ] Missing data/null errors
- [ ] Infinite loops/re-renders
- [ ] Memory leaks
- [ ] Slow performance
- [ ] Layout shifts
- [ ] Broken images
- [ ] Missing icons
- [ ] Incorrect colors/themes
- [ ] Responsive design issues
- [ ] Mobile view broken
- [ ] Accessibility issues

### Backend Issues

- [ ] 500 errors
- [ ] 404 errors
- [ ] Slow queries
- [ ] Missing endpoints
- [ ] Incorrect data returned
- [ ] Validation errors
- [ ] Authentication issues
- [ ] Authorization issues
- [ ] Database connection issues
- [ ] Missing migrations
- [ ] Incorrect data types

### Integration Issues

- [ ] Cognito auth failures
- [ ] S3 upload failures
- [ ] SQS message failures
- [ ] Bedrock AI failures
- [ ] Email sending failures
- [ ] SMS sending failures
- [ ] Calendar sync failures

---

## 📊 Testing Tools

### Automated Testing

```bash
# Run E2E tests
node scripts/tests/test-live-system.mjs

# Run API tests
node scripts/tests/test-api-endpoints.mjs user@clinic.com Password123!

# Run frontend tests
node scripts/tests/test-frontend-pages.mjs user@clinic.com Password123!
```

### Manual Testing Tools

- Browser DevTools (Console, Network, Performance)
- React DevTools
- Lighthouse (Performance, Accessibility)
- WAVE (Accessibility)
- Postman/Insomnia (API testing)

### Monitoring

- CloudWatch Logs (backend errors)
- Browser console (frontend errors)
- Network tab (failed requests)
- Sentry/error tracking (if implemented)

---

## 📝 Issue Tracking Template

```markdown
### Issue: [Brief Description]

**Location:** [Page/Component/Endpoint]
**Severity:** [Critical/High/Medium/Low]
**Type:** [Bug/Visual/Performance/UX]

**Steps to Reproduce:**

1.
2.
3.

**Expected Behavior:**

**Actual Behavior:**

**Screenshots/Errors:**

**Browser/Environment:**

**Priority:** [P0/P1/P2/P3]
```

---

## 🎯 Next Steps

1. **Run automated tests** - Get baseline of what's broken
2. **Manual walkthrough** - Test every feature systematically
3. **Document issues** - Create GitHub issues for each problem
4. **Prioritize fixes** - P0 (broken), P1 (half-working), P2 (visual), P3 (nice-to-have)
5. **Fix systematically** - Start with P0, work down
6. **Re-test** - Verify fixes don't break other things
7. **Repeat** - Until 100% working
