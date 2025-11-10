# Test Suite

Comprehensive testing scripts for the Qivr clinic dashboard with live Cognito authentication.

## New Test Scripts (Auth Proxy System)

### 1. Live System Test (`test-live-system.mjs`)
Complete end-to-end test of the auth proxy system with real Cognito authentication.

**Features:**
- Registration flow
- Login/logout
- Patient creation
- Appointment booking
- Dashboard stats
- Tenant isolation
- Token refresh

**Usage:**
```bash
# Test production
node scripts/tests/test-live-system.mjs production

# Test local
node scripts/tests/test-live-system.mjs local
```

**Output:**
- Creates test clinic with timestamp
- Tests all major API flows
- Verifies tenant isolation
- Returns test credentials for manual testing

---

### 2. API Endpoint Test (`test-api-endpoints.mjs`)
Tests all backend API endpoints with live authentication.

**Features:**
- Tests 20+ API endpoints
- Validates tenant isolation
- Checks response formats
- Verifies auth requirements

**Usage:**
```bash
# Test production
node scripts/tests/test-api-endpoints.mjs user@clinic.com Password123! production

# Test local
node scripts/tests/test-api-endpoints.mjs user@clinic.com Password123! local
```

**Endpoints Tested:**
- Auth (login, check, refresh)
- Dashboard (stats, activity)
- Patients (list, paginated)
- Appointments (list, upcoming)
- Messages, Documents, Records
- Settings, Analytics, PROM, Intake

---

### 3. Frontend Page Test (`test-frontend-pages.mjs`)
Tests all React pages with browser automation.

**Features:**
- Automated login
- Tests all 10 pages
- Captures screenshots
- Checks for errors
- Validates API calls

**Requirements:**
```bash
npm install -D playwright
```

**Usage:**
```bash
# Test production
node scripts/tests/test-frontend-pages.mjs user@clinic.com Password123! production

# Test local
node scripts/tests/test-frontend-pages.mjs user@clinic.com Password123! local
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

**Output:**
- Screenshots saved to `/tmp/test-*.png`
- Console logs for each page
- API call validation

---

## Quick Start

### 1. Run Full System Test
```bash
# This creates a new test clinic and tests everything
node scripts/tests/test-live-system.mjs production
```

### 2. Test Existing Account
```bash
# Use your existing credentials
node scripts/tests/test-api-endpoints.mjs your@email.com YourPassword123! production
```

### 3. Test Frontend Pages
```bash
# Install Playwright first
npm install -D playwright

# Run page tests
node scripts/tests/test-frontend-pages.mjs your@email.com YourPassword123! production
```

---

## Legacy Test Scripts

These scripts use the old authentication system and should be updated or archived:

- `test-auth.js` - Old auth flow test (uses hardcoded URLs)
- `test-live-auth.js` - Manual token testing (requires token extraction)
- `test-auth-flow.mjs` - Uses Amplify (deprecated)
- `test-all-endpoints.sh` - Bash script (no auth)
- `test-api-direct.mjs` - Direct API calls (no auth proxy)

---

## Environment Configuration

### Production
- Frontend: `https://clinic.qivr.pro`
- Backend: `https://clinic.qivr.pro/api`
- Auth: Auth proxy with httpOnly cookies

### Local
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5050/api`
- Auth: Auth proxy with httpOnly cookies

---

## Test Data

All tests create isolated test data:
- Unique clinic names with timestamps
- Unique email addresses
- Test patients and appointments
- Automatically cleaned up (or can be manually deleted)

---

## Troubleshooting

### "No auth cookie" error
- Ensure login endpoint is working
- Check that cookies are being set
- Verify credentials are correct

### "Tenant isolation failed"
- Check X-Tenant-Id header is being sent
- Verify backend tenant filtering
- Review database queries

### "Page not found" error
- Ensure frontend is deployed
- Check CloudFront distribution
- Verify routing configuration

### "API call failed"
- Check backend is running
- Verify ALB health checks
- Review CloudFront cache behaviors

---

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run API Tests
  run: |
    node scripts/tests/test-live-system.mjs production
    
- name: Run Endpoint Tests
  run: |
    node scripts/tests/test-api-endpoints.mjs ${{ secrets.TEST_EMAIL }} ${{ secrets.TEST_PASSWORD }} production
```

---

## Next Steps

1. **Add more test cases** - Cover edge cases and error scenarios
2. **Performance testing** - Add load testing scripts
3. **Security testing** - Test auth vulnerabilities
4. **Integration tests** - Test third-party integrations
5. **E2E tests** - Full user journey tests
