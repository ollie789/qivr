# Testing Guide

This document captures the current expectations for automated and manual testing across the stack.

## Command palette

| Layer | Command | Notes |
| --- | --- | --- |
| Backend unit/integration | `cd backend && dotnet test` | Falls back to a local `qivr_test` database unless `TEST_CONNECTION_STRING` is provided |
| Patient portal | `npm run test --workspace=@qivr/patient-portal` | Uses Vitest + React Testing Library |
| Clinic dashboard | `npm run test --workspace=@qivr/clinic-dashboard` | Vitest suite covers PROM API stat mapping (`src/services/__tests__/promApi.test.ts`) |
| Widget | `npm run test --workspace=@qivr/widget` | Smaller footprint but keep parity |
| Lint | `npm run lint` | Fails the pipeline on warnings; fix before committing |
| Smoke check | `apps/check-status.sh` | Runs lint + targeted tests used in CI preflight |

### Backend database dependency

`Qivr.Tests` resolves the connection string in the following order:

1. `TEST_CONNECTION_STRING` environment variable (use this for CI or pointing at disposable databases)
2. Values inside `backend/.env.aws-dev` if present
3. `backend/Qivr.Api/appsettings.Development.json`
4. Fallback: `Host=localhost;Port=5432;Database=qivr_test;Username=qivr_user;Password=QivrDevPassword2024!`

Ensure the target database has the latest migrations before running the suite.

## End-to-end and flows

| Scenario | Script | Purpose |
| --- | --- | --- |
| Cognito login | `node test-auth-flow.mjs` | Validates hosted UI login + the SPA token exchange (set `VITE_ENABLE_DEV_AUTH=false` first) |
| API migrations | `ts-node test-api-migration.ts` | Ensures EF migrations apply cleanly before release |

Cypress-based UI flows are still on the backlog. Until they exist, exercise critical workflows manually (clinic login, booking, PROM completion) before releases.

## Expectations

- Keep unit test coverage above 70% on new services/components – we place the bar higher when touching auth, billing, or data export.
- When fixing a bug, add a regression test alongside the fix.
- Prefer React Testing Library for component tests (no Enzyme). Use MSW to stub API calls where needed.
- Backend integration tests live in `backend/Qivr.Tests`. Organise tests to mirror the namespaces they cover.

## Continuous integration

The pipeline runs `npm run lint`, workspace tests, and `dotnet test` on every pull request and on pushes to `main`. Failing jobs block merges – reproduce locally before re-running the workflow.

## Troubleshooting

- If `dotnet test` fails with a connection error, verify Postgres is running locally or that `TEST_CONNECTION_STRING` points at an accessible instance.
- Frontend tests require a modern Node environment (20+). Delete `node_modules` and reinstall if you see binary build errors.
- Snapshot updates belong in a dedicated commit unless they accompany code changes.

_Questions about testing strategy? Raise them in your PR so we can evolve these guidelines together._
