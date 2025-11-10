# API Routes Audit

## Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User signup (NOT `/register`)
- `POST /api/auth/confirm-signup` - Confirm email
- `POST /api/auth/refresh-token` - Refresh JWT
- `POST /api/auth/refresh` - Refresh JWT (alias)
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/confirm-forgot-password` - Confirm password reset
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user-info` - Get user info
- `PUT /api/auth/user-attributes` - Update user attributes

## Tenant Onboarding (`/api/TenantOnboarding`)
- `POST /api/TenantOnboarding/register-clinic` - Register new clinic (requires auth)
- `GET /api/TenantOnboarding/user-tenants` - Get user's tenants

## Clinic Dashboard (`/api/clinic-dashboard`)
- `GET /api/clinic-dashboard/overview` - Dashboard overview
- `GET /api/clinic-dashboard/schedule/weekly` - Weekly schedule
- `GET /api/clinic-dashboard/metrics` - Clinic metrics

## Patients (`/api/patients`)
- `GET /api/patients` - List patients
- `GET /api/patients/page` - Paginated list
- `GET /api/patients/search` - Search patients
- `GET /api/patients/{id}` - Get patient
- `POST /api/patients` - Create patient
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient

## Appointments (`/api/appointments`)
- `GET /api/appointments` - List appointments
- `GET /api/appointments/page` - Paginated list
- `GET /api/appointments/{id}` - Get appointment
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}` - Update appointment
- `POST /api/appointments/{id}/cancel` - Cancel appointment
- `POST /api/appointments/{id}/confirm` - Confirm appointment
- `POST /api/appointments/{id}/complete` - Complete appointment
- `GET /api/appointments/waitlist` - Get waitlist
- `POST /api/appointments/waitlist` - Add to waitlist

## Messages (`/api/Messages`)
- `GET /api/Messages` - List messages
- `GET /api/Messages/page` - Paginated list
- `GET /api/Messages/conversations` - List conversations
- `GET /api/Messages/conversation/{userId}` - Get conversation
- `POST /api/Messages` - Send message
- `POST /api/Messages/{id}/read` - Mark as read
- `DELETE /api/Messages/{id}` - Delete message
- `GET /api/Messages/unread-count` - Get unread count

## Documents (`/api/documents`)
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload document
- `POST /api/documents/patient/{patientId}` - Upload for patient
- `GET /api/documents/{id}` - Get document
- `GET /api/documents/{id}/download` - Download document
- `GET /api/documents/patient/{patientId}` - Get patient documents

## Medical Records (`/api/medical-records`)
- `GET /api/medical-records` - List records
- `GET /api/medical-records/vitals` - Get vitals
- `GET /api/medical-records/medications` - Get medications
- `GET /api/medical-records/allergies` - Get allergies
- `POST /api/medical-records/vitals` - Add vitals
- `POST /api/medical-records/medications` - Add medication
- `POST /api/medical-records/allergies` - Add allergy

## Settings (`/api/Settings`)
- `GET /api/Settings` - Get settings
- `PUT /api/Settings` - Update settings
- `PATCH /api/Settings/{category}` - Update category
- `POST /api/Settings/change-password` - Change password

## Analytics (`/api/Analytics`)
- `GET /api/Analytics/health-metrics` - Health metrics
- `GET /api/Analytics/prom-analytics` - PROM analytics
- `GET /api/Analytics/patient-trends` - Patient trends

## PROMs (`/api/v1/proms`)
- `POST /api/v1/proms/templates` - Create template
- `GET /api/v1/proms/templates` - List templates
- `GET /api/v1/proms/templates/{key}` - Get template
- `GET /api/v1/proms/instances` - List instances
- `GET /api/v1/proms/instances/{id}` - Get instance
- `POST /api/v1/proms/instances/{id}/answers` - Submit answers

## Intake (`/api/v1/Intake`)
- `POST /api/v1/Intake/submit` - Submit intake form
- `GET /api/v1/Intake/{id}/status` - Get status

## Webhooks (`/webhooks`)
- `POST /webhooks/sms/messagemedia` - MessageMedia SMS webhook
- `POST /webhooks/calendar/google` - Google Calendar webhook
- `POST /webhooks/calendar/microsoft` - Microsoft Calendar webhook

## Health Check
- `GET /health` - Health check endpoint

## Common Issues

### 1. Wrong Endpoint Names
- ❌ `/api/auth/register` - Does not exist
- ✅ `/api/auth/signup` - Correct endpoint

### 2. CSRF Protection
- Disabled in production (JWT provides security)
- If re-enabled, Bearer tokens bypass CSRF
- Exempt paths: `/api/auth/login`, `/api/auth/signup`, `/api/webhooks/*`

### 3. Authentication
- Most endpoints require JWT Bearer token
- Public endpoints: `/api/auth/signup`, `/api/auth/login`, `/health`
- Tenant context required via `X-Tenant-Id` header

### 4. Versioning
- Some endpoints support versioning: `/api/v1/...`
- Backward compatibility maintained: `/api/...`
