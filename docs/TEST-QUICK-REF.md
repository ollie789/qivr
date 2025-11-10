# Testing Quick Reference

## Run All Tests
```bash
./scripts/run-tests.sh
./scripts/run-tests.sh user@clinic.com Password123!
```

## Individual Tests

### 1. Live System Test (E2E)
```bash
node scripts/tests/test-live-system.mjs
```
- Creates new test clinic
- Tests full registration → login → CRUD → logout flow
- Verifies tenant isolation
- Returns test credentials

### 2. API Endpoint Test
```bash
node scripts/tests/test-api-endpoints.mjs user@clinic.com Password123!
```
- Tests 20+ API endpoints
- Validates auth and tenant headers
- Checks response formats

### 3. Frontend Page Test
```bash
# Install Playwright first
npm install -D playwright

# Run tests
node scripts/tests/test-frontend-pages.mjs user@clinic.com Password123!
```
- Tests all 10 pages
- Captures screenshots
- Validates API calls

## What Gets Tested

✅ **Auth Flow**
- Registration (creates per-tenant Cognito pool)
- Login (auth proxy with httpOnly cookies)
- Token refresh
- Logout

✅ **API Endpoints**
- Dashboard, Patients, Appointments
- Messages, Documents, Records
- Settings, Analytics, PROM, Intake

✅ **Frontend Pages**
- All 10 pages load correctly
- No console errors
- API calls succeed
- Data renders properly

✅ **Security**
- Tenant isolation (users only see their data)
- Auth validation (401 without token)
- CORS configuration
- HTTPS only

## Test Output

```
🧪 Testing Production (HTTPS)

📋 Test 1: Health Check
  ✅ Backend is healthy

📋 Test 2: Clinic Registration
  ✅ Registration successful
  📝 Tenant: abc123...

📋 Test 3: Login
  ✅ Login successful
  📝 User: test@clinic.test

...

📊 Test Results (12.5s)
   ✅ Passed: 12
   ❌ Failed: 0
   📈 Success Rate: 100.0%

🎉 All tests passed!
```

## Production Environment

**URL:** https://clinic.qivr.pro
**API:** https://clinic.qivr.pro/api
**Protocol:** HTTPS only

## Common Issues

**"Registration failed"** → Check backend is running
**"Login failed"** → Verify credentials
**"No auth cookie"** → Check CORS config
**"Tenant isolation failed"** → Check X-Tenant-Id header
**"SSL/TLS error"** → Verify HTTPS certificate is valid

## Full Documentation

See [docs/TESTING.md](docs/TESTING.md) for complete guide.
