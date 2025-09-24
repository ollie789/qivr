# Qivr Feature Status & Integration Roadmap
*Last reviewed: September 23, 2025*

## Status legend
- ✅ Ready – implemented and exercised end-to-end
- 🚧 Partial – one side (backend/frontend) or critical wiring remains incomplete
- ⛔ Blocked – no viable implementation available yet

## Feature matrix
| Feature slice | Backend status | Frontend status | Key blockers |
| --- | --- | --- | --- |
| Tenant context & authentication | 🚧 JWT claims and headers set the tenant, but the middleware still logs subdomains without resolving them to tenants, leaving multi-tenant isolation incomplete.【F:backend/Qivr.Api/Middleware/TenantMiddleware.cs†L46-L66】 | 🚧 Multiple API clients coexist; pages like the patient PROM view still import the legacy `services/apiClient` wrapper that lacks a base URL and tenant header logic.【F:apps/patient-portal/src/pages/PROMEnhanced.tsx†L86-L118】【F:apps/patient-portal/src/services/apiClient.ts†L14-L45】 | Implement subdomain lookup in the middleware and consolidate the portals onto the shared `lib/api-client` helper. |
| Clinic roster & operations | ⛔ `ClinicManagementController` responses are entirely mocked, so no clinics, providers, or stats can be managed via the API yet.【F:backend/Qivr.Api/Controllers/ClinicManagementController.cs†L33-L123】 | 🚧 UI screens exist but depend on the missing real data, preventing meaningful CRUD or analytics flows. | Replace controller TODOs with EF-backed queries and wire the dashboard to the new endpoints. |
| PROM lifecycle | ✅ `PromInstanceService` persists templates, instances, answers, reminders, and booking requests through EF and is registered in DI.【F:backend/Qivr.Services/PromInstanceService.cs†L32-L204】【F:backend/Qivr.Services/ServiceCollectionExtensions.cs†L28-L45】 | 🚧 The clinic PROM builder still generates fallback IDs like `q_<timestamp>` when `crypto.randomUUID` is unavailable, which violates the backend's GUID expectations documented in the PROM integration plan.【F:apps/clinic-dashboard/src/features/proms/components/PromBuilder.tsx†L260-L290】【F:docs/proms-integration-plan.md†L1-L32】 | Enforce GUID generation on the client and align payloads with the EF-backed DTOs. |
| PROM analytics & follow-up | 🚧 Stats endpoints exist but depend on PROM submissions being recorded; clinic analytics still rely on future EF queries, and patient analytics omit vitals due to disabled branches.【F:backend/Qivr.Api/Controllers/AnalyticsController.cs†L42-L109】 | 🚧 The clinic analytics client continues to call legacy routes and fabricates PROM completion breakdowns when data is missing.【F:apps/clinic-dashboard/src/services/analyticsApi.ts†L79-L142】 | Deliver real analytics queries and update the client to consume them without mock fallbacks. |
| Booking & scheduling | 🚧 PROM submissions can raise booking requests through the backend API, but there is no clinic workflow to review or convert them.【F:backend/Qivr.Api/Controllers/PromInstanceController.cs†L200-L247】 | ⛔ No UI exposes booking requests produced by PROMs; dashboards therefore lack the promised conversion insights. | Surface booking queues in the clinic dashboard and connect them to appointment creation. |
| Patient portal overview | 🚧 Backend endpoints for `/api/patient-dashboard/...` remain to be validated against the new data model. | ⛔ The dashboard page still targets legacy paths (`/dashboard/stats`, `/appointments/upcoming`, `/proms/pending`) that are not served by the current API, so cards remain empty.【F:apps/patient-portal/src/pages/Dashboard.tsx†L70-L88】 | Implement aligned patient-facing endpoints and update the page to call them via the shared API client. |
| Intake automation | ⛔ `IntakeProcessingWorker` logs TODOs for AI triage, notifications, and record creation, so intakes never progress beyond placeholders.【F:backend/Qivr.Api/Workers/IntakeProcessingWorker.cs†L172-L210】 | 🚧 Intake queues surface in the UI but cannot reflect automated outcomes. | Complete the worker pipeline and expose status updates through the dashboard. |
| Notifications & messaging | 🚧 Entities and controllers exist, yet real-time delivery and cursor pagination still require verification against the latest Notification schema.【F:backend/Qivr.Api/Controllers/NotificationsController.cs†L1-L120】 | 🚧 No consolidated notification centre is wired up in either SPA. | Validate notification delivery and surface the inbox/badge UI. |

## Near-term integration goals
1. Replace the mocked clinic management responses with tenant-aware EF queries and plumb them into the dashboard.
2. Finish the PROM client alignment (GUIDs, payload shapes, analytics consumption) described in `proms-integration-plan.md` before expanding template features.
3. Stand up patient dashboard endpoints that match the portal's needs, then migrate the portal to the shared API client and updated routes.
4. Enable intake and booking follow-up loops so analytics can report real conversion and workload metrics.
