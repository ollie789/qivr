# Operations & Runbook

Use this guide when you are supporting local environments, preparing releases, or handling production changes.

## Service management

```bash
# Start infra containers (Postgres, Redis, MinIO, Mailhog, pgAdmin)
npm run docker:up

# Follow container logs
npm run docker:logs

# Stop and remove containers
npm run docker:down
```

Common containers:
- `postgres` – data volume lives under `./postgres-data`
- `redis` – ephemeral cache, safe to flush between runs
- `minio` – S3-compatible storage; UI available at http://localhost:9001
- `mailhog` – outgoing email catcher at http://localhost:8025

Logs for the API and frontends are streamed directly in the terminals you used to start them. `start-all.sh` and `stop-all.sh` pipe stdout to `./logs` if you prefer background processes.

## Database and migrations

```bash
# Apply latest migrations locally
npm run db:migrate

# Create a new migration
cd backend/Qivr.Infrastructure
dotnet ef migrations add <MigrationName> --startup-project ../Qivr.Api

# Update a remote database (example)
dotnet ef database update \
  --project backend/Qivr.Infrastructure \
  --startup-project backend/Qivr.Api \
  --connection "$CONNECTION_STRING"
```

Store sensitive connection strings in AWS Secrets Manager (production) or a local `.env.local` file that is ignored by Git.

Seed helpers:
- `database/seed-data.sql` – baseline clinics, patients, PROM templates
- `database/scripts/` – ad-hoc utilities for fixture resets

## Environment variables

Backend variables (set via environment or user secrets):

- `DEFAULT_CONNECTION` (or `DATABASE_URL`) – primary Postgres connection string
- `INTAKE_CONNECTION` – optional override for the intake database connection
- `ASPNETCORE_ENVIRONMENT` – `Development`, `Staging`, `Production`
- `DevAuth__Enabled` – keep `true` for local mock auth, force `false` in shared/prod environments
- `COGNITO_*` – User pool IDs, client IDs, domain, region (required when using Cognito)
- `EMAIL_SMTP_*`, `EMAIL_FROM_*`, `EMAIL_ENABLED` – SMTP configuration for outbound mail
- `S3_ENDPOINT`, `S3_BUCKET_NAME`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` – object storage details
- `MESSAGE_MEDIA_*` – Optional SMS integration
- `OTEL_EXPORTER_OTLP_ENDPOINT` – Jaeger/OpenTelemetry collector

> Configuration precedence follows the standard .NET order: `appsettings.json` → `appsettings.{Environment}.json` → environment variables → command-line arguments. The project excludes `appsettings.Development.json` from publish so cloud deployments cannot accidentally pick up localhost defaults.

### Secrets Manager

- Set `AWS_SECRET_NAME` (default `qivr/api/production`) and `AWS_REGION` on the environment when you want the API to pull configuration from AWS Secrets Manager.
- The secret should be a JSON object whose keys match the environment properties the API expects. Example:

```json
{
  "DEFAULT_CONNECTION": "Host=qivr-prod.corp123.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr;Username=qivr_user;Password=...;SslMode=Require",
  "INTAKE_CONNECTION": "Host=qivr-prod-intake.corp123.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr_intake;Username=qivr_intake;Password=...;SslMode=Require",
  "EMAIL_SMTP_HOST": "email-smtp.ap-southeast-2.amazonaws.com",
  "EMAIL_SMTP_PORT": "465",
  "EMAIL_SMTP_USERNAME": "AKIA...",
  "EMAIL_SMTP_PASSWORD": "...",
  "EMAIL_FROM_EMAIL": "noreply@qivr.health",
  "EMAIL_FROM_NAME": "QIVR Health",
  "EMAIL_ENABLED": "true",
  "S3_ENDPOINT": "https://s3.ap-southeast-2.amazonaws.com",
  "S3_BUCKET_NAME": "qivr-production-uploads",
  "S3_ACCESS_KEY": "...",
  "S3_SECRET_KEY": "..."
}
```

Values stored in the secret override `appsettings.json` but can themselves be overridden by environment variables or command-line arguments if you need to test overrides.

### Running on ECS/Fargate

- Build the API image with the provided Dockerfile (`docker build -t qivr-api .`). The container exposes port **8080** and publishes `/health` for ALB/ELB health checks. Keep `ASPNETCORE_URLS=http://+:8080` in the task definition to match the container.
- In your task definition, map the required configuration via **environment** or **secrets**:
  ```json
  {
    "name": "DEFAULT_CONNECTION",
    "valueFrom": "arn:aws:secretsmanager:ap-southeast-2:123:secret:qivr/api/production:DEFAULT_CONNECTION::"
  },
  {
    "name": "COGNITO_REGION",
    "value": "ap-southeast-2"
  }
  ```
  Repeat for `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `EMAIL_SMTP_*`, `S3_*`, etc., either pointing to Secrets Manager or supplying literal values.
- Ensure the task IAM role can read the secret (`secretsmanager:GetSecretValue`) and access S3/RDS as needed. The execution role must pull from ECR.
- Configure your load balancer target group with path `/health` and port `8080`. The container’s `HEALTHCHECK` already probes this endpoint internally.
- Frontend tasks/services only need `VITE_API_URL`, `VITE_ENABLE_DEV_AUTH=false`, and the relevant Cognito env vars; these can also leverage Secrets Manager or Parameter Store.

Frontend variables (per app `.env`):

- `VITE_API_URL` – Base URL for the API (http://localhost:5050 in dev)
- `VITE_ENABLE_DEV_AUTH` – `true` uses the mock provider, `false` integrates with Cognito
- `VITE_COGNITO_*` – Region, user pool, client IDs matched to the environment (only needed when dev auth is disabled)

## Deployment outline

1. **Build & test**
   ```bash
   npm run lint
   npm run test
   npm run build
   dotnet test --collect:"XPlat Code Coverage"
   ```
2. **Publish artifacts** – `dotnet publish -c Release`, `npm run build --workspace=<app>` then containerise using the provided Dockerfiles.
3. **Push images** – Tag and push to ECR (or your registry of choice).
4. **Apply infrastructure** – Terraform modules live under `infrastructure/terraform`. Run `terraform plan` & `terraform apply` with the appropriate tfvars file.
5. **Secrets** – `infrastructure/scripts/setup-secrets.sh` seeds Secrets Manager with Cognito, SMTP, MessageMedia, and database credentials.
6. **Rollout** – Update ECS services (or Kubernetes deployment) and monitor CloudWatch/Stackdriver logs. Health checks should report 200s before promoting.

The detailed AWS checklist previously lived in `docs/checklist.md`; it now resides in `docs/archive/checklist.md` for historical reference.

## Troubleshooting cheatsheet

| Symptom | Quick checks |
| --- | --- |
| API 404/401 responses | Verify `ASPNETCORE_ENVIRONMENT` and auth mode (`DevAuth__Enabled` vs Cognito IDs), inspect `backend/logs` output |
| Frontend cannot reach API | Confirm `VITE_API_URL` matches the running backend and CORS allows the origin |
| Tenant mismatch errors | Ensure the `X-Tenant-Id` header matches the authenticated user’s tenant GUID |
| Database migration failures | Confirm the `dotnet-ef` CLI is installed and Postgres is running (`docker compose ps`) |
| MinIO upload failures | Regenerate credentials or clear buckets via the MinIO console |
| Auth mode not switching | Stop the API, clear browser storage, update `DevAuth__Enabled` / `VITE_ENABLE_DEV_AUTH`, then restart |

## Incident basics

1. Capture the failing request/response (HAR, curl, or API logs).
2. Validate tenant and auth context – most data issues stem from missing headers.
3. Reproduce locally using the same payload and feature flag state.
4. Patch behind a feature flag or toggle in configuration before rolling to production.
5. Follow up with documentation/test updates so the regression cannot repeat.

## Related references

- Authentication and pool configuration – [AWS_COGNITO_SETUP.md](./AWS_COGNITO_SETUP.md)
- Security expectations – [security.md](./security.md)
- Historical audits and sprint reports – [docs/archive/](./archive)

_If you discover a new failure mode, document it here with the steps you took so the next on-call saves time._
