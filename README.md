# Qivr Clinic Dashboard

Multi-tenant SaaS platform for clinic management with per-tenant Cognito authentication.

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

- [Testing Guide](docs/TESTING.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Quick Reference](docs/QUICK-REFERENCE.md)

## 🛠️ Development

```bash
# Backend
cd backend
dotnet run

# Frontend
cd apps/clinic-dashboard
npm run dev
```

## 📊 Features

✅ Multi-tenant architecture
✅ Patient management
✅ Appointment scheduling
✅ Medical records
✅ Document management
✅ Messaging system
✅ Analytics dashboard
✅ PROM questionnaires
✅ Intake forms
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
