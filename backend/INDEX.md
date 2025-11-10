# Backend Structure

.NET 8 Web API with multi-tenant architecture.

## Projects

### Qivr.Api
Main API application with controllers, middleware, and startup configuration.

**Key folders:**
- `Controllers/` - 27 API controllers
- `Services/` - Auth, storage, and business services
- `Middleware/` - Tenant context, CSRF, rate limiting
- `Authentication/` - JWT and dev auth handlers
- `Extensions/` - Service registration extensions
- `Config/` - Configuration models

### Qivr.Core
Domain entities, DTOs, and interfaces.

**Key folders:**
- `Entities/` - 18 domain models (Tenant, User, Patient, etc.)
- `DTOs/` - Data transfer objects
- `Interfaces/` - Service contracts

### Qivr.Infrastructure
Data access and external integrations.

**Key folders:**
- `Data/` - DbContext and repositories
- `Migrations/` - EF Core migrations
- `Services/` - Infrastructure services

### Qivr.Services
Business logic and domain services.

**Key services:**
- Patient management
- Appointment scheduling
- PROM questionnaires
- Messaging
- Notifications
- Analytics
- Calendar integration
- AI services

### Qivr.Tests
Unit and integration tests.

### Qivr.Tools
CLI tools for seeding and utilities.

## Build & Run

```bash
# Restore dependencies
dotnet restore

# Build
dotnet build

# Run API
cd Qivr.Api
dotnet run

# Run tests
dotnet test

# Create migration
cd Qivr.Api
dotnet ef migrations add MigrationName
dotnet ef database update
```

## Docker

```bash
# Build image
docker build -t qivr-api .

# Run container
docker run -p 8080:8080 qivr-api
```

## Configuration

- `appsettings.json` - Base config
- `appsettings.Development.json` - Local dev
- `appsettings.Production.json` - Production
- `.env` - Local environment variables

## Archived

Old Dockerfiles and deployment zips moved to `/archive/`
