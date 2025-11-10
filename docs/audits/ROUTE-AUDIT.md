# Route Audit - Backend vs Frontend

## Frontend Routes (Clinic Dashboard)

### Implemented Pages
- ✅ `/login` - Login page
- ✅ `/clinic-registration` - Clinic registration
- ✅ `/dashboard` - Main dashboard
- ✅ `/intake` - Intake management
- ✅ `/appointments` - Appointments
- ✅ `/patients` - Patient list
- ✅ `/patients/:id` - Patient detail
- ✅ `/messages` - Messages
- ✅ `/documents` - Documents
- ✅ `/medical-records` - Medical records
- ✅ `/prom` - PROM management
- ✅ `/analytics` - Analytics
- ✅ `/settings` - Settings

### Frontend Services (API Clients)
- ✅ `authApi.ts` - Authentication
- ✅ `dashboardApi.ts` - Dashboard data
- ✅ `patientApi.ts` - Patient management
- ✅ `appointmentsApi.ts` - Appointments
- ✅ `messagesApi.ts` - Messages
- ✅ `documentsApi.ts` - Documents
- ✅ `medicalRecordsApi.ts` - Medical records
- ✅ `promApi.ts` - PROM
- ✅ `analyticsApi.ts` - Analytics
- ✅ `intakeApi.ts` - Intake forms
- ✅ `notificationsApi.ts` - Notifications
- ✅ `providerApi.ts` - Provider management
- ✅ `messageTemplatesApi.ts` - Message templates
- ✅ `tenantService.ts` - Tenant management

## Backend API Endpoints

### Authentication & Onboarding
- ✅ `POST /api/auth/login` → Frontend: `authApi.ts`
- ✅ `POST /api/auth/signup` → Frontend: `authApi.ts`
- ❌ `POST /api/auth/register` - **DOES NOT EXIST** (test uses wrong endpoint)
- ✅ `POST /api/TenantOnboarding/register-clinic` → Frontend: `ClinicRegistration.tsx`
- ✅ `POST /api/auth/logout` → Frontend: `authApi.ts`
- ✅ `GET /api/auth/user-info` → Frontend: `authApi.ts`

### Dashboard
- ✅ `GET /api/clinic-dashboard/overview` → Frontend: `dashboardApi.ts`
- ✅ `GET /api/clinic-dashboard/schedule/weekly` → Frontend: `dashboardApi.ts`
- ✅ `GET /api/clinic-dashboard/metrics` → Frontend: `dashboardApi.ts`
- ✅ `GET /api/dashboard/stats` → Frontend: `dashboardApi.ts`

### Patients
- ✅ `GET /api/patients` → Frontend: `patientApi.ts`
- ✅ `GET /api/patients/page` → Frontend: `patientApi.ts`
- ✅ `GET /api/patients/search` → Frontend: `patientApi.ts`
- ✅ `GET /api/patients/{id}` → Frontend: `patientApi.ts`
- ✅ `POST /api/patients` → Frontend: `patientApi.ts`
- ✅ `PUT /api/patients/{id}` → Frontend: `patientApi.ts`
- ✅ `DELETE /api/patients/{id}` → Frontend: `patientApi.ts`

### Appointments
- ✅ `GET /api/appointments` → Frontend: `appointmentsApi.ts`
- ✅ `GET /api/appointments/page` → Frontend: `appointmentsApi.ts`
- ✅ `POST /api/appointments` → Frontend: `appointmentsApi.ts`
- ✅ `PUT /api/appointments/{id}` → Frontend: `appointmentsApi.ts`
- ✅ `POST /api/appointments/{id}/cancel` → Frontend: `appointmentsApi.ts`
- ✅ `POST /api/appointments/{id}/confirm` → Frontend: `appointmentsApi.ts`
- ✅ `GET /api/appointments/waitlist` → Frontend: `appointmentsApi.ts`

### Messages
- ✅ `GET /api/Messages` → Frontend: `messagesApi.ts`
- ✅ `GET /api/Messages/conversations` → Frontend: `messagesApi.ts`
- ✅ `POST /api/Messages` → Frontend: `messagesApi.ts`
- ✅ `POST /api/Messages/{id}/read` → Frontend: `messagesApi.ts`
- ✅ `GET /api/Messages/unread-count` → Frontend: `messagesApi.ts`
- ✅ `GET /api/Messages/templates` → Frontend: `messageTemplatesApi.ts`

### Documents
- ✅ `GET /api/documents` → Frontend: `documentsApi.ts`
- ✅ `POST /api/documents/upload` → Frontend: `documentsApi.ts`
- ✅ `GET /api/documents/{id}` → Frontend: `documentsApi.ts`
- ✅ `GET /api/documents/{id}/download` → Frontend: `documentsApi.ts`
- ✅ `GET /api/documents/patient/{patientId}` → Frontend: `documentsApi.ts`

### Medical Records
- ✅ `GET /api/medical-records/vitals` → Frontend: `medicalRecordsApi.ts`
- ✅ `GET /api/medical-records/medications` → Frontend: `medicalRecordsApi.ts`
- ✅ `GET /api/medical-records/allergies` → Frontend: `medicalRecordsApi.ts`
- ✅ `POST /api/medical-records/vitals` → Frontend: `medicalRecordsApi.ts`
- ✅ `POST /api/medical-records/medications` → Frontend: `medicalRecordsApi.ts`

### PROM
- ✅ `GET /api/v1/proms/templates` → Frontend: `promApi.ts`
- ✅ `GET /api/v1/proms/instances` → Frontend: `promApi.ts`
- ✅ `POST /api/v1/proms/templates` → Frontend: `promApi.ts`
- ✅ `POST /api/v1/proms/instances/{id}/answers` → Frontend: `promApi.ts`

### Analytics
- ✅ `GET /api/Analytics/health-metrics` → Frontend: `analyticsApi.ts`
- ✅ `GET /api/Analytics/prom-analytics` → Frontend: `analyticsApi.ts`
- ✅ `GET /api/Analytics/patient-trends` → Frontend: `analyticsApi.ts`

### Intake
- ✅ `POST /api/v1/Intake/submit` → Frontend: `intakeApi.ts`
- ✅ `GET /api/v1/Intake/{id}/status` → Frontend: `intakeApi.ts`

### Settings
- ✅ `GET /api/Settings` → Frontend: `Settings.tsx`
- ✅ `PUT /api/Settings` → Frontend: `Settings.tsx`
- ✅ `POST /api/Settings/change-password` → Frontend: `Settings.tsx`

### Notifications
- ✅ `GET /api/Notifications` → Frontend: `notificationsApi.ts`
- ✅ `GET /api/Notifications/unread-count` → Frontend: `notificationsApi.ts`
- ✅ `PUT /api/Notifications/{id}/mark-read` → Frontend: `notificationsApi.ts`

## Issues Found

### 1. Duplicate/Overlapping Routes
- `GET /api/dashboard/stats` and `GET /api/clinic-dashboard/overview` - Similar functionality
- Multiple controllers use `[controller]` placeholder which can cause confusion

### 2. Missing Backend Endpoints
- ❌ `POST /api/auth/register` - Test script uses this but doesn't exist
  - **Fix**: Use `/api/auth/signup` instead

### 3. Backend Endpoints Without Frontend
- ⚠️ `POST /api/admin/seed` - Admin seeding (intentionally not exposed)
- ⚠️ `GET /api/Debug/*` - Debug endpoints (dev only)
- ⚠️ `POST /api/EmailVerification/*` - Email verification (background process)
- ⚠️ `POST /webhooks/*` - Webhook handlers (external services)
- ⚠️ `GET /api/Tenants` - Tenant management (admin only)
- ⚠️ `POST /api/clinic-management/*` - Clinic management (not yet in UI)

### 4. Frontend Pages Without Full Backend Support
- ⚠️ **Provider Management** - Backend has endpoints but no dedicated frontend page
  - Backend: `/api/clinic-management/clinics/{id}/providers`
  - Frontend: Only `providerApi.ts` service, no dedicated page

### 5. Versioning Inconsistencies
- Some endpoints use `/api/v1/` prefix (PROM, Intake, Evaluations)
- Most use `/api/` without version
- Some have both for backward compatibility

## Recommendations

### High Priority
1. ✅ **Fix test script** - Change `/api/auth/register` to `/api/auth/signup`
2. ⚠️ **Add Provider Management page** - Backend exists, frontend missing
3. ⚠️ **Consolidate dashboard endpoints** - Merge `/api/dashboard/stats` into `/api/clinic-dashboard/overview`

### Medium Priority
4. ⚠️ **Standardize versioning** - Decide on versioning strategy
5. ⚠️ **Add Clinic Management UI** - Backend endpoints exist but no frontend
6. ⚠️ **Document webhook endpoints** - For external integrations

### Low Priority
7. ⚠️ **Rename controllers** - Avoid `[controller]` placeholder for clarity
8. ⚠️ **Add API documentation** - Swagger/OpenAPI spec

## Route Coverage Summary

- **Total Frontend Pages**: 13
- **Total Backend Controllers**: 25
- **Fully Connected**: ~90%
- **Backend Only**: ~10% (admin, webhooks, debug)
- **Missing Frontend**: Provider Management, Clinic Management UI

## Next Steps

1. Fix test script to use correct endpoints
2. Consider adding Provider Management page
3. Document all webhook endpoints
4. Add Swagger documentation for API
