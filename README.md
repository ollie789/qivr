# Qivr Healthcare Platform

Multi-tenant SaaS platform for clinic management with patient engagement features.

## Quick Start

```bash
# Install dependencies
npm install

# Start development (all apps)
npm run dev

# Or start individually
npm run clinic:dev      # Clinic dashboard on :3010
npm run patient:dev     # Patient portal on :3005
npm run backend:dev     # .NET API on :5050
```

## Project Structure

```
qivr/
├── apps/                     # Frontend applications
│   ├── clinic-dashboard/     # Staff portal (18 pages)
│   ├── patient-portal/       # Patient portal (20 pages)
│   ├── intake-widget/        # Embeddable intake form
│   └── admin-portal/         # Platform admin
│
├── backend/                  # .NET 8 API
│   ├── Qivr.Api/            # API controllers (40+)
│   ├── Qivr.Services/       # Business logic layer
│   ├── Qivr.Core/           # Domain models & interfaces
│   └── Qivr.Infrastructure/ # Data access & external services
│
├── packages/                 # Shared packages
│   ├── design-system/       # Aura UI component library
│   ├── http/                # HTTP client utilities
│   └── eval/                # Evaluation utilities
│
├── database/                 # PostgreSQL migrations & seeds
├── docs/                     # Documentation
└── scripts/                  # Utility & deployment scripts
```

## Development

### Frontend Apps

| App              | Port | Command               |
| ---------------- | ---- | --------------------- |
| Clinic Dashboard | 3010 | `npm run clinic:dev`  |
| Patient Portal   | 3005 | `npm run patient:dev` |
| Intake Widget    | 3002 | `npm run widget:dev`  |
| Admin Portal     | 3020 | `npm run admin:dev`   |

### Backend

```bash
cd backend
dotnet run --project Qivr.Api    # API on port 5050
```

### Database

```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed test data
```

## Testing

```bash
npm run type-check    # Type checking
npm run lint          # Linting
npm run test          # Run tests
npm run storybook     # Component stories
```

## Key Features

- **Multi-tenant architecture** - Per-tenant Cognito pools, row-level data isolation
- **Intake management** - Kanban board, AI triage, questionnaire builder
- **Treatment plans** - Phase-based plans, exercise library, AI generation
- **PROM system** - Configurable questionnaires, automated scheduling, scoring
- **Patient portal** - Appointments, messaging, health progress, treatment tracking
- **Document management** - Upload, OCR extraction, categorization
- **Analytics dashboard** - Clinic metrics, patient outcomes, revenue tracking
- **Real-time messaging** - Threaded conversations, notifications
- **Referral management** - Track incoming/outgoing referrals
- **Device tracking** - Medical device assignment and monitoring

## Tech Stack

**Frontend:**

- React 19 + TypeScript
- Vite 7 (build tool)
- MUI v7 + Aura Design System
- React Query (data fetching)
- Zustand (state management)
- React Router v7

**Backend:**

- .NET 8 Web API
- Entity Framework Core
- PostgreSQL database
- Serilog logging

**AI/ML:**

- AWS Bedrock (Nova Lite, Claude)
- AI-powered intake triage
- Treatment plan generation
- Exercise suggestions

**Infrastructure:**

- AWS ECS Fargate (API)
- AWS S3 + CloudFront (frontend)
- AWS RDS PostgreSQL
- AWS Cognito (auth)
- AWS Lambda (OCR processing)
- AWS Textract (document OCR)
- AWS SES (email)

## Production URLs

| Service          | URL                      |
| ---------------- | ------------------------ |
| Clinic Dashboard | https://clinic.qivr.pro  |
| Patient Portal   | https://patient.qivr.pro |
| API              | https://api.qivr.pro     |
| Admin Portal     | https://admin.qivr.pro   |

## Deployment

```bash
npm run deploy              # Full deployment
npm run deploy:backend      # Backend only
npm run deploy:frontend     # Frontend only
```

## Documentation

See [docs/README.md](docs/README.md) for full documentation:

- [Architecture](docs/ARCHITECTURE.md) - System design
- [API Routes](docs/API-ROUTES.md) - Backend endpoints
- [Database Schema](docs/DATABASE-SCHEMA.md) - Data model
- [Guides](docs/guides/) - Development guides

## License

Proprietary
