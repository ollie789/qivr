# QIVR Port Configuration

## Service Ports (Configured and Verified)

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Backend API | 5249 | http://localhost:5249 | ✅ Running |
| Patient Portal | 3005 | http://localhost:3005 | Ready to start |
| Doctor Dashboard (Clinic) | 3010 | http://localhost:3010 | Ready to start |

## Configuration Files Updated

### Patient Portal (Port 3005)
- `/apps/patient-portal/package.json` - dev script uses `--port 3005`
- `/apps/patient-portal/vite.config.ts` - server.port set to 3005
- `/apps/patient-portal/src/config/amplify.config.ts` - redirect URLs use port 3005

### Doctor Dashboard (Port 3010)
- `/apps/clinic-dashboard/vite.config.ts` - server.port set to 3010
- `/apps/clinic-dashboard/src/config/amplify.config.ts` - redirect URLs use port 3010

### Backend API (Port 5249)
- Running with: `dotnet run --urls "http://localhost:5249"`
- Both frontend apps point to this URL in their `.env` files

## Starting Services

```bash
# Backend API (already running)
cd backend/Qivr.Api && dotnet run --urls "http://localhost:5249"

# Patient Portal
cd apps/patient-portal && npm run dev

# Doctor Dashboard
cd apps/clinic-dashboard && npm run dev
```

## Verification
After starting, verify all services are accessible:
- http://localhost:5249/api/health (Backend - will return 401 without auth)
- http://localhost:3005 (Patient Portal)
- http://localhost:3010 (Doctor Dashboard)