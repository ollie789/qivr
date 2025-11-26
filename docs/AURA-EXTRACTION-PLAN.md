# Aura UI Extraction & Integration Plan

**Date:** 2025-11-26  
**Goal:** Extract best patterns from Aura UI and apply to our system  
**Strategy:** Clean our mess, then integrate Aura styling

---

## 🎯 Strategy

### Phase 1: Extract Aura UI Essentials (1 hour)
Extract ONLY the styling, theme, and component patterns we need

### Phase 2: Clean Our System (30 min)
Remove duplicates and confusion

### Phase 3: Apply Aura Styling (2 hours)
Integrate Aura patterns into our components

---

## 📦 What to Extract from Aura UI

### 1. **Theme Configuration** ⭐ PRIORITY
**Location:** `Aura UI/vite-ts-starter/src/theme/`

**Extract:**
```
✅ theme.ts              - Complete theme setup
✅ palette.ts            - Color system
✅ typography.ts         - Font system
✅ shadows.ts            - Shadow system
✅ mixins.ts             - Reusable mixins
✅ components/*.tsx      - Component overrides
```

**Why:** This is the foundation of Aura's beautiful styling

---

### 2. **Styled Components** ⭐ PRIORITY
**Location:** `Aura UI/vite-ts-starter/src/components/styled/`

**Extract:**
```
✅ StyledTextField.tsx   - Beautiful text fields
✅ StyledFormControl.tsx - Form styling
✅ StyledChip.tsx        - Chip styling
✅ OutlinedBadge.tsx     - Badge component
```

**Why:** These make forms look amazing

---

### 3. **Base Components** ⭐ PRIORITY
**Location:** `Aura UI/vite-ts-starter/src/components/base/`

**Extract:**
```
✅ StatusAvatar.tsx      - Avatar with status
✅ SimpleBar.tsx         - Custom scrollbar
✅ Image.tsx             - Optimized image
```

**Why:** Useful utilities

---

### 4. **Notification Components** 🎯 MEDIUM
**Location:** `Aura UI/vite-ts-starter/src/components/sections/notification/`

**Extract:**
```
✅ NotificationList.tsx
✅ NotificationActionMenu.tsx
✅ NotificationListItemAvatar.tsx
```

**Why:** We need notification UI

---

### 5. **Common Components** 🎯 MEDIUM
**Location:** `Aura UI/vite-ts-starter/src/components/common/`

**Check what's useful and extract**

---

## 🧹 Cleanup Our System First

### Step 1: Remove Duplicates
```bash
# Delete duplicate aura app structure
rm -rf packages/design-system/src/aura/pages
rm -rf packages/design-system/src/aura/routes
rm -rf packages/design-system/src/aura/services
rm -rf packages/design-system/src/aura/providers
rm -rf packages/design-system/src/aura/reducers
rm -rf packages/design-system/src/aura/layouts
rm -rf packages/design-system/src/aura/locales
rm -rf packages/design-system/src/aura/data
rm -rf packages/design-system/src/aura/docs
rm -rf packages/design-system/src/aura/helpers
rm -rf packages/design-system/src/aura/hooks
rm -rf packages/design-system/src/aura/lib

# Keep only theme and useful components
# packages/design-system/src/aura/theme/ ✅
# packages/design-system/src/aura/components/ ✅ (check first)
```

### Step 2: Remove Disabled Folders
```bash
rm -rf packages/design-system/src/theme.disabled
rm -rf packages/design-system/src/providers.disabled
```

### Step 3: Consolidate Theme
```bash
# Merge aura theme into main theme
# Keep: packages/design-system/src/theme/
```

---

## 🎨 Integration Plan

### Phase 1: Extract Aura Theme (30 min)

**Create:** `packages/design-system/src/theme/aura/`

```bash
# Copy Aura theme files
cp -r "Aura UI/vite-ts-starter/src/theme/" src/theme/aura-extracted/

# Review and integrate:
# - palette.ts → src/theme/auraColors.ts (merge)
# - typography.ts → src/theme/typography.ts (new)
# - shadows.ts → src/theme/shadows.ts (new)
# - components/ → src/theme/components/ (new)
```

**File:** `src/theme/auraTheme.ts`
```typescript
import { createTheme } from '@mui/material';
import { auraColors } from './auraColors';
import { typography } from './typography';
import { shadows } from './shadows';
import { componentOverrides } from './components';

export const auraTheme = createTheme({
  palette: auraColors,
  typography,
  shadows,
  components: componentOverrides,
  shape: {
    borderRadius: 12, // Aura default
  },
});
```

---

### Phase 2: Extract Styled Components (30 min)

**Create:** `packages/design-system/src/components/aura/`

```bash
# Copy styled components
cp "Aura UI/vite-ts-starter/src/components/styled/StyledTextField.tsx" \
   src/components/aura/AuraTextField.tsx

cp "Aura UI/vite-ts-starter/src/components/styled/StyledFormControl.tsx" \
   src/components/aura/AuraFormControl.tsx

cp "Aura UI/vite-ts-starter/src/components/styled/OutlinedBadge.tsx" \
   src/components/aura/AuraBadge.tsx
```

**Rename and clean:**
- `StyledTextField` → `AuraTextField`
- `StyledFormControl` → `AuraFormControl`
- Remove app-specific dependencies

---

### Phase 3: Create Aura Base Components (30 min)

**File:** `src/components/aura/AuraCard.tsx`
```typescript
import { Paper, PaperProps } from '@mui/material';

export const AuraCard = (props: PaperProps) => (
  <Paper
    elevation={0}
    {...props}
    sx={{
      p: 3,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: 'primary.main',
        boxShadow: (theme) => theme.shadows[4],
      },
      ...props.sx,
    }}
  />
);
```

**File:** `src/components/aura/AuraGradientCard.tsx`
```typescript
export const AuraGradientCard = (props: PaperProps) => (
  <Paper
    elevation={0}
    {...props}
    sx={{
      p: 3,
      borderRadius: 3,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      ...props.sx,
    }}
  />
);
```

**File:** `src/components/aura/AuraButton.tsx`
```typescript
import { Button, ButtonProps } from '@mui/material';

export const AuraButton = (props: ButtonProps) => (
  <Button
    {...props}
    sx={{
      borderRadius: 2,
      textTransform: 'none',
      fontWeight: 600,
      px: 3,
      py: 1,
      ...props.sx,
    }}
  />
);
```

---

### Phase 4: Extract Notification Components (30 min)

```bash
# Copy notification components
mkdir -p src/components/notifications

cp "Aura UI/vite-ts-starter/src/components/sections/notification/"*.tsx \
   src/components/notifications/
```

**Clean up:**
- Remove app-specific imports
- Adapt to our API structure
- Export from index

---

### Phase 5: Update Exports (15 min)

**File:** `src/index.ts`
```typescript
// Aura Components
export * from './components/aura/AuraCard';
export * from './components/aura/AuraGradientCard';
export * from './components/aura/AuraButton';
export * from './components/aura/AuraTextField';
export * from './components/aura/AuraFormControl';
export * from './components/aura/AuraBadge';

// Aura Theme
export { auraTheme } from './theme/auraTheme';
export { auraColors } from './theme/auraColors';

// Notifications
export * from './components/notifications';

// Existing exports...
```

---

### Phase 6: Apply to Our Components (2 hours)

**Priority Components to Update:**

1. **TreatmentPlanCard** → Use AuraGradientCard
2. **IntakeKanban cards** → Use AuraCard
3. **All dialogs** → Apply Aura dialog styling
4. **All forms** → Use AuraTextField
5. **All buttons** → Use AuraButton

**Example Refactor:**

**Before:**
```typescript
<Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 8px...' }}>
  Content
</Paper>
```

**After:**
```typescript
import { AuraCard } from '@qivr/design-system';

<AuraCard>
  Content
</AuraCard>
```

---

## 📋 Execution Checklist

### Phase 1: Extraction (1 hour)
- [ ] Copy Aura theme files to `src/theme/aura-extracted/`
- [ ] Copy styled components to `src/components/aura/`
- [ ] Copy notification components to `src/components/notifications/`
- [ ] Copy base components (StatusAvatar, SimpleBar, Image)

### Phase 2: Integration (1 hour)
- [ ] Create `auraTheme.ts` with full theme
- [ ] Create `AuraCard.tsx`
- [ ] Create `AuraGradientCard.tsx`
- [ ] Create `AuraButton.tsx`
- [ ] Create `AuraTextField.tsx`
- [ ] Update `src/index.ts` exports

### Phase 3: Cleanup (30 min)
- [ ] Delete `src/aura/pages/`
- [ ] Delete `src/aura/routes/`
- [ ] Delete `src/aura/services/`
- [ ] Delete all app-specific folders
- [ ] Delete `theme.disabled/`
- [ ] Delete `providers.disabled/`
- [ ] Keep only `src/aura/theme/` and useful components

### Phase 4: Apply to Apps (2 hours)
- [ ] Update TreatmentPlanCard
- [ ] Update IntakeKanban
- [ ] Update all dialogs
- [ ] Update all forms
- [ ] Update all buttons
- [ ] Test builds

### Phase 5: Final Cleanup (30 min)
- [ ] Move `Aura UI/` folder to `~/Documents/aura-ui-reference/`
- [ ] Update documentation
- [ ] Commit changes

---

## 🎯 Final Structure

```
packages/design-system/
├── src/
│   ├── components/
│   │   ├── aura/              ✅ Aura styled components
│   │   │   ├── AuraCard.tsx
│   │   │   ├── AuraGradientCard.tsx
│   │   │   ├── AuraButton.tsx
│   │   │   ├── AuraTextField.tsx
│   │   │   └── ...
│   │   ├── notifications/     ✅ From Aura UI
│   │   ├── calendar/          ✅ Our components
│   │   ├── pain-map/          ✅ Our components
│   │   └── ...
│   │
│   ├── theme/
│   │   ├── auraTheme.ts       ✅ Complete Aura theme
│   │   ├── auraColors.ts      ✅ Color system
│   │   ├── typography.ts      ✅ From Aura
│   │   ├── shadows.ts         ✅ From Aura
│   │   └── components/        ✅ MUI overrides
│   │
│   └── index.ts               ✅ Clean exports
│
└── package.json
```

---

## 🎨 Benefits

### Before
- ❌ 1GB of reference apps
- ❌ Duplicate app structure
- ❌ Inconsistent styling
- ❌ Confusion

### After
- ✅ Clean 50MB package
- ✅ Aura styling integrated
- ✅ Consistent components
- ✅ Clear structure
- ✅ Beautiful UI everywhere

---

## ⏱️ Timeline

- **Extraction:** 1 hour
- **Integration:** 1 hour
- **Cleanup:** 30 min
- **Apply to apps:** 2 hours
- **Testing:** 30 min
- **Total:** 5 hours

---

## 🚀 Next Steps

1. **Start extraction** - Copy Aura theme and components
2. **Create Aura wrappers** - AuraCard, AuraButton, etc.
3. **Clean our system** - Remove duplicates
4. **Apply to apps** - Use new components everywhere
5. **Move reference** - Archive Aura UI folder
6. **Celebrate** - Beautiful, consistent design! 🎉

---

**Status:** 📋 READY TO EXECUTE  
**Priority:** HIGH  
**Impact:** Massive improvement in consistency and beauty
