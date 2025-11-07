# QIVR Healthcare Platform

QIVR connects allied health providers with patients through a multi-tenant platform built on ASP.NET Core 8 and React/TypeScript clients.

## 🌐 Production URLs

- **Clinic Dashboard:** https://dwmqwnt4dy1td.cloudfront.net
- **Patient Portal:** https://d1jw6e1qiegavd.cloudfront.net
- **API:** https://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com (Note: HTTPS not yet configured)

## 🚀 Local Development

```bash
# Clone & install
git clone git@github.com:qivr-health/qivr.git
cd qivr
npm install

# Start infrastructure (Postgres, Redis, MinIO, Mailhog)
npm run docker:up

# Run the API (http://localhost:5050)
npm run backend:dev

# In separate terminals run the frontends
npm run clinic:dev    # http://localhost:3010
npm run patient:dev   # http://localhost:3005
npm run widget:dev    # http://localhost:3000
```

**Note:** All environments (local, staging, production) connect to the same RDS database: `qivr-dev-db`

## 📍 Local Services

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5050 | http://localhost:5050 |
| Clinic Dashboard | 3010 | http://localhost:3010 |
| Patient Portal | 3005 | http://localhost:3005 |
| Widget | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | localhost:5432 |
| Mailhog | 8025 | http://localhost:8025 |

## 🏗️ Project Structure

```
qivr/
├── apps/
│   ├── clinic-dashboard/     # Staff-facing React app
│   ├── patient-portal/       # Patient React app
│   └── widget/               # Embeddable widget
├── backend/
│   ├── Qivr.Api/             # ASP.NET Core API
│   ├── Qivr.Core/            # Domain contracts
│   ├── Qivr.Infrastructure/  # EF Core + integrations
│   └── Qivr.Services/        # Business logic
├── packages/
│   └── http/                 # Shared TS HTTP client
└── infrastructure/           # Deployment scripts & Terraform
```

## 🚀 Deployment

```bash
# Deploy everything
npm run deploy

# Deploy only backend
npm run deploy:backend

# Deploy only frontend  
npm run deploy:frontend

# Check system status
npm run status
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guide.

## 📚 Documentation

- **[OPERATIONS.md](OPERATIONS.md)** - Deployment, monitoring, troubleshooting
- **[TODO-FRESH.md](TODO-FRESH.md)** - Current action items
- **[SYSTEM-AUDIT-2025-11-06.md](SYSTEM-AUDIT-2025-11-06.md)** - System audit
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - Quick command reference
- **[docs/](docs/)** - Detailed technical documentation

## 🤝 Contributing

See [AGENTS.md](AGENTS.md) for contributor guidelines.

## 📝 License

Proprietary – all rights reserved.
