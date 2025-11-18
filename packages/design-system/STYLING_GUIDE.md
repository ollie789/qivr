# Qivr Design System - Styling Guide

## Overview

All apps use the centralized `@qivr/design-system` theme for consistent styling. To update the entire UI, modify the theme in one place.

## Theme Location

**Single source of truth:** `packages/design-system/src/theme/theme.ts`

## Usage in Apps

```tsx
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '@qivr/design-system';

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

## Design Tokens

Colors, typography, and spacing are defined in `packages/design-system/src/tokens/index.ts`

### Colors
- Primary: Blue (#2563eb)
- Secondary: Purple (#7c3aed)
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Warning: Orange (#f59e0b)

### Typography
- Font Family: Inter
- Font Sizes: Defined in tokens
- Font Weights: 400 (regular), 500 (medium), 700 (bold)

### Spacing
- Base unit: 8px
- Use theme.spacing() for consistent spacing

## Component Styling

### Buttons
```tsx
<Button variant="contained">Primary Action</Button>
<Button variant="outlined">Secondary Action</Button>
<Button variant="text">Tertiary Action</Button>
```

### Cards
```tsx
<Card>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Dialogs
```tsx
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>Content</DialogContent>
  <DialogActions>Actions</DialogActions>
</Dialog>
```

## Customization

### Global Theme Updates

Edit `packages/design-system/src/theme/theme.ts`:

```ts
export const theme = createTheme({
  palette: {
    primary: {
      main: '#YOUR_COLOR',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // Your overrides
        },
      },
    },
  },
});
```

### Component-Specific Styling

Use `sx` prop for one-off styles:

```tsx
<Box sx={{ p: 2, bgcolor: 'primary.light' }}>
  Content
</Box>
```

### Custom Components

Build on design system components:

```tsx
import { QivrCard, QivrButton } from '@qivr/design-system';

export const MyFeature = () => (
  <QivrCard>
    <QivrButton>Action</QivrButton>
  </QivrCard>
);
```

## Best Practices

1. **Always use theme values** - Never hardcode colors or spacing
2. **Use design system components** - Build on QivrCard, QivrButton, etc.
3. **Consistent spacing** - Use theme.spacing(1, 2, 3, etc.)
4. **Semantic colors** - Use primary, secondary, success, error, warning
5. **Responsive design** - Use theme breakpoints

## Examples

### Good ✅
```tsx
<Box sx={{ 
  p: 2, 
  bgcolor: 'primary.main',
  borderRadius: 1,
  color: 'white'
}}>
  Content
</Box>
```

### Bad ❌
```tsx
<Box style={{ 
  padding: '16px',
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: 'white'
}}>
  Content
</Box>
```

## Updating the Entire UI

To change the look and feel across all apps:

1. Update colors in `tokens/index.ts`
2. Modify component overrides in `theme/theme.ts`
3. Changes apply to clinic dashboard, patient portal, and all future apps

## Testing Theme Changes

```bash
# Start Storybook to preview components
cd packages/design-system
npm run storybook

# Test in clinic dashboard
cd apps/clinic-dashboard
npm run dev
```
