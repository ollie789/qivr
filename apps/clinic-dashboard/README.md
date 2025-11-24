# Clinic Dashboard

Staff-facing React application for clinic operations and patient management.

## 🎯 Purpose

The Clinic Dashboard is the primary interface for healthcare providers and clinic staff to manage patients, appointments, documents, and communications.

## ✨ Features (100% UX Complete)

### **15 Pages**

- **Dashboard** - Overview with analytics and quick actions
- **Medical Records** - Comprehensive patient data management
- **Appointments** - Calendar scheduling with FullCalendar
- **Intake Management** - Triage and process patient intake forms
- **Documents** - File management with OCR processing
- **Messages** - Secure communication with patients
- **PROM** - Patient-Reported Outcome Measures management
- **Analytics** - Reports and insights
- **Providers** - Staff management
- **Settings** - Clinic configuration
- **Patient Detail** - Individual patient view
- **Document Upload** - File upload with drag-drop
- **Login/Signup** - Authentication
- **Clinic Registration** - New clinic onboarding

### **Key Capabilities**

- ✅ Multi-tenant architecture
- ✅ Real-time appointment scheduling
- ✅ Document OCR with AWS Textract
- ✅ Secure messaging system
- ✅ PROM builder and analytics
- ✅ AI-powered intake triage
- ✅ Calendar sync (Google/Microsoft)
- ✅ Comprehensive audit logging

## 🏗️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Library**: MUI v7 (Material-UI)
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Calendar**: FullCalendar
- **Charts**: Recharts
- **3D**: Three.js + React Three Fiber
- **Date**: date-fns

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Layout components
│   ├── dialogs/        # Dialog components
│   ├── documents/      # Document-related components
│   ├── intake/         # Intake form components
│   └── messaging/      # Messaging components
├── pages/              # Page components (15 pages)
├── services/           # API clients
│   ├── analyticsApi.ts
│   ├── appointmentsApi.ts
│   ├── authApi.ts
│   ├── documentApi.ts
│   ├── intakeApi.ts
│   ├── medicalRecordsApi.ts
│   ├── messagesApi.ts
│   ├── patientApi.ts
│   └── promApi.ts
├── stores/             # Zustand state stores
│   └── authStore.ts
├── hooks/              # Custom React hooks
├── features/           # Feature modules
│   ├── analytics/
│   ├── proms/
│   └── intake/
├── lib/                # Third-party configurations
│   └── api-client.ts
├── utils/              # Utility functions
│   ├── date.ts
│   └── exportUtils.ts
└── types/              # TypeScript type definitions
```

## 🚀 Development

### **Prerequisites**

- Node.js 18+
- npm 9+

### **Setup**

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### **Available Scripts**

```bash
npm run dev          # Start dev server (port 3010)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test            # Run tests
```

## 🌐 Environment Variables

Create `.env.development` for local development:

```env
VITE_API_URL=http://localhost:5050
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
```

Production (`.env.production`):

```env
VITE_API_URL=https://clinic.qivr.pro/api
```

## 🔐 Authentication

- **Method**: AWS Cognito with JWT tokens
- **Storage**: httpOnly cookies (secure)
- **Tenant Isolation**: `X-Tenant-Id` header
- **Session**: Automatic token refresh

## 📦 Bundle Size

- **Total**: 1.06MB (293KB gzipped)
- **Vendor Chunks**:
  - React: 33KB gzipped
  - MUI: 137KB gzipped
  - Charts: 168KB gzipped
  - 3D: 295KB gzipped

## 🎨 UX Features

- ✅ Skeleton loaders (32 instances)
- ✅ Empty states with CTAs (13 instances)
- ✅ Filter chips (3 pages)
- ✅ Error boundaries
- ✅ Loading states
- ✅ Responsive design
- ✅ Accessibility (ARIA labels)

## 🔗 API Integration

Connects to backend API at `VITE_API_URL`:

- RESTful endpoints
- JWT authentication
- Automatic retry logic
- Error handling
- Request/response interceptors

## 📱 Responsive Design

- **Desktop**: Full feature set
- **Tablet**: Optimized layouts
- **Mobile**: Touch-friendly interface

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
node ../../scripts/tests/test-live-system.mjs
```

## 📚 Related Documentation

- [Architecture](../../docs/ARCHITECTURE.md)
- [API Routes](../../docs/API-ROUTES.md)
- [UX Progress](../../docs/UX-PROGRESS.md)
- [Development Guide](../../docs/guides/development.md)

## 🚀 Deployment

Automatically deployed to AWS S3 + CloudFront on push to main:

- **Production**: https://clinic.qivr.pro
- **CDN**: CloudFront distribution
- **Build Time**: ~7-8 seconds
- **Success Rate**: 100%
