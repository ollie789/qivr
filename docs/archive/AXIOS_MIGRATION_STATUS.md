# Axios to Fetch Migration Status

## ✅ Completed

### 1. Created @qivr/http Package
Location: `/packages/http/`
- Fetch wrapper with all required features
- Timeout support via AbortController
- Correlation headers (X-Request-ID, X-Clinic-Id)
- ProblemDetails error handling
- Auth token management
- TypeScript support

### 2. Migrated Services
- ✅ `analyticsApi.ts` - Complete
- ✅ `dashboardApi.ts` - Complete
- ✅ `patientApi.ts` - Complete

### 3. Package Updates
- Added `@qivr/http` to clinic-dashboard dependencies
- Removed `axios` from package.json

## 🔄 Remaining Tasks

### Files Still Using Axios:
1. **promInstanceApi.ts** - Service for PROM instances
2. **jwtAuthService.ts** - Auth service
3. **AppointmentScheduler.tsx** - Component directly using axios
4. **axiosConfig.ts** - Can be deleted

### Quick Migration Examples:

#### For promInstanceApi.ts:
```typescript
// Before
const response = await axios.post(
  `${API_URL}/prominstance/send`,
  request,
  { headers: getHeaders() }
);

// After
import { postWithAuth } from '@qivr/http';
const response = await postWithAuth<PromInstanceDto>(
  '/prominstance/send',
  request
);
```

#### For jwtAuthService.ts:
```typescript
// Before
const response = await axios.post('/auth/login', credentials);

// After
import { postJson } from '@qivr/http';
const response = await postJson<AuthResponse>('/auth/login', credentials);
```

## Installation Steps

1. **Build the http package**:
```bash
cd packages/http
npm install
npm run build
```

2. **Install in clinic-dashboard**:
```bash
cd apps/clinic-dashboard
npm install
```

3. **Remove axios**:
```bash
npm uninstall axios
```

## Testing Checklist

- [ ] Dashboard loads with real data
- [ ] Patient list displays correctly
- [ ] Analytics charts render
- [ ] API errors are handled gracefully
- [ ] Auth flow works (login/logout)
- [ ] File uploads work (if applicable)

## Common Patterns

### GET Request
```typescript
import { getWithAuth } from '@qivr/http';
const data = await getWithAuth<ResponseType>('/api/endpoint');
```

### POST Request
```typescript
import { postWithAuth } from '@qivr/http';
const result = await postWithAuth<ResponseType>('/api/endpoint', payload);
```

### With Query Parameters
```typescript
const params = new URLSearchParams({ key: 'value' });
const data = await getWithAuth<ResponseType>(`/api/endpoint?${params}`);
```

### Error Handling
```typescript
import { ApiError } from '@qivr/http';

try {
  const data = await getWithAuth('/api/endpoint');
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.problem?.detail);
  }
}
```

## Benefits of Migration

1. **No external dependencies** - Using native fetch API
2. **Smaller bundle size** - Removed ~15KB from axios
3. **Consistent error handling** - ProblemDetails standard
4. **Better TypeScript support** - Custom typed wrapper
5. **Automatic auth & correlation** - Built into wrapper

## Next Steps

1. Complete migration of remaining 4 files
2. Test all API endpoints
3. Remove axiosConfig.ts
4. Add CI check to prevent axios reintroduction
5. Update other apps (patient-portal, widget) similarly
