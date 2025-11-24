# Patient Portal

Patient-facing React application for self-service healthcare management.

## 🎯 Purpose

The Patient Portal enables patients to manage their healthcare journey, book appointments, complete questionnaires, view medical records, and communicate with their clinic.

## ✨ Features (100% UX Complete)

### **19 Pages**

- **Dashboard** - Overview with upcoming appointments and tasks
- **Appointments** - View and book appointments
- **Book Appointment** - Appointment scheduling interface
- **Messages** - Secure messaging with clinic
- **Documents** - View medical documents
- **Document Checklist** - Required document tracking
- **Medical Records** - Health history and records
- **PROMs** - View assigned questionnaires
- **Complete PROM** - Fill out questionnaires
- **Evaluations** - View evaluation history
- **Evaluation Detail** - Individual evaluation view
- **Intake Form** - New patient intake
- **Pain Map Selector** - 3D pain visualization
- **Profile** - Patient profile management
- **Login/Register** - Authentication
- **Email Verification** - Account verification

### **Key Capabilities**

- ✅ Self-service appointment booking
- ✅ Secure document viewing
- ✅ PROM completion with scoring
- ✅ Medical record access
- ✅ Secure messaging
- ✅ 3D pain map visualization
- ✅ Intake form submission
- ✅ Profile management

## 🏗️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Library**: MUI v7 (Material-UI)
- **State Management**: Zustand
- **Data Fetching**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Date**: date-fns

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components
│   ├── auth/           # Authentication components
│   └── shared/         # Shared components
├── pages/              # Page components (19 pages)
├── services/           # API clients
│   ├── analyticsApi.ts
│   ├── appointmentsApi.ts
│   ├── authApi.ts
│   ├── dashboardApi.ts
│   ├── documentApi.ts
│   ├── medicalRecordsApi.ts
│   └── messagesApi.ts
├── features/           # Feature modules
│   ├── analytics/
│   ├── documents/
│   └── evaluations/
├── lib/                # Third-party configurations
│   └── api-client.ts
├── config/             # Configuration
│   └── api.ts
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
npm run dev          # Start dev server (port 3005)
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

- **Method**: AWS Cognito (patient pool)
- **Storage**: httpOnly cookies (secure)
- **Tenant Isolation**: Automatic via backend
- **Session**: Automatic token refresh
- **Email Verification**: Required for new accounts

## 📦 Bundle Size

- **Total**: 2.50MB (703KB gzipped)
- **Vendor Chunks**:
  - React: 34KB gzipped
  - MUI: 122KB gzipped
  - Charts: 104KB gzipped

## 🎨 UX Features

- ✅ Skeleton loaders (17 instances)
- ✅ Empty states with CTAs (6 instances)
- ✅ Filter chips (2 pages)
- ✅ Error boundaries
- ✅ Loading states
- ✅ Responsive design
- ✅ Accessibility (ARIA labels)
- ✅ Mobile-optimized

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
- **Mobile**: Touch-friendly, mobile-first

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
node ../../scripts/tests/test-live-system.mjs
```

## 🎯 User Flows

### **New Patient Registration**

1. Register account
2. Verify email
3. Complete intake form
4. Book first appointment

### **Returning Patient**

1. Login
2. View dashboard
3. Complete assigned PROMs
4. Book follow-up appointment
5. Message clinic with questions

### **PROM Completion**

1. Receive notification
2. Access PROM from dashboard
3. Complete questionnaire
4. Submit responses
5. View results (if enabled)

## 📚 Related Documentation

- [Architecture](../../docs/ARCHITECTURE.md)
- [API Routes](../../docs/API-ROUTES.md)
- [UX Progress](../../docs/UX-PROGRESS.md)
- [Development Guide](../../docs/guides/development.md)

## 🚀 Deployment

Automatically deployed to AWS S3 + CloudFront on push to main:

- **Production**: https://patient.qivr.pro (or clinic subdomain)
- **CDN**: CloudFront distribution
- **Build Time**: ~5-7 seconds
- **Success Rate**: 100%

## 🔒 Security

- HTTPS only (enforced)
- httpOnly cookies (no localStorage)
- CSRF protection
- XSS prevention
- Content Security Policy
- Input validation
- Secure file uploads
