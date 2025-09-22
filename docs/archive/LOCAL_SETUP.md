# Qivr Local Development Setup

## Current Status ✅
All components are configured and ready to run!

## Quick Start
```bash
# Start everything
./start-local.sh

# Stop everything
./stop-local.sh
```

## Services & Ports
| Service | Port | URL | Status |
|---------|------|-----|--------|
| PostgreSQL | 5432 | - | ✅ Running |
| MinIO (S3) | 9000/9001 | http://localhost:9001 | ✅ Running |
| Backend API | 5050 | http://localhost:5050 | ✅ Running |
| Clinic Dashboard | 3002 | http://localhost:3002 | ✅ Ready |

## Login Credentials
- **Email**: `test.doctor@clinic.com`
- **Password**: `ClinicTest123!`
- **Role**: Admin
- **Tenant ID**: `b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11`

## Features Available
✅ **Authentication** - AWS Cognito integration
✅ **Dashboard** - Main clinic dashboard
✅ **Patients** - Patient management
✅ **Staff Management** - Manage clinic staff
✅ **Intake Queue** - Patient intake processing
✅ **Appointments** - Appointment scheduling
✅ **PROMs Builder** - Patient-reported outcome measures
✅ **Analytics** - Clinic analytics
✅ **Settings** - Clinic settings

## Configuration Files
- Backend config: `/backend/Qivr.Api/appsettings.Development.json`
- Frontend config: `/apps/clinic-dashboard/.env`
- Frontend dev config: `/apps/clinic-dashboard/.env.development`

## Troubleshooting

### If login fails:
1. Clear browser cache: `localStorage.clear(); sessionStorage.clear()`
2. Check backend is running: `curl http://localhost:5050/api/health`
3. Verify Cognito region: `ap-southeast-2`

### If API calls fail:
1. Check tenant ID is correct: `b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11`
2. Verify backend is using port 5050
3. Check CORS is configured for your frontend port

### If database issues:
```bash
# Check PostgreSQL
psql -h localhost -U qivr_user -d qivr

# Run migrations
cd backend
dotnet ef database update --project Qivr.Infrastructure --startup-project Qivr.Api
```

## Development Workflow
1. Start all services: `./start-local.sh`
2. Open browser: http://localhost:3002
3. Login with test credentials
4. Make changes to code
5. Frontend hot-reloads automatically
6. Backend requires restart for changes

## Next Steps
- [ ] Add more test data
- [ ] Configure email service
- [ ] Set up SMS notifications
- [ ] Add more PROM templates
- [ ] Configure appointment types
