# API Standardization Plan

## Decision: Non-Versioned Routes
- **Current**: 21 non-versioned, 8 versioned
- **Standard**: `/api/{resource}` (no version prefix)
- **Reason**: Majority already use this pattern

## Changes Required

### 1. Remove Duplicate Routes

#### DashboardController
- ❌ Remove: `GET /api/dashboard/stats`
- ✅ Keep: `GET /api/clinic-dashboard/overview` (more specific)
- **Action**: Delete DashboardController, merge into ClinicDashboardController

### 2. Standardize Versioned Routes

#### PromsController
- ❌ Current: `/api/v1/proms`
- ✅ New: `/api/proms`
- **Action**: Change Route attribute

#### IntakeController
- ❌ Current: `/api/v1/Intake`
- ✅ New: `/api/intake`
- **Action**: Change Route attribute

#### EvaluationsController
- ❌ Current: `/api/v1/[controller]`
- ✅ New: `/api/evaluations`
- **Action**: Change Route attribute

### 3. Remove Backward Compatibility Routes

These controllers have duplicate Route attributes:
- AuthController: Remove `[Route("api/v{version:apiVersion}/auth")]`
- AppointmentsController: Remove `[Route("api/v{version:apiVersion}/appointments")]`
- PatientsController: Remove `[Route("api/v{version:apiVersion}/patients")]`
- DocumentsController: Remove `[Route("api/v{version:apiVersion}/documents")]`

### 4. Standardize [controller] Placeholder

Replace `[controller]` with explicit names:
- AnalyticsController: `/api/[controller]` → `/api/analytics`
- NotificationsController: `/api/[controller]` → `/api/notifications`
- PromInstanceController: `/api/[controller]` → `/api/prom-instances`
- TenantOnboardingController: `/api/[controller]` → `/api/tenant-onboarding`
- TenantsController: `/api/[controller]` → `/api/tenants`
- DebugController: `/api/[controller]` → `/api/debug`
- EmailVerificationController: `/api/[controller]` → `/api/email-verification`

### 5. Add Missing Endpoint

#### AuthController
- ✅ Add: `POST /api/auth/register` (alias for signup)
- **Action**: Add endpoint that calls SignUpAsync

## Implementation Order

1. ✅ Delete DashboardController (duplicate)
2. ✅ Standardize versioned routes (Proms, Intake, Evaluations)
3. ✅ Remove backward compatibility routes
4. ✅ Replace [controller] placeholders
5. ✅ Add /api/auth/register alias
6. ✅ Update frontend API clients

## Breaking Changes

### For External Clients
- `/api/v1/proms/*` → `/api/proms/*`
- `/api/v1/Intake/*` → `/api/intake/*`
- `/api/v1/evaluations/*` → `/api/evaluations/*`

### Migration Strategy
- Add deprecation warnings to old endpoints
- Support both for 1 release cycle
- Remove old endpoints in next major version

## Files to Modify

### Backend
1. `Controllers/DashboardController.cs` - DELETE
2. `Controllers/ClinicDashboardController.cs` - Merge stats endpoint
3. `Controllers/PromsController.cs` - Change route
4. `Controllers/IntakeController.cs` - Change route
5. `Controllers/EvaluationsController.cs` - Change route
6. `Controllers/AuthController.cs` - Remove versioned route, add register alias
7. `Controllers/AppointmentsController.cs` - Remove versioned route
8. `Controllers/PatientsController.cs` - Remove versioned route
9. `Controllers/DocumentsController.cs` - Remove versioned route
10. `Controllers/AnalyticsController.cs` - Explicit route
11. `Controllers/NotificationsController.cs` - Explicit route
12. `Controllers/PromInstanceController.cs` - Explicit route
13. `Controllers/TenantOnboardingController.cs` - Explicit route
14. `Controllers/TenantsController.cs` - Explicit route

### Frontend
1. `services/promApi.ts` - Update URLs
2. `services/intakeApi.ts` - Update URLs
3. `services/dashboardApi.ts` - Remove old stats endpoint

## Testing Checklist
- [ ] All frontend pages load
- [ ] Authentication works
- [ ] Patient CRUD operations
- [ ] Appointment booking
- [ ] PROM submission
- [ ] Intake form submission
- [ ] Analytics dashboard
- [ ] Document upload/download
