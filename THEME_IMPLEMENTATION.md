# Qivr Theme Implementation - Complete Guide

## ✅ Implementation Complete

The entire Qivr application now uses a centralized design system for consistent styling across all apps.

## Architecture

```
packages/design-system/
├── src/
│   ├── tokens/           # Design tokens (colors, spacing, typography)
│   │   └── index.ts      # Single source of truth for all values
│   ├── theme/            # MUI theme configuration
│   │   └── theme.ts      # Component overrides and theme setup
│   └── components/       # Reusable UI components
│       ├── QivrButton.tsx
│       ├── QivrCard.tsx
│       ├── StatCard.tsx
│       └── ...
```

## What's Included

### 1. Design Tokens (`packages/design-system/src/tokens/index.ts`)

**Colors:**
- Primary: Blue (#2563eb)
- Secondary: Purple (#7c3aed)
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Warning: Orange (#f59e0b)
- Info: Blue (#3b82f6)
- Grey scale: 50-900

**Typography:**
- Font: Inter
- Sizes: xs (12px) → xxxl (32px)
- Weights: Light (300) → Bold (700)

**Spacing:**
- xs (4px) → xxxl (64px)
- Base unit: 8px

**Border Radius:**
- sm (6px) → full (9999px)

**Shadows:**
- sm → xl (4 levels)

### 2. Theme Configuration (`packages/design-system/src/theme/theme.ts`)

**Component Overrides:**
- ✅ MuiButton - Consistent padding, border radius, shadows
- ✅ MuiCard - Rounded corners, subtle shadows
- ✅ MuiDialog - Rounded corners, elevated shadows
- ✅ MuiTextField - Rounded inputs
- ✅ MuiChip - Rounded, medium weight
- ✅ MuiPaper - No background image, consistent shadows
- ✅ MuiAlert - Rounded corners
- ✅ MuiTableCell - Subtle borders, grey header
- ✅ MuiTab - No text transform, medium weight
- ✅ MuiAppBar - Subtle shadow

### 3. Design System Components

All components automatically use the theme:
- QivrButton
- QivrCard
- StatCard
- EmptyState
- LoadingSpinner
- DataTable
- And more...

## How to Use

### In Your Components

```tsx
import { Box, Button, Card, Typography } from '@mui/material';
import { QivrButton, QivrCard } from '@qivr/design-system';

// All MUI components automatically use the theme
<Button variant="contained">Themed Button</Button>

// Design system components
<QivrButton emphasize="primary">Action</QivrButton>

// Use theme values via sx prop
<Box sx={{ 
  p: 2,                    // Uses theme.spacing(2) = 16px
  bgcolor: 'primary.main', // Uses theme.palette.primary.main
  borderRadius: 1,         // Uses theme.shape.borderRadius
}}>
  Content
</Box>
```

### Testing the Theme

Visit `/theme` in the clinic dashboard to see all components styled:
```
http://localhost:5173/theme
```

## Updating the Theme

### Change Colors

Edit `packages/design-system/src/tokens/index.ts`:

```ts
// Change primary color to green
export const ColorPrimaryMain = "#10b981";
export const ColorPrimaryLight = "#34d399";
export const ColorPrimaryDark = "#059669";
```

### Change Component Styles

Edit `packages/design-system/src/theme/theme.ts`:

```ts
components: {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 20, // Make all buttons pill-shaped
        fontWeight: 600,  // Make all buttons bolder
      },
    },
  },
}
```

### Change Typography

Edit tokens for font sizes, or theme for font family:

```ts
// In tokens/index.ts
export const TypographyFontFamilyBase = '"Poppins", sans-serif';

// In theme/theme.ts
typography: {
  fontFamily: tokens.TypographyFontFamilyBase,
  h1: {
    fontSize: '3rem', // Larger headings
  },
}
```

## Apps Using the Theme

### ✅ Clinic Dashboard
- Location: `apps/clinic-dashboard`
- Uses: `<ThemeProvider theme={theme}>`
- All components styled consistently

### 🔜 Patient Portal
- Location: `apps/patient-portal`
- Will use the same theme
- Consistent experience across portals

## Benefits

1. **Single Source of Truth** - Change colors/styles in one place
2. **Consistency** - All components look and feel the same
3. **Easy Updates** - Rebrand entire app by editing tokens
4. **Type Safety** - TypeScript ensures correct usage
5. **Scalability** - Add new apps with same styling

## Examples

### Before (Inconsistent)
```tsx
// Different styles everywhere
<Button style={{ borderRadius: '8px', padding: '10px 20px' }}>
<Button style={{ borderRadius: '4px', padding: '8px 16px' }}>
<Button style={{ borderRadius: '12px', padding: '12px 24px' }}>
```

### After (Consistent)
```tsx
// All buttons use theme
<Button variant="contained">Action 1</Button>
<Button variant="contained">Action 2</Button>
<Button variant="contained">Action 3</Button>
```

## Quick Reference

### Common Theme Values

```tsx
// Spacing
sx={{ p: 1 }}  // 8px padding
sx={{ p: 2 }}  // 16px padding
sx={{ p: 3 }}  // 24px padding

// Colors
sx={{ bgcolor: 'primary.main' }}
sx={{ bgcolor: 'success.light' }}
sx={{ color: 'text.secondary' }}

// Border Radius
sx={{ borderRadius: 1 }}  // 8px
sx={{ borderRadius: 2 }}  // 16px

// Shadows
elevation={1}  // Subtle shadow
elevation={2}  // Medium shadow
elevation={3}  // Strong shadow
```

## Documentation

- **Styling Guide**: `packages/design-system/STYLING_GUIDE.md`
- **Component Docs**: `packages/design-system/src/components/`
- **Storybook**: Run `npm run storybook` in design-system

## Support

For questions or issues with the theme system:
1. Check the styling guide
2. View the theme showcase at `/theme`
3. Review component examples in Storybook
4. Check MUI documentation for component props

---

**Last Updated**: November 18, 2025
**Version**: 1.0.0
