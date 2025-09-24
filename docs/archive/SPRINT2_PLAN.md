# Sprint 2 Plan – Frontend Integration

## Objective
Align the clinic dashboard front-end with the updated backend analytics and PROM endpoints so charts, tables, and metrics reflect real data instead of mocks.

## Workstreams
- **Analytics Service Refresh**: Replace legacy `analyticsApi` calls with the `/api/clinic-management/clinics/{id}/analytics` response, updating dashboard and analytics pages to consume the richer dataset (trends, provider performance, PROM breakdowns).
- **PROM Client Alignment** *(next up)*: Enforce GUID question IDs in the builder, reshape POST payloads to match backend DTOs, and standardise request headers via the shared API client.
- **Validation & QA**: Add smoke validation steps (manual or automated) to ensure key widgets render data correctly after the refactor.

## Next Steps
1. Finish analytics client refactor (in progress in current context).
2. Tackle PROM builder and client alignment once analytics are merged.
3. Document manual verification steps for the dashboard and analytics screens.
