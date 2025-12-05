# Qivr API Routes

**Base URL:** `https://api.qivr.pro/api`

All endpoints require authentication unless marked otherwise. Multi-tenant endpoints require `X-Tenant-Id` header.

## Authentication

**Base:** `/api/auth`

| Method | Endpoint                   | Description            |
| ------ | -------------------------- | ---------------------- |
| POST   | `/login`                   | User login             |
| POST   | `/register`                | User registration      |
| POST   | `/signup`                  | Alias for register     |
| GET    | `/user-info`               | Get current user info  |
| POST   | `/refresh`                 | Refresh auth token     |
| POST   | `/logout`                  | User logout            |
| POST   | `/confirm-signup`          | Confirm email signup   |
| POST   | `/forgot-password`         | Request password reset |
| POST   | `/confirm-forgot-password` | Confirm password reset |
| POST   | `/change-password`         | Change user password   |
| POST   | `/mfa/setup`               | Setup MFA              |
| POST   | `/mfa/verify`              | Verify MFA             |
| PUT    | `/user-attributes`         | Update user attributes |

## Patients

**Base:** `/api/patients`

| Method | Endpoint  | Description                            |
| ------ | --------- | -------------------------------------- |
| GET    | `/`       | List patients (cursor pagination)      |
| GET    | `/page`   | List patients (traditional pagination) |
| GET    | `/search` | Search patients                        |
| GET    | `/{id}`   | Get patient details                    |
| POST   | `/`       | Create patient                         |
| PUT    | `/{id}`   | Update patient                         |
| DELETE | `/{id}`   | Soft delete patient                    |

## Appointments

**Base:** `/api/appointments`

| Method | Endpoint           | Description                   |
| ------ | ------------------ | ----------------------------- |
| GET    | `/`                | List appointments             |
| GET    | `/page`            | List appointments (paginated) |
| GET    | `/{id}`            | Get appointment details       |
| POST   | `/`                | Create appointment            |
| PUT    | `/{id}`            | Update appointment            |
| DELETE | `/{id}`            | Cancel appointment            |
| GET    | `/available-slots` | Get available time slots      |
| POST   | `/{id}/complete`   | Mark appointment complete     |
| POST   | `/{id}/reschedule` | Reschedule appointment        |

## Evaluations

**Base:** `/api/evaluations`

| Method | Endpoint               | Description             |
| ------ | ---------------------- | ----------------------- |
| GET    | `/`                    | List evaluations        |
| GET    | `/{id}`                | Get evaluation details  |
| POST   | `/`                    | Create evaluation       |
| PUT    | `/{id}`                | Update evaluation       |
| DELETE | `/{id}`                | Delete evaluation       |
| GET    | `/patient/{patientId}` | Get patient evaluations |
| POST   | `/{id}/finalize`       | Finalize evaluation     |

## Treatment Plans

**Base:** `/api/treatment-plans`

| Method | Endpoint                          | Description                         |
| ------ | --------------------------------- | ----------------------------------- |
| GET    | `/`                               | List treatment plans/templates      |
| GET    | `/{id}`                           | Get treatment plan                  |
| POST   | `/`                               | Create treatment plan               |
| PUT    | `/{id}`                           | Update treatment plan               |
| DELETE | `/{id}`                           | Delete treatment plan               |
| POST   | `/generate`                       | AI generate treatment plan          |
| POST   | `/preview`                        | Preview AI-generated plan           |
| POST   | `/{id}/approve`                   | Approve draft plan                  |
| POST   | `/suggest-exercises`              | AI suggest exercises                |
| POST   | `/{id}/sessions/{num}/complete`   | Complete session                    |
| POST   | `/{id}/exercises/{exId}/complete` | Complete exercise                   |
| GET    | `/my-plan`                        | Get patient's plan (patient portal) |
| GET    | `/{id}/milestones`                | Get plan milestones                 |
| POST   | `/{id}/check-in`                  | Daily check-in                      |
| GET    | `/progress`                       | Get progress data                   |
| POST   | `/{id}/schedule-appointments`     | Bulk schedule                       |
| POST   | `/{id}/schedule-proms`            | Schedule PROMs                      |
| POST   | `/{id}/advance-phase`             | Advance to next phase               |
| GET    | `/exercises`                      | List exercise templates             |
| GET    | `/exercises/{id}`                 | Get exercise template               |
| GET    | `/exercises/filters`              | Get filter options                  |
| POST   | `/exercises/generate`             | AI generate exercises               |
| POST   | `/exercises`                      | Create exercise template            |
| PUT    | `/exercises/{id}`                 | Update exercise template            |
| DELETE | `/exercises/{id}`                 | Delete exercise template            |

## PROMs

**Base:** `/api/proms`

| Method | Endpoint                             | Description               |
| ------ | ------------------------------------ | ------------------------- |
| GET    | `/templates`                         | List PROM templates       |
| GET    | `/templates/{id}`                    | Get template              |
| POST   | `/templates`                         | Create template           |
| PUT    | `/templates/{id}`                    | Update template           |
| DELETE | `/templates/{id}`                    | Delete template           |
| GET    | `/instances`                         | List PROM instances       |
| GET    | `/instances/{id}`                    | Get instance              |
| POST   | `/send`                              | Send PROM to patient      |
| POST   | `/send-bulk`                         | Send to multiple patients |
| POST   | `/instances/{id}/submit`             | Submit PROM response      |
| GET    | `/patient/{patientId}`               | Get patient PROMs         |
| GET    | `/treatment-progress/{planId}`       | Get treatment progress    |
| POST   | `/instances/{id}/treatment-progress` | Submit treatment progress |

## Intakes

**Base:** `/api/intakes`

| Method | Endpoint       | Description           |
| ------ | -------------- | --------------------- |
| GET    | `/`            | List intakes          |
| GET    | `/{id}`        | Get intake details    |
| POST   | `/`            | Create intake         |
| PUT    | `/{id}`        | Update intake         |
| DELETE | `/{id}`        | Delete intake         |
| POST   | `/{id}/submit` | Submit intake         |
| POST   | `/{id}/triage` | AI triage intake      |
| PUT    | `/{id}/status` | Update intake status  |
| GET    | `/kanban`      | Get kanban board data |

## Messages

**Base:** `/api/messages`

| Method | Endpoint                 | Description          |
| ------ | ------------------------ | -------------------- |
| GET    | `/threads`               | List message threads |
| GET    | `/threads/{id}`          | Get thread messages  |
| POST   | `/threads`               | Create new thread    |
| POST   | `/threads/{id}/messages` | Send message         |
| PUT    | `/threads/{id}/read`     | Mark as read         |

## Documents

**Base:** `/api/documents`

| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| GET    | `/`              | List documents         |
| GET    | `/{id}`          | Get document details   |
| POST   | `/upload`        | Upload document        |
| GET    | `/{id}/download` | Download document      |
| DELETE | `/{id}`          | Delete document        |
| GET    | `/{id}/ocr`      | Get OCR results        |
| POST   | `/{id}/process`  | Trigger OCR processing |

## Referrals

**Base:** `/api/referrals`

| Method | Endpoint               | Description           |
| ------ | ---------------------- | --------------------- |
| GET    | `/`                    | List referrals        |
| GET    | `/{id}`                | Get referral          |
| POST   | `/`                    | Create referral       |
| PUT    | `/{id}`                | Update referral       |
| DELETE | `/{id}`                | Delete referral       |
| PUT    | `/{id}/status`         | Update status         |
| GET    | `/patient/{patientId}` | Get patient referrals |

## Analytics

**Base:** `/api/analytics`

| Method | Endpoint        | Description           |
| ------ | --------------- | --------------------- |
| GET    | `/overview`     | Dashboard overview    |
| GET    | `/patients`     | Patient analytics     |
| GET    | `/appointments` | Appointment analytics |
| GET    | `/revenue`      | Revenue analytics     |
| GET    | `/proms`        | PROM analytics        |
| GET    | `/trends`       | Trend data            |

## Provider Schedule

**Base:** `/api/provider-schedule`

| Method | Endpoint                   | Description           |
| ------ | -------------------------- | --------------------- |
| GET    | `/providers`               | List providers        |
| GET    | `/providers/{id}/schedule` | Get provider schedule |
| PUT    | `/providers/{id}/schedule` | Update schedule       |
| GET    | `/availability`            | Get availability      |

## Settings

**Base:** `/api/settings`

| Method | Endpoint              | Description         |
| ------ | --------------------- | ------------------- |
| GET    | `/`                   | Get clinic settings |
| PUT    | `/`                   | Update settings     |
| GET    | `/service-types`      | List service types  |
| POST   | `/service-types`      | Create service type |
| PUT    | `/service-types/{id}` | Update service type |
| DELETE | `/service-types/{id}` | Delete service type |

## Notifications

**Base:** `/api/notifications`

| Method | Endpoint     | Description             |
| ------ | ------------ | ----------------------- |
| GET    | `/`          | List notifications      |
| PUT    | `/{id}/read` | Mark as read            |
| PUT    | `/read-all`  | Mark all as read        |
| GET    | `/stream`    | SSE notification stream |

## Device Tracking

**Base:** `/api/device-tracking`

| Method | Endpoint                     | Description       |
| ------ | ---------------------------- | ----------------- |
| GET    | `/devices`                   | List devices      |
| GET    | `/devices/{id}`              | Get device        |
| POST   | `/devices`                   | Register device   |
| PUT    | `/devices/{id}`              | Update device     |
| POST   | `/devices/{id}/assign`       | Assign to patient |
| POST   | `/devices/{id}/return`       | Return device     |
| GET    | `/patient/{patientId}/usage` | Get patient usage |

## AI Triage

**Base:** `/api/ai-triage`

| Method | Endpoint   | Description               |
| ------ | ---------- | ------------------------- |
| POST   | `/analyze` | Analyze intake for triage |

## Admin API

**Base:** `/api/admin` (Admin portal only)

### Tenants

| Method | Endpoint                 | Description        |
| ------ | ------------------------ | ------------------ |
| GET    | `/tenants`               | List all tenants   |
| GET    | `/tenants/{id}`          | Get tenant details |
| POST   | `/tenants/{id}/suspend`  | Suspend tenant     |
| POST   | `/tenants/{id}/activate` | Activate tenant    |
| PUT    | `/tenants/{id}/plan`     | Update plan        |
| PUT    | `/tenants/{id}/features` | Update features    |
| DELETE | `/tenants/{id}`          | Delete tenant      |

### Analytics

| Method | Endpoint                   | Description     |
| ------ | -------------------------- | --------------- |
| GET    | `/analytics/dashboard`     | Admin dashboard |
| GET    | `/analytics/usage`         | Platform usage  |
| GET    | `/analytics/prom-outcomes` | PROM outcomes   |
| GET    | `/analytics/revenue-trend` | Revenue trends  |

### Billing

| Method | Endpoint                         | Description       |
| ------ | -------------------------------- | ----------------- |
| GET    | `/billing/overview`              | Billing overview  |
| GET    | `/billing/tenants/{id}/invoices` | Tenant invoices   |
| GET    | `/billing/transactions`          | All transactions  |
| GET    | `/billing/churn`                 | Churn metrics     |
| GET    | `/billing/revenue-breakdown`     | Revenue breakdown |

### Operations

| Method | Endpoint                   | Description    |
| ------ | -------------------------- | -------------- |
| GET    | `/operations/health`       | System health  |
| GET    | `/operations/metrics`      | System metrics |
| GET    | `/operations/active-users` | Active users   |
| GET    | `/operations/queues`       | Queue status   |
| GET    | `/operations/alerts`       | System alerts  |
| GET    | `/operations/logs`         | System logs    |

## Response Formats

### Success Response

```json
{
  "data": { ... },
  "message": "Success"
}
```

### Paginated Response

```json
{
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": "Additional details",
  "code": "ERROR_CODE"
}
```

## Authentication

All requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Multi-tenant requests require tenant ID:

```
X-Tenant-Id: <tenant-uuid>
```
