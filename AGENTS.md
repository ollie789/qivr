# Repository Guidelines

## Project Structure & Module Organization
- `apps/clinic-dashboard`, `apps/patient-portal`, and `apps/widget` house the Vite/React clients for clinic staff, patients, and the embeddable widget.
- `backend/` holds the .NET 8 solution (`Qivr.Api`, `Core`, `Infrastructure`, `Services`) with tests in `Qivr.Tests`; keep domain rules in Services and surface endpoints through `Qivr.Api`.
- Shared code lives in `packages/http`; database assets sit in `database/`; deployment and helper scripts (`infrastructure/`, `start-all.sh`, `verify-api-endpoints.sh`) support local setup.

## Build, Test, and Development Commands
- `npm install` bootstraps all workspaces; `./start-all.sh` brings up Docker dependencies and the API, and `./stop-all.sh` tears them down.
- `npm run backend:dev` watches the API (requires `npm run docker:up` or `docker compose up -d`); `clinic:dev`, `patient:dev`, and `widget:dev` serve the three UIs; `npm run build` executes Turbo builds.
- Run `dotnet test` from `backend/` and `npm run test` for workspace suites; `apps/check-status.sh` offers quick smoke coverage before pushing.

## Coding Style & Naming Conventions
- Frontends use TypeScript, Prettier (2 spaces), and ESLint; keep code formatted via `npm run lint` and `npm run format`.
- Backend code follows .NET defaults: PascalCase types, camelCase locals, nullable references enabled, 4-space indentation.
- Prefix shared packages `@qivr/<feature>` and reuse helpers from `packages/http` instead of reimplementing.

## Testing Guidelines
- Place backend tests under `backend/Qivr.Tests`, mirroring namespaces; use xUnit + Moq and run with `dotnet test --collect:"XPlat Code Coverage"` when coverage is needed.
- Co-locate frontend specs under `__tests__` folders so Turbo scopes runs; mock Cognito via the shared HTTP client.
- Use `test-auth-flow.mjs`, `test-api-migration.ts`, and `apps/check-status.sh` to validate end-to-end flows expected by CI.

## Commit & Pull Request Guidelines
- Use imperative commit subjects; optional prefixes (`docs:`, `✨`, `🐛`) match history while keeping commits focused.
- PRs against `main` need scope, testing notes, and screenshots or curl output for UI/API work; request a reviewer and confirm CI.
- Flag database or Cognito changes in the PR body and link the relevant issue or ticket.

## Environment & Access Tips
- Copy `.env.example` into each app (e.g., `apps/clinic-dashboard/.env`) and fill Cognito IDs, API URLs, and tenant values.
- Local services (Postgres, Redis, MinIO, Mailhog) ship via `docker-compose.yml`; `npm run docker:logs` helps diagnose infra issues.
- Support matrix: Node 20+, .NET 8; run `install.sh` on first setup and keep secrets out of source control.
