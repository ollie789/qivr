# Auth System Migration & Testing Plan

**Date:** 2025-11-10
**Status:** In Progress

## Current State - TWO Auth Systems 🔴

### 1. OLD: Cognito Direct (cognitoAuthService.ts)
- Uses shared Cognito User Pool
- Direct AWS Amplify integration
- **Problem:** All tenants in one pool (not SaaS)

### 2. NEW: Auth Proxy (authApi.ts)
- Backend handles per-tenant Cognito pools
- API endpoints: `/api/auth/login`, `/api/auth/refresh`
- **Correct for SaaS:** Each tenant has own pool

### Current Configuration:

```
Development (.env.development):
  VITE_USE_AUTH_PROXY=true  ✅ Uses new system

Production (.env.production):
  VITE_USE_AUTH_PROXY=false ❌ Uses old system!

Default (.env):
  VITE_USE_AUTH_PROXY=false ❌ Uses old system!
```

## Problem Identified ⚠️

**Production is using the OLD auth system!**

This means:
- New clinic registration creates per-tenant Cognito pool
- But login tries to use shared pool
- Users can't login to their new clinics!

---

## Solution: Enable Auth Proxy in Production

### Step 1: Update Environment Config

**File:** `apps/clinic-dashboard/.env.production`

```env
# Change from:
VITE_USE_AUTH_PROXY=false

# To:
VITE_USE_AUTH_PROXY=true
```

### Step 2: Verify Backend Auth Endpoints Exist

Check these endpoints work:
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get user info

### Step 3: Test Flow

1. Register new clinic → Creates tenant + Cognito pool
2. Login with credentials → Backend authenticates against tenant's pool
3. Get JWT token → Frontend stores token
4. API calls use token → Backend validates against correct pool

---

## Testing Checklist

### ✅ Registration Flow
- [ ] Go to https://clinic.qivr.pro
- [ ] Click "Register Clinic"
- [ ] Fill in clinic details
- [ ] Submit form
- [ ] Verify: Tenant created in DB
- [ ] Verify: Cognito User Pool created
- [ ] Verify: Admin user created in pool
- [ ] Verify: Success message shown

### ✅ Login Flow (After Registration)
- [ ] Go to login page
- [ ] Enter email/password from registration
- [ ] Submit login
- [ ] Verify: No errors in console
- [ ] Verify: Redirected to dashboard
- [ ] Verify: User info displayed
- [ ] Verify: Token stored in localStorage

### ✅ Session Persistence
- [ ] Login successfully
- [ ] Refresh page
- [ ] Verify: Still logged in
- [ ] Verify: Dashboard loads
- [ ] Close browser
- [ ] Reopen and go to app
- [ ] Verify: Still logged in (if "remember me")

### ✅ Token Refresh
- [ ] Login successfully
- [ ] Wait for token to expire (or mock it)
- [ ] Make API call
- [ ] Verify: Token refreshes automatically
- [ ] Verify: API call succeeds

### ✅ Logout
- [ ] Click logout button
- [ ] Verify: Redirected to login
- [ ] Verify: Token cleared
- [ ] Try to access dashboard
- [ ] Verify: Redirected to login

### ✅ Error Handling
- [ ] Try login with wrong password
- [ ] Verify: Error message shown
- [ ] Try login with non-existent email
- [ ] Verify: Error message shown
- [ ] Try accessing API without token
- [ ] Verify: 401 error handled

---

## Backend Auth Controller Check

### Required Endpoints:

```csharp
// AuthController.cs should have:

[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    // 1. Get user's tenant from DB
    // 2. Authenticate against tenant's Cognito pool
    // 3. Return JWT token
}

[HttpPost("refresh")]
public async Task<IActionResult> Refresh()
{
    // 1. Get refresh token from cookie/header
    // 2. Refresh with Cognito
    // 3. Return new access token
}

[HttpPost("logout")]
public async Task<IActionResult> Logout()
{
    // 1. Invalidate token
    // 2. Clear cookies
}

[HttpGet("user")]
public async Task<IActionResult> GetUserInfo()
{
    // 1. Get user from token
    // 2. Return user details
}
```

---

## Migration Steps

### Phase 1: Enable Auth Proxy (NOW)
1. Update `.env.production` to use auth proxy
2. Rebuild frontend
3. Deploy to S3
4. Test registration + login

### Phase 2: Verify Backend (NOW)
1. Check AuthController has all endpoints
2. Test endpoints with curl/Postman
3. Verify token validation works
4. Check CORS allows auth endpoints

### Phase 3: Test End-to-End (NOW)
1. Register new clinic
2. Login with new credentials
3. Access dashboard
4. Make API calls
5. Verify tenant isolation

### Phase 4: Cleanup (Later)
1. Remove old Cognito direct code
2. Remove cognitoAuthService.ts
3. Remove Amplify dependencies
4. Update documentation

---

## Quick Test Commands

### Test Backend Auth Endpoints:

```bash
# Test login (replace with real credentials after registration)
curl -X POST https://api-staging.qivr.health/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"Test123!"}'

# Test with token
TOKEN="your-jwt-token"
curl https://api-staging.qivr.health/api/auth/user \
  -H "Authorization: Bearer $TOKEN"

# Test refresh
curl -X POST https://api-staging.qivr.health/api/auth/refresh \
  -H "Authorization: Bearer $TOKEN"
```

---

## Expected Behavior After Fix

### Registration:
1. User fills form → POST /api/tenants
2. Backend creates:
   - Tenant record
   - Cognito User Pool (per-tenant)
   - User Pool Client
   - Admin user in pool
3. Frontend shows success
4. User can immediately login

### Login:
1. User enters email/password → POST /api/auth/login
2. Backend:
   - Finds user's tenant
   - Authenticates against tenant's pool
   - Returns JWT token
3. Frontend stores token
4. Redirects to dashboard

### API Calls:
1. Frontend sends: `Authorization: Bearer <token>`
2. Backend validates token against tenant's pool
3. Extracts tenant ID from token
4. Returns tenant-specific data

---

## Next Steps

1. **Update .env.production** to enable auth proxy
2. **Rebuild frontend** with new config
3. **Test registration** end-to-end
4. **Test login** with new credentials
5. **Verify dashboard** loads with real data

---

## Files to Update

1. `apps/clinic-dashboard/.env.production` - Enable auth proxy
2. `apps/clinic-dashboard/.env` - Enable auth proxy (default)
3. Rebuild and deploy frontend

---

## Success Criteria

- ✅ New clinic registration works
- ✅ User can login with new credentials
- ✅ Dashboard loads after login
- ✅ API calls work with token
- ✅ Token refresh works automatically
- ✅ Logout works correctly
- ✅ Session persists across refreshes

