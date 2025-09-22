# QIVR Project Status & Roadmap
*Last reviewed: September 23, 2025*

## MVP Readiness Snapshot
| Area | Status | Notes |
| --- | --- | --- |
| Backend services | 🚧 Partial | PROM workflows now persist through Entity Framework, but core clinic management and analytics endpoints still serve placeholder data and tenant resolution from subdomains remains unimplemented. |
| Frontend applications | 🚧 Partial | The clinic dashboard continues to call legacy analytics routes and fabricates PROM breakdowns, while the PROM builder still falls back to non-GUID question IDs. The patient portal relies on a relative `fetch` wrapper without a configurable API base URL. |
| Data layer & migrations | ✅ Baseline | EF Core migrations are the source of truth and development seeding covers tenants, users, and PROM templates, yet no analytics or booking fixtures are provisioned. |
| Quality & testing | ⚠️ Minimal | Automated coverage remains limited to a single controller test—no integration or E2E guards exist for PROM, booking, or analytics flows. |
| Documentation | ⚠️ Divergent | `API_AUDIT_REPORT.md` still lists several controllers as "fully functional" even though the implementation contains TODOs and mock data. |

## Backend reality check
- **Clinic management endpoints**: `ClinicManagementController` returns hard-coded clinics, providers, and statistics in every action instead of querying `QivrDbContext`, leaving roster management, booking analytics, and clinic overviews without real data.【F:backend/Qivr.Api/Controllers/ClinicManagementController.cs†L33-L123】
- **Analytics**: The patient analytics controller keeps all vital-sign calculations behind `if (false)` blocks, so only PROM-derived metrics reach the dashboards and no clinical trends are produced yet.【F:backend/Qivr.Api/Controllers/AnalyticsController.cs†L42-L109】
- **Tenant safeguards**: `TenantMiddleware` still logs the detected subdomain but never resolves it to a tenant record, so multi-tenant isolation depends solely on JWT claims or headers.【F:backend/Qivr.Api/Middleware/TenantMiddleware.cs†L46-L66】
- **PROM architecture**: `PromInstanceService` now reads and writes templates, instances, responses, and booking requests through EF Core and is registered in DI, establishing the backend foundation described in `proms-integration-plan.md` and replacing the former in-memory mocks.【F:backend/Qivr.Services/PromInstanceService.cs†L32-L204】【F:backend/Qivr.Services/ServiceCollectionExtensions.cs†L28-L45】

## Frontend reality check
- **Clinic dashboard analytics**: `analyticsApi` still queries `/api/clinic-dashboard/metrics` and synthesises completion datasets when the backend returns nothing, so charts never reflect live totals even if the API is fixed.【F:apps/clinic-dashboard/src/services/analyticsApi.ts†L79-L142】
- **PROM builder payloads**: When `crypto.randomUUID` is unavailable (e.g., older browsers or SSR), new PROM questions fall back to IDs like `q_<timestamp>`, which do not satisfy the backend requirement for GUID question identifiers outlined in `proms-integration-plan.md`.【F:apps/clinic-dashboard/src/features/proms/components/PromBuilder.tsx†L260-L290】
- **Patient portal API client**: The portal's `apiClient` constructs requests with bare `fetch` calls and no configurable API base, so deployments that host the SPA separately from the API require additional proxying before any request succeeds.【F:apps/patient-portal/src/services/apiClient.ts†L14-L55】

## Data & tooling
- EF Core migrations under `backend/Qivr.Infrastructure/Migrations` are now authoritative and the legacy SQL artifacts have been removed; the database README documents the updated workflow and the super-admin endpoint seeds PROM templates/instances for local testing.【F:database/README.md†L1-L47】
- No automated process seeds analytics data, booking history, or vital signs, leaving the dashboards without representative fixtures.

## Documentation alignment
- `API_AUDIT_REPORT.md` marks controllers such as ClinicManagement, Analytics, and PromInstance as "fully functional," but the current source still contains TODOs and static responses. Treat the audit as historical context until it can be reconciled with the codebase.【F:docs/API_AUDIT_REPORT.md†L25-L73】
- `proms-integration-plan.md` accurately describes the remaining gaps between the refined PROM backend and the React clients; the workstreams in that plan should be prioritised before claiming PROM readiness.【F:docs/proms-integration-plan.md†L1-L32】

## Immediate priorities for baseline completion
1. Replace the remaining mock responses in clinic management and analytics controllers with tenant-aware EF queries so both dashboards can surface real data.
2. Finish tenant resolution by wiring subdomain lookups into `TenantMiddleware` and hardening logging/metrics for header overrides.
3. Align clinic dashboard and patient portal PROM clients with the EF-backed DTOs (stable GUID question IDs, real analytics endpoints, consistent payloads) and expose environment-aware API base URLs.
4. Backfill development fixtures for analytics, bookings, and vitals to exercise the new endpoints and unblock automated smoke tests.
5. Update `API_AUDIT_REPORT.md` after the above fixes so documentation once again reflects the deployed behaviour.
