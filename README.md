# QIVR Healthcare Platform

## 🏥 Overview
QIVR is a comprehensive healthcare platform connecting patients with allied health providers. Built with .NET Core 8.0 backend and React/TypeScript frontends, it provides multi-tenant support with AWS Cognito authentication.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start all services
./start-all.sh

# Or start individually:
docker compose up -d     # Infrastructure (PostgreSQL, Redis, MinIO)
npm run backend:dev      # Backend API
npm run clinic:dev       # Clinic Dashboard  
npm run patient:dev      # Patient Portal
```

## 📍 Service URLs

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Backend API** | 5050 | http://localhost:5050 | REST API & Swagger |
| **Clinic Dashboard** | 3001 | http://localhost:3001 | Provider interface |
| **Patient Portal** | 3000/3005 | http://localhost:3000 | Patient interface |
| **Widget** | 3003 | http://localhost:3003 | Embeddable booking |
| **pgAdmin** | 8081 | http://localhost:8081 | Database management |
| **MinIO Console** | 9001 | http://localhost:9001 | S3 storage UI |
| **Mailhog** | 8025 | http://localhost:8025 | Email testing |

## 🔑 Test Credentials

### Clinic Dashboard
- Email: `clinic@qivr.health` or `test.doctor@clinic.com`
- Password: `Clinic123!` or `ClinicTest123!`
- Tenant ID: `b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11`

### Patient Portal
- Email: `patient@qivr.health`
- Password: `Patient123!`

## 🏗️ Architecture

```
qivr/
├── apps/                    # Frontend applications
│   ├── clinic-dashboard/    # React clinic management
│   ├── patient-portal/      # React patient app
│   └── widget/              # Embeddable widget
├── backend/                 # .NET Core API
│   ├── Qivr.Api/            # API controllers & middleware
│   ├── Qivr.Core/           # Domain models & interfaces
│   ├── Qivr.Infrastructure/ # Data access & external services
│   └── Qivr.Services/       # Business logic
├── packages/                # Shared packages
│   └── http/                # Fetch wrapper with Cognito auth
├── database/                # Database scripts
└── infrastructure/          # Deployment & configuration
```

## 💻 Development

### Backend Development
```bash
cd backend

# Run API
dotnet watch run --project Qivr.Api --urls "http://localhost:5050"

# Run tests
dotnet test

# Database migrations
dotnet ef migrations add MigrationName --project Qivr.Infrastructure --startup-project Qivr.Api
dotnet ef database update --project Qivr.Infrastructure --startup-project Qivr.Api
```

### Frontend Development
```bash
# Install dependencies
npm install

# Run specific app
npm run clinic:dev    # Clinic dashboard
npm run patient:dev   # Patient portal
npm run widget:dev    # Widget

# Build all
npm run build

# Lint & format
npm run lint
npm run format
```

### Docker Services
```bash
docker compose up -d     # Start all services
docker compose down      # Stop all services
docker compose logs -f   # View logs
```

## 🔧 Configuration

### Environment Variables
Create `.env` files in each frontend app:

```env
# apps/clinic-dashboard/.env
VITE_API_URL=http://localhost:5050
VITE_COGNITO_REGION=ap-southeast-2
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
```

### AWS Cognito Setup
- Region: `ap-southeast-2`
- Separate User Pools for clinic staff and patients
- JWT token refresh handled automatically by `@qivr/http` package

## 📊 Current Status

### ✅ Working Features
- **Authentication**: AWS Cognito with multi-tenant support
- **Dashboard**: Real-time metrics and analytics
- **Patient Management**: Full CRUD operations
- **Appointments**: Scheduling with provider availability
- **Messaging**: Secure patient-provider communication
- **Documents**: File upload/download with S3 storage
- **PROM System**: Patient-reported outcome measures
- **Settings**: User preferences and notifications

### 🚧 In Progress
- Calendar integration (Microsoft Graph)
- SMS notifications (MessageMedia)
- Telehealth video calls
- Billing & insurance claims
- Advanced analytics dashboard

### 📈 Build Status (as of 2025-09-22)
- **Compilation**: ✅ Success (0 errors, 100 warnings)
- **Database**: Migration ready for new entities
- **API Coverage**: 10/18 controllers fully functional
- **Test Coverage**: Pending implementation

## 🛠️ Troubleshooting

### Build Issues
```bash
# Clear build artifacts
dotnet clean
rm -rf bin/ obj/

# Restore packages
dotnet restore
```

### Authentication Issues
```javascript
// Clear browser storage
localStorage.clear();
sessionStorage.clear();
// Then re-login
```

### Database Issues
```bash
# Check PostgreSQL status
docker compose ps

# Connect to database
psql -h localhost -U qivr_user -d qivr

# Reset database
docker compose down -v
docker compose up -d
dotnet ef database update --project Qivr.Infrastructure --startup-project Qivr.Api
```

## 🚀 Deployment

### Prerequisites
- .NET 8.0 SDK
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16+

### Production Deployment
1. Set production environment variables
2. Build applications:
   ```bash
   dotnet publish -c Release
   npm run build
   ```
3. Run database migrations
4. Deploy to hosting platform (AWS, Azure, etc.)

## 📚 Documentation

- [API Documentation](http://localhost:5050/swagger) - Swagger UI
- [WARP.md](WARP.md) - AI assistant guidance
- [Project Status](docs/PROJECT_STATUS.md) - Detailed feature status

## 🤝 Contributing

1. Create feature branch from `main`
2. Follow existing code patterns
3. Ensure tenant isolation in all queries
4. Add tests for new features
5. Update relevant documentation

## 📝 License

Proprietary - All rights reserved

---

*For detailed implementation status and technical documentation, see [PROJECT_STATUS.md](docs/PROJECT_STATUS.md)*