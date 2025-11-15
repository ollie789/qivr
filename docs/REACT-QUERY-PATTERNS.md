# React Query Patterns

## Cache Invalidation After Mutations

**ALWAYS** invalidate queries after creating, updating, or deleting data to ensure the UI refreshes automatically.

### Pattern 1: Using queryClient.invalidateQueries (RECOMMENDED)

```tsx
import { useQueryClient } from '@tanstack/react-query';

const MyComponent = () => {
  const queryClient = useQueryClient();

  const handleSave = async () => {
    await apiClient.post('/api/resource', data);
    
    // Invalidate specific query
    queryClient.invalidateQueries({ queryKey: ['resource-list'] });
    
    // Or invalidate multiple related queries
    queryClient.invalidateQueries({ queryKey: ['resource'] }); // Matches all keys starting with 'resource'
  };
};
```

### Pattern 2: Using useMutation with onSuccess

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const MyComponent = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/api/resource', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-list'] });
      enqueueSnackbar('Created successfully', { variant: 'success' });
    },
    onError: () => {
      enqueueSnackbar('Failed to create', { variant: 'error' });
    },
  });

  const handleCreate = () => {
    createMutation.mutate(formData);
  };
};
```

## Query Key Conventions

Use consistent query keys across the application:

- **List queries**: `['resource-list']` or `['resources']`
- **Detail queries**: `['resource', id]`
- **Filtered queries**: `['resources', { status, date }]`

### Examples

```tsx
// PROM Templates
['prom-templates']                    // List all templates
['prom-template', templateId]         // Single template

// PROM Responses/Instances
['prom-responses']                    // List all responses
['prom-responses', { status }]        // Filtered responses
['prom-instance', instanceId]         // Single instance

// Patients
['patients']                          // List all patients
['patient', patientId]                // Single patient
['patient-vitals', patientId]         // Patient vitals
['patient-history', patientId]        // Patient history

// Medical Records
['medical-records', patientId]        // Patient medical records
['vital-signs', patientId]            // Vital signs
['medical-history', patientId]        // Medical history

// Appointments
['appointments']                      // List appointments
['appointment', appointmentId]        // Single appointment
```

## Common Scenarios

### Creating a Resource

```tsx
const handleCreate = async () => {
  await apiClient.post('/api/resources', data);
  queryClient.invalidateQueries({ queryKey: ['resources'] });
};
```

### Updating a Resource

```tsx
const handleUpdate = async (id: string) => {
  await apiClient.put(`/api/resources/${id}`, data);
  queryClient.invalidateQueries({ queryKey: ['resources'] });
  queryClient.invalidateQueries({ queryKey: ['resource', id] });
};
```

### Deleting a Resource

```tsx
const handleDelete = async (id: string) => {
  await apiClient.delete(`/api/resources/${id}`);
  queryClient.invalidateQueries({ queryKey: ['resources'] });
};
```

### Bulk Operations

```tsx
const handleBulkUpdate = async (ids: string[]) => {
  await Promise.all(ids.map(id => apiClient.put(`/api/resources/${id}`, data)));
  queryClient.invalidateQueries({ queryKey: ['resources'] });
};
```

## Anti-Patterns (DON'T DO THIS)

### ❌ Manual refetch with callbacks

```tsx
// BAD - passing refetch callbacks through props
<ChildComponent onSave={() => refetch()} />
```

### ❌ Not invalidating after mutations

```tsx
// BAD - UI won't update
const handleSave = async () => {
  await apiClient.post('/api/resource', data);
  // Missing: queryClient.invalidateQueries()
};
```

### ❌ Using window.location.reload()

```tsx
// BAD - full page reload is slow and loses state
const handleSave = async () => {
  await apiClient.post('/api/resource', data);
  window.location.reload();
};
```

## Implementation Checklist

When adding a new mutation (create/update/delete):

- [ ] Import `useQueryClient` from `@tanstack/react-query`
- [ ] Call `const queryClient = useQueryClient()` in component
- [ ] After successful mutation, call `queryClient.invalidateQueries({ queryKey: [...] })`
- [ ] Invalidate all related queries (list, detail, filtered views)
- [ ] Test that UI updates automatically after mutation

## Examples in Codebase

- ✅ `PromBuilder.tsx` - Template creation invalidates `['prom-templates']`
- ✅ `PROMSender.tsx` - Sending PROM invalidates `['prom-responses']`
- ✅ `PROM.tsx` - Delete template mutation with invalidation
