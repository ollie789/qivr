# Test Suite

## Unit Tests

Each app has its own unit tests using Vitest:

```bash
# Patient Portal (15 tests)
npm run test --workspace=@qivr/patient-portal

# Backend (.NET)
cd backend && dotnet test
```

## E2E Tests

```bash
# Main integration test suite
node scripts/tests/test-live-system.mjs
```

Covers: Auth, Patients, Appointments, Medical Records, PROMs, Messaging, Analytics, Multi-tenant isolation.

## Manual Testing

See [PATIENT-PORTAL-MANUAL-TEST.md](PATIENT-PORTAL-MANUAL-TEST.md).

## Archived Scripts

Historical test scripts are in `docs/archive/test-scripts/`.
