# MVP Milestone - November 2025

## Overview
Qivr has reached MVP status with a fully functional multi-tenant clinic management platform featuring patient portal, clinic dashboard, and comprehensive healthcare workflows.

## Architecture

### Frontend Applications
- **Clinic Dashboard** (`apps/clinic-dashboard/`) - React + TypeScript + Vite
  - Multi-tenant clinic management interface
  - Patient records, appointments, PROM management
  - Real-time messaging and notifications
  - Analytics dashboard
  
- **Patient Portal** (`apps/patient-portal/`) - React + TypeScript + Vite
  - Patient-facing interface for self-service
  - Intake form submission
  - PROM completion
  - Appointment viewing and messaging

### Backend API
- **.NET 8 Web API** (`backend/Qivr.Api/`)
  - RESTful API with JWT authentication
  - Multi-tenant data isolation
  - Entity Framework Core + PostgreSQL
  - AWS Cognito integration (per-tenant user pools)

### Infrastructure
- **AWS ECS Fargate** - Containerized backend deployment
- **AWS RDS PostgreSQL** - Multi-tenant database
- **AWS S3 + CloudFront** - Frontend hosting and CDN
- **AWS Cognito** - Per-tenant authentication
- **AWS ALB** - Load balancing and SSL termination

## Core Features

### ✅ Authentication & Authorization
- Per-tenant Cognito user pools
- Role-based access control (Admin, Staff, Patient)
- Tenant isolation enforced at database and application layers
- Patient blocking from clinic dashboard

### ✅ Patient Management
- Comprehensive patient records
- Medical history tracking
- Document management
- Consent tracking

### ✅ Intake & Evaluations
- Patient intake form submission
- Cross-application data flow (patient portal → clinic dashboard)
- Real-time evaluation queue
- Auto-refresh with 30-second polling

### ✅ PROM System
- Custom PROM template builder
- PROM instance assignment to patients
- Patient PROM completion workflow
- Response tracking and analytics

### ✅ Appointments
- Appointment scheduling
- Provider assignment
- Status tracking
- Auto-refresh functionality

### ✅ Messaging
- Patient-staff messaging
- Real-time notifications
- Read/unread status tracking

### ✅ Medical Records
- Access control (Admin/Staff can view all patients in tenant)
- Medical summary generation
- Condition tracking

## Technical Highlights

### State Management
- **React Query** for server state with proper cache invalidation
- **Zustand** for client state
- Standardized query key conventions
- Mutation patterns with automatic cache updates

### Data Flow
- API responses properly unwrapped (some endpoints return data directly)
- Consistent error handling
- Loading states managed via React Query
- Auto-refresh for critical data (evaluations, appointments)

### Security
- Tenant isolation via `tenant_id` foreign keys
- Cognito ID → Database ID mapping for user lookups
- Role-based endpoint protection
- HTTPS-only in production

### Code Quality
- TypeScript strict mode
- Comprehensive documentation
- React Query patterns guide
- Cache invalidation best practices

## Known Architecture Decisions

### Cognito ID Mapping
- JWT `sub` claim contains `cognito_id` (not database user ID)
- Backend lookups required: `Users.FirstOrDefault(u => u.CognitoSub == cognitoId)`
- Ensures proper foreign key relationships

### API Response Structure
- Some endpoints return data directly (e.g., `/api/evaluations`)
- Others wrap in `{data: ...}` structure
- `apiClient.get()` already unwraps one level

### Cross-App Cache
- Patient portal and clinic dashboard don't share React Query cache
- Auto-refresh implemented (30s polling + refetchOnWindowFocus)
- Ensures data consistency across applications

### User Types
- **Admin/Staff**: Full clinic dashboard access, credentials in Cognito
- **Provider**: Metadata only (no login), assigned to appointments
- **Patient**: Patient portal only, blocked from clinic dashboard

## Deployment

### Production URLs
- **Clinic Dashboard**: https://clinic.qivr.pro
- **Patient Portal**: https://portal.qivr.pro
- **API**: https://api.qivr.pro

### Build Process
- CodeBuild project: `qivr-build` (ap-southeast-2)
- Docker image pushed to ECR
- ECS service auto-deploys new task definitions
- Frontend deployed via S3 sync + CloudFront invalidation

## Database Schema
- Multi-tenant with `tenant_id` on all entities
- Soft deletes via `deleted_at` timestamps
- Audit fields: `created_at`, `updated_at`, `created_by`, `updated_by`
- JSON columns for flexible data (preferences, metadata, questionnaire responses)

## Testing
- E2E test suite: `scripts/tests/test-live-system.mjs` (19 tests)
- API endpoint tests
- Frontend page tests
- Database seed scripts for demo data

## Documentation
- [React Query Patterns](./REACT-QUERY-PATTERNS.md)
- [Cache Invalidation Fix](./CACHE-INVALIDATION-FIX.md)
- [Testing Guide](./TESTING.md)
- [API Documentation](./API.md)
- [Quick Reference](./QUICK-REFERENCE.md)

## Next Steps (Post-MVP)
- [ ] Real-time WebSocket notifications
- [ ] Advanced analytics and reporting
- [ ] Document OCR and processing
- [ ] Telehealth integration
- [ ] Mobile applications
- [ ] AI-powered clinical insights
- [ ] Billing and insurance integration

---

**Status**: MVP Complete ✅  
**Date**: November 15, 2025  
**Build**: #213 (CodeBuild)  
**Task Definition**: qivr-api:135 (ECS)
