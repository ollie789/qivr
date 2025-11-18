# Patient Portal Components

Organized component structure using the Qivr design system.

## Structure

```
components/
├── shared/             # Shared/reusable components
│   ├── TenantSelector.tsx
│   └── LoadingScreen.tsx (re-exports from design system)
│
├── auth/               # Authentication components
│   └── PrivateRoute.tsx
│
└── layout/             # Layout components
    └── MainLayout.tsx  # Main patient portal shell
```

## Design System Integration

This portal uses `@qivr/design-system` for consistent styling:

```tsx
import { 
  QivrButton, 
  QivrCard, 
  StatCard,
  LoadingSpinner,
  EmptyState 
} from '@qivr/design-system';
```

## Usage

Import from organized folders:

```tsx
// Components
import { TenantSelector, LoadingScreen } from '../components/shared';
import { PrivateRoute } from '../components/auth';
import { MainLayout } from '../components/layout';
```

## Feature-Based Organization

Patient-specific features are in `src/features/`:
- `appointments/` - Appointment booking and management
- `dashboard/` - Patient dashboard widgets
- `documents/` - Document management
- `medical-records/` - Medical records viewing
- `proms/` - Patient-reported outcome measures
- `profile/` - Patient profile management
- `analytics/` - Health analytics

Each feature contains:
- `components/` - Feature-specific UI components
- `hooks/` - Feature-specific React hooks
- `types/` - TypeScript types

## Styling

All components use the centralized theme from `@qivr/design-system`:
- Consistent colors, spacing, typography
- Same look and feel as clinic dashboard
- Update theme once, both portals change

See `packages/design-system/STYLING_GUIDE.md` for details.
