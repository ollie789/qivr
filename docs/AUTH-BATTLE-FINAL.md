# Auth Battle - Final Push (2025-11-10)

## Current Status: 🟡 IN PROGRESS

**Goal:** Get full end-to-end test suite passing with production Cognito auth

**Last Update:** 2025-11-10 21:36 - Build #55 deployed (task def :43), signup returns placeholder IDs

## What's Working ✅

1. **Cognito Signup** - Users can register, Cognito user created
2. **CloudFront Fixed** - No more HTML responses on API errors
3. **CSRF Disabled** - JWT Bearer tokens provide security
4. **API Routes Standardized** - All using `/api/{resource}` pattern
5. **Custom Attributes Removed** - No longer trying to set `custom:tenant_id` in Cognito

## Current Blocker 🔴

**Signup returns IDs but doesn't create database records**

- Signup endpoint returns: `userSub`, `userId`, `tenantId`, `cognitoPoolId`
- BUT: `userId` and `tenantId` are just placeholder GUIDs
- Database records NOT created yet
- Login will fail because user doesn't exist in DB

## Architecture Decision ✅

**Cognito = Auth Only, Database = Everything Else**

```
┌─────────────┐         ┌──────────────┐
│   Cognito   │         │   Database   │
├─────────────┤         ├──────────────┤
│ - Username  │         │ - UserId     │
│ - Password  │         │ - TenantId   │
│ - Email     │         │ - Role       │
│ - Tokens    │         │ - Profile    │
└─────────────┘         │ - All Data   │
                        └──────────────┘
```

## What Needs to Happen Next 🎯

### 1. Complete Signup Flow (CRITICAL)

**File:** `backend/Qivr.Api/Services/CognitoAuthService.cs`

After Cognito signup succeeds, need to:

```csharp
// 1. Create Tenant record
var tenant = new Tenant {
    Id = Guid.NewGuid(),
    Name = request.ClinicName,
    CreatedAt = DateTime.UtcNow
};
await _dbContext.Tenants.AddAsync(tenant);

// 2. Create User record
var user = new User {
    Id = Guid.NewGuid(),
    CognitoSub = response.UserSub,  // Link to Cognito
    TenantId = tenant.Id,
    Email = request.Email,
    FirstName = request.FirstName,
    LastName = request.LastName,
    Role = "Admin"  // First user is admin
};
await _dbContext.Users.AddAsync(user);

await _dbContext.SaveChangesAsync();

return new SignUpResult {
    TenantId = tenant.Id,
    UserId = user.Id,
    UserSub = response.UserSub
};
```

### 2. Fix Login Flow

**File:** `backend/Qivr.Api/Services/CognitoAuthService.cs`

After Cognito login succeeds:

```csharp
// Lookup user by Cognito sub
var user = await _dbContext.Users
    .FirstOrDefaultAsync(u => u.CognitoSub == cognitoUserSub);

if (user == null) {
    return new LoginResult { 
        Success = false, 
        ErrorMessage = "User not found in database" 
    };
}

return new LoginResult {
    Success = true,
    AccessToken = tokens.AccessToken,
    UserInfo = new UserInfo {
        Id = user.Id,
        TenantId = user.TenantId,
        Email = user.Email,
        Role = user.Role
    }
};
```

### 3. Middleware Already Works ✅

`TenantMiddleware` and `TenantContextMiddleware` already:
- Extract user from JWT token
- Lookup user in database by Cognito sub
- Set tenant context for request

**No changes needed here!**

## Test Suite Status

**Script:** `scripts/tests/test-live-system.mjs`

| Test | Status | Notes |
|------|--------|-------|
| 1. Registration | 🟡 Partial | Creates Cognito user, needs DB records |
| 2. Login | ⏸️ Blocked | Needs DB user to exist |
| 3. Auth Check | ⏸️ Blocked | Needs login |
| 4. Create Patient | ⏸️ Blocked | Needs auth |
| 5. List Patients | ⏸️ Blocked | Needs auth |
| 6-19. Other Tests | ⏸️ Blocked | All need auth |

## Quick Reference

### Current Cognito Pool
- **Pool ID:** `ap-southeast-2_VHnD5yZaA`
- **Name:** `qivr-simple-pool`
- **Attributes:** Standard OIDC only (no custom attrs)

### Current Deployment
- **Cluster:** `qivr_cluster` (underscore!)
- **Service:** `qivr-api`
- **Task Definition:** `:43` (deploying - build #55)
- **Build:** #55 SUCCEEDED, deploying now

### Test Commands
```bash
# Quick signup test
./scripts/tests/test-signup.sh

# Full E2E test with CloudWatch logs
./scripts/tests/test-with-logs.sh

# Check deployment
aws ecs describe-services --cluster qivr_cluster --services qivr-api --region ap-southeast-2
```

### Key Files
- **Auth Controller:** `backend/Qivr.Api/Controllers/AuthController.cs`
- **Auth Service:** `backend/Qivr.Api/Services/CognitoAuthService.cs`
- **Tenant Middleware:** `backend/Qivr.Api/Middleware/TenantMiddleware.cs`
- **User Model:** `backend/Qivr.Core/Entities/User.cs`
- **Tenant Model:** `backend/Qivr.Core/Entities/Tenant.cs`

## Previous Issues Solved ✅

1. ~~CloudFront returning HTML on API errors~~ - Removed custom error responses
2. ~~CSRF blocking POST requests~~ - Disabled CSRF, using JWT
3. ~~Custom Cognito attributes error~~ - Removed custom attrs
4. ~~Wrong endpoint name~~ - Using `/api/auth/signup`
5. ~~Missing username field~~ - Added to request
6. ~~ApplyMigrations still true~~ - Set to false
7. ~~API route inconsistency~~ - Standardized all routes

## Next Session Checklist

When you come back to this:

1. Check if build #55 deployed (task def :43)
2. Inject DbContext into CognitoAuthService
3. Implement tenant/user creation in SignUpAsync
4. Implement user lookup in LoginAsync
5. Run test suite
6. Fix any remaining issues

## Notes

- Don't recreate Cognito pool - current one is fine
- Don't add custom attributes - database is source of truth
- Middleware already handles tenant context - don't touch it
- Test script expects: `tenantId`, `userId`, `cognitoPoolId` in signup response
