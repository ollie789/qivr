# Repository Hygiene – Progress Snapshot

_Last updated: 2025-09-30_

## Completed
- Archived legacy Cognito utility scripts (create-fixed-user-pool, fix-cognito-*, rebuild/recreate scripts) into `scripts/archive/` so the root stays focused on active workflows.
- Moved unused startup/test helpers (`start-backend`, `start-correct`, `start-local`, `stop-local`, `test-auth-flow`, `test-multi-tenant`, `verify-api-endpoints`, etc.) alongside the archived Cognito scripts.
- Preserved primary entry points (`start-all.sh`, `stop-all.sh`, `install.sh`, `check-status.sh`, `test-all-endpoints.sh`) at the root for everyday development.
- Closed the outstanding documentation tidy-up by updating the patient dashboard progress log after the new seeds landed.

## Next
- Review remaining shell helpers (`start-services.sh`, `start-all.sh`) for consolidation once the new multi-service launcher lands.

## Notes
- `scripts/archive/` keeps provenance without cluttering the default scripts list.
- Update onboarding docs after the entire refactor so new developers know which script to run.
