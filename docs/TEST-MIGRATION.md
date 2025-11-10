# Test Suite Migration

## Overview

Migrated from fragmented, outdated test scripts to a comprehensive test suite using the new auth proxy system with live Cognito authentication.

## Old Test Scripts (Deprecated)

### 1. test-auth.js
```javascript
// ❌ Problems:
- Hardcoded CloudFront URLs
- No environment switching
- Manual token extraction required
- Tests only basic health checks
- No tenant isolation testing
```

### 2. test-live-auth.js
```javascript
// ❌ Problems:
- Requires manual token from browser
- Hardcoded CloudFront URLs
- No automated flow
- Manual tenant ID input
- No comprehensive testing
```

### 3. test-auth-flow.mjs
```javascript
// ❌ Problems:
- Uses deprecated Amplify library
- Hardcoded client secrets
- Tests old shared Cognito pool
- Doesn't work with new auth proxy
- No tenant isolation
```

### 4. test-all-endpoints.sh
```bash
# ❌ Problems:
- Bash script (hard to maintain)
- No authentication
- Hardcoded endpoints
- No response validation
- No tenant context
```

### 5. test-api-direct.mjs
```javascript
// ❌ Problems:
- Direct API calls (bypasses auth proxy)
- No cookie handling
- Incomplete endpoint coverage
- No tenant isolation testing
```

## New Test Suite (Current)

### 1. test-live-system.mjs ✅
```javascript
// ✅ Improvements:
+ Environment-aware (production/local)
+ Complete E2E flow
+ Automatic test clinic creation
+ Tests auth proxy with httpOnly cookies
+ Validates tenant isolation
+ 12 comprehensive test cases
+ Clear pass/fail reporting
+ Returns test credentials
```

**Test Cases:**
1. Health check
2. Clinic registration (creates per-tenant pool)
3. Login (auth proxy)
4. Auth check
5. Create patient
6. Get patients (verify tenant filtering)
7. Create appointment
8. Get appointments (verify tenant filtering)
9. Dashboard stats
10. Tenant isolation (wrong tenant ID)
11. Token refresh
12. Logout

### 2. test-api-endpoints.mjs ✅
```javascript
// ✅ Improvements:
+ Tests 20+ endpoints
+ Automatic auth flow
+ Cookie handling
+ Tenant header validation
+ Response format checking
+ Data isolation verification
+ Environment switching
```

**Endpoints Tested:**
- Auth: login, check, refresh, logout
- Dashboard: stats, activity
- Patients: list, paginated
- Appointments: list, upcoming
- Messages: list, threads
- Documents: list
- Medical Records: list
- Settings: clinic, user
- Analytics: overview
- PROM: questionnaires
- Intake: forms
- Tenants: list
- Users: me
- Notifications: list

### 3. test-frontend-pages.mjs ✅
```javascript
// ✅ Improvements:
+ Browser automation (Playwright)
+ Tests all 10 pages
+ Automatic login
+ Screenshot capture
+ Error detection
+ API call validation
+ Auth data verification
```

**Pages Tested:**
- Dashboard
- Patients
- Appointments
- Messages
- Documents
- Medical Records
- Settings
- Analytics
- PROM
- Intake Forms

### 4. run-tests.sh ✅
```bash
# ✅ Improvements:
+ Runs all test suites
+ Colored output
+ Summary report
+ Error handling
+ Environment support
+ Credential management
```

## Key Differences

### Authentication

**Old:**
```javascript
// Manual token extraction
const token = 'eyJhbGc...'; // Copy from browser
headers: { 'Authorization': `Bearer ${token}` }
```

**New:**
```javascript
// Automatic auth flow
await makeRequest('/auth/login', {
  body: JSON.stringify({ email, password })
});
// Cookie automatically captured and reused
```

### Tenant Context

**Old:**
```javascript
// Hardcoded or manual input
const tenantId = 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11';
```

**New:**
```javascript
// Automatically captured from login
const data = await response.json();
tenantId = data.user.tenantId;
// Automatically added to all requests
```

### Environment Configuration

**Old:**
```javascript
// Hardcoded URLs
const API_URL = 'https://d2xnv2zqtx1fym.cloudfront.net';
```

**New:**
```javascript
// Environment-aware
const ENVIRONMENTS = {
  production: 'https://clinic.qivr.pro/api',
  local: 'http://localhost:5050/api'
};
const baseUrl = ENVIRONMENTS[env];
```

### Test Coverage

**Old:**
```
✅ Health check
✅ Unauthenticated request
✅ Invalid token
✅ CORS preflight
❌ No registration testing
❌ No login flow
❌ No CRUD operations
❌ No tenant isolation
❌ No frontend testing
```

**New:**
```
✅ Health check
✅ Registration (per-tenant pools)
✅ Login (auth proxy)
✅ Auth validation
✅ Patient CRUD
✅ Appointment CRUD
✅ Dashboard data
✅ Tenant isolation
✅ Token refresh
✅ Logout
✅ 20+ API endpoints
✅ 10 frontend pages
```

## Migration Benefits

### 1. Automation
- **Old:** Manual token extraction, manual tenant IDs
- **New:** Fully automated from registration to logout

### 2. Coverage
- **Old:** ~5 basic tests
- **New:** 30+ comprehensive tests

### 3. Accuracy
- **Old:** Tests deprecated auth system
- **New:** Tests current auth proxy system

### 4. Maintainability
- **Old:** Scattered scripts, hardcoded values
- **New:** Centralized suite, environment-aware

### 5. CI/CD Ready
- **Old:** Requires manual intervention
- **New:** Fully automated, can run in pipelines

### 6. Documentation
- **Old:** Minimal comments
- **New:** Complete docs (TESTING.md, README.md)

## Usage Comparison

### Old Workflow
```bash
# 1. Login to website manually
# 2. Open browser dev tools
# 3. Find auth token in localStorage
# 4. Copy token
# 5. Run test with token
node test-live-auth.js "eyJhbGc..." "tenant-id"

# Result: Tests 3-4 endpoints
```

### New Workflow
```bash
# 1. Run test
node scripts/tests/test-live-system.mjs production

# Result: Tests complete E2E flow with 12 test cases
```

## File Status

### Deprecated (Keep for Reference)
```
scripts/test-auth.js           → Use test-api-endpoints.mjs
scripts/test-live-auth.js      → Use test-live-system.mjs
scripts/tests/test-auth-flow.mjs → Use test-live-system.mjs
scripts/tests/test-all-endpoints.sh → Use test-api-endpoints.mjs
scripts/tests/test-api-direct.mjs → Use test-api-endpoints.mjs
```

### Current (Use These)
```
scripts/tests/test-live-system.mjs     ✅ E2E testing
scripts/tests/test-api-endpoints.mjs   ✅ API testing
scripts/tests/test-frontend-pages.mjs  ✅ UI testing
scripts/run-tests.sh                   ✅ Test runner
```

## Recommendations

1. **Archive old tests** - Move to `scripts/tests/archive/`
2. **Update CI/CD** - Use new test suite
3. **Document credentials** - Store test account in secrets
4. **Run regularly** - Add to deployment pipeline
5. **Extend coverage** - Add more test cases as features grow

## Next Steps

1. Run new test suite to verify everything works
2. Archive old test scripts
3. Update CI/CD pipeline
4. Add test credentials to secrets manager
5. Schedule regular test runs
6. Monitor test results
7. Extend coverage for new features
