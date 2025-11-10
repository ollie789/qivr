# Patient Portal

React + TypeScript frontend for patients.

## Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── services/       # API clients
├── state/          # State management
├── contexts/       # React contexts
├── features/       # Feature modules
├── layouts/        # Layout components
├── config/         # Configuration
├── types/          # TypeScript types
└── lib/            # Third-party lib configs
```

## Key Pages

- Dashboard - Patient overview
- Appointments - View & book appointments
- Messages - Communicate with clinic
- Documents - View medical documents
- Medical Records - Health history
- Profile - Patient profile
- PROM - Questionnaires

## Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment

- `.env.development` - Local dev
- `.env.production` - Production

## API

Connects to backend at `VITE_API_URL`

## Auth

Uses Cognito patient pool via backend API.
