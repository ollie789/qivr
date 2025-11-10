# Auth Store & Cognito Pools Audit

**Date:** 2025-11-10
**Status:** Review Complete

## AuthStore Analysis ✅

### Current Implementation

**File:** `apps/clinic-dashboard/src/stores/authStore.ts`
**Lines:** 267 (clean and focused)

### ✅ What's Good:

1. **Single Auth Method**
   - Only uses auth proxy (backend API)
   - No more dual auth systems
   - Clean and simple

2. **Proper State Management**
   ```typescript
   - user: User | null
   - token: string | null (placeholder, real token in httpOnly cookie)
   - isAuthenticated: boolean
   - isLoading: boolean
   - mfaRequired: boolean
   - activeTenantId: string | null
   ```

3. **Login Flow**
   ```
   1. Call authApi.login(email, password)
   2. Backend finds user's tenant
   3. Backend authenticates against tenant's Cognito pool
   4. Backend sets httpOnly cookie with JWT
   5. Frontend stores user info in state
   ```

4. **Session Persistence**
   - Uses zustand persist middleware
   - Stores user, token, isAuthenticated, activeTenantId
   - Survives page refreshes

5. **Error Handling**
   - Handles MFA challenges
   - Proper error propagation
   - Loading states

### ⚠️ Potential Issues:

1. **checkAuth() Not Called on App Load**
   - Need to verify this runs on app startup
   - Should validate session is still valid

2. **Token Refresh**
   - refreshToken() exists but may not be called automatically
   - Need to add interceptor for 401 responses

3. **Logout Cleanup**
   - Clears state but doesn't clear localStorage
   - May leave stale data

### 🔧 Recommended Fixes:

#### Fix 1: Add Auth Check on App Load

**File:** `apps/clinic-dashboard/src/App.tsx`

```typescript
useEffect(() => {
  const { checkAuth } = useAuthActions();
  checkAuth();
}, []);
```

#### Fix 2: Add Token Refresh Interceptor

**File:** `apps/clinic-dashboard/src/lib/api-client.ts`

```typescript
// Add response interceptor
if (error.status === 401) {
  try {
    await useAuthStore.getState().refreshToken();
    // Retry original request
  } catch {
    useAuthStore.getState().resetAuth();
    window.location.href = '/login';
  }
}
```

#### Fix 3: Clear LocalStorage on Logout

**File:** `authStore.ts` - logout function

```typescript
logout: async () => {
  try {
    await authApi.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear persisted state
    localStorage.removeItem('auth-storage');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      // ... rest
    });
  }
}
```

---

## Cognito Pools Analysis

### Current Pools:

1. **qivr-simple-pool** (ap-southeast-2_VHnD5yZaA)
   - Created: 2025-11-08
   - Purpose: OLD shared pool
   - Status: ⚠️ Should not be used anymore

2. **qivr-patient-pool** (ap-southeast-2_ZMcriKNGJ)
   - Created: 2025-09-02
   - Purpose: Patient portal
   - Status: ✅ Still needed for patient app

### Expected Per-Tenant Pools:

**Format:** `qivr-{tenant-slug}` or `qivr-{tenant-name}`

**Status:** Need to check if any were created

### How Per-Tenant Pools Work:

1. **Registration Flow:**
   ```
   User registers clinic
     ↓
   POST /api/tenants
     ↓
   EnhancedTenantService.CreateSaasTenantAsync()
     ↓
   SaasTenantService.CreateTenantUserPoolAsync()
     ↓
   Creates new Cognito User Pool
     ↓
   Stores pool ID in Tenant.CognitoUserPoolId
   ```

2. **Login Flow:**
   ```
   User logs in
     ↓
   POST /api/auth/login
     ↓
   Backend finds user by email
     ↓
   Gets user's tenant
     ↓
   Gets tenant's CognitoUserPoolId
     ↓
   Authenticates against that pool
     ↓
   Returns JWT token
   ```

### 🔍 Verification Needed:

1. **Check Database:**
   ```sql
   SELECT "Name", "CognitoUserPoolId", "CognitoUserPoolClientId"
   FROM "Tenants"
   WHERE "CognitoUserPoolId" IS NOT NULL;
   ```

2. **Check Cognito:**
   - List all user pools
   - Look for pools matching tenant names
   - Verify they have users

3. **Test Registration:**
   - Register new clinic
   - Check if Cognito pool is created
   - Verify pool ID is stored in database

---

## Backend Auth Controller Check

### Required Endpoints:

**File:** `backend/Qivr.Api/Controllers/AuthController.cs`

#### 1. Login Endpoint
```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    // 1. Find user by email
    var user = await _userService.GetUserByEmailAsync(request.Email);
    
    // 2. Get user's tenant
    var tenant = await _tenantService.GetTenantAsync(user.TenantId);
    
    // 3. Get tenant's Cognito pool
    var poolId = tenant.CognitoUserPoolId;
    var clientId = tenant.CognitoUserPoolClientId;
    
    // 4. Authenticate with Cognito
    var result = await _cognitoClient.InitiateAuthAsync(new InitiateAuthRequest
    {
        ClientId = clientId,
        AuthFlow = AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters = new Dictionary<string, string>
        {
            { "USERNAME", request.Email },
            { "PASSWORD", request.Password }
        }
    });
    
    // 5. Set httpOnly cookie with JWT
    Response.Cookies.Append("auth_token", result.AuthenticationResult.IdToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.UtcNow.AddHours(1)
    });
    
    // 6. Return user info
    return Ok(new { userInfo = MapUserToDto(user) });
}
```

#### 2. Refresh Endpoint
```csharp
[HttpPost("refresh")]
public async Task<IActionResult> Refresh()
{
    // Get refresh token from cookie
    // Call Cognito to refresh
    // Set new cookie
    return Ok();
}
```

#### 3. Logout Endpoint
```csharp
[HttpPost("logout")]
public async Task<IActionResult> Logout()
{
    // Clear cookie
    Response.Cookies.Delete("auth_token");
    return Ok();
}
```

#### 4. User Info Endpoint
```csharp
[HttpGet("user")]
[Authorize]
public async Task<IActionResult> GetUserInfo()
{
    // Get user from JWT claims
    var userId = User.FindFirst("sub")?.Value;
    var user = await _userService.GetUserAsync(userId);
    return Ok(MapUserToDto(user));
}
```

---

## Issues Found & Fixes

### Issue 1: AuthStore Not Checking Session on Load
**Impact:** User may appear logged out after refresh
**Fix:** Add checkAuth() call in App.tsx useEffect

### Issue 2: No Automatic Token Refresh
**Impact:** User gets logged out when token expires
**Fix:** Add 401 interceptor to refresh token

### Issue 3: LocalStorage Not Cleared on Logout
**Impact:** Stale data persists
**Fix:** Clear localStorage in logout function

### Issue 4: Old Cognito Pool Still Exists
**Impact:** Confusion, potential security issue
**Fix:** Delete qivr-simple-pool after migration complete

### Issue 5: Need to Verify Per-Tenant Pools
**Impact:** Registration may not be creating pools
**Fix:** Test registration and check Cognito

---

## Testing Plan

### Test 1: Registration Creates Pool
1. Register new clinic
2. Check Cognito for new pool
3. Check database for pool ID
4. Verify user created in pool

### Test 2: Login Uses Correct Pool
1. Login with registered user
2. Check backend logs for pool ID used
3. Verify JWT token is from correct pool
4. Check cookie is set

### Test 3: Session Persistence
1. Login successfully
2. Refresh page
3. Verify still logged in
4. Check checkAuth() was called

### Test 4: Token Refresh
1. Login successfully
2. Wait for token to expire (or mock it)
3. Make API call
4. Verify token refreshes automatically

### Test 5: Logout
1. Login successfully
2. Click logout
3. Verify cookie cleared
4. Verify localStorage cleared
5. Verify redirected to login

---

## Immediate Actions

### Priority 1: Fix AuthStore Issues
- [ ] Add checkAuth() on app load
- [ ] Add token refresh interceptor
- [ ] Clear localStorage on logout

### Priority 2: Verify Backend
- [ ] Check AuthController has all endpoints
- [ ] Verify per-tenant pool authentication
- [ ] Test with curl/Postman

### Priority 3: Test End-to-End
- [ ] Register new clinic
- [ ] Verify pool created
- [ ] Login with credentials
- [ ] Verify session persists

### Priority 4: Cleanup
- [ ] Delete old qivr-simple-pool
- [ ] Remove old Cognito references
- [ ] Update documentation

---

## Success Criteria

- ✅ Registration creates per-tenant Cognito pool
- ✅ Login authenticates against correct pool
- ✅ Session persists across page refreshes
- ✅ Token refreshes automatically
- ✅ Logout clears all state
- ✅ No old Cognito code remains
- ✅ All tests pass

