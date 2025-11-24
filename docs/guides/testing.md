# Testing Guide

Complete testing documentation for the Qivr clinic dashboard.

## Overview

The test suite validates the entire application stack with live Cognito authentication:

- ✅ Auth proxy system (httpOnly cookies)
- ✅ Per-tenant Cognito pools
- ✅ Tenant isolation
- ✅ All API endpoints
- ✅ All frontend pages
- ✅ End-to-end workflows

## Quick Start

### Run All Tests

```bash
# Test production with new test clinic
./scripts/run-tests.sh production

# Test with existing credentials
./scripts/run-tests.sh production user@clinic.com Password123!

# Test local environment
./scripts/run-tests.sh local user@clinic.com Password123!
```

### Run Individual Tests

```bash
# Live system test (creates new clinic)
node scripts/tests/test-live-system.mjs production

# API endpoint test (requires credentials)
node scripts/tests/test-api-endpoints.mjs user@clinic.com Password123! production

# Frontend page test (requires Playwright)
node scripts/tests/test-frontend-pages.mjs user@clinic.com Password123! production
```

## Test Suites

### 1. Live System Test

**File:** `scripts/tests/test-live-system.mjs`

**What it tests:**

- ✅ Clinic registration (creates per-tenant Cognito pool)
- ✅ User login (auth proxy with httpOnly cookies)
- ✅ Auth check endpoint
- ✅ Patient creation
- ✅ Appointment booking
- ✅ Dashboard stats
- ✅ Tenant isolation (verifies data filtering)
- ✅ Token refresh
- ✅ Logout

**Output:**

```
📋 Test 1: Health Check
  ✅ Backend is healthy

📋 Test 2: Clinic Registration
  ✅ Registration successful
  ✅ Tenant ID returned
  ✅ User ID returned
  ✅ Cognito pool ID returned
  📝 Tenant: abc123...
  📝 Pool: ap-southeast-2_xyz...

📋 Test 3: Login
  ✅ Login successful
  ✅ User data returned
  ✅ Correct tenant ID
  ✅ Auth cookie set
  📝 User: test@clinic.test

...

📊 Test Results (12.5s)
   ✅ Passed: 12
   ❌ Failed: 0
   📈 Success Rate: 100.0%

🎉 All tests passed!
```

**Use case:** Automated testing, CI/CD pipelines

---

### 2. API Endpoint Test

**File:** `scripts/tests/test-api-endpoints.mjs`

**What it tests:**

- ✅ 20+ API endpoints
- ✅ Authentication flow
- ✅ Tenant header validation
- ✅ Response formats
- ✅ Data isolation

**Endpoints:**

```
Auth:
  POST /auth/login
  GET  /auth/check
  POST /auth/refresh
  POST /auth/logout

Dashboard:
  GET  /dashboard/stats
  GET  /dashboard/recent-activity

Patients:
  GET  /patients
  GET  /patients?page=1&pageSize=10

Appointments:
  GET  /appointments
  GET  /appointments/upcoming

Messages:
  GET  /messages
  GET  /messages/threads

Documents:
  GET  /documents

Medical Records:
  GET  /medical-records

Settings:
  GET  /settings/clinic
  GET  /settings/user

Analytics:
  GET  /analytics/overview

PROM:
  GET  /prom/questionnaires

Intake:
  GET  /intake/forms

Tenants:
  GET  /tenants

Users:
  GET  /users/me

Notifications:
  GET  /notifications
```

**Use case:** API regression testing, endpoint validation

---

### 3. Frontend Page Test

**File:** `scripts/tests/test-frontend-pages.mjs`

**What it tests:**

- ✅ Login flow
- ✅ All 10 pages load
- ✅ No console errors
- ✅ API calls succeed
- ✅ Auth data present
- ✅ Content renders

**Pages:**

```
✅ Dashboard         - Stats, activity, appointments
✅ Patients          - List, create, edit, view
✅ Appointments      - Calendar, booking, management
✅ Messages          - Threads, send, receive
✅ Documents         - Upload, list, view
✅ Medical Records   - CRUD operations
✅ Settings          - Preferences, clinic settings
✅ Analytics         - Charts, AI insights
✅ PROM              - Questionnaires, responses
✅ Intake Forms      - Patient intake forms
```

**Requirements:**

```bash
npm install -D playwright
```

**Output:**

- Screenshots: `/tmp/test-*.png`
- Console logs for each page
- API call validation

**Use case:** UI testing, visual regression testing

---

## Test Data

All tests create isolated test data:

```javascript
// Unique clinic
clinicName: `Test Clinic ${timestamp}`;
email: `test${timestamp}@clinic.test`;

// Test patient
firstName: "John";
lastName: "Doe";
email: `patient${timestamp}@test.com`;

// Test appointment
appointmentType: "Consultation";
startTime: tomorrow;
status: "Scheduled";
```

**Cleanup:** Test data can be manually deleted or left for debugging.

---

## Environments

### Production

```bash
Frontend: https://clinic.qivr.pro
Backend:  https://clinic.qivr.pro/api
Auth:     Auth proxy (httpOnly cookies)
```

### Local

```bash
Frontend: http://localhost:5173
Backend:  http://localhost:5050/api
Auth:     Auth proxy (httpOnly cookies)
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Run Live System Test
        run: node scripts/tests/test-live-system.mjs production

      - name: Run API Endpoint Test
        run: |
          node scripts/tests/test-api-endpoints.mjs \
            ${{ secrets.TEST_EMAIL }} \
            ${{ secrets.TEST_PASSWORD }} \
            production

      - name: Install Playwright
        run: npm install -D playwright

      - name: Run Frontend Page Test
        run: |
          node scripts/tests/test-frontend-pages.mjs \
            ${{ secrets.TEST_EMAIL }} \
            ${{ secrets.TEST_PASSWORD }} \
            production
```

---

## Troubleshooting

### Test Failures

**"Registration failed"**

- Check backend is running
- Verify database connection
- Check Cognito permissions

**"Login failed"**

- Verify credentials are correct
- Check Cognito pool exists
- Review auth proxy logs

**"No auth cookie"**

- Ensure cookies are enabled
- Check CORS configuration
- Verify domain settings

**"Tenant isolation failed"**

- Check X-Tenant-Id header
- Verify backend filtering
- Review database queries

**"API call failed"**

- Check backend health
- Verify ALB is running
- Review CloudFront config

**"Page not found"**

- Ensure frontend is deployed
- Check CloudFront distribution
- Verify S3 bucket

### Debug Mode

Add debug logging:

```javascript
// In test scripts
const DEBUG = true;

if (DEBUG) {
  console.log("Request:", { url, headers, body });
  console.log("Response:", { status, headers, data });
}
```

---

## Best Practices

### 1. Test Isolation

- Each test creates its own data
- Tests don't depend on each other
- Clean state for each run

### 2. Realistic Data

- Use valid email formats
- Use strong passwords
- Use realistic names and dates

### 3. Error Handling

- Tests fail fast on errors
- Clear error messages
- Helpful debugging info

### 4. Performance

- Tests run in parallel where possible
- Minimal wait times
- Efficient API calls

### 5. Maintenance

- Update tests when APIs change
- Keep test data current
- Document new test cases

---

## Adding New Tests

### 1. Add to Live System Test

```javascript
// In test-live-system.mjs
async testNewFeature() {
  console.log('\n📋 Test X: New Feature');

  const response = await makeRequest('/new-endpoint', {
    method: 'POST',
    body: JSON.stringify({ data })
  });

  assert(response.ok, 'Feature works');
  const data = await response.json();
  assert(data.result, 'Expected result');
}
```

### 2. Add to API Endpoint Test

```javascript
// In test-api-endpoints.mjs
{
  method: 'GET',
  path: '/new-endpoint',
  name: 'New Feature'
}
```

### 3. Add to Frontend Page Test

```javascript
// In test-frontend-pages.mjs
{
  path: '/new-page',
  name: 'New Page',
  dataCheck: '.new-component'
}
```

---

## Next Steps

1. **Load Testing** - Test with multiple concurrent users
2. **Security Testing** - Test auth vulnerabilities
3. **Performance Testing** - Measure response times
4. **Integration Testing** - Test third-party services
5. **Accessibility Testing** - Test WCAG compliance
6. **Mobile Testing** - Test responsive design
7. **Browser Testing** - Test cross-browser compatibility

---

## Resources

- [Test Suite README](../scripts/tests/README.md)
- [API Documentation](./API.md)
- [Auth Proxy Documentation](./AUTH-PROXY.md)
- [Deployment Guide](./DEPLOYMENT.md)
