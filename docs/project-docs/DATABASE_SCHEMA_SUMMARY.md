# Qivr Database Schema Documentation
Generated: 2025-10-01

## Database Overview
- **Database**: PostgreSQL (Amazon RDS)
- **Schemas**: `qivr` (main), `audit` (audit logs)
- **Total Tables**: 23

## Core Entity Tables

### 1. **tenants** ✅
Multi-tenant support for different clinics/organizations
- `id` (uuid, PK)
- `name` (varchar)
- `slug` (varchar, unique)
- `is_active` (boolean)
- `settings` (jsonb)
- `created_at`, `updated_at` (timestamps)

### 2. **users** ✅
Core user accounts (both patients and practitioners)
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `cognito_id` (varchar, unique) - AWS Cognito integration
- `email` (varchar)
- `first_name`, `last_name` (varchar)
- `phone` (varchar)
- `role` (varchar) - 'patient', 'practitioner', etc.
- `is_active` (boolean)
- `metadata` (jsonb)
- `created_at`, `updated_at` (timestamps)

### 3. **clinics** ✅
Physical clinic locations
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `name` (varchar)
- `address` (jsonb)
- `phone`, `email` (varchar)
- `settings`, `branding` (jsonb)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamps)

## Patient Management Tables

### 4. **patients** ✅
Extended patient information
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `user_id` (uuid, FK → users)
- `first_name`, `last_name` (varchar)
- `email`, `phone` (varchar)
- `date_of_birth` (date)
- `gender` (varchar)
- `address`, `city`, `state`, `postcode` (text/varchar)
- `medical_history`, `insurance_info`, `emergency_contact` (jsonb)
- `created_at`, `updated_at` (timestamps)

### 5. **patient_records** ✅
Additional patient records/documents
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `patient_id` (uuid, FK → users)
- `medical_record_number` (varchar)
- `demographics`, `medical_history`, `emergency_contact`, `insurance_info` (jsonb)
- `created_at`, `updated_at` (timestamps)

### 6. **practitioners** ✅
Healthcare provider details
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `user_id` (uuid, FK → users)
- `employee_id` (varchar)
- `license_number` (varchar)
- `specialization` (varchar)
- `qualifications` (array)
- `availability` (jsonb)
- `created_at`, `updated_at` (timestamps)

## Appointment System Tables

### 7. **appointments** ✅
Core appointment scheduling
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `clinic_id` (uuid, FK → clinics)
- `patient_id` (uuid, FK → users)
- `provider_id` (uuid, FK → users)
- `evaluation_id` (uuid, optional)
- `appointment_type` (varchar)
- `status` (varchar) - 'requested', 'scheduled', 'completed', etc.
- `scheduled_start`, `scheduled_end` (timestamp)
- `actual_start`, `actual_end` (timestamp)
- `location_type` (varchar) - 'InPerson', 'Telehealth'
- `location_details` (jsonb)
- `notes` (text)
- `external_calendar_id` (varchar)
- `cancellation_reason` (text)
- `cancelled_at`, `reminder_sent_at` (timestamp)
- `created_at`, `updated_at` (timestamps)

### 8. **appointment_waitlist_entries** ✅
Waitlist for appointments
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `patient_id` (uuid, FK → users)
- `provider_id` (uuid, FK → users)
- `appointment_type` (varchar)
- `notes` (text)
- `preferred_dates` (array)
- `status` (varchar)
- `created_by`, `updated_by` (varchar)
- `fulfilled_at` (timestamp)
- `matched_appointment_id` (uuid, FK → appointments)
- `metadata` (jsonb)
- `created_at`, `updated_at` (timestamps)

## Medical Records Tables

### 9. **medical_conditions** ✅
Patient medical conditions/diagnoses
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `patient_id` (uuid, FK → users)
- `condition` (varchar)
- `icd10_code` (varchar)
- `diagnosed_date` (timestamp)
- `status` (varchar) - 'active', 'managed', 'resolved'
- `managed_by` (varchar)
- `last_reviewed` (timestamp)
- `notes` (text)
- `created_at`, `updated_at` (timestamps)

### 10. **medical_vitals** ✅
Vital signs records
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `patient_id` (uuid, FK → users)
- `recorded_at` (timestamp)
- `systolic`, `diastolic` (integer) - blood pressure
- `heart_rate` (integer)
- `temperature_celsius` (numeric)
- `weight_kilograms`, `height_centimetres` (numeric)
- `oxygen_saturation` (integer)
- `respiratory_rate` (integer)
- `created_at`, `updated_at` (timestamps)

### 11. **medical_lab_results** ✅
Laboratory test results
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `patient_id` (uuid, FK → users)
- `result_date` (timestamp)
- `category` (varchar) - test category
- `test_name` (varchar)
- `value` (text)
- `unit` (varchar)
- `reference_range` (varchar)
- `status` (varchar) - 'normal', 'high', 'low'
- `ordered_by` (varchar)
- `notes` (text)
- `created_at`, `updated_at` (timestamps)

### 12. **medical_medications** ✅
Current and past medications
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `patient_id` (uuid, FK → users)
- `name` (varchar)
- `dosage` (varchar)
- `frequency` (varchar)
- `start_date`, `end_date` (timestamp)
- `status` (varchar) - 'active', 'completed', 'discontinued'
- `prescribed_by` (varchar)
- `instructions` (text)
- `refills_remaining` (integer)
- `last_filled` (timestamp)
- `pharmacy` (varchar)
- `created_at`, `updated_at` (timestamps)

### 13. **medical_allergies** ✅
Patient allergies
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `patient_id` (uuid, FK → users)
- `allergen` (varchar)
- `type` (varchar) - 'food', 'medication', 'environmental'
- `severity` (varchar) - 'mild', 'moderate', 'severe', 'life-threatening'
- `reaction` (text)
- `diagnosed_date` (timestamp)
- `notes` (text)
- `created_at`, `updated_at` (timestamps)

### 14. **medical_immunizations** ✅
Vaccination records
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `patient_id` (uuid, FK → users)
- `vaccine` (varchar)
- `date` (timestamp)
- `next_due` (timestamp)
- `provider` (varchar)
- `facility` (varchar)
- `lot_number` (varchar)
- `series` (varchar)
- `created_at`, `updated_at` (timestamps)

## Evaluation & Assessment Tables

### 15. **evaluations** ✅
Patient evaluations/assessments
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `patient_id` (uuid, FK → users)
- `clinic_id` (uuid, FK → clinics)
- `evaluation_type` (varchar)
- `status` (varchar) - 'in_progress', 'completed'
- `responses` (jsonb)
- `pain_map_data` (jsonb)
- `ai_summary` (text)
- `ai_summary_reviewed_at` (timestamp)
- `ai_summary_reviewed_by` (uuid, FK → users)
- `completed_at` (timestamp)
- `created_at`, `updated_at` (timestamps)

### 16. **evaluations_intake** ✅
Initial intake evaluations (view or staging table)
- Similar structure to evaluations
- Additional fields: `patient_name`, `patient_email`, `patient_phone`
- `evaluation_number` (varchar)
- `chief_complaint` (text)
- `symptoms` (text)
- `pain_level` (integer)
- `questionnaire_responses` (jsonb)
- `ai_risk_flags` (array)
- `urgency` (varchar)

### 17. **intake_submissions** ✅
Raw intake form submissions
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `evaluation_id` (uuid)
- `patient_name`, `patient_email` (text)
- `condition_type` (text)
- `pain_level` (integer)
- `severity` (varchar)
- `status` (varchar) - 'pending', 'processed'
- `submitted_at` (timestamp)
- `created_at`, `updated_at` (timestamps)

### 18. **pain_maps** ✅
3D pain mapping data
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `evaluation_id` (uuid)
- `body_part` (varchar)
- `pain_type` (varchar)
- `intensity` (integer)
- `pain_quality` (array)
- `coordinate_x`, `coordinate_y`, `coordinate_z` (numeric)
- `created_at`, `updated_at` (timestamps)

## PROM (Patient-Reported Outcome Measures) Tables

### 19. **prom_templates** ✅
Templates for questionnaires
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `key` (varchar)
- `version` (integer)
- `name` (varchar)
- `description` (text)
- `questions` (jsonb)
- `scoring_method` (varchar)
- `scoring_rules` (jsonb)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamps)

### 20. **prom_instances** ✅
Individual PROM submissions
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `template_id` (uuid, FK → prom_templates)
- `patient_id` (uuid, FK → users)
- `appointment_id` (uuid, FK → appointments)
- `status` (varchar) - 'pending', 'completed'
- `scheduled_for`, `sent_at`, `completed_at` (timestamp)
- `responses` (jsonb)
- `score` (numeric)
- `score_interpretation` (varchar)
- `reminder_count` (integer)
- `last_reminder_at` (timestamp)
- `created_at`, `updated_at` (timestamps)

## Communication Tables

### 21. **notifications** ✅
System notifications
- `id` (uuid, PK)
- `tenant_id` (uuid, FK → tenants)
- `recipient_id` (uuid, FK → users)
- `sender_id` (uuid, FK → users)
- `type` (varchar)
- `channel` (varchar) - 'email', 'sms', 'in-app'
- `priority` (varchar)
- `title` (varchar)
- `message` (text)
- `data` (jsonb)
- `scheduled_for`, `sent_at`, `read_at` (timestamp)
- `error_message` (text)
- `retry_count` (integer)
- `created_at`, `updated_at` (timestamps)

## Authentication & Security Tables

### 22. **auth_tokens** ✅
Authentication tokens
- `id` (uuid, PK)
- `user_id` (uuid, FK → users)
- `token_hash` (varchar)
- `token_type` (varchar)
- `expires_at` (timestamp)
- `revoked_at` (timestamp)
- `created_at` (timestamp)

## Audit Tables

### 23. **audit.audit_logs** ✅
Audit trail for all changes
- `id` (uuid, PK)
- `tenant_id` (uuid)
- `user_id` (uuid)
- `entity_type` (varchar)
- `entity_id` (uuid)
- `action` (varchar) - 'INSERT', 'UPDATE', 'DELETE'
- `changes` (jsonb)
- `created_at` (timestamp)

---

## Entity to API Controller Mapping

| Entity | Database Table | API Controller | Status |
|--------|---------------|----------------|--------|
| User | users | AuthController, ProfileController | ✅ |
| Tenant | tenants | TenantsController | ✅ |
| Clinic | clinics | ClinicManagementController | ✅ |
| Patient | patients, patient_records | PatientsController, PatientDashboardController | ✅ |
| Practitioner | practitioners | ClinicDashboardController | ✅ |
| Appointment | appointments | AppointmentsController | ✅ |
| Medical Records | medical_* tables | MedicalRecordsController | ✅ |
| Evaluation | evaluations, evaluations_intake | EvaluationsController, IntakeController | ✅ |
| PROM | prom_templates, prom_instances | PromsController, PromInstanceController | ✅ |
| Notification | notifications | NotificationsController | ✅ |
| Message | ❌ Missing table | MessagesController | ⚠️ |
| Document | ❌ Missing table | DocumentsController | ⚠️ |
| Analytics | N/A (computed) | AnalyticsController | ✅ |

---

## Potential Schema Issues & Missing Tables

### 🔴 **Critical Missing Tables**

1. **messages** table - Required by MessagesController
   - Should store patient-provider communications
   - Needs: id, tenant_id, sender_id, recipient_id, content, timestamps

2. **documents** table - Required by DocumentsController
   - Should store uploaded files/documents
   - Needs: id, tenant_id, patient_id, file_name, file_path, metadata

### 🟡 **Potential Issues**

1. **Provider Entity Confusion**
   - Code references `Provider` entity but database has `practitioners` table
   - May need to align naming or create a providers view

2. **User Role Management**
   - Single `role` column in users table
   - May need role_permissions table for complex permissions

3. **Appointment-Provider Relationship**
   - appointments.provider_id references users table directly
   - Should potentially reference practitioners table

---

## Recommendations

1. **Backfill documents/messages tables** using the script mentioned above.
2. **Introduce provider compatibility view** (or migrate practitioners) so the `Provider` entity maps cleanly.
3. **Design RBAC tables** (`roles`, `permissions`, `user_roles`, `role_permissions`) to replace ad-hoc `users.role` usage.
4. **Update appointment foreign keys** once provider profiles are canonical.

Details and sequencing for provider alignment and RBAC work live in `docs/roadmaps/provider-rbac-migration.md`.

---

## Current Data Summary

- **Active Tenant**: `11111111-1111-1111-1111-111111111111` (Demo Clinic)
- **Users**: 2 (1 patient: ollie.bingemann@gmail.com, 1 practitioner: test.doctor@clinic.com)
- **Medical Records**: Fully seeded (conditions, vitals, lab results, medications, allergies, immunizations)
- **Appointments**: 3 (linking patient and provider)

---

*This documentation reflects the current state of the Qivr database schema as of October 2025.*
