# Authentication Guide

The platform supports two authentication modes:

1. **AWS Cognito (default across environments)** – Cognito owns identity, the API validates the access token, and both React apps integrate with the hosted login experience.
2. **Development auth (opt-in for offline work)** – the API issues signed JWTs for a configurable mock user and bypasses AWS Cognito. This keeps local onboarding light when you explicitly enable it.

Use the sections below to switch between modes and to understand how the frontends and API coordinate session state.

---

## 1. Development auth (optional for offline work)

Enable development auth when you need a local-only workflow by setting (or exporting):
- `ASPNETCORE_ENVIRONMENT=Development`, and
- `DevAuth:Enabled=true` (see `backend/Qivr.Api/appsettings.Development.json`).

Frontend workspaces opt-in by setting `VITE_ENABLE_DEV_AUTH=true` (the sample `.env` files now default to `false`). In this mode:

- Logging in hits the API’s `/api/auth/login` endpoint which returns http-only cookies and a short-lived access token string for client-side use when needed.
- The mock user profile is defined in `DevAuth:DefaultUser` (tenant ID, email, role). Adjust those values if you need a different persona for manual testing.
- No Cognito configuration is required; the shared Docker Compose stack is enough to start building features.

### Overriding the mock user

Edit `backend/Qivr.Api/appsettings.Development.json` and update:

```json
"DevAuth": {
  "DefaultTenantId": "...",
  "DefaultRole": "Clinician",
  "DefaultUser": {
    "Id": "...",
    "Email": "...",
    "FirstName": "...",
    "LastName": "...",
    "TenantId": "...",
    "Role": "Clinician"
  }
}
```

Restart the API after changes so the new profile is applied.

---

## 2. Cognito-backed authentication

Disable the mock provider when you need to exercise the hosted login flow or when building against shared environments.

### Backend switches

1. Set the following in `backend/appsettings.Development.json` (or via environment variables):
   ```json
   "DevAuth": {
     "Enabled": false
   },
   "UseMockAuth": false
   ```
2. Provide Cognito configuration (region, user pool IDs, client IDs). You can either:
   - export them as environment variables (`COGNITO_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, etc.), or
   - add them to Secrets Manager so they’re injected at runtime (see [docs/operations.md](./operations.md)).

### Frontend switches

1. In each app’s `.env` file, remove or set `VITE_ENABLE_DEV_AUTH=false`.
2. Populate the Cognito values that match the desired environment:
   ```env
   VITE_API_URL=http://localhost:5050
   VITE_COGNITO_REGION=ap-southeast-2
   VITE_COGNITO_USER_POOL_ID=...
   VITE_COGNITO_CLIENT_ID=...
   ```
3. Clear browser storage/localStorage after toggling so the new mode starts cleanly.

The React apps read the access token from Amplify, send it to the API, and the API hydrates user claims (tenant, role) via `AuthenticationExtensions.cs`. The controller layer continues to set secure cookies to keep the dashboard aligned with the new proxy endpoints.

| Claim source | Usage |
| --- | --- |
| `custom:custom:tenant_id` → fallback to `custom:tenant_id` | Sets the `X-Tenant-Id` header for API calls |
| `custom:custom:clinic_id` → fallback to `custom:clinic_id` | Populates clinic context in the dashboard |
| `sub` | Provides the authenticated patient/user identifier |

The frontends read these values directly from the ID token, so no hard-coded tenant, clinic, or patient IDs are required.

### Cognito reference

Provisioning steps, CLI snippets, and pool IDs are captured in [AWS_COGNITO_SETUP.md](./AWS_COGNITO_SETUP.md). Follow that guide when recreating pools or updating clients.

---

## 3. Mixed-mode testing tips

| Scenario | How to run |
| --- | --- |
| FAST local dev without Cognito | Set `DevAuth:Enabled=true` and `VITE_ENABLE_DEV_AUTH=true` |
| Validate Cognito login locally | Keep `DevAuth:Enabled=false`, `VITE_ENABLE_DEV_AUTH=false`, and ensure the frontend `.env` files contain valid pool/client IDs |
| Automated API tests | Default settings use the same connection string as the application. Override `TEST_CONNECTION_STRING` to point at a disposable database when needed |
| Switching modes | Stop the API, clear browser storage, update the env flags, then restart affected services |

---

## 4. FAQ

**Do I need to change anything for production?**  
Yes – production configuration must set `DevAuth:Enabled=false` and rely solely on Cognito. Never deploy with the mock provider enabled.

**Where do the auth cookies live?**  
`/api/auth/login` issues secure, http-only cookies (`accessToken`, `refreshToken`) so the dashboard no longer embeds tokens in bundles. React Query requests still send the bearer token from memory when available, but the proxy endpoints rely on cookies.

**How do tenants work in dev auth?**  
The tenant GUID in `DevAuth:DefaultUser` becomes the `X-Tenant-Id` injected by the backend. Update it if you need to scope data to a different tenant record.

---

_Last updated: 2025-10-04_
