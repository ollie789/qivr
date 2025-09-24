# Troubleshooting Guide

## Common Issues and Solutions

# Fix Clinic Dashboard Authentication & Data Issues

## The Issues
1. API calls returning 404 errors
2. Tenant ID mismatch (was "clinic-001", should be a GUID)
3. Missing PROM and booking features

## Solution Steps

### 1. Clear Browser Cache & Re-login
1. Open browser DevTools (F12)
2. Go to Application tab → Storage → Clear site data
3. Or in Console, run:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```
4. Refresh the page (Cmd+R)

### 2. Login Again with Updated Credentials
- **Email**: `test.doctor@clinic.com`
- **Password**: `ClinicTest123!`

Your user now has the correct tenant/clinic ID: `b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11`

### 3. Backend is Running Correctly
- **API**: http://localhost:5050
- **Frontend**: http://localhost:3002

## Features Status

### ✅ Working
- Authentication with Cognito
- Staff Management page
- Patient listing

### 🔧 Need Integration
The PROM builder and appointment booking features exist in the backend but may need:
1. Frontend routes to be added
2. Menu items to be enabled
3. Feature flags to be set

## Test API Directly
You can test if the PROM API is working:

```bash
# Get your auth token from browser DevTools:
# Application → Local Storage → clinic-auth-storage → look for token

# Then test:
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     -H "X-Tenant-Id: b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11" \
     http://localhost:5050/api/v1/proms/templates
```

## Next Steps
After clearing cache and re-logging in, the API calls should work with the correct tenant ID.
# API Endpoint Issues Analysis

## Endpoints with 401 (Unauthorized) - These exist but need auth:
- GET /api/clinic-management/clinics/b6c55eef-b8ac-4b8e-8b5f-6a1yatcc5?from=...
- GET /api/Notifications
- GET /api/Messages?params=%5Bobject+Object%5D
- GET /api/Documents?params=%5Bobject+Object%5D

## Endpoints with 404 (Not Found) - These DON'T exist:
- GET /api/v1/patients (404)
- GET /api/Documents?params=%5Bobject+Object%5D (404 sometimes)
- GET /api/patients (404)
- GET /api/Messages?params=%5Bobject+Object%5D (404 sometimes)

## API Calls Being Made (from console):
1. analyticApi.ts - calling /api/clinic-management/clinics/{clinicId}/analytics
2. api-client.ts - various calls
3. patientApi.ts - calling /api/patients or /api/v1/patients
4. NotificationBell.tsx - calling /api/Notifications
5. Messages.tsx - calling /api/Messages
6. Documents.tsx - calling /api/Documents

## Issues Identified:
1. Patient API doesn't exist at all (no /api/patients or /api/v1/patients)
2. Mix of v1 and non-v1 endpoints
3. Some endpoints working intermittently (401 vs 404)
