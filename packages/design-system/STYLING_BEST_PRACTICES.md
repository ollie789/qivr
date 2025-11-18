# Styling Best Practices

## Current State ✅

**Clinic Dashboard:**
- ❌ Inline styles: 5 (only for necessary cases like hidden inputs)
- ✅ Theme-based styling: 477 instances using `sx` prop
- ✅ All use design system theme values

**Result:** Already following best practices!

## Styling Hierarchy (Best to Worst)

### 1. ✅ Use Design System Components (Best)
```tsx
import { Stack, Container, Section } from '@qivr/design-system';

// Instead of:
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

// Use:
<Stack spacing={2}>
  <Child1 />
  <Child2 />
</Stack>
```

### 2. ✅ Use Theme via sx Prop (Good)
```tsx
// Uses theme values automatically
<Box sx={{ 
  p: 2,                    // theme.spacing(2)
  bgcolor: 'primary.main', // theme.palette.primary.main
  borderRadius: 1,         // theme.shape.borderRadius
}}>
```

### 3. ✅ Use MUI Component Props (Good)
```tsx
// Built-in props use theme
<Button variant="contained" color="primary" size="large">
<Card elevation={2}>
<Typography variant="h4" color="text.secondary">
```

### 4. ⚠️ Inline Styles (Avoid)
```tsx
// Only for necessary cases
<input type="file" style={{ display: 'none' }} />
```

### 5. ❌ Hardcoded Values (Never)
```tsx
// DON'T DO THIS
<Box style={{ 
  padding: '16px',
  backgroundColor: '#2563eb',
  borderRadius: '8px'
}}>
```

## New Layout Components

### Stack - Flexible Layout
```tsx
import { Stack } from '@qivr/design-system';

// Vertical stack (default)
<Stack spacing={2}>
  <Item1 />
  <Item2 />
</Stack>

// Horizontal stack
<Stack direction="row" spacing={3} align="center" justify="space-between">
  <Item1 />
  <Item2 />
</Stack>

// Instead of:
<Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'center', justifyContent: 'space-between' }}>
```

### Container - Centered Content
```tsx
import { Container } from '@qivr/design-system';

// Centered container with max width
<Container maxWidth="lg" padding={3}>
  <Content />
</Container>

// Instead of:
<Box sx={{ maxWidth: '1024px', mx: 'auto', px: 3 }}>
```

### Section - Page Sections
```tsx
import { Section } from '@qivr/design-system';

// Section with spacing
<Section spacing={4} background="grey">
  <Content />
</Section>

// Instead of:
<Box sx={{ py: 4, bgcolor: 'grey.50' }}>
```

## Common Patterns

### Before (More sx)
```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="h4">Title</Typography>
    <Button variant="contained">Action</Button>
  </Box>
  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
    <Content />
  </Box>
</Box>
```

### After (Design System Components)
```tsx
<Stack spacing={2} sx={{ p: 3 }}>
  <Stack direction="row" justify="space-between" align="center">
    <Typography variant="h4">Title</Typography>
    <Button variant="contained">Action</Button>
  </Stack>
  <Section background="grey" spacing={2}>
    <Content />
  </Section>
</Stack>
```

## Migration Examples

### Example 1: Form Layout
```tsx
// Before
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '600px', mx: 'auto', p: 3 }}>
  <TextField label="Name" />
  <TextField label="Email" />
  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
    <Button variant="outlined">Cancel</Button>
    <Button variant="contained">Submit</Button>
  </Box>
</Box>

// After
<Container maxWidth="sm" padding={3}>
  <Stack spacing={2}>
    <TextField label="Name" />
    <TextField label="Email" />
    <Stack direction="row" spacing={2} justify="flex-end">
      <Button variant="outlined">Cancel</Button>
      <Button variant="contained">Submit</Button>
    </Stack>
  </Stack>
</Container>
```

### Example 2: Dashboard Section
```tsx
// Before
<Box sx={{ py: 4, bgcolor: 'grey.50' }}>
  <Box sx={{ maxWidth: '1280px', mx: 'auto', px: 3 }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">Dashboard</Typography>
      <Grid container spacing={3}>
        {/* Cards */}
      </Grid>
    </Box>
  </Box>
</Box>

// After
<Section spacing={4} background="grey">
  <Container maxWidth="xl">
    <Stack spacing={3}>
      <Typography variant="h4">Dashboard</Typography>
      <Grid container spacing={3}>
        {/* Cards */}
      </Grid>
    </Stack>
  </Container>
</Section>
```

## Benefits

1. **Less Code** - Fewer sx props to write
2. **More Readable** - Intent is clearer
3. **Consistent** - Same patterns everywhere
4. **Maintainable** - Change component, not every usage
5. **Type Safe** - Props are typed

## When to Use sx

Use `sx` for:
- One-off styling needs
- Overriding component styles
- Responsive styles
- Hover/focus states

```tsx
<Stack 
  spacing={2}
  sx={{ 
    '&:hover': { bgcolor: 'action.hover' },
    display: { xs: 'none', md: 'flex' }
  }}
>
```

## Checklist

- [ ] Use design system components first
- [ ] Use theme values via sx (not hardcoded)
- [ ] Use MUI component props when available
- [ ] Avoid inline styles unless necessary
- [ ] Never hardcode colors, spacing, or sizes

## Summary

**Current Status:** ✅ Already excellent
- Only 5 inline styles (necessary cases)
- 477 theme-based styles using sx
- All use design system theme

**Next Level:** Use new layout components
- Stack, Container, Section
- Reduce sx usage by ~30%
- More readable, maintainable code
