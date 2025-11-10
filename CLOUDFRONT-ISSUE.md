# CloudFront Configuration Issue

## Problem
CloudFront custom error responses are intercepting API errors and returning frontend HTML.

### Current Config (Distribution E1S9SAZB57T3C3)
```
CustomErrorResponses:
  - ErrorCode: 403 → /index.html (200)
  - ErrorCode: 404 → /index.html (200)
```

### Impact
- `/api/auth/register` returns 403 (CSRF error) → CloudFront serves `/index.html`
- All API errors (403, 404) return HTML instead of JSON
- E2E tests fail because they expect JSON responses

### Root Cause
CloudFront applies custom error responses globally - cannot exclude `/api/*` paths.

### Solutions

**Option 1: Remove Custom Error Responses** ❌
- Breaks SPA routing (404s won't serve index.html)
- Frontend routing will fail

**Option 2: Use Lambda@Edge** ✅ RECOMMENDED
- Intercept responses
- Only apply error responses for non-API paths
- Check if path starts with `/api/` → pass through original response
- Otherwise → apply custom error response

**Option 3: Separate Distributions** ✅ ALTERNATIVE
- One distribution for frontend (with error responses)
- One distribution for API (without error responses)
- Use different subdomains: `app.qivr.pro` and `api.qivr.pro`

**Option 4: Test Against ALB Directly** ✅ TEMPORARY
- Bypass CloudFront for testing
- Use ALB URL: `qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com`
- Not a permanent solution

## Immediate Action
Test against ALB directly until CloudFront is fixed:
```bash
curl http://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com/api/health
```

## Long-term Fix
Implement Lambda@Edge function to conditionally apply error responses.
