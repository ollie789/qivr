# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

QIVR is a healthcare platform connecting patients with allied health providers. It consists of a .NET Core backend API, React-based clinic dashboard and patient portal frontends, and uses AWS Cognito for authentication with PostgreSQL for data persistence.

## Architecture

### Backend (.NET Core 8.0)
- **API**: REST API at `backend/Qivr.Api` (port 5050)
- **Core**: Domain models and interfaces at `backend/Qivr.Core`
- **Infrastructure**: Data access and external services at `backend/Qivr.Infrastructure`
- **Services**: Business logic at `backend/Qivr.Services`
- **Multi-tenant**: Tenant isolation via `TenantId` in all queries
- **Authentication**: AWS Cognito with JWT tokens

### Frontend Applications (React + TypeScript)
- **Clinic Dashboard**: `apps/clinic-dashboard` (port 3001)
- **Patient Portal**: `apps/patient-portal` (port 3000 or 3005 per user preference)
- **Widget**: Embeddable booking widget at `apps/widget` (port 3003)
- **Shared HTTP Package**: `packages/http` - Type-safe fetch wrapper with Cognito integration

### Database
- PostgreSQL with Entity Framework Core
- Migrations in `backend/Qivr.Infrastructure/Migrations`
- Seed data in `database/seed-data.sql`

## Common Commands

### Start Everything
```bash
# Quick start with all services
./start-all.sh

# Or start individual services:
docker compose up -d  # Start PostgreSQL, MinIO, Redis
npm run backend:dev   # Backend API on port 5050
npm run clinic:dev    # Clinic Dashboard on port 3001
npm run patient:dev   # Patient Portal on port 3000/3005
```

### Backend Development
```bash
cd backend

# Run API
dotnet watch run --project Qivr.Api --urls "http://localhost:5050"

# Run tests
dotnet test

# Add migration
dotnet ef migrations add MigrationName --project Qivr.Infrastructure --startup-project Qivr.Api

# Update database
dotnet ef database update --project Qivr.Infrastructure --startup-project Qivr.Api

# Build
dotnet build

# Clean
dotnet clean
```

### Frontend Development
```bash
# Install dependencies (from root)
npm install

# Run specific app
npm run clinic:dev    # Clinic dashboard
npm run patient:dev   # Patient portal
npm run widget:dev    # Widget

# Build all
npm run build

# Lint
npm run lint

# Format code
npm run format

# Run tests
npm run test
```

### Database Operations
```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Access PostgreSQL
psql -h localhost -U qivr_user -d qivr
```

### Docker Services
```bash
# Start all containers
docker compose up -d

# Stop containers
docker compose down

# View logs
docker compose logs -f [service-name]

# Services available:
# - PostgreSQL: 5432
# - MinIO (S3): 9000/9001
# - Redis: 6379
# - Mailhog: 1025/8025
# - pgAdmin: 8081
```

## Key Architectural Patterns

### API Controllers
Controllers inherit from `BaseApiController` which provides:
- Tenant context via `CurrentTenantId`
- User context via `CurrentUserId`
- Automatic tenant filtering for queries

### Frontend HTTP Client
All API calls use `@qivr/http` package which handles:
- Cognito token refresh
- Type-safe requests with generics
- Automatic error handling
- SSR-safe implementation

### Authentication Flow
1. User authenticates with AWS Cognito
2. Frontend stores tokens in localStorage/sessionStorage
3. HTTP client automatically attaches tokens to requests
4. Backend validates JWT tokens and extracts user/tenant info

### Multi-Tenancy
- Every entity has `TenantId` field
- Queries automatically filter by current tenant
- Cross-tenant access prevented at API level

## Test Credentials

**Clinic Dashboard**
- Email: `clinic@qivr.health` or `test.doctor@clinic.com`
- Password: `Clinic123!` or `ClinicTest123!`

**Patient Portal**
- Email: `patient@qivr.health`
- Password: `Patient123!`

## Service URLs

| Service | Development URL |
|---------|----------------|
| Backend API | http://localhost:5050 |
| Swagger UI | http://localhost:5050/swagger |
| Clinic Dashboard | http://localhost:3001 |
| Patient Portal | http://localhost:3000 or 3005 |
| Widget | http://localhost:3003 |
| pgAdmin | http://localhost:8081 |
| MinIO Console | http://localhost:9001 |
| Mailhog | http://localhost:8025 |

## Critical Implementation Notes

### Patient and Provider References
Per user preferences, use specific entities instead of generic User references:
- Use `PatientRecord` for patient data
- Use `Provider` for clinic staff/doctors
- Use `Appointment`, `VitalSign`, `Document` entities
- Implement polymorphic references where needed

### Port Configuration
- Backend API: 5050 (avoids macOS AirPlay conflict on 5000)
- Patient Portal: 3005 (per user preference)
- Doctor Dashboard: 3010 (per user preference)
- Current configuration may vary - check `ports.config.json`

### AWS Cognito Configuration
- Region: `ap-southeast-2`
- User Pools for both clinic staff and patients
- Automatic token refresh implemented in frontend

### Current TODOs
Major pending implementations per PROJECT_STATUS.md:
1. Complete Patient Records Controller (medical history, vitals)
2. Fix Intake Processing Worker (AI integration)
3. Complete Calendar Integration (Microsoft Graph)
4. Implement SMS notifications (MessageMedia)
5. Complete PROM Builder UI
6. Add comprehensive testing (target 80% coverage)

## Development Workflow

### For New Features
1. Create feature branch from `main`
2. Implement backend API endpoint if needed
3. Add/update Entity Framework models and migrations
4. Implement frontend components and API integration
5. Test with local Cognito or use test credentials
6. Ensure tenant isolation is maintained
7. Add tests for critical paths

### For Bug Fixes
1. Check `PROJECT_STATUS.md` for known issues
2. Verify tenant context is properly handled
3. Test with multiple tenant scenarios
4. Ensure Cognito tokens are properly refreshed

### Database Changes
1. Modify entities in `Qivr.Core/Entities`
2. Create migration: `dotnet ef migrations add [Name]`
3. Review generated migration
4. Update database: `dotnet ef database update`
5. Update seed data if needed

## Troubleshooting

### Backend Issues
- Check logs in `logs/backend.log`
- Verify PostgreSQL is running: `docker compose ps`
- Check connection string in `appsettings.Development.json`
- Ensure port 5050 is not in use

### Frontend Issues
- Clear browser cache: `localStorage.clear(); sessionStorage.clear()`
- Check API URL in `.env` files
- Verify Cognito configuration in `amplify.config.ts`
- Check browser console for CORS errors

### Authentication Issues
- Verify Cognito region is `ap-southeast-2`
- Check User Pool ID and Client ID
- Ensure tokens are not expired
- Clear session storage and re-login

### Database Issues
- Check PostgreSQL container: `docker compose logs postgres`
- Verify migrations are applied: `dotnet ef database update`
- Check connection string includes correct credentials
- Ensure tenant ID is correct for queries