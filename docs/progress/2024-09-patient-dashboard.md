# Patient Dashboard API Alignment – Progress Snapshot

_Last updated: 2025-09-30_

## Completed
- Surveyed `PatientDashboardController` routes (`/overview`, `/appointments/history`, `/health-summary`) and removed references to non-existent endpoints (`/summary`, `/appointments`, `/documents`, `/proms`).
- Updated `test-all-endpoints.sh` to exercise the real patient-dashboard routes so auth smoke tests reflect current behaviour.
- Added `database/seeds/patient-dashboard.sql` with future/past visits, PROM results, and an unread message so the overview, history, and badge counts return representative payloads in dev.

## Next
- Extend patient portal smoke coverage once the UI consumes the seeded data (e.g. PROM trends and unread message badge).
- Evaluate whether additional seed fixtures are needed for documents or vitals if new dashboard cards are introduced.

## Notes
- The patient dashboard relies heavily on appointments/PROM responses; new seeds target patient `b96ee4f8-7051-7098-213f-dafccafb06f9` with the same tenant/provider IDs used by the clinic fixtures.
