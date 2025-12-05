# Qivr Platform Architecture

## System Overview

Qivr is a multi-tenant SaaS platform for healthcare clinic management with patient engagement features.

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS CloudFront (CDN)                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌───────▼────────┐   ┌───────▼────────┐
│ Clinic Portal  │   │ Patient Portal │   │ Intake Widget  │
│   (S3 Bucket)  │   │   (S3 Bucket)  │   │   (S3 Bucket)  │
│  React + Vite  │   │  React + Vite  │   │  React + Vite  │
└────────────────┘   └────────────────┘   └────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Application      │
                    │   Load Balancer    │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   .NET 8 API       │
                    │   (ECS Fargate)    │
                    │   Multi-tenant     │
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │             │             │               │
┌───────▼────┐  ┌────▼─────┐  ┌───▼────────┐  ┌───▼────────┐
│ PostgreSQL │  │ AWS      │  │ AWS Lambda │  │ AWS Bedrock│
│    RDS     │  │ Cognito  │  │ (OCR)      │  │ (AI/ML)    │
│Multi-tenant│  │Per-tenant│  │ Textract   │  │ Nova/Claude│
└────────────┘  └──────────┘  └────────────┘  └────────────┘
```

## Frontend Applications

### Clinic Dashboard (`apps/clinic-dashboard`)

Staff-facing application for clinic operations.

**Tech Stack:**

- React 19 + TypeScript
- Vite 7 (build tool)
- MUI v7 + Aura Design System
- Zustand (state management)
- React Query (data fetching)
- React Router v7

**Pages (18):**

- ActionCenter - Intake triage and kanban board
- Analytics - Clinic metrics and charts
- Appointments - Calendar and scheduling
- DocumentUpload - Document management with OCR
- ExerciseLibrary - Exercise template management
- Inbox - Internal messaging
- IntakeManagement - Intake form management
- MedicalRecords - Patient records
- PatientDetail - Individual patient view
- PROM - Questionnaire management
- Referrals - Referral tracking
- Settings - Clinic configuration
- TreatmentPlans - Treatment plan templates
- TreatmentPlanDetail - Individual plan view

**Port:** 3010

### Patient Portal (`apps/patient-portal`)

Patient-facing application for self-service.

**Tech Stack:**

- React 19 + TypeScript
- Vite 7 (build tool)
- MUI v7 + Aura Design System
- Zustand (state management)
- React Query (data fetching)

**Pages (20):**

- Dashboard - Patient home
- Appointments - View/manage appointments
- BookAppointment - Appointment booking
- CompletePROM - PROM questionnaire completion
- Documents - Document viewing
- Evaluations - View evaluations
- HealthProgress - Progress tracking
- IntakeForm - Intake questionnaire
- Messages - Messaging with clinic
- Profile - Account settings
- Referrals - View referrals
- TreatmentPlan - View treatment plan

**Port:** 3005

### Intake Widget (`apps/intake-widget`)

Embeddable intake form for clinic websites.

**Port:** 3002

### Admin Portal (`apps/admin-portal`)

Platform administration for SaaS management.

**Port:** 3020

## Backend API

### .NET 8 Web API (`backend/`)

**Structure:**

```
backend/
├── Qivr.Api/           # Controllers & endpoints
├── Qivr.Services/      # Business logic
├── Qivr.Core/          # Domain models & interfaces
├── Qivr.Infrastructure/# Data access & external services
└── Qivr.Tests/         # Unit & integration tests
```

**Key Controllers (40+):**

- AuthController - Authentication (Cognito)
- PatientsController - Patient CRUD
- AppointmentsController - Scheduling
- PromsController - PROM management
- TreatmentPlansController - Treatment plans
- EvaluationsController - Clinical evaluations
- DocumentsController - Document management
- MessagesController - Messaging
- IntakeController - Intake forms
- ReferralsController - Referral management
- ClinicAnalyticsController - Analytics
- AiTriageController - AI-powered triage
- DeviceTrackingController - Device management

**Port:** 5050

## Database

### PostgreSQL (RDS)

Multi-tenant database with row-level security.

**Key Tables:**

- `tenants` - Clinic organizations
- `users` - Staff and patients
- `patients` - Patient records
- `appointments` - Scheduling
- `evaluations` - Clinical evaluations
- `prom_templates` - PROM questionnaires
- `prom_instances` - PROM responses
- `treatment_plans` - Treatment plans
- `documents` - Document metadata
- `messages` - Messaging
- `intakes` - Intake submissions
- `referrals` - Referral tracking

## AWS Services

| Service             | Purpose                            |
| ------------------- | ---------------------------------- |
| ECS Fargate         | API hosting                        |
| RDS PostgreSQL      | Database                           |
| S3                  | Frontend hosting, document storage |
| CloudFront          | CDN                                |
| Cognito             | Authentication (per-tenant pools)  |
| Lambda              | OCR processing                     |
| Textract            | Document OCR                       |
| Bedrock             | AI/ML (Nova Lite, Claude)          |
| SES                 | Email delivery                     |
| SQS                 | Message queues                     |
| CloudWatch          | Logging & monitoring               |
| SSM Parameter Store | Configuration                      |

## Key Features

### Multi-Tenancy

- Tenant ID in all database queries
- Per-tenant Cognito user pools
- Tenant-specific settings and branding

### AI Integration

- AI-powered intake triage
- Treatment plan generation
- Exercise suggestions
- Document OCR extraction

### PROM System

- Configurable questionnaire templates
- Automated scheduling
- Scoring and tracking
- Treatment plan integration

### Treatment Plans

- Phase-based plans
- Exercise prescriptions
- Progress tracking
- Patient portal integration

### Real-time Features

- Notification system
- Message threading
- Appointment reminders

## Development

```bash
# Install dependencies
npm install

# Start all apps
npm run dev

# Or individually
npm run clinic:dev      # Port 3010
npm run patient:dev     # Port 3005
npm run backend:dev     # Port 5050
```

## Deployment

**Production URLs:**

- Clinic: https://clinic.qivr.pro
- Patient: https://patient.qivr.pro
- API: https://api.qivr.pro

**CI/CD:**

- AWS CodeBuild for builds
- S3 sync for frontends
- ECS deployment for API
- CloudFront invalidation

## Design System

### Aura UI (`packages/design-system`)

Custom component library built on MUI v7.

**Components:**

- AuraButton, AuraIconButton
- AuraCard, AuraGlassCard
- AuraDialog, AuraDrawer
- AuraTextField, SelectField
- PageHeader, SectionLoader
- DataTable, EmptyState
- Callout, StatusChip

**Tokens:**

- Colors (primary, secondary, semantic)
- Typography (font sizes, weights)
- Spacing (consistent scale)
- Shadows (elevation levels)
- Border radius (consistent rounding)
