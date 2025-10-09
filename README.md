# QIVR Healthcare Platform

QIVR connects allied health providers with patients through a multi-tenant platform built on ASP.NET Core 8 and React/TypeScript clients. This repository hosts the API, the clinic and patient portals, and the shared tooling that keeps them in sync.

## 🚀 Quick start

```bash
# Clone & install
git clone git@github.com:qivr-health/qivr.git
cd qivr
npm install

# Start infrastructure (Postgres, Redis, MinIO, Mailhog)
npm run docker:up

# Run the API (http://localhost:5050)
npm run backend:dev

# In separate terminals run the frontends
npm run clinic:dev    # http://localhost:3010
npm run patient:dev   # http://localhost:3005
npm run widget:dev    # http://localhost:3000
```

Create `.env` files only if you need to override the defaults. The workspace now points at Cognito out of the box; flip `DevAuth:Enabled` / `VITE_ENABLE_DEV_AUTH` to `true` only when you explicitly want the mock provider. A full walkthrough lives in [docs/authentication.md](docs/authentication.md) and [docs/setup.md](docs/setup.md).

For hosted environments, either:
- Set environment variables such as `DEFAULT_CONNECTION`, `INTAKE_CONNECTION`, `EMAIL_SMTP_HOST`, `S3_BUCKET_NAME`, etc., **or**
- Provide an AWS Secrets Manager entry (see `AWS_SECRET_NAME`) with those key/value pairs so the API can resolve them at runtime.

## 📍 Services & ports

| Surface | Port | URL | Notes |
| --- | --- | --- | --- |
| Backend API | 5050 | http://localhost:5050 | Swagger at `/swagger` |
| Clinic dashboard | 3010 | http://localhost:3010 | React + Vite dev server |
| Patient portal | 3005 | http://localhost:3005 | React + Vite dev server |
| Widget | 3000 | http://localhost:3000 | Embeddable widget playground |
| PostgreSQL | 5432 | — | User `qivr_user`, database `qivr` |
| Redis | 6379 | — | Ephemeral cache |
| MinIO | 9000 / 9001 | http://localhost:9001 | S3-compatible storage |
| Mailhog | 1025 / 8025 | http://localhost:8025 | Email catcher for dev |
| API container (ECS) | 8080 | — | Health check path `/health` |

Seed data creates `test.doctor@clinic.com` (`ClinicTest123!`) and `patient@qivr.health` (`Patient123!`) after running `database/seed-data.sql`.

## 🏗️ Project layout

```
qivr/
├── apps/
│   ├── clinic-dashboard/     # Staff-facing React app
│   ├── patient-portal/       # Patient React app
│   └── widget/               # Embeddable widget
├── backend/
│   ├── Qivr.Api/             # ASP.NET Core API
│   ├── Qivr.Core/            # Domain contracts
│   ├── Qivr.Infrastructure/  # EF Core + integrations
│   └── Qivr.Services/        # Business logic layer
├── packages/
│   └── http/                 # Shared TS HTTP client
├── database/                 # Migrations, seeds, helpers
└── infrastructure/           # Terraform, deployment scripts
```

See [docs/architecture.md](docs/architecture.md) for a deeper walkthrough of each component.

## 🧑‍💻 Development

| Task | Command |
| --- | --- |
| Start API | `npm run backend:dev` |
| Start clinic dashboard | `npm run clinic:dev` |
| Start patient portal | `npm run patient:dev` |
| Start widget | `npm run widget:dev` |
| Run lint | `npm run lint` |
| Run tests | `npm run test` (fan-outs via Turbo) |
| Apply migrations | `npm run db:migrate` |
| Toggle mock auth | `DevAuth:Enabled` / `VITE_ENABLE_DEV_AUTH` (see [docs/authentication.md](docs/authentication.md)) |

Refer to [docs/development.md](docs/development.md) for branching conventions, coding standards, and helper scripts.

## ✅ Testing

- Backend: `cd backend && dotnet test`
  - Defaults to a local `qivr_test` database; override `TEST_CONNECTION_STRING` when pointing at another instance.
- React workspaces: `npm run test --workspace=@qivr/<app>`
- Smoke check before pushing: `apps/check-status.sh`
- Extra flows: `test-auth-flow.mjs`, `test-api-migration.ts`

The full testing guidance, including coverage expectations and CI behaviour, lives in [docs/testing.md](docs/testing.md).

## 📚 Documentation

All documentation now sits under [`/docs`](docs/README.md). Start there for setup, architecture, operations, and security guides. Historical audits are preserved under [`/docs/archive`](docs/archive/).

## 🤝 Contributing

- Read [AGENTS.md](AGENTS.md) for contributor etiquette and PR expectations.
- Use feature branches, keep commits focused, and include screenshots/curl output for UI or API changes.
- Update the relevant doc when altering workflows or infrastructure.

## 🛠️ Troubleshooting & operations

- Docker issues? `npm run docker:logs` and `npm run docker:down` usually clear stale containers.
- Authentication stuck? Clear browser storage and run `node test-auth-flow.mjs`.
- Port conflict? Adjust the Vite `server.port` value or stop the conflicting process.

Find more runbook-style fixes, deployment reminders, and environment notes in [docs/operations.md](docs/operations.md).

## 📝 License

Proprietary – all rights reserved.
