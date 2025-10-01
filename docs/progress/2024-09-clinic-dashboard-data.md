# Clinic Dashboard Data Seeding – Progress Snapshot

_Last updated: 2025-09-29_

## Completed
- Added `database/seeds/clinic-dashboard.sql` to create representative appointments and PROM responses for tenant `b6c55eef...` and provider `a0c05a9f...`.
- Ensured the seed is idempotent via `IF NOT EXISTS` guards so it can be re-run safely in dev/test databases.
- Seeds include future, past, and completed appointments to exercise overview/metrics queries, plus a PROM template/instance/response for the metrics view.

## Next
- Document invocation (e.g. `psql -f database/seeds/clinic-dashboard.sql`) and hook into any existing setup scripts if desired.
- Expand seeds with additional providers/patients if multi-provider dashboards need coverage.

## Notes
- Seed relies on existing tables (`appointments`, `prom_templates`, `prom_instances`, `prom_responses`) – run migrations first.
- Keep tenant/provider IDs in sync with Cognito seed users to avoid cross-tenant noise.
