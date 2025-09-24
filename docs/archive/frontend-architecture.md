# Frontend Architecture Audit – Clinic Dashboard & Patient Portal

> Snapshot captured on $(date '+%Y-%m-%d') to baseline current structure, ownership, and consolidation opportunities across the two React clients in `apps/`.

## 1. High-Level Overview

- **Clinic Dashboard (`apps/clinic-dashboard`)** – staff-facing Vite + React + MUI app. Uses Cognito via Amplify, React Query, a `DashboardLayout`, and lazy-loaded routes (see `src/App.tsx`).
- **Patient Portal (`apps/patient-portal`)** – patient-facing Vite + React + MUI app. Similar stack with `AuthLayout`/`MainLayout` pair, Amplify bootstrapping in `App.tsx`, and routing delegated to `AppContent.tsx`.
- **Shared Assets** – only `apps/shared` (DocumentUpload + document service) is actively shared. Most overlap is still duplicated per app.

## 2. Clinic Dashboard Structure & Usage

```
src/
  App.tsx                     // Router + layout wiring (lazy pages)
  components/                 // Auth, layout, dialog components
  features/analytics          // Shared stat cards + chart widgets
  features/appointments       // Feature modules (components/hooks)
  features/intake
  features/proms
  pages/                      // Route-level screens (Dashboard, Analytics, etc.)
  services/                   // API wrappers backed by lib/api-client
  stores/authStore.ts         // zustand auth state / Amplify bridge
  lib/api-client.ts           // Canonical HTTP client (Amplify token + tenant headers)
```

### Routing & Layout

- `App.tsx` mounts `DashboardLayout` behind `PrivateRoute` for all authenticated routes; lazy loads `Dashboard`, `IntakeManagement`, `Appointments`, `Patients`, `PatientDetail`, `Messages`, `Documents`, `MedicalRecords`, `PROM`, `Analytics`, `Settings`.
- `PrivateRoute` checks `authStore.checkAuth()` on mount; displays `CircularProgress` while `isLoading` (Zustand + Amplify integration).

### Active Pages

| Page | Status | Notes |
|------|--------|-------|
| `Dashboard.tsx` | **In use** | Pulls analytics stats via `analyticsApi`; now composed from `features/analytics` widgets. |
| `Analytics.tsx` | **In use** | Consumes `features/analytics` components + new stat card grid. |
| `IntakeManagement.tsx` | **In use** | Connects to `intakeApi`; supersedes legacy intake pages. |
| `Appointments.tsx` | **In use** | Uses `appointmentsApi`; heavy UI logic inline. |
| `Patients.tsx` / `PatientDetail.tsx` | **In use** | Need review for shareable patient summary components. |
| `PROM.tsx` | **In use** | Relies on `promApi` / `promInstanceApi`. |
| `Documents.tsx` | **In use** | Custom file CRUD; should leverage shared doc upload widget. |
| `MedicalRecords.tsx` | **In use** | Connects to `medicalRecordsApi` (mock-heavy). |
| `Messages.tsx` | **In use** | Messaging workflows; duplicates logic from `features`. |
| `IntakeProcessing.tsx` / `IntakeQueue.tsx` | **Removed** | Legacy, unrouted pages deleted in cleanup (rely on `IntakeManagement`). |

### Services & Duplication

- `lib/api-client.ts` is the canonical HTTP wrapper and now exports shared `handleApiError`/`isApiError` helpers; `sharedApiClient.ts` alias was removed and all services/pages consume the same client.
- `services/index.ts` re-exports the canonical client; DTO naming conflicts still block re-exporting analytics/dashboard types (consider shared types package next).
- Auth flow consolidated on Amplify via `authStore` selectors (`useAuth`, `useAuthStatus`, etc.); no remaining JWT usage in clinic dashboard.

### Components / Features

- `features/proms/components/PromBuilder.tsx` now enforces GUID IDs and normalized payload. This should be treated as the canonical PROM builder.
- `components/PromPreview.tsx`, `components/PROMSender.tsx`, etc. embed service calls; candidates for `features/proms/hooks.ts` to reduce duplication.
- Layout primitives (`DashboardLayout`, side nav, top bar) mirror patient portal’s `MainLayout`.

### Cleanup Targets

- Audit remaining API DTO exports so analytics/dashboard services can be re-exported without conflicts.
- Identify shared PROM/document components that could join the analytics widgets in `features/` to reduce duplication across apps.
- Evaluate patient portal for legacy enhanced pages that can reuse the new analytics/stat components.

## 3. Patient Portal Structure & Usage

```
src/
  App.tsx              // Amplify init + QueryClient provider
  AppContent.tsx       // Router definitions (AuthLayout/MainLayout)
  components/          // PrivateRoute, LoadingScreen, PROM cards
  contexts/AuthContext // Auth state (Amplify session)
  layouts/             // AuthLayout, MainLayout
  pages/               // Enhanced pages, some archived legacy views
  services/            // api.ts (shared client) + deprecated apiClient.ts
  theme.ts             // MUI theme (similar to clinic theme)
```

### Routing & Layout

- Auth routes (`/login`, `/register`, `/verify-email`, `/confirm-email`) share `AuthLayout`.
- Protected routes wrap `MainLayout` in `PrivateRoute`; includes `/dashboard`, `/medical-records`, `/documents`, `/analytics`, `/evaluations`, `/appointments`, `/proms`, `/profile`.
- `App.tsx` sets up Amplify and Query Client but delegates routing to `AppContent`.

### Pages

| Page | Status | Notes |
|------|--------|-------|
| `Dashboard.tsx` | **In use** | Patient overview with mock data; shares patterns with clinic Dashboard. |
| `AnalyticsEnhanced.tsx` | **In use** | Massive component with inline fetch calls to `/api/Analytics/*`; heavy reliance on placeholder data. |
| `DocumentsEnhanced.tsx` / `MedicalRecordsEnhanced.tsx` | **In use** | Each implements its own fetch + UI; parallels clinic versions. |
| `Evaluations.tsx` / `EvaluationDetail.tsx` | **In use** | PROM/evaluation history; need to reuse service layer from clinic. |
| `Appointments.tsx`, `BookAppointment.tsx` | **In use** | Appointment flows; check duplication with clinic `Appointments`. |
| `PROMEnhanced.tsx`, `CompletePROM.tsx` | **In use** | PROM workflows; analytics and builder should align with clinic features. |
| `pages/archive/*` (`Messages.tsx`, `Settings.tsx`, `SignUp.tsx`) | **Unused** | Safe to delete unless used for reference. |
| `AppSimple.tsx` | **Unused** | Demo entry point; not exported. |

### Services & Duplication

- Two competing HTTP clients:
  - `lib/api-client.ts` (shared approach with Amplify + `@qivr/http`).
  - `services/apiClient.ts` (custom fetch + localStorage token). **Recommendation:** delete the latter and update imports to use `lib/api-client` exclusively.
- `services/api.ts` simply re-exports `lib/api-client` for backwards compatibility. Once migration is complete, collapse to a single entry point.
- Auth context handles Amplify session. Could share logic with clinic `authStore` via a common package.

### Components / Layout

- Layout components mirror clinic layout. Align navigation, theming, and page containers to reduce divergence.
- `components/PrivateRoute.tsx` duplicates the clinic implementation; should move to shared UI package.
- `LoadingScreen.tsx` valuable for both apps.

### Cleanup Targets

- Remove archive pages and `AppSimple.tsx` to reduce noise.
- Refactor enhanced pages (`Analytics`, `Documents`, `MedicalRecords`, `PROM`) into modular `features/*` directories with hooks and shared components.
- Share theme tokens with clinic app to maintain consistent styling.

## 4. Cross-App Consolidation Opportunities

1. **Routing & Auth Guard** – Extract a single `PrivateRoute` (and potentially `PublicRoute`) component driven by injected auth hooks. Both apps currently maintain near-identical versions.
2. **Amplify / Auth Config** – `config/amplify.ts` duplicated; publish a shared function in `packages/auth` and import from both apps.
3. **HTTP Client** – Standardize on `@qivr/http` wrappers (already used in `lib/api-client.ts`). Remove patient portal’s `services/apiClient.ts` and any direct `fetch` usage.
4. **Analytics Components** – Build a shared analytics component library (stat cards, trend charts, PROM completion pie) consumed by both dashboard and patient portal to avoid divergence.
5. **PROM Tooling** – Promote `features/proms` (builder, preview, sender) into a shared package or at least share types + API hooks. Patient portal should reuse these for evaluation flows.
6. **Document & Medical Record UIs** – Unify around shared components/services; both apps fetch similar data sets.
7. **Theme & Tokens** – Consolidate MUI theme definitions (palette, typography, shape) into a shared module with configuration overrides per app.
8. **Type Definitions** – Avoid duplicate exports by moving DTOs (`DashboardStats`, `PromResponse`, etc.) into `packages/types` or a generated client.

## 5. Recommended Next Steps

1. **Publish Shared Frontend Package**
   - Extract `features/analytics` + auth/layout primitives into `@qivr/frontend` for reuse across apps.
   - Include shared theme tokens and PROM/document helpers once consolidated.

2. **Finalize API Typings**
   - Move duplicated DTOs (`DashboardStats`, `PromResponse`, etc.) into a shared types package to unblock full service re-exports.

3. **Carry Over Cleanup to Patient Portal**
   - Remove portal archives and point analytics/dashboard pages at the new shared components.

4. **Document Auth Flow**
   - Add Amplify setup + Zustand hook usage to onboarding docs now that `useAuth*` APIs are canonical.

5. **Document Architecture & Ownership**
   - Keep this audit updated as we consolidate to avoid reintroducing duplication.
   - Link from `docs/DOCUMENTATION_INDEX.md` so others can discover the reference (already added by Sprint 2 work).

---

This document is intended as an internal working reference. Update after each consolidation milestone so future contributors have an accurate map of the frontend surface area.
