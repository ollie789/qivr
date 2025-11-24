# Qivr Clinic Dashboard

Multi-tenant SaaS platform for clinic management with per-tenant Cognito authentication.

## 🎨 UX Improvements (97% Complete - 100% of Active Pages!) 🎉

**Patient Portal**: 100% complete (19/19 pages)
**Clinic Dashboard**: 100% complete (15/15 pages)
**Overall Platform**: 97% complete (34/35 pages - 1 test page deleted)

See [UX-IMPROVEMENTS.md](docs/UX-IMPROVEMENTS.md) for detailed documentation.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev
```

## 📁 Project Structure

```
qivr/
├── apps/                   # Frontend applications
│   └── clinic-dashboard/   # Main clinic dashboard app
├── backend/                # .NET Core API
│   ├── Qivr.Api/          # API controllers
│   ├── Qivr.Services/     # Business logic
│   └── Qivr.Infrastructure/ # Data access
├── docs/                   # Documentation
├── scripts/                # Utility scripts
│   └── tests/             # Test suites
├── database/               # SQL migrations
├── aws/                    # AWS configurations
└── infrastructure/         # Docker, Terraform

```

## 🧪 Testing

```bash
# Run E2E tests (19 comprehensive tests)
node scripts/tests/test-live-system.mjs

# Test specific features
node scripts/tests/test-api-endpoints.mjs user@clinic.com Password123!
node scripts/tests/test-frontend-pages.mjs user@clinic.com Password123!
```

## 🔐 Authentication

- **Auth Proxy** with httpOnly cookies
- **Per-tenant Cognito pools** (created on registration)
- **Tenant isolation** via X-Tenant-Id header
- **HTTPS only** in production

## 🌐 Deployment

**Production:** https://clinic.qivr.pro

**Stack:**

- Frontend: React + Vite → S3 + CloudFront
- Backend: .NET 8 → ECS Fargate
- Database: PostgreSQL RDS
- Auth: AWS Cognito (per-tenant pools)

## 📚 Documentation

**Getting Started:**

- [Setup Guide](docs/guides/setup.md)
- [Development Guide](docs/guides/development.md)
- [Quick Reference](docs/guides/QUICK-REFERENCE.md)

**Current Status:**

- [UX Progress](docs/UX-PROGRESS.md) - 97% complete!
- [UX Improvements Guide](docs/UX-IMPROVEMENTS.md)
- [API Routes](docs/API-ROUTES.md)
- [Database Schema](docs/DATABASE-SCHEMA.md)

**Operations:**

- [Deployment Guide](docs/deployment/DEPLOYMENT.md)
- [Testing Guide](docs/guides/testing.md)
- [Architecture](docs/guides/architecture.md)

See [docs/README.md](docs/README.md) for complete documentation index.

## 🛠️ Development

```bash
# Backend
cd backend
dotnet run

# Frontend
cd apps/clinic-dashboard
npm run dev
```

## 🚀 Deployment Status

- **Latest**: Project cleanup & optimization complete (1.5GB saved)
- **UX**: 97% complete - All active pages improved
- **Production**: https://clinic.qivr.pro
- **Recent Updates**: Bundle optimization, documentation reorganization

## 📊 Features

✅ Multi-tenant architecture
✅ Medical records (consolidated patient management)
✅ Appointment scheduling
✅ Document management with OCR
✅ Messaging system with unread counts
✅ Analytics dashboard
✅ PROM questionnaires with scoring
✅ Intake forms with AI triage
✅ Settings management

## 🔧 Tech Stack

**Frontend:**

- React 18
- TypeScript
- Vite
- Zustand (state)
- React Query
- TailwindCSS

**Backend:**

- .NET 8
- Entity Framework Core
- PostgreSQL
- Serilog

**Infrastructure:**

- AWS ECS Fargate
- AWS RDS PostgreSQL
- AWS Cognito
- AWS S3 + CloudFront
- AWS ALB

## 📝 License

Proprietary
