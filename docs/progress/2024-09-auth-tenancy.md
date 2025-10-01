# Auth & Tenancy Hardening – Progress Snapshot

_Last updated: 2025-09-30_

## Completed
- Added `/api/auth/refresh-token` support for JSON payloads and aliased `/api/auth/refresh` for backward compatibility.
- Implemented `/api/tenants/{tenantId}` lookup to complement the existing tenants list.
- Hardened `/api/profile` to fall back to Cognito claims when no persisted profile exists and prevented SQL errors when legacy tables are missing.
- Updated the tenant middleware allowlist to include `/api/tenants` so discovery works before a tenant header is set.
- Began cleaning shared tooling: `test-all-endpoints.sh` no longer trips over empty bodies, uses the correct refresh endpoint, and emits friendlier failure output.
- Realigned `test-api-migration.ts` and `test-auth-flow.mjs` to exercise the current clinic and patient dashboard endpoints instead of the legacy `/api/dashboard/*` and `/api/auth/*` routes.

## In Flight / Next
- Continue pruning legacy shell/doc artifacts as each feature group is reviewed.
- Expand automated coverage once feature-specific endpoints are verified (clinic dashboard up next per roadmap).

## Notes
- Profile service now tolerates missing rows/data and logs warnings instead of failing the request.
- Keep an eye on `test-all-endpoints.sh` – additional restructuring will follow as later feature groups are tackled.
