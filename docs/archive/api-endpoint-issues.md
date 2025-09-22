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
