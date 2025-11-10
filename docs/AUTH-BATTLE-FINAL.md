# Auth Battle - Final Push (2025-11-10)

## Current Status: 🟢 NEARLY COMPLETE - Build #62 Deploying

**Goal:** Get full end-to-end test suite passing with production Cognito auth

**Last Update:** 2025-11-10 22:15 - Build #62 deploying with database schema fix

## What's Working ✅

1. **Cognito Signup** - Users can register, Cognito user created
2. **CloudFront Fixed** - No more HTML responses on API errors
3. **CSRF Disabled** - JWT Bearer tokens provide security
4. **API Routes Standardized** - All using `/api/{resource}` pattern
5. **Custom Attributes Removed** - No longer trying to set `custom:tenant_id` in Cognito
6. **Database Creation Implemented** - Signup creates Tenant and User records
7. **Entity Model Fixed** - User entity matches database schema (UserType→role, Preferences→metadata)
8. **RDS CloudWatch Logs Enabled** - Full database query visibility
9. **Enhanced Test Logging** - ECS + RDS logs in one script

## Latest Fix 🔧

**Build #62: Ignore Tenant properties that don't exist in database**

RDS logs revealed: `column "cognito_user_pool_client_id" of relation "tenants" does not exist`

Solution: Added `.Ignore()` for Tenant properties not in database:
- CognitoUserPoolId
- CognitoUserPoolClientId  
- CognitoUserPoolDomain
- Plan, Timezone, Locale

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

## Troubleshooting Tools 🔍

### Enhanced Test Runner
```bash
bash scripts/tests/test-with-logs.sh
```

Shows:
- ECS API logs (errors, exceptions)
- RDS PostgreSQL logs (SQL queries, schema errors)
- ECS task status
- Database connection status
- Recent signup attempts

### RDS CloudWatch Logs
**Log Group:** `/aws/rds/instance/qivr-dev-db/postgresql`

Example error that saved us:
```
ERROR: column "cognito_user_pool_client_id" of relation "tenants" does not exist
STATEMENT: INSERT INTO tenants (id, cognito_user_pool_client_id, ...)
```

## Build History 📦

- **Build #57-58**: Failed - UserType namespace collision
- **Build #59**: Success - Fully qualified UserType
- **Build #60**: Failed - NotMapped hack
- **Build #61**: Success - Proper entity model, empty migration
- **Build #62**: Deploying - Ignore Tenant properties not in DB

## Next Steps ✅

1. Wait for Build #62 deployment (~2 min)
2. Run: `bash scripts/tests/test-with-logs.sh`
3. Signup should succeed → Test login
4. Login succeeds → Run full 19-test suite
5. **Auth Battle Won** 🎉
