# Clinic Frontend Cleanup Overview

> Single reference for the clinic dashboard frontend: current state, delivered cleanup, and the remaining roadmap. Use this document going forward instead of juggling the legacy architecture notes.

## 1. Current Status (2025-09-23)
- **Lint:** `npx eslint src --ext .ts,.tsx` → 0 errors, 0 warnings
- **Type safety:** No `any` usage in clinic dashboard
- **Data flow:** `lib/api-client` + shared `handleApiError`/`isApiError` power every service call
- **Docs:**
  - `docs/FRONTEND_ARCHITECTURE.md` – detailed history/metrics
  - `docs/frontend-architecture.md` – original audit (kept for baseline)

## 2. What’s Been Delivered
### Type & API Consolidation
- Removed `sharedApiClient`; all services route through `lib/api-client`
- Added reusable error helpers; consumed across services/components
- Typed PROM, intake, medical record, and patient services
- Eliminated every `any` in dashboard components (PROM flow, intake, patients, medical records, schedule dialog, login)

### Component & Feature Work
- Analytics widgets extracted to `features/analytics` and consumed on dashboard/analytics pages
- Intake management + evaluation viewer now use typed helpers and selectors
- PROM preview/sender dialogs share DTOs and use typed configuration
- Patients page now runs on fully typed form dialogs with optimistic updates

### Supporting Changes
- `SelectField` component introduced for consistent dropdown styling/validation
- New `forms`, `mui`, and `icons` component barrels keep imports tidy
- Documentation refreshed and cross-linked (`FRONTEND_ARCHITECTURE.md` now reflects clean slate)

## 3. Architecture Snapshot (Clinic Dashboard)
```
apps/clinic-dashboard/
├── src/
│   ├── App.tsx                     // Router + lazy routes
│   ├── components/                 // Shared UI, forms, layout, auth
│   ├── features/
│   │   ├── analytics/              // Stat cards + charts
│   │   ├── appointments/           // Scheduling widgets/hooks
│   │   ├── intake/                 // Intake management surfaces
│   │   └── proms/                  // PROM builder/preview stack
│   ├── pages/                      // Route-level screens
│   ├── services/                   // Typed API wrappers via lib/api-client
│   ├── stores/                     // Zustand stores (auth etc.)
│   └── lib/api-client.ts           // Amplify-aware HTTP client + helpers
```

## 4. Next Steps
### Short Term (in-flight)
1. **Patient dialog polish** – Form is wired, add validation visuals and optional fields (tags/conditions) before submission.
2. **Appointments refactor** – Break `pages/Appointments.tsx` (≈800 lines) into `features/appointments/*` with hooks + components.
3. **Documents page** – Swap in shared `FileUpload`, ensure service uses typed responses.

### Medium Term
1. **Shared DTO package** – Promote core DTOs (PROM, intake, patient) into `@qivr/types` for reuse across apps.
2. **Portal cleanup** – Apply the same typing and analytics refactors to `apps/patient-portal` (drop legacy client, reuse widgets).
3. **Optimistic flows** – Extend optimistic updates to other CRUD surfaces (documents, medical records) once real APIs land.

### Long Term
- Promote shared UI primitives (PrivateRoute, layout shell, analytics cards) into a common workspace package.
- Generate typed API clients from backend contracts/OpenAPI when available to keep services in sync.
- Replace remaining mock data paths with real endpoints (medical records, patient history) as backend support arrives.

## 5. Useful Commands
```bash
# Clinic dashboard lint
cd apps/clinic-dashboard && npx eslint src --ext .ts,.tsx

# Type coverage snapshot
npx type-coverage

# Largest TSX files (identify refactor targets)
find apps/clinic-dashboard/src -name "*.tsx" -exec wc -l {} \; | sort -rn | head -20
```

## 6. Related Docs
- `docs/FRONTEND_ARCHITECTURE.md` – cleanup campaign history, historical metrics
- `docs/frontend-architecture.md` – initial audit and consolidation notes
- `docs/DOCUMENTATION_INDEX.md` – updated listing (includes this overview)

---
_Keep this doc updated after each major refactor or architecture change so new work can pick up the current state without context drift._
