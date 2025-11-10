# Clinic Dashboard

React + TypeScript frontend for clinic staff.

## Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components (13 pages)
├── services/       # API clients
├── stores/         # Zustand state management
├── hooks/          # Custom React hooks
├── features/       # Feature modules
├── config/         # Configuration
├── types/          # TypeScript types
├── utils/          # Utilities
└── lib/            # Third-party lib configs
```

## Key Pages

- Dashboard - Overview & stats
- Patients - Patient management
- Appointments - Scheduling
- Messages - Communication
- Documents - File management
- Analytics - Reports & insights
- Settings - Configuration
- Profile - User profile

## Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment

- `.env.development` - Local dev
- `.env.production` - Production (clinic.qivr.pro)

## API

Connects to backend at `VITE_API_URL` (default: https://clinic.qivr.pro/api)

## Auth

Uses Cognito via backend API with JWT tokens in httpOnly cookies.
