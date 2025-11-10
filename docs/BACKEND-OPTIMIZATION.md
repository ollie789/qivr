# Backend Controller Optimization

## Duplicates & Overlaps Found

### 1. PROM Controllers - MAJOR OVERLAP ⚠️
**PromsController** and **PromInstanceController** have significant overlap:

#### PromsController (`/api/proms`)
- Templates: `POST /templates`, `GET /templates`, `GET /templates/{key}`
- Instances: `GET /instances`, `GET /instances/{id}`, `POST /instances/{id}/answers`
- Scheduling: `POST /schedule`
- Stats: `GET /stats`

#### PromInstanceController (`/api/prom-instances`)
- Instances: `GET /`, `GET /{instanceId}`, `GET /patient/{patientId}`
- Actions: `POST /send`, `POST /{instanceId}/submit`, `POST /{instanceId}/reminder`
- Stats: `GET /stats` ⚠️ DUPLICATE
- Management: `POST /{instanceId}/cancel`, `POST /{instanceId}/booking`

**Recommendation:** MERGE into single PromsController
- Keep templates under `/api/proms/templates/*`
- Keep instances under `/api/proms/instances/*`
- Delete PromInstanceController

### 2. Profile vs Settings - OVERLAP ⚠️
Both handle user preferences and password changes:

#### ProfileController (`/api/profile`)
- `GET /` - Get profile
- `PUT /` - Update profile
- `POST /photo` - Upload photo
- `POST /change-password` ⚠️ DUPLICATE
- `POST /verify-email` - Email verification
- `POST /verify-phone` - Phone verification

#### SettingsController (`/api/settings`)
- `GET /` - Get settings
- `PUT /` - Update settings
- `PATCH /{category}` - Update category
- `POST /change-password` ⚠️ DUPLICATE
- `POST /two-factor` - 2FA setup
- `POST /export-data` - Data export
- `DELETE /account` - Delete account

**Recommendation:** MERGE into single ProfileController
- Profile data: `/api/profile`
- Settings: `/api/profile/settings`
- Security: `/api/profile/security` (password, 2FA)
- Delete SettingsController

### 3. Dashboard Controllers - SEPARATE PURPOSES ✅
**ClinicDashboardController** and **PatientDashboardController** serve different users:
- Clinic: For clinic staff (overview, schedule, metrics)
- Patient: For patients (appointments, health summary)

**Recommendation:** KEEP BOTH - Different audiences

### 4. ClinicManagementController - NO FRONTEND ⚠️
Has comprehensive clinic/provider management but no UI:
- `GET /clinics` - List clinics
- `POST /clinics` - Create clinic
- `GET /clinics/{id}/providers` - List providers
- `POST /clinics/{id}/providers` - Add provider

**Recommendation:** KEEP - Needed for multi-clinic support (future feature)

### 5. Unused/Debug Controllers

#### AdminController (`/api/admin`)
- `POST /seed` - Seed database
**Recommendation:** KEEP - Useful for development/testing

#### DebugController (`/api/debug`)
- Various debug endpoints
**Recommendation:** KEEP - Useful for troubleshooting

#### EmailVerificationController (`/api/email-verification`)
- Email verification endpoints
**Recommendation:** CHECK - Might be duplicate of ProfileController

### 6. Webhook Controllers - KEEP ✅
- CalendarWebhooksController - External calendar integrations
- MessageMediaWebhookController - SMS webhooks
- WebhooksController - General webhooks

**Recommendation:** KEEP ALL - External integrations

## Optimization Actions

### High Priority - Merge Controllers

#### 1. Merge PROM Controllers
```
PromsController (KEEP)
├── /api/proms/templates/*          (from PromsController)
├── /api/proms/instances/*          (merge from both)
├── /api/proms/instances/{id}/send  (from PromInstanceController)
├── /api/proms/instances/{id}/submit
└── /api/proms/stats                (deduplicate)

PromInstanceController (DELETE)
```

**Files to modify:**
- Merge PromInstanceController methods into PromsController
- Update routes to `/api/proms/instances/*`
- Delete PromInstanceController.cs
- Update frontend promApi.ts

#### 2. Merge Profile/Settings Controllers
```
ProfileController (KEEP)
├── /api/profile                    (profile data)
├── /api/profile/photo
├── /api/profile/settings           (from SettingsController)
├── /api/profile/security/password  (deduplicate)
├── /api/profile/security/two-factor
└── /api/profile/data/export

SettingsController (DELETE)
```

**Files to modify:**
- Merge SettingsController methods into ProfileController
- Update routes
- Delete SettingsController.cs
- Update frontend Settings.tsx

### Medium Priority - Consolidate

#### 3. Check EmailVerificationController
- Review if functionality duplicates ProfileController
- If yes, merge into ProfileController
- If no, keep separate

### Low Priority - Document

#### 4. Document ClinicManagementController
- Add to frontend roadmap
- Document API for future UI implementation

## Benefits

### Before Optimization
- 27 controllers
- Duplicate endpoints (change-password, stats)
- Confusing separation (Proms vs PromInstance)

### After Optimization
- 24 controllers (-3)
- No duplicate endpoints
- Clear separation of concerns
- Easier to maintain

## Implementation Plan

### Phase 1: PROM Controllers (30 min)
1. Copy PromInstanceController methods to PromsController
2. Update routes to `/api/proms/instances/*`
3. Remove duplicate stats endpoint
4. Delete PromInstanceController.cs
5. Update frontend promApi.ts
6. Test PROM functionality

### Phase 2: Profile/Settings (30 min)
1. Copy SettingsController methods to ProfileController
2. Update routes to `/api/profile/*`
3. Remove duplicate change-password
4. Delete SettingsController.cs
5. Update frontend Settings.tsx
6. Test profile/settings pages

### Phase 3: Verification (15 min)
1. Review EmailVerificationController
2. Merge if duplicate
3. Update routes if needed

### Phase 4: Testing (30 min)
1. Run all E2E tests
2. Verify no broken endpoints
3. Check frontend pages
4. Monitor CloudWatch logs

## Breaking Changes

### PROM Endpoints
- `/api/prom-instances/*` → `/api/proms/instances/*`

### Settings Endpoints
- `/api/settings/*` → `/api/profile/settings/*`

## Estimated Time
- Total: 2 hours
- Risk: Low (mostly moving code)
- Testing: Required

## Next Steps
1. Review and approve plan
2. Implement Phase 1 (PROM merge)
3. Test thoroughly
4. Implement Phase 2 (Profile merge)
5. Final testing
