# Authentication Migration Pattern

## Before (Vulnerable to 403 errors)
```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api-client';

function MyComponent() {
  // ❌ This will fail if auth is loading or user not authenticated
  const { data, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => api.get('/my-endpoint'),
  });

  return <div>{data?.message}</div>;
}
```

## After (Protected)
```typescript
import { useQuery } from '@tanstack/react-query';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { api } from '../lib/api-client';

function MyComponent() {
  const { canMakeApiCalls } = useAuthGuard();
  
  // ✅ This waits for auth to complete before making API calls
  const { data, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => api.get('/my-endpoint'),
    enabled: canMakeApiCalls, // ← Key addition
  });

  return <div>{data?.message}</div>;
}
```

## Alternative: Use Protected Hooks
```typescript
import { useProtectedQuery } from '../hooks/useProtectedQuery';
import { api } from '../lib/api-client';

function MyComponent() {
  // ✅ Auth protection built-in
  const { data, isLoading } = useProtectedQuery({
    queryKey: ['my-data'],
    queryFn: () => api.get('/my-endpoint'),
  });

  return <div>{data?.message}</div>;
}
```

## Key Files to Update

### High Priority (User-facing pages)
- `src/pages/Patients.tsx` - Patient list/search
- `src/pages/Appointments.tsx` - Calendar/appointments
- `src/pages/Messages.tsx` - Message threads
- `src/pages/MedicalRecords.tsx` - Patient records
- `src/pages/Analytics.tsx` - Charts/reports

### Medium Priority (Components)
- `src/components/NotificationBell.tsx` - Notifications
- `src/components/TenantSelector.tsx` - Tenant switching
- `src/pages/Settings.tsx` - User settings

### Low Priority (Admin features)
- `src/pages/PROM.tsx` - PROM management
- `src/pages/IntakeManagement.tsx` - Intake forms
- `src/pages/Documents.tsx` - Document management

## Pattern Summary

1. **Import useAuthGuard**: `import { useAuthGuard } from '../hooks/useAuthGuard';`
2. **Get auth state**: `const { canMakeApiCalls } = useAuthGuard();`
3. **Protect queries**: Add `enabled: canMakeApiCalls` to all useQuery/useInfiniteQuery
4. **API client handles**: 403 errors automatically trigger re-authentication
5. **Loading states**: Components show loading while auth resolves

## Benefits

- ✅ Prevents 403 errors from premature API calls
- ✅ Automatic re-authentication on auth failures  
- ✅ Consistent loading states across app
- ✅ Better user experience during auth transitions
- ✅ Centralized auth logic
