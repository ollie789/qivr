# Production Fixes Testing Checklist

## Automated Tests ✅

Run: `node scripts/tests/test-production-fixes.mjs <email> <password>`

- ✅ API Health Check
- ✅ Clinic Dashboard Loading
- ✅ Patient Portal Loading

## Manual Testing Required

### 1. Patient Portal Login (Fixed /api/api routing) 🔐

**Issue Fixed:** Double `/api/api` in URL causing 404 errors

**Test Steps:**
1. Go to https://patients.qivr.pro
2. Enter credentials and click Login
3. Should successfully authenticate without CORS or 404 errors

**Expected:** Login succeeds, redirects to dashboard  
**Status:** ⬜ Not Tested

---

### 2. Analytics Dashboard (Fixed DateTime.Kind) 📊

**Issue Fixed:** `DateTime.Kind=Unspecified` causing 500 errors

**Test Steps:**
1. Login to https://clinic.qivr.pro
2. Navigate to Analytics/Dashboard
3. Check that dashboard loads without errors
4. Verify stat cards show data (appointments, patients, etc.)

**Expected:** Dashboard loads, no 500 errors in console  
**Status:** ⬜ Not Tested

---

### 3. Clinical Analytics (Fixed LINQ Translation) 📈

**Issue Fixed:** `DateTime.ToString()` in LINQ query causing translation errors

**Test Steps:**
1. Login to https://clinic.qivr.pro
2. Navigate to Analytics page
3. Select date range (last 7-30 days)
4. Check appointment trends chart loads
5. Verify patient outcomes data displays

**Expected:** Charts render, no LINQ translation errors  
**Status:** ⬜ Not Tested

---

### 4. Medical Records (Fixed Missing Columns) 🏥

**Issue Fixed:** Missing `affected_area`, `onset_type`, etc. columns causing 500 errors

**Test Steps:**
1. Login to https://clinic.qivr.pro
2. Navigate to Medical Records
3. Select a patient
4. View medical conditions
5. Try to add/edit a condition with affected area

**Expected:** Medical records load, conditions display properly  
**Status:** ⬜ Not Tested

---

### 5. Intake Details (Fixed Questionnaire Data) 📋

**Issue Fixed:** Only showing "aaa" instead of full patient responses

**Test Steps:**
1. Login to https://clinic.qivr.pro
2. Navigate to Intake Management
3. Click on an intake evaluation
4. Check "Chief Complaint" section
5. Verify full description shows (not just short text)
6. Check "Medical History" section has data

**Expected:** Full questionnaire responses visible  
**Status:** ⬜ Not Tested

---

### 6. Treatment Plans (Fixed EF Configuration) 💊

**Issue Fixed:** `Exercise` entity missing primary key causing startup failures

**Test Steps:**
1. Login to https://clinic.qivr.pro
2. Navigate to Treatment Plans
3. Create a new treatment plan
4. Add sessions and exercises
5. Save and verify it persists
6. Edit and verify changes save

**Expected:** Treatment plans CRUD works, no EF errors  
**Status:** ⬜ Not Tested

---

### 7. Environment Variables (Fixed Build Process) ⚙️

**Issue Fixed:** HTTP fallbacks allowing insecure builds

**Test Steps:**
1. Check browser console on both portals
2. Verify all API calls use HTTPS
3. No mixed content warnings
4. No `/api/api` double routing

**Expected:** All requests to `https://clinic.qivr.pro/api/*`  
**Status:** ⬜ Not Tested

---

## Browser Console Checks

Open DevTools Console (F12) and verify:

### Clinic Dashboard (https://clinic.qivr.pro)
- [ ] No CORS errors
- [ ] No 500 Internal Server errors
- [ ] No "DateTime.Kind" errors
- [ ] No "column does not exist" errors
- [ ] No "LINQ translation" errors
- [ ] All API calls use HTTPS

### Patient Portal (https://patients.qivr.pro)
- [ ] No CORS errors
- [ ] No `/api/api` routing errors
- [ ] No mixed content warnings
- [ ] Login endpoint is `/api/auth/login` (not `/api/api/auth/login`)
- [ ] All API calls use HTTPS

---

## Database Verification

Run these queries to verify migrations:

\`\`\`sql
-- Check medical_conditions columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'medical_conditions' 
  AND column_name IN ('affected_area', 'onset_type', 'previous_treatments', 'aggravating_factors', 'relieving_factors');

-- Should return 5 rows
\`\`\`

---

## CloudWatch Logs Check

Check for errors in last 1 hour:

\`\`\`bash
aws logs tail /ecs/qivr-api --since 1h --region ap-southeast-2 --format short | grep -iE "error|exception" | grep -v "FailedToDeterminePort"
\`\`\`

**Expected:** No critical errors (HTTPS redirect warning is OK)

---

## Performance Checks

### Response Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Analytics queries complete in < 3 seconds
- [ ] Medical records load in < 1 second
- [ ] Intake details load in < 1 second

### Database Queries
- [ ] No N+1 query issues
- [ ] Indexes being used (check query plans)
- [ ] No full table scans on large tables

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| API Health | ✅ Pass | Responding correctly |
| Frontend Loading | ✅ Pass | Both portals load |
| Patient Login | ⬜ Pending | Requires credentials |
| Analytics Dashboard | ⬜ Pending | Requires auth |
| Clinical Analytics | ⬜ Pending | Requires auth |
| Medical Records | ⬜ Pending | Requires auth |
| Intake Details | ⬜ Pending | Requires auth |
| Treatment Plans | ⬜ Pending | Requires auth |

---

## Sign-off

- [ ] All manual tests completed
- [ ] No critical errors in logs
- [ ] Performance acceptable
- [ ] Ready for production use

**Tested By:** _______________  
**Date:** _______________  
**Sign-off:** _______________
