# Architecture Overview

This monorepo hosts the patient- and clinic-facing React apps, the .NET 8 API, and supporting tooling. The goal of this guide is to give new contributors enough context to orient themselves before diving into the code.

## Platform map

```
qivr/
├── apps/
│   ├── clinic-dashboard/     # Staff-facing React + Vite + MUI
│   ├── patient-portal/       # Patient React app
│   └── widget/               # Embeddable appointment/PROM widget
├── backend/
│   ├── Qivr.Api/             # ASP.NET Core web API layer
│   ├── Qivr.Core/            # Domain contracts (entities, interfaces)
│   ├── Qivr.Infrastructure/  # EF Core, external integrations, migrations
│   └── Qivr.Services/        # Business logic orchestrators
├── packages/
│   └── http/                 # Shared TypeScript HTTP client
├── database/                 # SQL seeds and helper scripts
└── infrastructure/           # Terraform, deployment helpers, utility scripts
```

## Backend (ASP.NET Core)

- **Entry point** – `Qivr.Api` exposes controllers, middleware, Swagger, and authentication wiring.
- **Domain services** – `Qivr.Services` encapsulates business rules (appointments, PROMs, messaging, etc.) and is the right place for new domain logic.
- **Data access** – `Qivr.Infrastructure` provides `QivrDbContext`, EF migrations, and adapters for external services (S3/MinIO, MessageMedia).
- **Shared contracts** – `Qivr.Core` defines DTOs, enums, and interfaces used across the API and tests.
- **Configuration** – environment-specific settings live in `backend/Qivr.Api/appsettings*.json`; use user secrets or environment variables for secrets.

Key middleware:

- `TenantMiddleware` resolves the tenant from headers/subdomains.
- `ExceptionHandlingMiddleware` ensures consistent API error envelopes.
- `Authentication` wires either the DevAuth mock provider (local default) or Cognito JWT validation depending on configuration.

## Frontend (React + Vite)

All three apps share the same tooling stack: TypeScript, React Router, React Query, Material UI, and the `@qivr/http` client for authenticated requests.

### Clinic dashboard (`apps/clinic-dashboard`)

- `src/features/*` house domain-specific UI modules (analytics, appointments, proms, intake).
- `src/services` wraps API consumption using the shared client and typed DTOs.
- Zustand manages auth session state (bridging Cognito to UI) under `src/stores`.
- Layout primitives (`DashboardLayout`, navigation) live under `src/components`.

### Patient portal (`apps/patient-portal`)

- Mirrors the dashboard structure – the recent refactor moved appointments, dashboard, and profile into `src/features`.
- `src/lib/api-client.ts` centralises Amplify session handling and attaches tenant/patient headers.
- Routes are declared in `src/AppContent.tsx`; `PrivateRoute` guards authenticated sections.

### Widget (`apps/widget`)

- Minimal React app exposing embeddable components and hooks for booking/PROM flows.
- Shares util code via `packages/http` and cross-app DTOs where applicable.

## Shared packages

- `packages/http` is a lightweight wrapper around `fetch` that:
  - Attaches auth headers (or relies on http-only cookies) consistently across apps
  - Standardises error handling through `HttpError`
  - Provides convenience helpers (`getJson`, `postJson`, retry logic)

Introduce new cross-app utilities inside `packages/` to avoid duplicating logic between dashboard, portal, and widget.

## Data & integrations

- **Database** – PostgreSQL 16 with EF Core migrations. Use `npm run db:migrate` to apply local migrations.
- **Storage** – MinIO emulates S3 in local environments. Credentials default to `minioadmin/minioadmin`.
- **Messaging** – MessageMedia integrations are configured but guarded behind environment variables.
- **Telemetry** – OpenTelemetry exporters are wired in appsettings; Jaeger and the collector run via Docker Compose.

## Deployment surfaces

- **API** – Containerised ASP.NET Core app, typically running under ECS Fargate (see `infrastructure/`).
- **Frontends** – Built assets served behind a CDN (CloudFront) with Cognito-hosted auth flows.
- **Infrastructure-as-code** – Terraform definitions under `infrastructure/terraform` cover VPC, RDS, ECS, and supporting services.

_Questions or planning an architectural change? Start a design note in `/docs/archive/architecture/` and link it from here once agreed._
