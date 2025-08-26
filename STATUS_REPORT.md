# Qivr Status Report

## Executive Summary
- Core backend API and database are in place with multi-tenant support and CORS configured for local apps.
- Frontends (widget, clinic dashboard, patient portal) exist; dashboard and portal currently lean on mock/test endpoints for development.
- Widget now posts to backend using configurable API URL (VITE_API_URL).

## Backend ↔ Frontend Integration
- Widget → Backend: Public intake endpoint available at `/api/v1/intake/submit`. Widget updated to use `${VITE_API_URL}`.
- Clinic Dashboard → Backend: Uses `/api/appointments` and `/api/TestData/*` during dev. Authentication required for real data.
- Patient Portal → Backend: API clients exist; many flows currently return mock data in dev.

## Risks/Blockers
- Real auth/token flow not wired in local dev across all apps (uses mocks).
- Calendar integrations require external credentials.
- PROM workflows partially implemented end-to-end.

## Next Steps (2 weeks)
1. Wire dashboard to real evaluation/intake data
   - Replace `/api/TestData/*` with real endpoints
   - Add authenticated calls using Cognito tokens
2. Complete patient portal flows
   - Appointments list/booking; PROMs list and submission
   - Remove mock interceptors behind a dev flag
3. PROM system
   - Finish scheduling and scoring; expose `/api/v1/proms` endpoints in FE
4. Calendar integration
   - Complete Google OAuth flow locally; add availability UI hooks
5. Observability & CI
   - Add minimal API smoke tests; align Node 20 in CI; optional

## Environment Notes
- pgAdmin runs on `http://localhost:8081` per docker-compose.
- Set `VITE_API_URL` for each app as appropriate (e.g., `http://localhost:5000`).