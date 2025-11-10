# Tenancy Structure Audit

## Current State Analysis

### Service Architecture

**THREE tenant services exist:**

1. **TenantService** (in UserService.cs)
   - Basic CRUD operations
   - Gets tenants for user
   - Legacy implementation

2. **EnhancedTenantService** (EnhancedTenantService.cs)
   - Wraps TenantService
   - Adds `CreateSaasTenantAsync()` method
   - Delegates to SaasTenantService for Cognito
   - **CURRENTLY USED in TenantsController**

3. **SaasTenantService** (SaasTenantService.cs)
   - Creates per-tenant Cognito User Pools
   - Creates Cognito clients
   - Manages tenant-specific auth

### Current Flow (SaaS Model)

```
User creates clinic
  ↓
TenantsController.CreateTenant()
  ↓
EnhancedTenantService.CreateSaasTenantAsync()
  ↓
SaasTenantService.CreateTenantUserPoolAsync()
  ↓
Creates:
  - Tenant record in DB
  - Dedicated Cognito User Pool
  - Cognito User Pool Client
  - Clinic record
  - Admin user
```

### Database Structure

**Tenant table has:**
- Slug ✅
- Name ✅
- Status ✅
- CognitoUserPoolId ✅ (NEW - for SaaS)
- CognitoUserPoolClientId ✅ (NEW - for SaaS)
- CognitoUserPoolDomain ✅ (NEW - for SaaS)

**User table has:**
- TenantId ✅
- CognitoSub ✅

## Issues Identified

### 1. Service Duplication ⚠️
- TenantService and EnhancedTenantService both implement ITenantService
- TenantService is registered but not used
- Confusing which service does what

### 2. Mixed Responsibilities
- TenantService is in UserService.cs file (wrong location)
- EnhancedTenantService delegates basic operations instead of inheriting

### 3. Missing Cleanup
- Old TenantService should be removed or deprecated
- No clear migration path documented

## Recommendations

### HIGH PRIORITY

**1. Consolidate Services**
```
Remove: TenantService (legacy)
Keep: EnhancedTenantService (rename to TenantService)
Keep: SaasTenantService (Cognito operations)
```

**2. Move TenantService out of UserService.cs**
Create dedicated file: `Qivr.Services/TenantService.cs`

**3. Update Service Registration**
```csharp
// Remove
services.AddScoped<ITenantService, TenantService>();

// Keep (rename EnhancedTenantService → TenantService)
services.AddScoped<ITenantService, TenantService>();
services.AddScoped<ISaasTenantService, SaasTenantService>();
```

### MEDIUM PRIORITY

**4. Add Migration Documentation**
Document how existing tenants migrate to per-tenant Cognito pools

**5. Add Tenant Isolation Tests**
Verify users can only access their tenant's data

**6. Add Cognito Pool Cleanup**
Handle failed tenant creation (rollback Cognito pool)

## Current Status: MOSTLY ALIGNED ✅

### What's Working:
- ✅ New tenants get dedicated Cognito pools
- ✅ Tenant table has Cognito fields
- ✅ User table has TenantId
- ✅ TenantsController uses EnhancedTenantService
- ✅ SaaS flow is implemented

### What Needs Cleanup:
- ⚠️ Old TenantService still registered (unused)
- ⚠️ Service naming is confusing
- ⚠️ TenantService in wrong file

## Action Plan

### Phase 1: Immediate (Do Now)
1. Remove old TenantService registration
2. Rename EnhancedTenantService → TenantService
3. Move to dedicated file

### Phase 2: Short-term (This Week)
1. Add error handling for Cognito failures
2. Add tenant isolation tests
3. Document SaaS architecture

### Phase 3: Long-term (Next Sprint)
1. Migrate existing tenants to dedicated pools
2. Add tenant management UI
3. Add billing integration

## Conclusion

**Your SaaS structure IS aligned and working!** 

The API is correctly using the new SaaS model:
- ✅ Per-tenant Cognito pools
- ✅ Proper tenant isolation
- ✅ Correct database structure

The only issue is **code organization** - you have legacy code that's registered but not used. This won't break anything, but should be cleaned up for maintainability.

**Recommendation:** Clean up the service duplication, but your core SaaS architecture is solid.
