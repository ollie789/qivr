# Security Guidelines

Security is everyone’s responsibility. The points below summarise what we enforce today and the areas that still require follow-up.

## Secrets & configuration

- **Never commit secrets**. Keep local values in `.env.local` files or export them in your shell. Production secrets live in AWS Secrets Manager.
- **Application settings** – Do not hardcode keys in `appsettings*.json`. Reference them via `builder.Configuration["Key"]` so we can replace them with environment variables or secret providers.
- **S3/MinIO credentials** – Rotate the default `minioadmin` credentials when sharing environments. Store replacements in Secrets Manager.

## Authentication & authorisation

- We rely on **AWS Cognito** for identity. The API validates JWTs through `AddAuthentication().AddJwtBearer(...)`; keep the issuer/audience aligned with the user pools configured in [AWS_COGNITO_SETUP.md](./AWS_COGNITO_SETUP.md).
- Tenancy is enforced through `TenantMiddleware`. Always require an `X-Tenant-Id` header (or subdomain) and validate it against the authenticated user before running queries.
- New endpoints must decorate actions with `[Authorize]` attributes (or explicit `[AllowAnonymous]` if they truly are public).

## Data handling

- Use parameterised EF Core queries; avoid string interpolation inside raw SQL commands.
- When exposing identifiers externally, prefer GUIDs over sequential IDs to reduce enumeration risk.
- Audit-sensitive entities (appointments, messages, documents) should update `UpdatedBy`/`UpdatedAt` fields.
- Frontend apps must treat tokens as opaque. We store Cognito tokens in memory or `sessionStorage`; never write them to cookies without `Secure`/`HttpOnly` flags.

## Dependencies & patching

- Run `npm audit` / `dotnet list package --outdated` regularly and patch high/critical CVEs.
- Update Docker base images monthly to pull in OS-level security fixes.

## Secure coding checklist

- [ ] Input validation – guard controllers/services against missing or malformed payloads.
- [ ] Logging – avoid writing secrets, tokens, or PHI to logs. Use structured logging for traceability.
- [ ] Rate limiting – sensitive endpoints (auth, messaging) should apply limiter policies (`IEndpointConventionBuilder.RequireRateLimiting`).
- [ ] Error handling – surface problem details to clients; never leak stack traces in production.
- [ ] Reviews – tag a second reviewer for any change touching authentication, authorisation, or data export.

## Outstanding TODOs

- Implement automated dependency scanning in CI (GitHub Dependabot or OWASP Dependency-Check).
- Formalise rate-limiting policies across all login and notification endpoints.
- Document the incident response bridge and escalation path for production outages.

If you spot a security gap, raise an issue immediately and label it `security`. Critical fixes should ship in hotfix branches following the playbook in `operations.md`.
