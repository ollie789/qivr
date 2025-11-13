# Design Tokens

Design tokens are the single source of truth for design decisions (colors, spacing, typography).

## Workflow: Figma → Tokens → Components

### 1. Design in Figma
- Install the **Figma Tokens** plugin in Figma
- Define your colors, spacing, and typography as tokens
- Export tokens as JSON

### 2. Update Token Files
Replace the JSON files in this directory with your exported tokens:
- `colors.json` - Color palette
- `spacing.json` - Spacing scale
- `typography.json` - Font families, sizes, weights

### 3. Build Tokens
```bash
npm run build-tokens
```

This generates TypeScript constants in `src/tokens/index.ts`

### 4. Use in Components
```typescript
import { ColorPrimaryMain, SpacingMd } from '../tokens';

const MyComponent = styled('div')({
  backgroundColor: ColorPrimaryMain,
  padding: SpacingMd,
});
```

### 5. Update Theme
Import tokens into your MUI theme to apply globally.

## Token Structure

```json
{
  "color": {
    "primary": {
      "main": { "value": "#1976d2" }
    }
  }
}
```

Generates: `export const ColorPrimaryMain = "#1976d2";`
