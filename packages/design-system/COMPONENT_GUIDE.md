# Design System Component Guide

## New Components Added

### Forms

#### FormField
Standardized text input with consistent styling.

```tsx
import { FormField } from '@qivr/design-system';

<FormField
  label="Email"
  type="email"
  required
  helperText="Enter your email address"
  error={!!errors.email}
/>
```

#### FormActions
Consistent Cancel/Submit button layout.

```tsx
import { FormActions } from '@qivr/design-system';

<FormActions
  onCancel={handleClose}
  onSubmit={handleSubmit}
  submitLabel="Save"
  submitLoading={isSubmitting}
  submitDisabled={!isValid}
  align="right"
/>
```

#### SearchBar
Search input with clear button.

```tsx
import { SearchBar } from '@qivr/design-system';

<SearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  onClear={() => setSearchTerm('')}
  placeholder="Search patients..."
/>
```

### Dialogs

#### ConfirmDialog
Confirmation dialog for destructive actions.

```tsx
import { ConfirmDialog } from '@qivr/design-system';

<ConfirmDialog
  open={deleteOpen}
  onClose={() => setDeleteOpen(false)}
  onConfirm={handleDelete}
  title="Delete Patient"
  message="Are you sure you want to delete this patient? This action cannot be undone."
  confirmLabel="Delete"
  severity="error"
  loading={isDeleting}
/>
```

#### FormDialog
Dialog with form and actions.

```tsx
import { FormDialog, FormField, Stack } from '@qivr/design-system';

<FormDialog
  open={open}
  onClose={handleClose}
  onSubmit={handleSubmit}
  title="Add Patient"
  formActionsProps={{
    submitLabel: 'Add Patient',
    submitLoading: isSubmitting,
  }}
>
  <Stack spacing={2}>
    <FormField label="First Name" required />
    <FormField label="Last Name" required />
    <FormField label="Email" type="email" />
  </Stack>
</FormDialog>
```

### Feedback

#### StatusBadge
Consistent status indicators.

```tsx
import { StatusBadge } from '@qivr/design-system';

<StatusBadge status="active" />
<StatusBadge status="pending" />
<StatusBadge status="inactive" />
<StatusBadge status="error" label="Failed" />
```

#### PageLoader
Full-page loading state.

```tsx
import { PageLoader } from '@qivr/design-system';

{isLoading && <PageLoader message="Loading dashboard..." />}
```

#### SectionLoader
Section loading state.

```tsx
import { SectionLoader } from '@qivr/design-system';

{isLoading ? (
  <SectionLoader message="Loading patients..." />
) : (
  <PatientList />
)}
```

### Layout

#### Stack
Flexible layout component.

```tsx
import { Stack } from '@qivr/design-system';

// Vertical stack
<Stack spacing={2}>
  <Item1 />
  <Item2 />
</Stack>

// Horizontal stack
<Stack direction="row" spacing={3} align="center" justify="space-between">
  <Title />
  <Actions />
</Stack>
```

#### Container
Centered content with max width.

```tsx
import { Container } from '@qivr/design-system';

<Container maxWidth="lg" padding={3}>
  <Content />
</Container>
```

#### Section
Page section with spacing.

```tsx
import { Section } from '@qivr/design-system';

<Section spacing={4} background="grey">
  <SectionContent />
</Section>
```

## Migration Examples

### Before: Custom Form
```tsx
<Dialog open={open} onClose={onClose}>
  <DialogTitle>Add Patient</DialogTitle>
  <DialogContent>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
      <TextField label="First Name" required fullWidth />
      <TextField label="Last Name" required fullWidth />
      <TextField label="Email" type="email" fullWidth />
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button variant="contained" onClick={onSubmit} disabled={isSubmitting}>
      {isSubmitting ? 'Adding...' : 'Add Patient'}
    </Button>
  </DialogActions>
</Dialog>
```

### After: Using Design System
```tsx
<FormDialog
  open={open}
  onClose={onClose}
  onSubmit={onSubmit}
  title="Add Patient"
  formActionsProps={{ submitLabel: 'Add Patient', submitLoading: isSubmitting }}
>
  <Stack spacing={2}>
    <FormField label="First Name" required />
    <FormField label="Last Name" required />
    <FormField label="Email" type="email" />
  </Stack>
</FormDialog>
```

### Before: Delete Confirmation
```tsx
<Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
  <DialogTitle>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Warning color="error" />
      <Typography>Delete Patient</Typography>
    </Box>
  </DialogTitle>
  <DialogContent>
    <Typography>
      Are you sure you want to delete this patient? This action cannot be undone.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
    <Button 
      variant="contained" 
      color="error" 
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  </DialogActions>
</Dialog>
```

### After: Using ConfirmDialog
```tsx
<ConfirmDialog
  open={deleteOpen}
  onClose={() => setDeleteOpen(false)}
  onConfirm={handleDelete}
  title="Delete Patient"
  message="Are you sure you want to delete this patient? This action cannot be undone."
  confirmLabel="Delete"
  severity="error"
  loading={isDeleting}
/>
```

### Before: Loading State
```tsx
{isLoading ? (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: '200px'
  }}>
    <CircularProgress />
  </Box>
) : (
  <Content />
)}
```

### After: Using SectionLoader
```tsx
{isLoading ? <SectionLoader /> : <Content />}
```

## Benefits

1. **Less Code** - 50-70% reduction in boilerplate
2. **Consistency** - Same patterns everywhere
3. **Maintainability** - Update once, applies everywhere
4. **Type Safety** - Full TypeScript support
5. **Accessibility** - Built-in ARIA labels

## Component Checklist

- [x] FormField - Standardized inputs
- [x] FormActions - Cancel/Submit buttons
- [x] SearchBar - Search with clear
- [x] ConfirmDialog - Confirmation dialogs
- [x] FormDialog - Form in dialog
- [x] StatusBadge - Status indicators
- [x] PageLoader - Full page loading
- [x] SectionLoader - Section loading
- [x] Stack - Flexible layouts
- [x] Container - Centered content
- [x] Section - Page sections

## Next Steps

1. Migrate existing forms to use FormField/FormActions
2. Replace custom dialogs with ConfirmDialog/FormDialog
3. Use StatusBadge for all status displays
4. Replace CircularProgress with PageLoader/SectionLoader
5. Use Stack/Container/Section for layouts
