# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Qivr is a multi-tenant healthcare platform for patient intake, appointment scheduling, and clinic management. It consists of:
- **Frontend**: Three React apps (Patient Portal, Clinic Dashboard, Widget) using TypeScript, Material-UI, and React Query
- **Backend**: .NET 8 modular monolith API with PostgreSQL database
- **Infrastructure**: Docker-based local development environment with comprehensive service stack

## Key Commands

### Full Stack Development
```bash
# Start all services (recommended for first-time setup)
./start-all.sh

# Or start specific services:
./start-backend.sh        # Backend API only
./start-local.sh          # Frontend apps only

# Stop everything
./stop-all.sh
```

### Frontend Development
```bash
# Patient Portal (port 3000)
npm run patient:dev

# Clinic Dashboard (port 3001)
npm run clinic:dev  

# Embeddable Widget (port 3002)
npm run widget:dev

# Build all frontends
npm run build

# Run frontend tests
npm test
```

### Backend Development
```bash
# Start backend API (port 5050)
cd backend && dotnet watch run --project Qivr.Api

# Run backend tests
cd backend && dotnet test

# Database migrations
cd backend && dotnet ef migrations add MigrationName -p Qivr.Infrastructure -s Qivr.Api
cd backend && dotnet ef database update
```

### Infrastructure Management
```bash
# Start Docker services (PostgreSQL, Redis, MinIO, etc.)
docker compose up -d

# View service logs
docker compose logs -f [service-name]

# Reset everything (WARNING: deletes all data)
./restart-clean.sh

# Check service health
./check-status.sh
```

### Database Operations
```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Connect to database
psql -h localhost -U qivr_user -d qivr
```

## Architecture Overview

### Monorepo Structure
The project uses npm workspaces to manage multiple applications:
- `/apps/patient-portal` - Patient-facing React app with appointment booking and evaluation viewing
- `/apps/clinic-dashboard` - Clinic management interface with 3D body mapping and PROM templates
- `/apps/widget` - Embeddable iframe widget for third-party integration
- `/backend` - .NET 8 API following Domain-Driven Design principles
- `/packages` - Shared code between frontend apps
- `/database` - PostgreSQL migrations and schemas
- `/infrastructure` - Docker configs and Terraform for AWS deployment

### Backend Architecture (.NET 8)
The backend follows a modular monolith pattern:
- **Qivr.Api**: Controllers, middleware, API gateway functionality
- **Qivr.Core**: Domain entities, interfaces, business rules
- **Qivr.Services**: Business logic, external integrations (Calendar, AI, SMS)
- **Qivr.Infrastructure**: Data access, EF Core, repositories

Key middleware:
- `TenantContextMiddleware` - Extracts tenant context from JWT
- `SecurityHeadersMiddleware` - Adds CSP, HSTS headers
- `RateLimitingMiddleware` - Request throttling

### Database Design
PostgreSQL with Row-Level Security (RLS) for multi-tenancy:
- All tables include `tenant_id` for data isolation
- Evaluations include AI-generated summaries
- Calendar integration with Google/Microsoft
- PROM (Patient-Reported Outcome Measures) system
- Complete audit logging

### Authentication & Security
- AWS Cognito for identity management (production)
- Mock authentication available for development
- JWT tokens with tenant claims
- Role-based access control (Patient, Practitioner, Admin)
- Australian data residency requirements

## Service URLs & Ports

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5050 | http://localhost:5050/api |
| Patient Portal | 3000 | http://localhost:3000 |
| Clinic Dashboard | 3001 | http://localhost:3001 |
| Widget | 3002 | http://localhost:3002 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO Console | 9001 | http://localhost:9001 |
| Mailhog UI | 8025 | http://localhost:8025 |
| pgAdmin | 8081 | http://localhost:8081 |
| Jaeger Tracing | 16686 | http://localhost:16686 |

## Development Credentials

### Test Accounts
- **Clinic**: clinic@qivr.health / Clinic123!
- **Patient**: patient@qivr.health / Patient123!

### Service Credentials
- **PostgreSQL**: qivr_user / qivr_dev_password
- **MinIO**: minioadmin / minioadmin
- **pgAdmin**: admin@qivr.com / admin

## Common Development Tasks

### Adding a New API Endpoint
1. Create DTO in `backend/Qivr.Core/DTOs/`
2. Add interface in `backend/Qivr.Core/Interfaces/`
3. Implement service in `backend/Qivr.Services/`
4. Create controller in `backend/Qivr.Api/Controllers/`
5. Add tests in `backend/Qivr.Tests/`

### Creating a Frontend Component
1. Add component in appropriate app's `src/components/`
2. If shared, place in `/packages/ui-components/`
3. Include Material-UI theming and responsive design
4. Add React Query hooks for data fetching
5. Include error boundaries and loading states

### Database Schema Changes
1. Create migration: `dotnet ef migrations add [Name]`
2. Review generated migration in `backend/Qivr.Infrastructure/Migrations/`
3. Apply migration: `dotnet ef database update`
4. Update seed data if needed in `database/seed-data.sql`

## Environment Configuration

### Required Environment Variables
Key variables needed in `.env` file:
```bash
# Database
INTAKE_DATABASE_URL=postgresql://qivr_user:qivr_dev_password@localhost/qivr

# AWS (for production)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-southeast-2

# Authentication
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
JWT_SECRET=

# External Services
MESSAGEMEDIA_API_KEY=
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
MICROSOFT_CLIENT_ID=
```

## Testing Strategy

### Frontend Testing
- Unit tests with Vitest
- Component testing with React Testing Library
- E2E tests for critical user flows

### Backend Testing
- Unit tests for services and domain logic
- Integration tests for API endpoints
- Load testing with k6 for performance validation

### Test Commands
```bash
# All tests
npm test

# Backend only
cd backend && dotnet test

# Frontend with coverage
npm test -- --coverage

# E2E tests
npm run test:e2e
```

## Troubleshooting

### Backend Won't Start
- Check PostgreSQL is running: `docker compose ps postgres`
- Verify connection string in `.env`
- Run migrations: `cd backend && dotnet ef database update`

### Frontend Build Errors
- Clear caches: `rm -rf node_modules/.vite`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

### Port Conflicts
```bash
# Find process using port
lsof -i :5050  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 $(lsof -ti:5050)
```

### Database Connection Issues
```bash
# Test connection
psql -h localhost -U qivr_user -d qivr -c "SELECT 1;"

# Reset database (WARNING: data loss)
docker compose down -v
docker compose up -d postgres
```

## Key API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/signup` - Registration
- `POST /api/auth/refresh` - Token refresh

### Patient Operations
- `POST /api/evaluations` - Submit evaluation
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `POST /api/proms/complete` - Submit PROM responses

### Clinic Operations
- `GET /api/evaluations/queue` - Review intake queue
- `POST /api/proms/templates` - Create PROM template
- `GET /api/appointments/availability` - Check provider availability

## Deployment Notes

### Local Development
Uses Docker Compose for all infrastructure services. Frontend apps use Vite dev server with HMR.

### Production Deployment
- AWS ECS for backend API
- CloudFront + S3 for frontend apps
- RDS PostgreSQL with Multi-AZ
- Cognito for authentication
- All data stays in Australian regions (ap-southeast-2)

## Important Considerations

### Multi-Tenancy
All database queries must include tenant context. The `TenantContextMiddleware` automatically extracts this from JWT claims.

### Healthcare Compliance
- PHI (Protected Health Information) must be encrypted
- Audit logging required for all data access
- Consent management for SMS communications
- Data residency in Australian AWS regions

### Performance
- Use React Query for caching and optimistic updates
- Implement pagination for large datasets
- Database queries optimized with proper indexes
- Redis caching for frequently accessed data

### Security
- Never expose sensitive keys in frontend code
- Use environment variables for configuration
- Implement rate limiting on API endpoints
- Regular security audits and dependency updates
