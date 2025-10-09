# Local Setup Guide

Follow this walkthrough when you are provisioning a new laptop or need to rebuild your environment from scratch.

## 1. Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20.x | npm 10 ships with Node 20 – keep both in sync |
| .NET SDK | 8.0.x | Install ASP.NET runtime alongside the SDK |
| Docker Desktop | Latest stable | Required for Postgres, Redis, MinIO, Mailhog |
| PostgreSQL client | 15+ | Optional but handy for running `psql` commands |
| AWS CLI (v2) | — | Only needed when touching Cognito or deployment secrets |

> One-liner install: run `./install.sh` on macOS to verify the required tooling.

## 2. Clone and bootstrap

```bash
# From the repo root
git clone git@github.com:qivr-health/qivr.git
cd qivr

# Install Node workspace dependencies
npm install

# Restore .NET packages
cd backend
 dotnet restore
cd ..
```

## 3. Environment files

Each workspace reads configuration from `.env` if it exists. Create the files you need and paste the variables below—anything you omit falls back to the defaults baked into the codebase.

### Backend (`backend/.env`)

```env
# Optional when using the local dev auth provider
DevAuth__Enabled=true
DevAuth__DefaultTenantId=b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11

# Only required when talking to Cognito
COGNITO_REGION=ap-southeast-2
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
```

Secrets should stay outside git. Use shell exports, `.env.local`, or your preferred secrets manager when pointing at shared environments.

### Frontends (`apps/*/.env`)

```env
VITE_API_URL=http://localhost:5050
VITE_ENABLE_DEV_AUTH=false           # Switch to true for the mock dev provider

# Only needed for Cognito-backed sessions
VITE_COGNITO_REGION=
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
```

When `VITE_ENABLE_DEV_AUTH=true`, the React apps rely on the API’s mock auth provider and no Cognito configuration is required.

## 4. Start infrastructure and services

```bash
# Bring up Postgres, Redis, MinIO, Mailhog, etc.
npm run docker:up

# Start the API (http://localhost:5050)
npm run backend:dev

# Clinic dashboard (http://localhost:3010)
npm run clinic:dev

# Patient portal (http://localhost:3005)
npm run patient:dev

# Widget (http://localhost:3000)
npm run widget:dev
```

Use separate terminals or a multiplexer (tmux/zellij). The scripts stream logs and restart on file changes.

To stop everything, run `npm run docker:down` and `Ctrl+C` any watch processes. `./stop-all.sh` is available if you opted into `start-all.sh` above.

### Ports at a glance

| Service | Port | Notes |
| --- | --- | --- |
| Backend API | 5050 | Swagger UI served at `/swagger` |
| Clinic Dashboard | 3010 | Vite dev server, opens automatically |
| Patient Portal | 3005 | Cognito by default; enable dev auth via env flag |
| Widget | 3000 | Embeddable booking widget |
| PostgreSQL | 5432 | User: `qivr_user`, Database: `qivr` |
| Redis | 6379 | Ephemeral cache |
| MinIO | 9000 (API), 9001 (console) | Credentials default to `minioadmin/minioadmin` |
| Mailhog | 1025 (SMTP), 8025 (UI) | Useful for email testing |

## 5. Database helpers

```bash
# Apply EF Core migrations
npm run db:migrate

# (Optional) Load seed data
docker compose exec postgres psql -U qivr_user -d qivr -f database/seed-data.sql
```

`database/run-migrations.sh` wraps the EF CLI if you prefer bash scripts.

## 6. Test accounts

Local fixtures seed the following users when you run the seed script:

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Clinic staff | `test.doctor@clinic.com` | `ClinicTest123!` | Tenant `b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11` |
| Patient | `patient@qivr.health` | `Patient123!` | Assign PROMs from the dashboard first |

If the credentials fail, rerun the seed SQL or invite yourself through Cognito.

## 7. Optional helpers

- `./start-all.sh` spins up the API plus both React apps and tails logs into `./logs`. Prefer the individual scripts when debugging specific services.
- `npm run docker:logs` streams container logs if you need to troubleshoot Postgres, MinIO, or Mailhog.
- `./stop-all.sh` stops everything the start script launched.

_Stuck somewhere? Jump to [operations.md](./operations.md) for common fixes._
