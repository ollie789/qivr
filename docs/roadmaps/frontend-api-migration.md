# Frontend API Migration Roadmap

_Updated: 2025-09-30_

The clinic dashboard, patient portal, and widget apps still reference legacy endpoints from the pre-tenancy API surface. This roadmap tracks the remaining migrations so every UI feature consumes the current controllers and passes tenant/patient headers consistently.

## Clinic Dashboard

| Area | Entry Point(s) | Current Endpoints | Target Endpoints | Notes |
| ---- | -------------- | ---------------- | ---------------- | ----- |
| Dashboard overview | `pages/Dashboard.tsx`, `services/dashboardApi.ts` | ✅ `/api/clinic-dashboard/overview` | — | Metrics mapping verified; revisit once backend exposes additional fields |
| Appointments lifecycle | `pages/Appointments.tsx`, `services/appointmentsApi.ts` | ✅ `/api/appointments*` | — | UI now consumes cursor payloads; patient + provider selectors now pull from current APIs |
| Patient management | `pages/Patients.tsx`, `pages/PatientDetail.tsx`, `services/patientApi.ts` | ✅ `/api/patients` (list/detail) | `/api/patients`, `/api/patients/{id}`, `/api/medical-records?patientId=`, `/api/patient-dashboard/*` | Detail drawer now hydrates from `/api/patients/{id}`; waiting on richer history DTOs from backend |
| Medical records | `pages/MedicalRecords.tsx`, `services/medicalRecordsApi.ts` | ✅ `/api/medical-records*` | — | Service + UI now query mapper-based endpoints with tenant headers |
| Documents | `pages/Documents.tsx`, `services/documentsApi.ts` | ✅ `/api/documents*` | — | Uploads now use tenancy-aware client; sharing/review wired to new metadata schema |
| Messages | `pages/Messages.tsx`, `services/messagesApi.ts` | ✅ `/api/messages*` | — | Conversations + replies now driven by cursor endpoints; template manager consumes `/api/messages/templates` with sensible fallback |
| Notifications | Notification drawer, `services/notificationsApi.ts` | ✅ `/api/notifications*` | — | Drawer consumes cursor API + preferences endpoint; SSE feed wired in |
| Analytics | `pages/Analytics.tsx`, `services/analyticsApi.ts` | ✅ `/api/clinic-management/clinics/{id}/analytics` | — | Mapping now normalises new DTOs; consider migrating revenue drilldowns when backend exposes `/api/analytics/*` |
| Intake management | `pages/IntakeManagement.tsx`, `services/intakeApi.ts` | `/api/v1/evaluations*` | ✅ already matches current controller | Keep an eye on DTO evolution |
| PROM management | `pages/PROM.tsx`, `services/promApi.ts` | ✅ `/api/v1/proms/*` | — | Builder + scheduler now map responses; keep an eye on upcoming stats endpoints |
| Settings / Tenant selector | `pages/Settings.tsx`, `services/tenantService.ts`, new `TenantSelector` | `/api/tenants` | ✅ current | Confirm tenant selection propagates through auth store so headers update |

## Patient Portal

| Area | Entry Point(s) | Current Endpoints | Target Endpoints | Notes |
| ---- | -------------- | ---------------- | ---------------- | ----- |
| Dashboard overview | `features/dashboard`, `services/dashboardApi.ts` | ✅ `/api/patient-dashboard/*` | — | Overview, health summary, and PROM stats now aligned |
| Appointments | `features/appointments`, `services/appointmentsApi.ts` | ✅ `/api/appointments*` | — | Patient view now uses cursor endpoints + availability helpers |
| Medical records | `features/health-summary`, `services/medicalRecordsApi.ts` | ✅ `/api/medical-records*` | — | Clients switched to query-based routes with envelope unwrap |
| Documents | `features/documents`, `services/documentsApi.ts` | ✅ `/api/documents*` | — | Share/review flows now hit current controllers |
| PROMs | `features/proms`, `services/promsApi.ts` | ✅ `/api/v1/proms/*` | — | Submission, drafts, and history aligned with current controllers |
| Analytics | `services/analyticsApi.ts` | ✅ `/api/analytics/*` | — | Patient dashboard now uses mapped health + PROM endpoints |
| Evaluations | `pages/Evaluations.tsx`, `services/intakeApi.ts` | `/api/v1/evaluations` | ✅ current | Ensure tenant header supplied via api-client |
| Auth flows | `pages/Register.tsx`, `pages/VerifyEmail.tsx`, `services/cognitoAuthService.ts` | `/api/EmailVerification/*` | ✅ current | Claims now stored in clean `custom:*` slots |

## Widget

| Area | Entry Point(s) | Current Endpoints | Target Endpoints | Notes |
| ---- | -------------- | ---------------- | ---------------- | ----- |
| Intake submission | `Widget.tsx` | ✅ `/api/v1/intake/submit` | — | Optionally attach `X-Clinic-Id` from embedding context |

## Execution Checklist

1. Clinic flows ✅; follow-ups tracked per row (patient detail DTOs, message template UX, analytics drilldowns).
2. Patient portal flows ✅; any new `/api/analytics` contracts can be adopted incrementally as the backend evolves.
3. After each migration, run smoke helpers (`run-api-tests.sh`, `test-api-direct.mjs`) and spot-check the UI with seeded data.
4. Keep tenant/patient header propagation centralized in the auth stores (`useAuthStore`, `AuthContext`) and API client wrappers.

Track completed migrations by ticking the relevant rows or annotating this doc as features move over.
