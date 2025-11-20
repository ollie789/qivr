# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core commands

### Repo-level (Node workspaces)
- Install dependencies: `npm install`
- Build all workspaces: `npm run build`
- Run all JS/TS tests (workspace-level unit tests): `npm run test`
- Lint all workspaces: `npm run lint`
- Type-check frontends: `npm run type-check`
- Clean caches and `node_modules`: `npm run clean`

### Local environment & services
- Start local infra (Postgres, Redis, MinIO, Mailhog, etc.): `npm run docker:up`
- Stop local infra: `npm run docker:down`
- Tail Docker logs: `npm run docker:logs`
- Apply DB migrations (EF Core wrapper): `npm run db:migrate`
- Seed DB directly (psql): `npm run db:seed`

### Backend (.NET API)
From repo root (preferred scripts):
- Dev API (watch mode): `npm run backend:dev` (runs `dotnet watch run --project Qivr.Api`)

From `backend/` directly:
- Restore packages: `dotnet restore`
- Run API once: `dotnet run --project Qivr.Api`
- Run backend tests (all projects): `dotnet test`
- Run tests for a single project, e.g. infrastructure tests: `dotnet test Qivr.Tests/Qivr.Tests.csproj`

### Frontend apps (Vite + React)
All apps are workspaces under `apps/`.

From repo root via workspaces:
- Clinic dashboard dev: `npm run clinic:dev`
- Patient portal dev: `npm run patient:dev`
- Widget dev: `npm run widget:dev`

From each app directory (e.g. `apps/clinic-dashboard`, `apps/patient-portal`):
- Start dev server: `npm run dev`
- Build app: `npm run build`
- Preview production build: `npm run preview`
- Lint app: `npm run lint`
- Run app unit tests (Vitest): `npm run test`
- Run a single Vitest test file:
  - `npx vitest path/to/file.test.tsx`
- Run a single test by name (inside app):
  - `npx vitest path/to/file.test.tsx -t "test name"`

### End-to-end / integration tests
Primary docs: `docs/testing.md` and `scripts/tests/README.md`.

From repo root:
- Main live-system E2E suite: `node scripts/tests/test-live-system.mjs`
- Run all scripted tests via wrapper: `./scripts/run-tests.sh <env> [email password]`
  - Example (prod-like with new clinic): `./scripts/run-tests.sh production`
  - Example (prod-like with existing user): `./scripts/run-tests.sh production user@clinic.com Password123!`

Individual scripted suites:
- Live system (creates tenant and exercises full flow):
  - `node scripts/tests/test-live-system.mjs production`
- API endpoint regression tests:
  - `node scripts/tests/test-api-endpoints.mjs user@clinic.com Password123! production`
- Frontend page tests (Playwright):
  - `node scripts/tests/test-frontend-pages.mjs user@clinic.com Password123! production`

### Local setup quick path
For a new machine (see `docs/setup.md` for details):
- Clone & install:
  - `git clone git@github.com:qivr-health/qivr.git`
  - `cd qivr && npm install`
  - `cd backend && dotnet restore && cd ..`
- Configure env files (minimal for local dev):
  - `backend/.env` – toggle `DevAuth__Enabled` and optional Cognito
  - `apps/*/.env` – set `VITE_API_URL` and `VITE_ENABLE_DEV_AUTH`
- Start infra and services:
  - `npm run docker:up`
  - `npm run backend:dev`
  - `npm run clinic:dev`
  - `npm run patient:dev`
  - `npm run widget:dev`

## High-level architecture

### Monorepo layout
This is a Node workspaces + .NET monorepo that hosts:
- **Frontend apps** under `apps/`
  - `clinic-dashboard`: staff-facing clinic UI
  - `patient-portal`: patient-facing portal
  - `widget`: embeddable booking/interaction widget
- **Backend** under `backend/` – .NET 8 modular monolith
- **Shared JS/TS packages** under `packages/` (notably `@qivr/http` and the design system)
- **Database and infra** under `database/` and `infrastructure/`
- **Operational scripts & tests** under `scripts/` and `scripts/tests/`

Core documentation entry points:
- Root overview: `README.md`
- Docs index: `docs/README.md`
- Architecture: `docs/architecture.md`
- Development reference: `docs/development.md`
- Local setup: `docs/setup.md`
- Testing guide: `docs/testing.md`

### Backend architecture (ASP.NET Core)
Backend projects (see `backend/Qivr.sln` and `backend/README.md`):
- `Qivr.Api` – ASP.NET Core entrypoint
  - Controllers expose REST endpoints for auth, appointments, intake, PROMs, messaging, documents, etc.
  - Middleware handles tenant resolution, security headers, rate limiting, and exception shaping.
  - Options/config classes map `appsettings*.json` and env variables.
- `Qivr.Core` – domain contracts
  - Entities, enums, and interfaces shared across layers.
- `Qivr.Infrastructure` – data and integrations
  - EF Core `DbContext`, migrations, repositories.
  - External services: storage (S3/MinIO), SMS (MessageMedia), calendar providers, etc.
- `Qivr.Services` – application/business services
  - Orchestrates domain workflows: intake processing, calendar sync, notification gating, AI analysis, etc.

Key ideas for changes on the backend:
- New domain behavior generally belongs in `Qivr.Services` with interfaces in `Qivr.Core` and EF wiring in `Qivr.Infrastructure`.
- Controllers in `Qivr.Api` should stay thin and delegate to services.
- Multi-tenancy is enforced via middleware + RLS; preserve tenant context propagation when adding endpoints.

### Frontend architecture (React + Vite)
All React apps share a similar structure and rely on a common toolset:
- TypeScript + Vite
- React Router for routing
- React Query for server state
- MUI for UI primitives
- Zustand for auth/session and limited global state
- Shared HTTP abstraction via `@qivr/http`

Clinic dashboard (`apps/clinic-dashboard`, see its `README.md`):
- `src/features/*` – domain-level modules (patients, appointments, analytics, messaging, documents, medical records, settings, etc.).
- `src/components` – layout and reusable UI pieces (navigation, forms, widgets).
- `src/services` – API clients built on `@qivr/http` with typed DTOs.
- `src/stores` – Zustand stores for auth/session and cross-feature state.

Patient portal (`apps/patient-portal`, see its `README.md`):
- Mirrors the feature-first layout: `src/features`, `src/components`, `src/services`, etc.
- Auth is Cognito-based; a central API client module wires Amplify/Cognito to `@qivr/http`/fetch and attaches tenant/patient context.

Widget app (`apps/widget`):
- Minimal feature surface, focused on embeddable components and hooks.
- Reuses HTTP client and shared DTOs where possible.

### Shared packages and contracts
- `packages/http` (`@qivr/http`):
  - Thin wrapper around `fetch` responsible for consistent auth header/cookie handling and error normalization.
  - Frontends should prefer these helpers over raw `fetch` to keep auth and error behavior consistent.
- `packages/design-system`:
  - Shared design tokens and UI primitives consumed by both main frontends and the widget.

When introducing cross-cutting JS/TS utilities or shared types between apps, prefer placing them in `packages/` rather than duplicating per app.

### Testing and scripts as part of the architecture
The `scripts/tests` directory acts as a black-box contract test suite for the deployed system:
- `test-live-system.mjs` spins up a full patient/clinic workflow against a target environment, creating a temporary tenant and validating auth, appointments, messaging, documents, analytics, and tenant isolation end-to-end.
- `test-api-endpoints.mjs` exercises ~20+ API routes to guard response shapes, auth requirements, and tenant header behavior.
- `test-frontend-pages.mjs` (with Playwright) drives the React frontends, ensuring key routes render, make successful API calls, and avoid console errors.

These tests assume real infrastructure (Cognito, ALB, RDS) is reachable for non-local environments. For local work, combine them with the Docker-compose stack (`npm run docker:up`) and backend/frontend dev servers.

### Data, infra, and deployment
- `database/` contains SQL seed data and helper scripts referenced by `npm run db:migrate` and related commands.
- `infrastructure/` and `aws/` describe deployment surfaces:
  - ECS Fargate for the API
  - S3 + CloudFront for frontends
  - RDS PostgreSQL and supporting AWS resources
- `docs/QUICK-REFERENCE.md` documents production URLs, AWS resources, and the minimal CLI commands for checking status, deploying, and inspecting logs.

When making changes that affect production behavior (API shapes, auth flows, infrastructure), check for corresponding references in `docs/`, `scripts/`, and `infrastructure/` to keep operational tooling in sync.