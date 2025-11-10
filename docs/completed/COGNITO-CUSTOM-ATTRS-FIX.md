# Cognito Custom Attributes Fix

**Date:** 2025-11-10  
**Issue:** Signup failing with "Type for attribute {custom:tenant_id} could not be determined"

## Problem

The backend code was attempting to set custom Cognito attributes (`custom:tenant_id` and `custom:role`) during user signup, but these attributes were never defined in the Cognito user pool schema.

Cognito custom attributes:
- Must be defined when the user pool is created
- Cannot be added after pool creation
- Cannot be removed once added

## Root Cause

`CognitoAuthService.cs` was trying to set custom attributes during `SignUpAsync`:

```csharp
new() { Name = "custom:tenant_id", Value = request.TenantId.ToString() },
new() { Name = "custom:role", Value = request.Role }
```

But the `qivr-simple-pool` user pool only has standard OIDC attributes (email, given_name, family_name, phone_number, etc.).

## Solution

Removed custom Cognito attributes from signup flow. Tenant and role information is now:
- Stored in the database only (Users table)
- Retrieved via database queries after authentication
- Not duplicated in Cognito user attributes

### Changes Made

**File:** `backend/Qivr.Api/Services/CognitoAuthService.cs`

Removed lines 180-181 from SignUpRequest:
```csharp
// REMOVED:
new() { Name = "custom:tenant_id", Value = request.TenantId.ToString() },
new() { Name = "custom:role", Value = request.Role }
```

## Architecture Decision

**Why not recreate the user pool with custom attributes?**

1. **Simplicity:** Database is already the source of truth for tenant/role data
2. **Flexibility:** Can change tenant/role schema without Cognito constraints
3. **Consistency:** All user metadata in one place (database)
4. **No migration:** Existing users don't need to be moved

**Trade-offs:**
- ✅ Simpler architecture
- ✅ More flexible data model
- ✅ Single source of truth (database)
- ⚠️ Requires database lookup after Cognito auth (already happening)

## Testing

Created minimal test script: `scripts/tests/test-signup.sh`

```bash
./scripts/tests/test-signup.sh
```

Expected response:
```json
{
  "userId": "...",
  "tenantId": "...",
  "cognitoPoolId": "ap-southeast-2_VHnD5yZaA"
}
```

## Related Changes

- Fixed `test-live-system.mjs` to use `/auth/signup` (not `/auth/register`)
- Added `username` field to signup request (required by Cognito)
- Archived outdated test scripts to `scripts/archive/old-tests/`

## Deployment

Build #53 - Deployed to ECS with task definition :41
