# Qivr Documentation

## Core Reference

| Document                                 | Description                                   |
| ---------------------------------------- | --------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)       | System architecture, tech stack, AWS services |
| [API-ROUTES.md](API-ROUTES.md)           | Complete API endpoint reference               |
| [DATABASE-SCHEMA.md](DATABASE-SCHEMA.md) | Database tables and relationships             |

## Guides

| Guide                                                          | Description                   |
| -------------------------------------------------------------- | ----------------------------- |
| [guides/setup.md](guides/setup.md)                             | Initial project setup         |
| [guides/development.md](guides/development.md)                 | Development workflow          |
| [guides/authentication.md](guides/authentication.md)           | Auth implementation (Cognito) |
| [guides/testing.md](guides/testing.md)                         | Testing approach              |
| [guides/operations.md](guides/operations.md)                   | Ops procedures                |
| [guides/security.md](guides/security.md)                       | Security guidelines           |
| [guides/OPENTELEMETRY-SETUP.md](guides/OPENTELEMETRY-SETUP.md) | Observability setup           |
| [guides/QUICK-REFERENCE.md](guides/QUICK-REFERENCE.md)         | Quick command reference       |

## Specialized

| Document                                                               | Description           |
| ---------------------------------------------------------------------- | --------------------- |
| [deployment/DEPLOYMENT.md](deployment/DEPLOYMENT.md)                   | Production deployment |
| [features/3D-PAIN-MAP.md](features/3D-PAIN-MAP.md)                     | 3D pain visualization |
| [SAAS-ANALYTICS-ARCHITECTURE.md](SAAS-ANALYTICS-ARCHITECTURE.md)       | Analytics data lake   |
| [INTAKE-QUESTIONNAIRE-STRUCTURE.md](INTAKE-QUESTIONNAIRE-STRUCTURE.md) | Intake form structure |

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

## Production URLs

| Service          | URL                      |
| ---------------- | ------------------------ |
| Clinic Dashboard | https://clinic.qivr.pro  |
| Patient Portal   | https://patient.qivr.pro |
| API              | https://api.qivr.pro     |
| Admin Portal     | https://admin.qivr.pro   |

## Project Structure

```
qivr/
├── apps/
│   ├── clinic-dashboard/    # Staff portal (18 pages)
│   ├── patient-portal/      # Patient portal (20 pages)
│   ├── intake-widget/       # Embeddable intake form
│   └── admin-portal/        # Platform admin
├── backend/
│   ├── Qivr.Api/           # API controllers (40+)
│   ├── Qivr.Services/      # Business logic
│   ├── Qivr.Core/          # Domain models
│   └── Qivr.Infrastructure/# Data access
├── packages/
│   ├── design-system/      # Aura UI components
│   ├── http/               # HTTP client
│   └── eval/               # Evaluation utilities
├── database/               # Migrations & seeds
└── docs/                   # Documentation
```

## Tech Stack

**Frontend:**

- React 19 + TypeScript
- Vite 7
- MUI v7 + Aura Design System
- React Query, Zustand
- React Router v7

**Backend:**

- .NET 8 Web API
- Entity Framework Core
- PostgreSQL

**Infrastructure:**

- AWS ECS Fargate
- AWS RDS PostgreSQL
- AWS S3 + CloudFront
- AWS Cognito
- AWS Bedrock (AI)

## Archive

The [archive/](archive/) folder contains historical documentation from completed features and migrations.
