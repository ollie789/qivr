# @qivr/design-system

Shared tokens, theming helpers, and UI primitives for Qivr applications.

## Usage

```tsx
import { QivrThemeProvider, QivrButton } from '@qivr/design-system';

function AppShell() {
  return (
    <QivrThemeProvider brand="clinic">
      <QivrButton>Schedule visit</QivrButton>
    </QivrThemeProvider>
  );
}
```

## Scripts

- `npm run build --workspace=@qivr/design-system`: emit compiled JS + type declarations to `dist/`.
- `npm run typecheck --workspace=@qivr/design-system`: run TypeScript without emitting output.
