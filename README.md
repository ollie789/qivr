# Qivr - Patient↔Allied Health Connector

## Overview

Qivr is a comprehensive platform that helps allied-health clinics (physiotherapy, chiropractic, etc.) convert website visitors into booked patients and retain them through structured outcomes tracking (PROMs - Patient-Reported Outcome Measures).

## 🎯 Key Features

- **White-label Evaluation Widget**: Embeddable on clinic websites with custom branding
- **3D Body Mapping**: Interactive pain mapping with anatomical precision
- **Smart Intake**: Dynamic questionnaires with condition-specific questions
- **AI-Powered Triage**: Intelligent summaries and next-step guidance
- **Appointment Booking**: Integrated with Google Calendar and Microsoft 365
- **PROM Tracking**: Longitudinal outcomes tracking and analytics
- **Multi-tenant Architecture**: Secure, scalable platform for multiple clinics
- **Australian Data Residency**: Full compliance with APPs and Health Records Acts

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, MUI v5, Three.js
- **Backend**: .NET 8 (Modular Monolith), OpenAPI-first
- **Database**: PostgreSQL 16 with Row-Level Security
- **Auth**: Amazon Cognito (Social + SAML/OIDC)
- **Infrastructure**: AWS (ECS Fargate, RDS, S3, CloudFront)
- **AI**: Amazon Bedrock (AU region)
- **Messaging**: MessageMedia (SMS), Amazon Connect (Voice)

### Project Structure

```
qivr/
├── apps/
│   ├── widget/           # Embeddable React widget
│   ├── patient-portal/   # Patient web application
│   └── clinic-dashboard/ # Clinic management interface
├── backend/
│   ├── Qivr.Api/        # API Gateway
│   ├── Qivr.Core/       # Core domain models
│   ├── Qivr.Services/   # Business logic services
│   └── Qivr.Infrastructure/ # Data access, external integrations
├── packages/
│   ├── ui-components/   # Shared React components
│   ├── types/          # Shared TypeScript types
│   └── utils/          # Shared utilities
├── infrastructure/
│   ├── terraform/      # Infrastructure as Code
│   └── docker/         # Container definitions
└── database/
    ├── migrations/     # Database migrations
    └── schemas/        # SQL schemas
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- .NET 8 SDK
- PostgreSQL 16
- Docker & Docker Compose
- AWS CLI configured

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/qivr.git
cd qivr
```

2. Install dependencies:
```bash
npm install
cd backend && dotnet restore
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start local services:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
cd database && ./run-migrations.sh
```

6. Start development servers:
```bash
npm run dev
```

### Frontend API Base URL
Set `VITE_API_URL` in the frontend apps to point to your API (defaults to `http://localhost:5000`). For example:
```bash
# .env.local in each app
VITE_API_URL=http://localhost:5000
```

## 🔒 Security & Compliance

- **Data Residency**: All PHI stored in AWS AU regions (Sydney/Melbourne)
- **Encryption**: TLS 1.2+ in transit, KMS at rest
- **Authentication**: Multi-factor, social login, SSO for clinics
- **Audit Logging**: Immutable audit trail for all PHI access
- **RBAC**: Role-based access control with tenant isolation

## 📊 Key Modules

### Identity & Access Management
- Cognito integration
- JWT token management
- Multi-tenant claims

### Intake & 3D Body Mapping
- Interactive 3D anatomical model
- Pain intensity mapping
- Dynamic questionnaires

### Booking & Calendar Sync
- Google Calendar integration
- Microsoft 365 integration
- Availability management
- Double-booking prevention

### PROMs Management
- Template builder with versioning
- Automated scheduling
- Longitudinal tracking
- FHIR-compliant exports

### Notifications
- SMS reminders (MessageMedia)
- Email notifications
- Voice agent (Amazon Connect)
- Consent management

## 🏥 For Clinics

Qivr provides clinics with:
- Structured patient intake reducing admin time
- AI-assisted triage and prioritization
- Automated appointment reminders
- Outcome tracking and analytics
- White-label customization

## 👥 For Patients

Patients benefit from:
- Easy online evaluation
- Clear understanding of their condition
- Convenient appointment booking
- Progress tracking over time
- Personalized care journey

## 📈 Milestones

- **M1**: Infrastructure foundation (Weeks 1-3)
- **M2**: Widget & Intake (Weeks 4-6)
- **M3**: Booking system (Weeks 7-8)
- **M4**: PROMs platform (Weeks 9-10)
- **M5**: Notifications & AI (Weeks 11-12)
- **M6**: Security & DR (Weeks 13-14)
- **M7**: Pilot launch (Weeks 15-16)

## 📝 License

Proprietary - All rights reserved

## 🤝 Contact

For inquiries about implementation or customization, visit [sammuti.com](https://sammuti.com)
