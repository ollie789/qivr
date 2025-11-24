# Qivr Platform Architecture

## 🏗️ System Overview

Qivr is a multi-tenant SaaS platform for healthcare clinic management, consisting of two frontend applications, a .NET backend API, and PostgreSQL database.

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS CloudFront (CDN)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼────────┐         ┌───────▼────────┐
        │  Clinic Portal │         │ Patient Portal │
        │   (S3 Bucket)  │         │   (S3 Bucket)  │
        │  React + Vite  │         │  React + Vite  │
        └────────────────┘         └────────────────┘
                │                           │
                └─────────────┬─────────────┘
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
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼────┐  ┌────▼─────┐  ┌───▼────────┐
        │ PostgreSQL │  │ AWS      │  │ AWS Lambda │
        │    RDS     │  │ Cognito  │  │ (OCR)      │
        │ Multi-tenant│  │ Per-tenant│  │ Textract   │
        └────────────┘  └──────────┘  └────────────┘
```

---

## 📱 Frontend Applications

### **Clinic Dashboard** (`apps/clinic-dashboard`)

**Purpose**: Staff-facing application for clinic operations

**Tech Stack**:

- React 19 + TypeScript
- Vite (build tool)
- MUI v7 (UI components)
- Zustand (state management)
- React Query (data fetching)
- React Router v6 (routing)

**Key Features**:

- 15 pages (100% UX complete)
- Dashboard with analytics
- Patient management (medical records)
- Appointment scheduling (FullCalendar)
- Document management with OCR
- Messaging system
- PROM management
- Intake form triage
- Provider management
- Settings & configuration

**Bundle Size**: 1.06MB (293KB gzipped)
**Port**: 3010

---

### **Patient Portal** (`apps/patient-portal`)

**Purpose**: Patient-facing application for self-service

**Tech Stack**:

- React 19 + TypeScript
- Vite (build tool)
- MUI v7 (UI components)
- Zustand (state management)
- React Query (data fetching)
- React Router v6 (routing)

**Key Features**:

- 19 pages (100% UX complete)
- Patient dashboard
- Appointment booking
- Document viewing
- Medical records access
- PROM completion
- Messaging with clinic
- Profile management
- Intake form submission

**Bundle Size**: 2.50MB (703KB gzipped)
**Port**: 3005

---

## 🔧 Backend API

### **Qivr.Api** (`backend/`)

**Purpose**: Multi-tenant REST API for all operations

**Tech Stack**:

- .NET 8 (C#)
- Entity Framework Core
- PostgreSQL
- Serilog (logging)
- JWT + AWS Cognito (auth)

**Architecture**: Modular Monolith

```
backend/
├── Qivr.Api/              # API Layer (Controllers, Middleware)
├── Qivr.Core/             # Domain Layer (Entities, Interfaces)
├── Qivr.Infrastructure/   # Data Layer (DbContext, Migrations)
└── Qivr.Services/         # Business Logic (Services)
```

**Key Controllers**:

- `AuthController` - Authentication & registration
- `AppointmentsController` - Scheduling & calendar sync
- `PatientsController` - Patient CRUD
- `DocumentsController` - File upload & OCR
- `MessagesController` - Messaging system
- `PROMController` - Questionnaire management
- `IntakeController` - Intake form processing
- `AnalyticsController` - Reporting & metrics

**Port**: 5050 (dev), 80/443 (prod)

---

## 🗄️ Database

### **PostgreSQL RDS**

**Purpose**: Multi-tenant data storage with Row-Level Security (RLS)

**Schema Design**:

- **Multi-tenancy**: `clinic_id` on all tables
- **RLS Policies**: Automatic tenant isolation
- **Audit Logging**: Comprehensive change tracking

**Key Tables**:

- `clinics` - Tenant information
- `users` - User accounts (staff & patients)
- `patients` - Patient demographics
- `appointments` - Scheduling data
- `documents` - File metadata
- `messages` - Communication threads
- `prom_templates` - Questionnaire definitions
- `prom_responses` - Patient responses
- `intake_evaluations` - Intake forms
- `medical_records` - Health data

**Migrations**: Entity Framework Core
**Backup**: Automated daily snapshots

---

## 🔐 Authentication & Authorization

### **Multi-Tenant Cognito**

- **Per-clinic User Pools**: Each clinic gets isolated Cognito pool
- **Patient vs Staff**: Separate authentication flows
- **Token Management**: JWT tokens with httpOnly cookies
- **Tenant Isolation**: `X-Tenant-Id` header + RLS policies

**Auth Flow**:

1. User logs in → Cognito validates credentials
2. Backend issues JWT + sets httpOnly cookie
3. Frontend includes `X-Tenant-Id` header
4. Backend validates token + tenant access
5. Database RLS enforces tenant isolation

---

## 📦 Shared Packages

### **@qivr/design-system** (`packages/design-system`)

**Purpose**: Shared UI component library

**Components**:

- Aura UI components (buttons, cards, forms)
- Skeleton loaders
- Empty states
- Filter chips
- Charts (Recharts integration)
- Pain map components (3D visualization)
- Status badges
- Navigation components

**Exports**: 30+ reusable components
**Used by**: Both frontend apps

---

### **@qivr/http** (`packages/http`)

**Purpose**: Shared HTTP client utilities

**Features**:

- Axios wrapper
- Request/response interceptors
- Error handling
- Type-safe API calls

---

## 🚀 Deployment

### **Infrastructure**

- **Frontend**: S3 + CloudFront (CDN)
- **Backend**: ECS Fargate (containerized)
- **Database**: RDS PostgreSQL (Multi-AZ)
- **Auth**: AWS Cognito (per-tenant pools)
- **Files**: S3 (document storage)
- **OCR**: Lambda + Textract

### **CI/CD**

- **GitHub Actions**: Automated builds & deployments
- **Build Time**: ~7-8 seconds per app
- **Deployment**: Automatic on push to main
- **Success Rate**: 100% (28 deployments)

### **Environments**

- **Production**: https://clinic.qivr.pro
- **API**: https://clinic.qivr.pro/api
- **Region**: AWS us-east-1

---

## 📊 Performance Metrics

### **Bundle Sizes**

- Clinic Dashboard: 1.06MB (293KB gzipped)
- Patient Portal: 2.50MB (703KB gzipped)
- Vendor chunks: Separate caching (react, mui, charts, 3d)

### **Build Performance**

- TypeScript compilation: ~2-3s
- Vite build: ~5-7s
- Total build time: ~7-8s

### **Database**

- Connection pooling: Enabled
- Query optimization: Indexed foreign keys
- RLS overhead: Minimal (<5ms)

---

## 🔄 Data Flow Examples

### **Patient Books Appointment**

```
Patient Portal → API → Database
1. Patient selects time slot
2. Frontend calls POST /api/appointments
3. Backend validates availability
4. Creates appointment record
5. Sends confirmation email
6. Returns appointment data
7. Frontend updates UI
```

### **Document Upload with OCR**

```
Clinic Dashboard → API → S3 → Lambda → Database
1. Staff uploads document
2. API uploads to S3
3. Triggers Lambda function
4. Lambda runs Textract OCR
5. Extracts text & metadata
6. Stores results in database
7. Frontend displays extracted data
```

### **PROM Completion**

```
Patient Portal → API → Database → Analytics
1. Patient receives PROM link
2. Completes questionnaire
3. API calculates scores
4. Stores responses
5. Updates analytics
6. Notifies clinic staff
```

---

## 🛡️ Security

### **Frontend**

- HTTPS only (enforced)
- httpOnly cookies (no localStorage)
- CSRF protection
- XSS prevention (React escaping)
- Content Security Policy

### **Backend**

- JWT validation on all endpoints
- Tenant isolation (RLS + middleware)
- Input validation & sanitization
- Rate limiting
- SQL injection prevention (EF Core)
- Audit logging

### **Database**

- Row-Level Security (RLS)
- Encrypted at rest
- Encrypted in transit (SSL)
- Automated backups
- Point-in-time recovery

---

## 📈 Scalability

### **Current Capacity**

- **Concurrent Users**: 1000+ per clinic
- **Database**: Vertical scaling available
- **API**: Horizontal scaling (ECS tasks)
- **Frontend**: CDN (unlimited)

### **Multi-Tenancy**

- **Isolation**: Database-level (RLS)
- **Performance**: Per-tenant query optimization
- **Scaling**: Add tenants without infrastructure changes

---

## 🔧 Development Workflow

### **Local Development**

```bash
# Start backend
cd backend && dotnet run

# Start clinic dashboard
cd apps/clinic-dashboard && npm run dev

# Start patient portal
cd apps/patient-portal && npm run dev
```

### **Testing**

```bash
# Run E2E tests
node scripts/tests/test-live-system.mjs

# Run unit tests
npm test
```

### **Deployment**

```bash
# Automatic on push to main
git push origin main

# Manual deployment
npm run deploy
```

---

## 📚 Related Documentation

- [Setup Guide](guides/setup.md)
- [Development Guide](guides/development.md)
- [API Routes](API-ROUTES.md)
- [Database Schema](DATABASE-SCHEMA.md)
- [Deployment Guide](deployment/DEPLOYMENT.md)
- [UX Progress](UX-PROGRESS.md)
