# Testing Guide

This document captures the current expectations for automated and manual testing across the stack.

## Command palette

| Layer | Command | Notes |
| --- | --- | --- |
| Backend unit/integration | `cd backend && dotnet test` | Pass `--collect:"XPlat Code Coverage"` when you need coverage reports |
| Patient portal | `npm run test --workspace=@qivr/patient-portal` | Uses Vitest + React Testing Library |
| Clinic dashboard | `npm run test --workspace=@qivr/clinic-dashboard` | Mirror the patient portal approach |
| Widget | `npm run test --workspace=@qivr/widget` | Smaller footprint but keep parity |
| Lint | `npm run lint` | Fails the pipeline on warnings; fix before committing |
| Smoke check | `apps/check-status.sh` | Runs lint + targeted tests used in CI preflight |

## End-to-end and flows

| Scenario | Script | Purpose |
| --- | --- | --- |
| Cognito login | `node test-auth-flow.mjs` | Validates hosted UI login + the SPA token exchange |
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

- If `dotnet test` fails because a database is missing, ensure `npm run docker:up` is running or override the connection string to point at a local Postgres instance.
- Frontend tests require a modern Node environment (20+). Delete `node_modules` and reinstall if you see binary build errors.
- Snapshot updates belong in a dedicated commit unless they accompany code changes.

_Questions about testing strategy? Raise them in your PR so we can evolve these guidelines together._
