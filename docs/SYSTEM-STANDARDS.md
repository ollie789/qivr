# Qivr System Standards & Architecture Guide

## 🏗️ Architecture Overview

**Multi-tenant SaaS Platform**
- Each clinic = separate tenant with isolated data
- Shared infrastructure, isolated data per tenant
- Single production environment (staging added later when needed)

## 🔐 Authentication System

### Standard Auth Flow
```
1. User login → API /auth/login
2. Backend validates → Cognito (tenant-specific pool)
3. Returns httpOnly cookies + user info
4. Frontend stores tenant context
5. All API calls include X-Tenant-Id header
```

### Auth Implementation Standards
- **Backend**: Use `_authorizationService.GetCurrentTenantId(HttpContext)` for tenant ID
- **Frontend**: Use httpOnly cookies + X-Tenant-Id header pattern
- **Never use**: JWT claims for tenant ID (inconsistent)
- **Both portals**: Same auth system (clinic + patient)

### Auth Files Pattern
```
Frontend:
- src/services/authApi.ts (API calls)
- src/lib/api-client.ts (HTTP client with auth)
- src/stores/authStore.ts (state management)

Backend:
- Controllers/AuthController.cs (endpoints)
- Services/CognitoAuthService.cs (Cognito integration)
- Controllers/TenantAwareController.cs (base class)
```

## 🌐 Infrastructure Standards

### Domain & Routing
- **Production**: `clinic.qivr.pro`
- **Frontend**: CloudFront → S3 production buckets
- **API**: CloudFront `/api/*` → ECS Fargate
- **Future staging**: `staging.clinic.qivr.pro`

### S3 Bucket Naming
```
Production:
- qivr-clinic-dashboard-production
- qivr-patient-portal-production

Future Staging:
- qivr-clinic-dashboard-staging  
- qivr-patient-portal-staging
```

### CloudFront Configuration
- **Single distribution** for production
- **Origins**: S3 (frontend) + ALB (API)
- **Behaviors**: 
  - `/*` → S3 (frontend assets)
  - `/api/*` → ECS backend (all HTTP methods)
- **Headers forwarded**: All headers for API calls
- **Cookies**: Forward all for auth

## 🚀 Deployment Pipeline

### CI/CD Flow
```
1. Git push → GitHub
2. CodeBuild triggered
3. Build backend → Docker → ECR → ECS
4. Build frontends → S3 production buckets
5. CloudFront invalidation
```

### Build Standards
- **Backend**: .NET 8, Docker multi-arch
- **Frontend**: React + Vite, TypeScript
- **Deployment**: Single production environment
- **Monitoring**: CloudWatch logs for debugging

## 📱 Frontend Applications

### Clinic Dashboard (`apps/clinic-dashboard`)
- **Users**: Clinic staff, admins
- **Features**: Patient management, appointments, analytics
- **Auth**: Admin/Staff roles
- **URL**: `clinic.qivr.pro`

### Patient Portal (`apps/patient-portal`)
- **Users**: Patients
- **Features**: Appointments, medical records, messaging
- **Auth**: Patient role within clinic tenant
- **URL**: `clinic.qivr.pro/patient` (future)

### Shared Standards
- **API Client**: Same pattern (httpOnly cookies + headers)
- **State Management**: Zustand preferred
- **Styling**: TailwindCSS
- **Build**: Vite + TypeScript

## 🗄️ Database & Backend

### Multi-tenant Data Model
```sql
-- All tables include TenantId for isolation
Users: TenantId, UserType (Admin/Staff/Patient)
Appointments: TenantId, PatientId, ProviderId
MedicalRecords: TenantId, PatientId
```

### Backend Standards
- **Framework**: .NET 8
- **Database**: PostgreSQL RDS
- **ORM**: Entity Framework Core
- **Auth**: AWS Cognito per tenant
- **Logging**: Serilog → CloudWatch
- **Hosting**: ECS Fargate

### Controller Patterns
```csharp
// Always extend TenantAwareController
public class PatientsController : TenantAwareController
{
    public async Task<IActionResult> CreatePatient([FromBody] CreatePatientDto dto)
    {
        // Use this pattern for tenant ID
        var tenantId = _authorizationService.GetCurrentTenantId(HttpContext);
        if (tenantId == Guid.Empty)
            return Unauthorized("Tenant not identified");
    }
}
```

## 🔧 Development Standards

### Local Development
```bash
# Backend
cd backend && dotnet run

# Frontend (clinic)
cd apps/clinic-dashboard && npm run dev

# Frontend (patient)
cd apps/patient-portal && npm run dev
```

### Environment Variables
```
# Frontend
VITE_API_URL=https://clinic.qivr.pro/api

# Backend
DATABASE_URL=postgresql://...
COGNITO_REGION=ap-southeast-2
```

### Testing Standards
- **E2E Tests**: `scripts/tests/test-live-system.mjs`
- **Data Flow**: `scripts/tests/test-data-flow.mjs`
- **Auth Tests**: `scripts/tests/test-auth-victory.mjs`

## 🛣️ API Routes Reference

**Base URL**: `https://clinic.qivr.pro/api`

### Core Routes Summary
- **Authentication**: `/api/auth/*` (login, register, refresh, etc.)
- **Patients**: `/api/patients/*` (CRUD, search)
- **Appointments**: `/api/appointments/*` (scheduling, management)
- **Messages**: `/api/messages/*` (threads, communication)
- **Medical Records**: `/api/medical-records/*` (patient records)
- **Documents**: `/api/documents/*` (file management)
- **Analytics**: `/api/analytics/*` (dashboard stats)
- **PROM**: `/api/proms/*` (questionnaires)
- **Intake**: `/api/intake/*` (forms, submissions)
- **Settings**: `/api/settings/*` (clinic, user preferences)

### Key Endpoints
```
POST /api/auth/login          # User authentication
POST /api/auth/register       # New user signup
GET  /api/patients            # List patients (paginated)
POST /api/patients            # Create patient
GET  /api/appointments        # List appointments
POST /api/appointments        # Create appointment
GET  /api/analytics/overview  # Dashboard stats
```

### Request Standards
- **Auth**: httpOnly cookies + X-Tenant-Id header
- **Content-Type**: application/json
- **Tenant Isolation**: All requests include tenant context

### Response Standards
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

*Full API documentation: See `/docs/API-ROUTES.md` for complete endpoint list (60+ routes)*

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

**1. "Valid Tenant ID is required"**
- Check: Controller uses `_authorizationService.GetCurrentTenantId()`
- Check: Frontend sends X-Tenant-Id header
- Check: User has correct tenant in database

**2. Frontend build failures**
- Check: TypeScript interfaces match API responses
- Check: All imports exist and are correct
- Check: API client has all required methods (get, post, put, patch, delete)

**3. CloudFront 404s**
- Check: S3 bucket names match CloudFront origins
- Check: Files deployed to correct buckets
- Check: CloudFront invalidation completed

**4. Auth issues**
- Check: Both portals use same auth pattern
- Check: Cookies are httpOnly and secure
- Check: Cognito pool exists for tenant

### Debugging Tools
- **CloudWatch Logs**: `/ecs/qivr-api` for backend logs
- **Browser DevTools**: Network tab for API calls
- **Test Scripts**: Run specific test suites
- **AWS Console**: Check service status

## 📋 Deployment Checklist

### Before Deploying
- [ ] All tests pass locally
- [ ] TypeScript compiles without errors
- [ ] Backend builds successfully
- [ ] Environment variables set correctly

### After Deploying
- [ ] CloudFront invalidation completed
- [ ] ECS service updated successfully
- [ ] CloudWatch logs show no errors
- [ ] Test critical user flows
- [ ] Run data flow test

## 🎯 Future Improvements

### When We Get Users
1. **Add proper staging environment**
2. **Implement blue/green deployments**
3. **Add comprehensive monitoring**
4. **Set up automated testing in pipeline**
5. **Add performance monitoring**

### Technical Debt to Address
1. **Standardize error handling** across all controllers
2. **Add API versioning** for future changes
3. **Implement proper logging** throughout frontend
4. **Add health checks** for all services
5. **Document all API endpoints**

---

## 📞 Quick Reference

**Production URL**: https://clinic.qivr.pro  
**API Base**: https://clinic.qivr.pro/api  
**CloudFront Distribution**: E1S9SAZB57T3C3  
**ECS Cluster**: qivr-cluster  
**Database**: qivr-dev-db (PostgreSQL RDS)  

**Key AWS Services**:
- ECS Fargate (backend)
- RDS PostgreSQL (database)  
- S3 (frontend assets)
- CloudFront (CDN + routing)
- Cognito (authentication)
- CodeBuild (CI/CD)

---

*Last Updated: November 11, 2025*
*Next Review: When adding staging environment*
