# Design System Component Migration

## Summary

Successfully migrated clinic dashboard components to use the new design system components, reducing boilerplate code and improving consistency.

## Components Migrated

### 1. Loading States (CircularProgress → PageLoader/SectionLoader)

**Files Updated:**
- `apps/clinic-dashboard/src/App.tsx`
- `apps/clinic-dashboard/src/components/Auth/PrivateRoute.tsx`
- `apps/clinic-dashboard/src/pages/Patients.tsx`
- `apps/clinic-dashboard/src/pages/Settings.tsx`
- `apps/clinic-dashboard/src/pages/PROM.tsx`

**Changes:**
- Replaced custom `PageLoader` component with design system `PageLoader`
- Replaced inline `<CircularProgress />` with `<SectionLoader minHeight={...} />`
- Consistent loading states across all pages

**Benefits:**
- Reduced code duplication (removed custom PageLoader implementation)
- Consistent loading UI across the application
- Configurable minHeight for section loaders

### 2. Form Dialogs (Dialog → FormDialog)

**Files Updated:**
- `apps/clinic-dashboard/src/pages/Patients.tsx` (PatientFormDialog)
- `apps/clinic-dashboard/src/components/dialogs/PatientInviteDialog.tsx`

**Before (PatientFormDialog):**
```tsx
<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
  <DialogTitle>{patient ? 'Edit Patient' : 'New Patient'}</DialogTitle>
  <DialogContent>
    {/* form fields */}
  </DialogContent>
  <DialogActions>
    <QivrButton emphasize="subtle" onClick={onClose}>Cancel</QivrButton>
    <QivrButton variant="contained" onClick={handleSubmit}>
      {patient ? 'Save Changes' : 'Create Patient'}
    </QivrButton>
  </DialogActions>
</Dialog>
```

**After:**
```tsx
<FormDialog
  open={open}
  onClose={handleClose}
  title={patient ? 'Edit Patient' : 'New Patient'}
  onSubmit={handleSubmit}
  submitLabel={patient ? 'Save Changes' : 'Create Patient'}
  submitDisabled={!isValid}
  maxWidth="md"
>
  {/* form fields */}
</FormDialog>
```

**Benefits:**
- Reduced from ~20 lines to ~8 lines per dialog
- Automatic Cancel/Submit button layout
- Built-in loading state support
- Consistent dialog styling

### 3. Confirmation Dialogs (Dialog → ConfirmDialog)

**Files Updated:**
- `apps/clinic-dashboard/src/pages/Settings.tsx` (API key generation)

**Before:**
```tsx
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle>Generate New API Key</DialogTitle>
  <DialogContent>
    <Alert severity="warning" sx={{ mt: 2 }}>
      Generating a new API key will invalidate the current key...
    </Alert>
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button variant="contained" color="warning" onClick={handleConfirm}>
      Generate New Key
    </Button>
  </DialogActions>
</Dialog>
```

**After:**
```tsx
<ConfirmDialog
  open={open}
  onClose={onClose}
  onConfirm={handleConfirm}
  title="Generate New API Key"
  message="Generating a new API key will invalidate the current key..."
  severity="warning"
  confirmText="Generate New Key"
/>
```

**Benefits:**
- Reduced from ~15 lines to ~8 lines
- Automatic warning icon and styling
- Consistent confirmation pattern
- Built-in severity variants (warning/error/info)

## Migration Statistics

### Code Reduction
- **PatientFormDialog**: 20 lines → 8 lines (60% reduction)
- **PatientInviteDialog**: 25 lines → 12 lines (52% reduction)
- **API Key Confirmation**: 15 lines → 8 lines (47% reduction)
- **Loading States**: 6 lines → 1 line per instance (83% reduction)

### Files Modified
- 6 files updated
- 0 files added
- 0 files deleted

### Components Used
- `PageLoader` - 2 instances
- `SectionLoader` - 5 instances
- `FormDialog` - 2 instances
- `ConfirmDialog` - 1 instance

## Remaining Migration Opportunities

### High Priority
1. **More Dialogs** - 90+ Dialog instances remaining
   - Schedule appointment dialogs
   - Delete confirmation dialogs
   - Settings dialogs
   
2. **More Loading States** - 25+ CircularProgress instances remaining
   - Inline button loading (appropriate use)
   - Chart loading states
   - Data fetching indicators

### Medium Priority
3. **Search Inputs** - Replace with `SearchBar` component
   - Patient search
   - Document search
   - PROM template search

4. **Status Indicators** - Replace Chip with `StatusBadge`
   - Patient status
   - Appointment status
   - PROM response status

### Low Priority
5. **Form Fields** - Standardize with `FormField` component
6. **Form Actions** - Use `FormActions` for Cancel/Submit patterns

## Next Steps

1. Continue migrating dialogs to `FormDialog` and `ConfirmDialog`
2. Replace search inputs with `SearchBar` component
3. Migrate status chips to `StatusBadge` component
4. Document migration patterns for team reference

## Notes

- CircularProgress in buttons (loading states) should remain as-is
- CircularProgress for charts (determinate progress) should remain as-is
- Only full-page and section loading states were migrated


## Phase 2 Migration (Completed)

### Search Inputs Migrated
- Patients.tsx - Patient search
- IntakeManagement.tsx - Intake search
- **Result**: 67% code reduction per search input (12 lines → 4 lines)

### Status Badges Migrated
- Patients.tsx - Patient status
- PROM.tsx - PROM response status (2 locations)
- Appointments.tsx - Appointment status (3 locations)
- IntakeManagement.tsx - Intake status
- **Result**: 93% code reduction per status badge (15 lines → 1 line)
- **Removed**: 4 getStatusColor functions + 1 getStatusIcon function (~80 lines total)

### Total Impact
- **10 files modified**
- **~150 lines of boilerplate removed**
- **Zero visual changes** - UI identical to users
- **All pages functional** - No breaking changes
