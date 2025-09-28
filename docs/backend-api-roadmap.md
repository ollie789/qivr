# Backend API Remediation Roadmap

_Last updated: 2025-09-26_

This document tracks the work required to unblock the clinic dashboard and patient portal from 401/404 responses while restoring the full appointment → assessment → review workflow.

## Objectives

1. Align authentication/configuration between frontends and the API so authorised calls carry valid Cognito tokens and tenant context.
2. Implement or stabilise the API endpoints relied on by the React apps (appointments, documents, medical records, PROMs).
3. Reinstate test coverage and tooling so regressions are caught automatically.

## Workstream Tracker

| Workstream | Owner | Status | Notes |
| --- | --- | --- | --- |
| Auth configuration audit |  | ☐ Not started | Ensure Cognito metadata matches across environments. |
| Seed users & tenants |  | ☑ Done | New provisioning CLI syncs Cognito users into Postgres. |
| Appointments API parity |  | ⧗ In progress | Audit surfaced missing waitlist/reminder APIs + DTO gaps. |
| Documents API parity |  | ⧗ In progress | Tenant-wide list/upload + categories live; sharing/review still remaining. |
| Medical records API |  | ☑ Done | Summary/vitals endpoints + full medical record entities deployed; uses sample data when DB empty. |
| PROM scheduling & metrics |  | ☐ Not started | `/api/v1/proms/*` scheduling, submission, stats. |
| Integration/E2E tests |  | ☐ Not started | Backfill coverage and smoke tests. |
| Observability & logging |  | ☐ Not started | Useful logging for auth/tenant issues. |

Update this table as milestones progress.

## Phase 1 – Authentication & Tenant Alignment

### Deliverables
- **Config parity:** `appsettings.Development.json` (or environment variables) uses the same `CognitoUserPoolId`, `CognitoClientId`, and region as `apps/*/.env`. Document the source of truth.
- **Local fixtures:** A repeatable script or seeded migration that creates:
  - Clinic staff user matching `test.doctor@clinic.com` (tenant `b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11`).
  - Patient user matching `patient@qivr.health`.
  - Optional additional tenants for multi-tenant validation.
- **Tenant verification endpoint:** Lightweight endpoint (`GET /auth/debug` or similar) that returns detected user/tenant to help diagnose 401s.

### Tasks
1. Compare Cognito settings in front-end `.env` vs backend `appsettings`. Update backend if necessary.
2. Update/expand seed scripts (`database/seed-data.sql` or EF seeding) to include clinic + patient fixtures that match seeded Cognito users.
3. Add the auth debug endpoint and note how to use it in this document.
4. Smoke test: login via clinic dashboard, hit `/auth/debug`, confirm tenant + user match expectations.

#### Implementation notes _(2025-09-25)_
- Super admin API + admin console removed. Use the `backend/Qivr.Tools` CLI (or `./scripts/sync-dev-users.sh`) after creating Cognito users to upsert matching tenant/user records.
  ```bash
  ./scripts/sync-dev-users.sh
  # or
  dotnet run --project backend/Qivr.Tools -- --config backend/Qivr.Tools/dev-users.json
  ```
  Replace the placeholder Cognito sub values in `dev-users.json` (or pass `CLINIC_DOCTOR_SUB`/`PATIENT_SUB` env vars to the script) before syncing. The tooling now enforces EF’s snake-case mapping, sets the tenant context automatically (works with RLS), and aligns seeds by slug if the tenant IDs differ. Set `SYNC_DEV_USERS_ON_START=true` to run the sync automatically from `start-backend.sh`.
- Added `GET /api/auth/debug` (requires auth) to surface resolved tenants from claims, headers, and middleware context alongside the caller's claims. Quick check:
  ```bash
  curl -H "Authorization: Bearer <token>" http://localhost:5001/api/auth/debug | jq
  ```

### Acceptance Criteria
- Logging in through the clinic dashboard results in 200 responses for previously protected endpoints (no more global 401s due to missing tokens).
- Auth debug endpoint shows aligned tenant/user info.

## Phase 2 – Endpoint Coverage

### General Approach
For each area (appointments, documents, medical records, PROMs):
1. Catalogue the exact HTTP calls the React app makes (check `apps/clinic-dashboard/src/services/*`).
2. Confirm each exists in the API (Swagger/ controllers).
3. Implement missing actions or connect them to EF Core instead of mocks.
4. Seed representative data so the UI displays realistic content.
5. Document assumptions, query parameters, and expected payloads in Swagger.

### 2.1 Appointments
- **Endpoints:** `/api/Appointments`, `/api/Appointments/{id}`, `/api/Appointments/book`, `/api/Appointments/availability`, `/api/Appointments/upcoming`, waitlist endpoints.
- **Tasks:**
  - Implement GET list with filters (start/end date, provider) using EF context.
  - Wire POST `/book` to create real appointments, respecting tenant/clinic.
  - Implement availability logic or return meaningful placeholder data with TODO.
  - Add integration tests hitting create/list endpoints.
- **Seeds:** Provide clinic providers + sample appointments for the default tenant.

- Core CRUD, booking, availability, confirm/cancel/reschedule endpoints exist. Waitlist endpoints now persist entries via EF + new table, and reminders trigger the notification gateway + in-app alerts; email/SMS integration still pending.
- Seed tooling now provisions a demo clinic, provider profile, and three upcoming appointments. Appointment DTOs surface contact data, telehealth links, and payment flags so the clinic UI can render the seeded data.
- Next step: extend waitlist service with triage/assignment workflow, add email/SMS delivery on reminders, and backfill integration tests covering booking, upcoming, reminders, and waitlist flows.

### 2.2 Documents
- **Endpoints:** `/api/Documents`, `/api/Documents/patient/{id}`, `/api/Documents/upload`, `/api/Documents/{id}/download`, `/api/Documents/categories`.
- **Tasks:**
  - Implement patient-specific list to avoid returning hardcoded documents.
  - Ensure upload saves metadata to DB and streams file to MinIO/S3 (already configured locally).
  - Provide meaningful categories (intake, lab results, etc.).
  - Add integration test: upload → list → download.
- **Seeds:** Create a few patient documents per seeded patient.

#### Current status _(2025-09-25)_
- Tenant-wide listing, patient filtering, and general upload endpoints now hit EF-backed data (with presigned download URLs, metadata, and tags). Categories endpoint merges defaults with stored document types so the clinic app can drop mock data.
- Remaining gaps: document sharing API, staff review workflow, and integration tests exercising upload → list → download flows (including storage cleanup). Seed data still needed for demo documents.

### 2.3 Medical Records
- **Endpoints:** `/api/MedicalRecords`, `/api/MedicalRecords/vitals`, `/api/MedicalRecords/lab-results`, `/api/MedicalRecords/medications`, `/api/MedicalRecords/allergies`, `/api/MedicalRecords/immunizations`.
- **Tasks:**
  - Replace temporary sample data with real EF queries (patient_records, vitals, labs once populated).
  - Add export endpoint(s) delivering PDF/CSV bundles for download.
  - Add tests verifying summary + vitals payload shapes (include future seeded data).
- **Seeds:** Extend provisioning CLI to create patient medical history (conditions, vitals trend, meds, allergies) so portals show real data.

#### Current status _(2025-09-28)_
- ☑ **Database schema:** Created normalized medical record entities (conditions, vitals, labs, medications, allergies, immunizations) with tenant isolation
- ☑ **Migration applied:** Tables created via `20250925094500_AddMedicalRecordsTables` migration  
- ☑ **API endpoints:** `/api/medical-records` returns `ApiEnvelope<MedicalSummaryDto>`, sub-endpoints for vitals, lab-results, medications, allergies, immunizations
- ☑ **Data-aware fallback:** Queries new tables first, falls back to sample data when empty (maintains UI compatibility)
- ☑ **Seeded data:** All medical tables populated with realistic patient data:
  - 2 medical conditions (Hypertension, Type 2 Diabetes)
  - 3 vital sign records 
  - 6 lab results (Metabolic panel, Lipid panel)
  - 3 active medications (Metformin, Lisinopril, Atorvastatin)
  - 3 allergies (Penicillin, Peanuts, Dust mites)
  - 3 immunization records (Influenza, COVID-19, Tetanus)
- ☑ **Workaround applied:** Used SQL script (`seed-medical-records.sql`) to directly seed data, bypassing CLI tool RLS/jsonb issues
- Next: Add export endpoints for PDF/CSV bundles, fix CLI tool for future seeding needs

### 2.4 PROMs
- **Endpoints:** `/api/v1/proms/templates`, `/api/v1/proms/templates/by-id/{id}`, `/api/v1/proms/schedule`, `/api/v1/proms/instances`, `/api/v1/proms/instances/{id}/answers`, `/api/PromInstance`.
- **Tasks:**
  - Ensure templates/instances endpoints return real data (leverage `PromInstanceService`).
  - Implement scheduling to create an instance assigned to a patient.
  - Confirm submission endpoint stores answers and updates completion status.
  - Add stats endpoint (`/stats`) to drive dashboard widgets.
- **Seeds:** Provide at least one PROM template and pre-populated instance for the seeded patient.

## Phase 3 – Testing & Tooling

### Deliverables
- Integration test suite covering all newly activated endpoints (xUnit + in-memory database or test container).
- Front-end smoke tests (Cypress or Playwright) executing key flows: schedule appointment, upload document, complete PROM.
- GitHub Actions/CI job running `npm run lint`, `npm run test`, and backend tests per PR.

### Tasks
1. Add backend integration tests under `backend/Qivr.Tests` mirroring each controller.
2. Re-enable or write new smoke tests in `apps/check-status.sh` / `apps/tests` covering the clinic workflow.
3. Update CI configuration to run the new tests.

## Phase 4 – Observability & Follow-up

- Implement structured logging for auth failures (log tenant, user, endpoint).
- Add dashboards or simple scripts summarising 4xx/5xx rates during local testing.
- Document any remaining gaps (e.g., features intentionally stubbed) and define next steps.

## Reference

- Frontend service calls: `apps/clinic-dashboard/src/services/*`, `apps/patient-portal/src/services/*`
- Backend controllers: `backend/Qivr.Api/Controllers/*`
- Seed scripts: `database/seed-data.sql`, `backend/Qivr.Infrastructure/Migrations`

Keep this document updated as work progresses. Add sections if new gaps are discovered during implementation or testing.
