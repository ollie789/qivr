# Qivr Test Suite - Clean & Organized

## 🟢 ACTIVE TESTS (Use These!)

### Core Tests
- **`active/test-comprehensive-full.mjs`** - Complete system test (patients, providers, appointments, messages, PROMs)
- **`active/test-creation.mjs`** - Simple clinic registration test  
- **`active/test-patient-simple.mjs`** - Basic patient creation workflow
- **`active/test-logs-debug.mjs`** - CloudWatch debugging tool

### Quick Commands
```bash
# Full system test
node scripts/tests/active/test-comprehensive-full.mjs

# Create new clinic
node scripts/tests/active/test-creation.mjs

# Test patient creation
node scripts/tests/active/test-patient-simple.mjs

# Debug with CloudWatch
node scripts/tests/active/test-logs-debug.mjs
```

## 📚 LEGACY TESTS (Reference Only)

- **`legacy/test-data-flow.mjs`** - Original comprehensive test (has issues)
- **`legacy/test-live-system.mjs`** - Old system test (auth issues)
- **`legacy/test-frontend-pages.mjs`** - Browser automation tests
- **`legacy/test-auth-victory.mjs`** - Auth validation test

## 🗄️ ARCHIVED TESTS (Old/Broken)

All old, broken, or superseded tests are in `archive/` folder.

## 🎯 RECOMMENDED WORKFLOW

1. **Start here**: `test-creation.mjs` - Creates new admin user
2. **Full test**: `test-comprehensive-full.mjs` - Tests everything
3. **Debug issues**: `test-logs-debug.mjs` - CloudWatch debugging
4. **Simple test**: `test-patient-simple.mjs` - Quick validation

## 🔧 CURRENT STATUS

- ✅ **Patient creation** - Working perfectly
- ✅ **Admin authentication** - Working perfectly  
- ✅ **CloudWatch debugging** - Working perfectly
- ⚠️ **Provider creation** - Needs backend deployment
- ⚠️ **Appointments/Messages/PROMs** - Endpoints need implementation

## 🚀 SYSTEM HEALTH

The core multi-tenant SaaS platform is **fully operational** with:
- Multi-tenant registration ✅
- Cognito authentication ✅
- Patient management ✅
- Real-time debugging ✅
