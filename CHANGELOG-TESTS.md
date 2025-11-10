# Test Suite Changelog

## [2.0.0] - 2025-11-10

### Added
- **test-live-system.mjs** - Complete E2E test suite with live Cognito authentication
  - 12 comprehensive test cases
  - Automatic test clinic creation
  - Tenant isolation validation
  - Auth proxy testing with httpOnly cookies
  - Token refresh testing
  
- **test-api-endpoints.mjs** - API endpoint testing suite
  - Tests 20+ endpoints
  - Automatic auth flow
  - Cookie handling
  - Tenant header validation
  - Response format checking
  
- **test-frontend-pages.mjs** - Frontend page testing with Playwright
  - Tests all 10 pages
  - Browser automation
  - Screenshot capture
  - Error detection
  - API call validation
  
- **run-tests.sh** - Unified test runner
  - Runs all test suites
  - Colored output
  - Summary reporting
  - Environment support
  
- **Documentation**
  - docs/TESTING.md - Complete testing guide
  - scripts/tests/README.md - Test suite documentation
  - TEST-QUICK-REF.md - Quick reference card
  - docs/TEST-MIGRATION.md - Migration guide from old tests

### Changed
- Migrated from manual token extraction to automatic auth flow
- Switched from hardcoded URLs to environment-aware configuration
- Updated from deprecated Amplify to auth proxy system
- Improved from ~5 basic tests to 30+ comprehensive tests

### Deprecated
- test-auth.js - Use test-api-endpoints.mjs instead
- test-live-auth.js - Use test-live-system.mjs instead
- test-auth-flow.mjs - Use test-live-system.mjs instead
- test-all-endpoints.sh - Use test-api-endpoints.mjs instead
- test-api-direct.mjs - Use test-api-endpoints.mjs instead

### Key Features
- ✅ Automatic test clinic creation with unique timestamps
- ✅ Per-tenant Cognito pool testing
- ✅ Auth proxy with httpOnly cookies
- ✅ Tenant isolation validation
- ✅ Environment switching (production/local)
- ✅ CI/CD ready
- ✅ Clear pass/fail reporting
- ✅ Test credentials returned for manual testing

### Test Coverage
- Auth: Registration, Login, Token Refresh, Logout
- API: Dashboard, Patients, Appointments, Messages, Documents, Records, Settings, Analytics, PROM, Intake
- Frontend: All 10 pages with browser automation
- Security: Tenant isolation, Auth validation, CORS

### Breaking Changes
- Old test scripts no longer maintained
- Requires Node.js 18+ for fetch API
- Frontend tests require Playwright installation

### Migration Path
1. Run new test suite: `node scripts/tests/test-live-system.mjs production`
2. Verify all tests pass
3. Archive old test scripts to `scripts/tests/archive/`
4. Update CI/CD pipeline to use new tests
5. Add test credentials to secrets manager

---

## [1.0.0] - 2024-09-29 (Legacy)

### Initial Test Scripts
- test-auth.js - Basic auth flow testing
- test-live-auth.js - Manual token testing
- test-auth-flow.mjs - Amplify-based testing
- test-all-endpoints.sh - Bash endpoint testing
- test-api-direct.mjs - Direct API testing

### Limitations
- Manual token extraction required
- Hardcoded URLs and tenant IDs
- Used deprecated Amplify library
- Tested old shared Cognito pool
- No tenant isolation testing
- Not CI/CD ready
- Limited coverage (~5 tests)
