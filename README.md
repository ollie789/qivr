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
│   ├── clinic-dashboard/     # Staff portal (React + Vite)
│   ├── patient-portal/       # Patient portal (React + Vite)
│   ├── intake-widget/        # Embeddable intake form
│   └── admin-portal/         # Platform admin
│
├── backend/                  # .NET 8 API
│   ├── Qivr.Api/            # API controllers & endpoints
│   ├── Qivr.Services/       # Business logic layer
│   ├── Qivr.Core/           # Domain models & interfaces
│   └── Qivr.Infrastructure/ # Data access & external services
│
├── packages/                 # Shared packages
│   ├── design-system/       # Aura UI component library
│   └── http/                # HTTP client utilities
│
├── database/                 # PostgreSQL migrations & seeds
├── analytics/                # AWS analytics (Athena, Glue)
├── aws/                      # AWS configurations
├── infrastructure/           # Docker, Terraform
├── scripts/                  # Utility & deployment scripts
├── stories/                  # Storybook stories
└── docs/                     # Documentation
```

## Development

### Frontend Apps

| App | Port | Command |
|-----|------|---------|
| Clinic Dashboard | 3010 | `npm run clinic:dev` |
| Patient Portal | 3005 | `npm run patient:dev` |
| Intake Widget | 3002 | `npm run widget:dev` |

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
# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm run test

# Storybook
npm run storybook
```

## Key Features

- **Multi-tenant architecture** with per-tenant Cognito pools
- **Patient portal** with appointments, messaging, health progress
- **Clinic dashboard** with intake management, analytics, treatment plans
- **Document management** with OCR extraction
- **PROM questionnaires** with scoring and tracking
- **Real-time messaging** between patients and providers
- **Analytics dashboard** with clinic metrics

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite build tool
- Material UI + custom Aura design system
- React Query for data fetching
- Zustand for state management

**Backend:**
- .NET 8 Web API
- Entity Framework Core
- PostgreSQL database
- Serilog logging

**Infrastructure:**
- AWS ECS Fargate (API)
- AWS S3 + CloudFront (frontend)
- AWS RDS PostgreSQL
- AWS Cognito (auth)

## Deployment

**Production:** https://clinic.qivr.pro

```bash
npm run deploy              # Full deployment
npm run deploy:backend      # Backend only
npm run deploy:frontend     # Frontend only
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design overview
- [API Routes](docs/API-ROUTES.md) - Backend endpoints
- [Database Schema](docs/DATABASE-SCHEMA.md) - Data model
- [Implementation Guide](docs/IMPLEMENTATION-GUIDE.md) - Feature development

See [docs/README.md](docs/README.md) for full documentation index.

## License

Proprietary
