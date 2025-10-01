# Clinic Dashboard Auth Proxy Roadmap

_Updated: 2025-10-05_

The clinic dashboard currently authenticates directly against Amazon Cognito from the browser. This complicates credential management, MFA policy enforcement, and observability, and it spreads auth logic across the front end. This roadmap outlines how we transition to a backend auth proxy so that the API mediates all Cognito traffic on behalf of the dashboard.

## Goals

- Centralise Cognito interaction within `Qivr.Api`, keeping client secrets and MFA policy server-side.
- Deliver a RESTful `/api/auth/*` surface for the clinic dashboard that mirrors existing flows (sign-in, MFA, refresh, logout, password reset).
- Maintain the patient portal’s direct Cognito integration (separate public client) while aligning token formats (JWT claims, expiry).
- Reduce auth regressions by adding smoke tests and observability around login, token refresh, and MFA.

## Success Metrics

- ✅ Dashboard sign-in flow uses only backend endpoints (no Cognito SDK bundle in the clinic app).
- ✅ API secrets (client IDs / secret) managed exclusively via AWS Secrets Manager.
- ✅ Automated regression tests cover happy path, MFA, token refresh, and logout.
- ✅ Auth telemetry (CloudWatch logs + traces) shows rate-limited, auditable requests per user/tenant.

## Current Gaps

1. `cognitoAuthService.ts` hits Cognito hosted flows directly from the browser.
2. MFA setup/confirmation, refresh token, and password reset logic live in the client with minimal error handling.
3. Secrets (App Client ID) are embedded in front-end builds, making rotation hard.
4. Limited monitoring/logging for failed sign-ins or refresh attempts; issues diagnosed via front-end consoles.

## Workstreams & Milestones

### 1. Backend Auth Proxy Foundation
- **Inventory Cognito usage** in `cognitoAuthService.ts` to map required API operations.
- **Design `/api/auth` surface**: endpoints for `POST /auth/sign-in`, `POST /auth/mfa/challenge`, `POST /auth/mfa/confirm`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/password/forgot`, `POST /auth/password/reset`.
- **Wire Cognito inside the API** using the AWS SDK and secrets from Secrets Manager; encapsulate them in a new `AuthProxyService`.
- **Implement token issuance**: return access/refresh tokens to the client, storing refresh tokens securely (HTTP-only cookie or encrypted store).
- **Add rate limiting & logging** on auth routes (Serilog + CloudWatch metrics).

### 2. Frontend Migration (Clinic Dashboard)
- **Introduce an Auth API client** consuming `/api/auth/*` (replace direct Cognito calls).
- **Gate rollout behind `VITE_USE_AUTH_PROXY`** so we can toggle the dashboard between Cognito SDK and proxy during rollout.
- **Refactor `authStore`** to use the new client, handling:
  - Sign-in with email/password.
  - MFA challenge + verification flows.
  - Token refresh via silent refresh or background job.
  - Logout/invalidate refresh tokens.
- **Remove Cognito SDK** from dashboard bundle; ensure env vars reference API URL only.
- **Handle errors & edge cases**: expose consistent error messages from proxy (wrong creds, locked account, expired MFA code).

### 3. MFA & Security Enhancements
- **Centralised MFA policy**: API enforces TOTP enrolment, backup codes (if needed), and rate limiting on code validation.
- **Session management**: decide on refresh-token rotation vs. static, and enforce automatic logout when tokens expire.
- **Audit logging**: Log success/failure events with user and tenant context for compliance.
- **Forgot password**: ensure backend handles Cognito challenge/response, front end just submits.

### 4. Testing & Observability
- **Unit tests** for `AuthProxyService` covering Cognito errors, MFA flows, and success paths.
- **Integration tests** (`backend/Qivr.Tests/Auth`) simulating end-to-end sign-in and refresh via AWS Cognito test pool (or local mocks using AWS SDK stubs).
- **Front-end e2e smoke**: update `test-auth-flow.mjs` to hit API endpoints, verifying login + protected route access.
- **Monitoring**: dashboard in CloudWatch or Datadog tracking auth failures, MFA enrolment, refresh anomalies.

### 5. Rollout Plan
- **Feature flag** `AUTH_PROXY_ENABLED` on the dashboard.
- **Dual-path support**: temporarily support both Cognito SDK (legacy) and proxy to allow staged rollout for internal testers.
- **Cutover**: enable proxy in staging, run regression suite, then flip production flag after sign-off.
- **Cleanup**: remove legacy Cognito code, deprecate old secrets, update documentation/Runbooks.

## Timeline (Indicative)

| Week | Focus |
| ---- | ----- |
| 1 | Requirements finalisation, `/api/auth` contract, Secrets Manager setup |
| 2 | Backend proxy endpoints implemented with unit tests |
| 3 | Frontend `authStore` refactor behind feature flag, smoke tests updated |
| 4 | MFA & password reset flows, observability instrumentation |
| 5 | Staging rollout, bug fixes, production cutover, documentation cleanup |

## Risks & Mitigations

- **Token storage confusion**: Choose between HTTP-only cookies (safer) vs. local storage (simpler) early. Document cross-origin implications.
- **Cognito rate limits**: Batch retries and exponential backoff within proxy; add caching for public keys.
- **Environment drift**: Keep configuration (pool IDs, client IDs, domain) versioned in infrastructure code, load via Secrets Manager.
- **User impact**: Communicate cutover to staff; provide fallback login (e.g., old flow) during rollout window.

## Follow-Up

- Sync with infrastructure team on Secrets Manager updates and IAM roles for the API.
- Align with security/compliance for logging and data retention requirements.
- Update developer onboarding docs once proxy is live.
