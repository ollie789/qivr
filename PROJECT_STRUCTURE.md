# Qivr Platform - Project Structure

## Directory Layout

```
qivr/
├── apps/                    # Frontend applications (Active)
│   ├── clinic-dashboard/    # Provider interface (React/TypeScript)
│   ├── patient-portal/      # Patient self-service portal (React/TypeScript)
│   └── widget/              # Embeddable 3D evaluation widget (React/Three.js)
│
├── backend/                 # .NET Core API
│   ├── Qivr.Api/           # API controllers and endpoints
│   ├── Qivr.Core/          # Domain models and interfaces
│   ├── Qivr.Infrastructure/# Data access and external services
│   └── Qivr.Services/      # Business logic and services
│
├── database/                # Database scripts
│   ├── migrations/         # SQL migration files
│   └── schemas/            # Schema definitions
│
├── infrastructure/          # Deployment and infrastructure
│   ├── terraform/          # Infrastructure as Code
│   └── otel/               # Observability configuration
│
├── logs/                   # Application logs (gitignored)
├── .pids/                  # Process ID files (gitignored)
│
├── docker-compose.yml      # Local development services
├── start-all.sh           # Start all services script
├── stop-all.sh            # Stop all services script
├── install.sh             # Initial setup script
│
└── Documentation
    ├── README.md                      # Project overview and quick start
    ├── SETUP.md                       # Detailed setup instructions
    ├── CURRENT_STATUS_AND_ROADMAP.md # Development status and roadmap
    └── TEST_CREDENTIALS.md           # Test account information
```

## Key Files

### Root Level Scripts
- `start-all.sh` - Starts all applications (Backend API, Clinic Dashboard, Patient Portal, Widget)
- `stop-all.sh` - Cleanly stops all running applications
- `install.sh` - Initial project setup and dependency installation
- `docker-compose.yml` - Local services (PostgreSQL, MinIO, pgAdmin, MailHog)

### Application Ports
- Backend API: `http://localhost:5000` (Swagger at `/swagger`)
- Clinic Dashboard: `http://localhost:3001`
- Patient Portal: `http://localhost:3002`
- Widget: `http://localhost:3000`
- pgAdmin: `http://localhost:8081`
- MinIO Console: `http://localhost:9001`
- MailHog: `http://localhost:8025`

## Technology Stack

### Backend
- .NET 8.0
- Entity Framework Core
- PostgreSQL
- MinIO (S3-compatible object storage)
- JWT Authentication

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- React Router
- React Hook Form
- Three.js (Widget only)
- Vite (build tool)

### Infrastructure
- Docker & Docker Compose
- Terraform
- GitHub Actions (CI/CD ready)

## Development Workflow

1. **Start Services**: Run `./start-all.sh` to start all applications
2. **Stop Services**: Run `./stop-all.sh` to stop everything
3. **View Logs**: Check the `logs/` directory for application logs
4. **Database**: PostgreSQL runs in Docker, migrations in `database/migrations/`
5. **API Documentation**: Visit `http://localhost:5000/swagger`

## Current Implementation Status

- ✅ Authentication & Authorization
- ✅ Patient Management
- ✅ Appointment Scheduling
- ✅ Patient Evaluations (3D body mapping)
- ✅ PROM Submission Flow
- ✅ Dashboard & Reporting (Basic)
- ⏳ Analytics & Charts
- ⏳ Real-time Updates
- ⏳ SMS/Voice Notifications
- ⏳ Payment Processing

See `CURRENT_STATUS_AND_ROADMAP.md` for detailed progress and next steps.
