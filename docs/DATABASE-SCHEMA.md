# Qivr Database Schema

PostgreSQL database with multi-tenant architecture using row-level tenant isolation.

## Core Tables

### Tenants & Users

| Table              | Description                                   |
| ------------------ | --------------------------------------------- |
| `tenants`          | Clinic organizations                          |
| `users`            | Staff and patient accounts                    |
| `roles`            | User roles (Admin, Clinician, Staff, Patient) |
| `user_roles`       | User-role assignments                         |
| `permissions`      | Granular permissions                          |
| `role_permissions` | Role-permission mappings                      |

### Patients & Records

| Table              | Description                      |
| ------------------ | -------------------------------- |
| `patients`         | Patient demographics (via Users) |
| `evaluations`      | Clinical evaluations             |
| `pain_assessments` | Pain assessment data             |
| `pain_maps`        | 3D pain visualization data       |
| `physio_histories` | Physiotherapy history            |

### Medical Records

| Table                   | Description            |
| ----------------------- | ---------------------- |
| `medical_allergies`     | Patient allergies      |
| `medical_conditions`    | Medical conditions     |
| `medical_medications`   | Current medications    |
| `medical_immunizations` | Immunization records   |
| `medical_lab_results`   | Lab results            |
| `medical_procedures`    | Procedure history      |
| `medical_vitals`        | Vital signs            |
| `medical_devices`       | Medical device records |

### Appointments

| Table                          | Description                    |
| ------------------------------ | ------------------------------ |
| `appointments`                 | Scheduled appointments         |
| `appointment_waitlist_entries` | Waitlist entries               |
| `service_types`                | Appointment types with pricing |

### Providers & Scheduling

| Table                         | Description         |
| ----------------------------- | ------------------- |
| `providers`                   | Provider profiles   |
| `provider_schedules`          | Weekly availability |
| `provider_schedule_overrides` | Schedule exceptions |
| `provider_time_off`           | Time off records    |

### Treatment Plans

| Table                         | Description                           |
| ----------------------------- | ------------------------------------- |
| `treatment_plans`             | Treatment plans (patient & templates) |
| `treatment_progress_feedback` | Patient progress feedback             |
| `exercise_templates`          | Exercise library                      |

### PROMs

| Table                   | Description                     |
| ----------------------- | ------------------------------- |
| `prom_templates`        | PROM questionnaire templates    |
| `prom_instances`        | Sent PROM instances             |
| `prom_responses`        | PROM answers                    |
| `prom_booking_requests` | PROM-triggered booking requests |

### Intakes

| Table                | Description             |
| -------------------- | ----------------------- |
| `intake_submissions` | Intake form submissions |

### Documents

| Table                 | Description          |
| --------------------- | -------------------- |
| `documents`           | Document metadata    |
| `document_audit_logs` | Document access logs |
| `ocr_jobs`            | OCR processing jobs  |

### Messaging

| Table                       | Description         |
| --------------------------- | ------------------- |
| `conversations`             | Message threads     |
| `conversation_participants` | Thread participants |
| `messages`                  | Individual messages |
| `inbox_items`               | Inbox entries       |

### Notifications

| Table                      | Description           |
| -------------------------- | --------------------- |
| `notifications`            | User notifications    |
| `notification_preferences` | Notification settings |

### Referrals

| Table       | Description       |
| ----------- | ----------------- |
| `referrals` | Patient referrals |

### Device Tracking

| Table                   | Description        |
| ----------------------- | ------------------ |
| `patient_device_usages` | Device assignments |

### Research & Partners

| Table                         | Description            |
| ----------------------------- | ---------------------- |
| `research_partners`           | Research organizations |
| `research_studies`            | Research studies       |
| `study_enrollments`           | Patient enrollments    |
| `partner_clinic_affiliations` | Partner-clinic links   |

### Admin & Config

| Table              | Description        |
| ------------------ | ------------------ |
| `api_keys`         | API key management |
| `admin_audit_logs` | Admin action logs  |
| `brand_themes`     | Tenant branding    |

## Key Relationships

```
Tenant (1) ──────< (N) Users
Tenant (1) ──────< (N) Patients
Tenant (1) ──────< (N) Appointments
Tenant (1) ──────< (N) Evaluations
Tenant (1) ──────< (N) TreatmentPlans
Tenant (1) ──────< (N) PromTemplates

Patient (1) ──────< (N) Appointments
Patient (1) ──────< (N) Evaluations
Patient (1) ──────< (N) PromInstances
Patient (1) ──────< (N) TreatmentPlans
Patient (1) ──────< (N) Documents

Provider (1) ──────< (N) Appointments
Provider (1) ──────< (N) ProviderSchedules
Provider (1) ──────< (N) TreatmentPlans

TreatmentPlan (1) ──────< (N) TreatmentProgressFeedback
TreatmentPlan (1) ──────< (N) PromInstances

PromTemplate (1) ──────< (N) PromInstances
PromInstance (1) ──────< (N) PromResponses

Conversation (1) ──────< (N) Messages
Conversation (1) ──────< (N) ConversationParticipants
```

## Multi-Tenancy

All tenant-scoped tables include:

- `tenant_id` (UUID, required)
- Row-level filtering in all queries

## Soft Deletes

Most tables support soft delete:

- `deleted_at` (timestamp, nullable)
- `is_deleted` (boolean) on some tables

## Audit Fields

Standard audit fields on most tables:

- `created_at` (timestamp)
- `updated_at` (timestamp)
- `created_by` (UUID, nullable)
- `updated_by` (UUID, nullable)

## JSON Columns

Several tables use JSONB for flexible data:

| Table                | Column                    | Content                    |
| -------------------- | ------------------------- | -------------------------- |
| `evaluations`        | `questionnaire_responses` | Intake answers             |
| `evaluations`        | `pain_assessment`         | Pain data                  |
| `treatment_plans`    | `phases`                  | Plan phases with exercises |
| `treatment_plans`    | `milestones`              | Achievement milestones     |
| `prom_templates`     | `questions`               | Question definitions       |
| `prom_templates`     | `scoring_rules`           | Scoring configuration      |
| `prom_instances`     | `answers`                 | Patient responses          |
| `intake_submissions` | `form_data`               | Form responses             |
| `documents`          | `ocr_data`                | Extracted text             |
| `pain_maps`          | `pain_points`             | 3D pain locations          |

## Indexes

Key indexes for performance:

- `tenant_id` on all tenant-scoped tables
- `patient_id` on patient-related tables
- `provider_id` on provider-related tables
- `status` on workflow tables
- `created_at` for time-based queries
- `scheduled_start` on appointments
- Composite indexes for common query patterns

## Migrations

Migrations are in `database/migrations/` and run via:

```bash
npm run db:migrate
```

## Seeding

Test data seeding:

```bash
npm run db:seed
```
