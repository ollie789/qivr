# Local Development Setup

## Prerequisites
- .NET 8.0 SDK
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+
- AWS CLI (for Cognito)

## Quick Start
See README.md for quick start guide.

## Detailed Setup

# Qivr Setup & Development Guide

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ and npm 10+
- **.NET 8 SDK**
- **Docker** and Docker Compose
- **PostgreSQL** client tools (psql)
- **AWS CLI** (for production deployment)

### Initial Setup

1. **Clone and install dependencies:**
```bash
# Install Node dependencies
npm install

# Install .NET dependencies
cd backend
dotnet restore
cd ..
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start local infrastructure:**
```bash
docker compose up -d
```

This starts:
- PostgreSQL 16 (port 5432)
- Redis (port 6379)
- LocalStack (AWS services mock, port 4566)
- MinIO (S3-compatible storage, ports 9000/9001)
- Mailhog (email testing, port 8025 for UI)
- pgAdmin (database UI, port 8081)
- OpenTelemetry Collector (port 4317)
- Jaeger (tracing UI, port 16686)

4. **Initialize the database:**
```bash
# The schema is automatically loaded from database/schemas/001_initial_schema.sql
# Verify connection:
psql -h localhost -U qivr_user -d qivr
```

5. **Start development servers:**

```bash
# Terminal 1: Backend API
cd backend
dotnet watch run --project Qivr.Api
# API will be available at http://localhost:5000
# Swagger UI at http://localhost:5000

# Terminal 2: Widget
npm run widget:dev
# Widget dev server at http://localhost:3000

# Terminal 3: Patient Portal
npm run patient:dev
# Patient portal at http://localhost:3001

# Terminal 4: Clinic Dashboard
npm run clinic:dev
# Clinic dashboard at http://localhost:3002
```

## 📁 Project Structure

```
qivr/
├── apps/                      # Frontend applications
│   ├── widget/               # Embeddable evaluation widget
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   │   └── BodyMap3D.tsx  # 3D body mapping
│   │   │   ├── services/    # API clients
│   │   │   └── utils/       # Utilities
│   │   └── package.json
│   ├── patient-portal/       # Patient web app
│   └── clinic-dashboard/     # Clinic management app
│
├── backend/                  # .NET 8 backend
│   ├── Qivr.Api/            # API gateway & controllers
│   ├── Qivr.Core/           # Domain models & interfaces
│   ├── Qivr.Services/       # Business logic
│   └── Qivr.Infrastructure/ # Data access & integrations
│
├── packages/                 # Shared packages
│   ├── ui-components/       # Shared React components
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Shared utilities
│
├── database/                # Database files
│   ├── migrations/         # Schema migrations
│   └── schemas/            # SQL schema definitions
│
├── infrastructure/         # Infrastructure as Code
│   ├── terraform/         # AWS infrastructure
│   └── docker/            # Container configs
│
└── docker-compose.yml     # Local development environment
```

## 🏗️ Architecture Overview

### Multi-Tenant Architecture
- **Row-Level Security (RLS)**: PostgreSQL enforces tenant isolation at the database level
- **Tenant Context**: Each request carries tenant_id in JWT claims
- **Data Isolation**: Complete data separation between clinics

### Key Components

1. **White-Label Widget**
   - Embeddable iframe with postMessage API
   - 3D body mapping using Three.js
   - Dynamic questionnaires
   - Social login integration

2. **Patient Portal**
   - View evaluations and AI summaries
   - Book and manage appointments
   - Complete PROMs
   - Track progress over time

3. **Clinic Dashboard**
   - Review patient intakes
   - Manage appointments
   - Design PROM templates
   - View analytics and trends

4. **Backend Services**
   - **Identity Service**: Cognito integration, JWT management
   - **Intake Service**: Evaluation processing, pain mapping
   - **Booking Service**: Calendar sync, availability management
   - **PROM Service**: Template management, scheduling, scoring
   - **Notification Service**: SMS, email, voice communications
   - **AI Service**: De-identified analysis, triage summaries

## 🔐 Security & Compliance

### Australian Data Residency
- All PHI stored in AWS Sydney (ap-southeast-2)
- Disaster recovery in Melbourne (ap-southeast-4)
- No PHI leaves Australian regions

### Authentication & Authorization
- Amazon Cognito for identity management
- JWT tokens with tenant claims
- Role-based access control (RBAC)
- Multi-factor authentication support

### Data Protection
- TLS 1.2+ for all communications
- AES-256 encryption at rest
- Audit logging for all PHI access
- Consent management system

## 🧪 Testing

### Unit Tests
```bash
# Backend tests
cd backend
dotnet test

# Frontend tests
npm test
```

### Integration Tests
```bash
# Run with test database
docker compose -f docker-compose.test.yml up
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 📊 Monitoring & Observability

### Metrics & Tracing
- OpenTelemetry instrumentation
- Jaeger UI: http://localhost:16686
- Metrics endpoint: http://localhost:8888/metrics

### Logs
- Structured JSON logging
- Centralized in CloudWatch (production)
- Local logs in Docker containers

### Health Checks
- API health: http://localhost:5000/health
- Database connectivity
- External service availability

## 🚢 Deployment

### Development
```bash
# Build all services
npm run build
cd backend && dotnet publish
```

### Staging/Production
```bash
# Use Terraform for infrastructure
cd infrastructure/terraform
terraform plan
terraform apply

# Deploy with GitHub Actions
# Pushes to main branch trigger deployment
```

## 📚 API Documentation

### Swagger/OpenAPI
- Development: http://localhost:5000
- Staging: https://api-staging.qivr.health/swagger
- Production: https://api.qivr.health/swagger

### Key Endpoints
```
POST   /api/v1/intakes                 # Submit evaluation
GET    /api/v1/intakes/{id}           # Get evaluation
POST   /api/v1/appointments           # Book appointment
GET    /api/v1/appointments           # List appointments
POST   /api/v1/proms/complete         # Submit PROM responses
GET    /api/v1/proms/patient/{id}     # Get patient PROMs
```

## 🛠️ Common Tasks

### Add a new database migration
```bash
cd backend
dotnet ef migrations add MigrationName -p Qivr.Infrastructure -s Qivr.Api
```

### Update dependencies
```bash
npm update
cd backend && dotnet outdated
```

### Clear local data
```bash
docker compose down -v
docker compose up -d
```

### Access services
- **pgAdmin**: http://localhost:8081 (admin@qivr.local / admin)
- **MinIO Console**: http://localhost:9001 (minioadmin / minioadmin)
- **Mailhog**: http://localhost:8025
- **Jaeger**: http://localhost:16686

## 🐛 Troubleshooting

### Database connection issues
```bash
# Check PostgreSQL is running
docker compose ps postgres
docker compose logs postgres

# Test connection
psql -h localhost -U qivr_user -d qivr
```

### Port conflicts
```bash
# Check what's using a port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :5000  # API
```

### Reset everything
```bash
docker compose down -v
rm -rf node_modules backend/bin backend/obj
npm install
cd backend && dotnet restore
docker compose up -d
```

## 📞 Support

For questions or issues:
- Check the [README](README.md)
- Review the [SPEC](../spec_001_pdf_printable_html_export.html)
- Contact: support@qivr.health


---

# Qivr Local Development Setup

## Current Status ✅
All components are configured and ready to run!

## Quick Start
```bash
# Start everything
./start-local.sh

# Stop everything
./stop-local.sh
```

## Services & Ports
| Service | Port | URL | Status |
|---------|------|-----|--------|
| PostgreSQL | 5432 | - | ✅ Running |
| MinIO (S3) | 9000/9001 | http://localhost:9001 | ✅ Running |
| Backend API | 5050 | http://localhost:5050 | ✅ Running |
| Clinic Dashboard | 3002 | http://localhost:3002 | ✅ Ready |

## Login Credentials
- **Email**: `test.doctor@clinic.com`
- **Password**: `ClinicTest123!`
- **Role**: Admin
- **Tenant ID**: `b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11`

## Features Available
✅ **Authentication** - AWS Cognito integration
✅ **Dashboard** - Main clinic dashboard
✅ **Patients** - Patient management
✅ **Staff Management** - Manage clinic staff
✅ **Intake Queue** - Patient intake processing
✅ **Appointments** - Appointment scheduling
✅ **PROMs Builder** - Patient-reported outcome measures
✅ **Analytics** - Clinic analytics
✅ **Settings** - Clinic settings

## Configuration Files
- Backend config: `/backend/Qivr.Api/appsettings.Development.json`
- Frontend config: `/apps/clinic-dashboard/.env`
- Frontend dev config: `/apps/clinic-dashboard/.env.development`

## Troubleshooting

### If login fails:
1. Clear browser cache: `localStorage.clear(); sessionStorage.clear()`
2. Check backend is running: `curl http://localhost:5050/api/health`
3. Verify Cognito region: `ap-southeast-2`

### If API calls fail:
1. Check tenant ID is correct: `b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11`
2. Verify backend is using port 5050
3. Check CORS is configured for your frontend port

### If database issues:
```bash
# Check PostgreSQL
psql -h localhost -U qivr_user -d qivr

# Run migrations
cd backend
dotnet ef database update --project Qivr.Infrastructure --startup-project Qivr.Api
```

## Development Workflow
1. Start all services: `./start-local.sh`
2. Open browser: http://localhost:3002
3. Login with test credentials
4. Make changes to code
5. Frontend hot-reloads automatically
6. Backend requires restart for changes

## Next Steps
- [ ] Add more test data
- [ ] Configure email service
- [ ] Set up SMS notifications
- [ ] Add more PROM templates
- [ ] Configure appointment types
