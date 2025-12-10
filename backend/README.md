# 🚀 Qivr Backend Services

## Overview

The Qivr backend is a .NET 8 modular monolith providing comprehensive APIs for patient intake, appointment scheduling, PROM tracking, and clinic management.

## ✅ Current Status: 85% Complete

All core backend services are implemented and functional:
- ✅ Multi-tenant architecture with RLS
- ✅ Authentication & authorization
- ✅ Calendar integrations (Google & Microsoft)
- ✅ SMS notifications with consent management
- ✅ AI analysis pipeline
- ✅ Audit logging system

## 🏗️ Architecture

```
backend/
├── Qivr.Api/              # API Gateway & Controllers
│   ├── Controllers/       # REST endpoints
│   ├── Middleware/        # Auth, tenant, security
│   ├── Options/           # Configuration models
│   ├── Services/          # Application services
│   └── Utilities/         # Helper functions
│
├── Qivr.Core/             # Domain Layer
│   ├── Entities/          # Domain models
│   ├── Interfaces/        # Service contracts
│   └── Enums/            # Domain enumerations
│
├── Qivr.Infrastructure/   # Infrastructure Layer
│   ├── Data/             # DbContext & repositories
│   ├── Migrations/       # Database migrations
│   └── Services/         # External integrations
│
└── Qivr.Services/        # Business Logic
    ├── Calendar/         # Google & Microsoft sync
    ├── AI/              # OpenAI integration
    └── Notifications/   # SMS & email services
```

## 🎯 Implemented Features

### Controllers
- **AppointmentsController** - Full appointment CRUD and scheduling
- **AuthController** - Authentication with JWT/Cognito
- **CalendarWebhooksController** - Calendar sync webhooks
- **ClinicManagementController** - Clinic administration
- **EmailVerificationController** - Email verification flow
- **EvaluationsController** - Patient intake evaluations
- **IntakeController** - Intake submission and processing
- **MessageMediaWebhookController** - SMS webhook handling
- **PatientRecordsController** - Patient data management
- **PromsController** - PROM templates and instances

### Services
- **CognitoAuthService** - AWS Cognito integration
- **JwtAuthService** - JWT token management
- **GoogleCalendarService** - Google Calendar API
- **MicrosoftGraphCalendarService** - Microsoft 365 integration
- **EmailService** - Email notifications
- **EmailVerificationService** - Verification token management
- **DbAuditLogger** - Audit trail with RLS
- **QuietHoursService** - Business hours enforcement
- **NotificationGate** - SMS permission checker
- **IntakeProcessingService** - Async intake processing
- **AIAnalysisService** - OpenAI summarization

### Middleware
- **TenantMiddleware** - Multi-tenant context with RLS, security validation
- **ErrorHandlingMiddleware** - Global exception handling
- **SecurityHeadersMiddleware** - CSP, HSTS, security headers
- **RateLimitingMiddleware** - Request throttling

## 🔧 Configuration

### Required Environment Variables
```bash
# Database
INTAKE_DATABASE_URL=postgresql://user:pass@localhost/qivr

# AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-southeast-2

# Authentication
COGNITO_USER_POOL_ID=ap-southeast-2_xxxxx
COGNITO_CLIENT_ID=xxxxx
JWT_SECRET=your-secret-key

# MessageMedia
MESSAGEMEDIA_API_KEY=your-key
MESSAGEMEDIA_API_SECRET=your-secret
MESSAGEMEDIA_WEBHOOK_SECRET=your-webhook-secret

# Calendar APIs
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
MICROSOFT_CLIENT_ID=xxxxx
MICROSOFT_CLIENT_SECRET=xxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxx
```

### appsettings.json Structure
```json
{
  "Features": {
    "EnableAsyncProcessing": true,
    "ProcessIntakeQueue": true,
    "EnableAiAnalysis": true,
    "SendEmailNotifications": true
  },
  "Notifications": {
    "BusinessHoursStartLocal": 9,
    "BusinessHoursEndLocal": 18,
    "EnforceQuietHours": true,
    "DefaultTimeZone": "Australia/Sydney"
  },
  "Security": {
    "DefaultTenantId": "00000000-0000-0000-0000-000000000001",
    "RequireHttps": true
  }
}
```

## 🚀 Getting Started

### Prerequisites
- .NET 8 SDK
- PostgreSQL 16
- AWS CLI configured
- MessageMedia account

### Installation
```bash
# Install dependencies
dotnet restore

# Run migrations
dotnet ef database update

# Run locally
dotnet run --project Qivr.Api
```

### Development
```bash
# Watch mode
dotnet watch run --project Qivr.Api

# Run tests
dotnet test

# Build for production
dotnet publish -c Release
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/verify-email` - Email verification

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/{id}` - Update appointment
- `DELETE /api/appointments/{id}` - Cancel appointment
- `GET /api/appointments/availability` - Check availability

### Evaluations
- `POST /api/evaluations` - Submit evaluation
- `GET /api/evaluations/{id}` - Get evaluation
- `GET /api/evaluations/queue` - Intake queue

### PROMs
- `GET /api/proms/templates` - List templates
- `POST /api/proms/templates` - Create template
- `POST /api/proms/instances` - Submit PROM
- `GET /api/proms/trends` - Outcome trends

### Webhooks
- `POST /api/webhooks/messagemedia/inbound` - SMS inbound
- `POST /api/webhooks/messagemedia/delivery` - SMS delivery
- `POST /api/webhooks/calendar/google` - Google Calendar
- `POST /api/webhooks/calendar/microsoft` - Microsoft Calendar

## 🔐 Security

### Authentication
- JWT bearer tokens
- Cognito integration
- Multi-factor authentication support

### Authorization
- Role-based access control (RBAC)
- Tenant isolation via RLS
- API key authentication for webhooks

### Data Protection
- Encryption at rest (KMS)
- TLS 1.2+ in transit
- Audit logging for all PHI access
- STOP/START consent management

## 🧪 Testing

```bash
# Unit tests
dotnet test Qivr.Core.Tests

# Integration tests
dotnet test Qivr.Api.Tests

# Load testing
k6 run tests/load/appointments.js
```

## 📝 Database Migrations

```bash
# Create migration
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update

# Rollback
dotnet ef database update PreviousMigration
```

## 🚢 Deployment

### Docker
```bash
docker build -t qivr-api .
docker run -p 5000:80 qivr-api
```

### AWS ECS
```bash
# Build and push
docker build -t qivr-api .
docker tag qivr-api:latest $ECR_URI:latest
docker push $ECR_URI:latest

# Deploy
aws ecs update-service --cluster qivr --service api --force-new-deployment
```

## 📊 Performance

- Average response time: <200ms
- Concurrent users supported: 1000+
- Database connection pooling: 20-100
- Request rate limiting: 100/minute per IP

## 🐛 Known Issues

1. Calendar sync occasionally misses events
2. SMS delivery reports can be delayed
3. Some database queries need optimization

## 📚 Documentation

- [API Documentation](../docs/api/README.md)
- [Database Schema](../database/README.md)
- [Security Guide](../docs/security.md)
- [Deployment Guide](../docs/deployment.md)

---

**Last Updated**: August 28, 2025
**Version**: 0.8.0
