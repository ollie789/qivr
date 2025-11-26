# Design Consistency Audit & Fix Plan

**Date:** 2025-11-26  
**Issue:** Inconsistent styling across components  
**Priority:** HIGH

---

## 🔍 Inconsistencies Found

### 1. **Border Radius Variations**
```
❌ borderRadius: 1  (4px)
❌ borderRadius: 2  (8px)
❌ borderRadius: 3  (12px)
❌ borderRadius: 4  (16px)
❌ borderRadius: "50%" (circles)
```

**Problem:** 5 different border radius values used randomly

---

### 2. **Padding Inconsistencies**
```
❌ p: 0  (13 instances)
❌ p: 1  (20 instances)
❌ p: 2  (31 instances)
❌ p: 3  (30 instances)
❌ p: 4  (8 instances)
❌ p: 8  (3 instances)
```

**Problem:** 6 different padding values with no clear pattern

---

### 3. **Shadow Variations**
```
❌ boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
❌ boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
❌ boxShadow: 1
❌ boxShadow: 2
❌ boxShadow: 3
```

**Problem:** Mix of custom shadows and MUI theme shadows

---

### 4. **Color Usage**
```
❌ Direct hex colors: '#667eea', '#764ba2'
❌ Theme colors: 'primary.main', 'secondary.main'
❌ Inline gradients: 'linear-gradient(...)'
```

**Problem:** No centralized color tokens

---

### 5. **Spacing Inconsistencies**
```
❌ Stack spacing: {1}, {2}, {3}, {4}
❌ Grid spacing: {2}, {3}, {4}
❌ gap: 1, gap: 2, gap: 3
```

**Problem:** Random spacing values

---

## 🎯 Aura Design System Standards

### Standardized Values

#### Border Radius
```typescript
const borderRadius = {
  sm: 1,    // 4px  - Chips, small buttons
  md: 2,    // 8px  - Buttons, inputs
  lg: 3,    // 12px - Cards, dialogs
  xl: 4,    // 16px - Large containers
  round: '50%', // Avatars, icon buttons
};
```

#### Padding/Spacing
```typescript
const spacing = {
  xs: 1,    // 8px  - Tight spacing
  sm: 2,    // 16px - Default spacing
  md: 3,    // 24px - Card padding
  lg: 4,    // 32px - Section padding
  xl: 6,    // 48px - Page padding
};
```

#### Shadows
```typescript
const shadows = {
  card: '0 2px 8px rgba(0,0,0,0.08)',
  cardHover: '0 4px 16px rgba(0,0,0,0.12)',
  dialog: '0 8px 32px rgba(0,0,0,0.16)',
};
```

#### Colors
```typescript
const colors = {
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  primary: '#667eea',
  secondary: '#764ba2',
};
```

---

## 🔧 Fix Plan

### Phase 1: Create Design Tokens (30 min)

**File:** `packages/design-system/src/theme/auraTokens.ts`

```typescript
export const auraTokens = {
  borderRadius: {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
    round: '50%',
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 6,
  },
  shadows: {
    card: '0 2px 8px rgba(0,0,0,0.08)',
    cardHover: '0 4px 16px rgba(0,0,0,0.12)',
    dialog: '0 8px 32px rgba(0,0,0,0.16)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
};
```

---

### Phase 2: Standardize Components (2-3 hours)

#### Priority 1: Cards (HIGH)
**Files to fix:**
- `AuraIntakeKanban.tsx`
- `TreatmentPlanCard.tsx`
- `PainProgressionChart.tsx`
- All dashboard cards

**Before:**
```typescript
sx={{
  p: 2.5,
  borderRadius: 3,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
}}
```

**After:**
```typescript
import { auraTokens } from '@qivr/design-system';

sx={{
  p: auraTokens.spacing.md,
  borderRadius: auraTokens.borderRadius.lg,
  boxShadow: auraTokens.shadows.card,
}}
```

---

#### Priority 2: Dialogs (HIGH)
**Files to fix:**
- `TreatmentPlanDialog.tsx`
- `ScheduleAppointmentDialog.tsx`
- `IntakeDetailsDialog.tsx`
- `RebookingDialog.tsx`

**Standardize:**
- Header: `p: 3`, gradient background
- Content: `p: 3`, `Stack spacing={3}`
- Actions: `p: 2`

---

#### Priority 3: Buttons (MEDIUM)
**Standardize:**
- Primary: `borderRadius: 2`, gradient or solid
- Secondary: `borderRadius: 2`, outlined
- Icon buttons: `borderRadius: '50%'`

---

#### Priority 4: Forms (MEDIUM)
**Standardize:**
- Text fields: `borderRadius: 2`
- Checkboxes: consistent spacing
- Sliders: consistent styling

---

### Phase 3: Create Reusable Styled Components (1 hour)

**File:** `packages/design-system/src/components/aura/AuraCard.tsx`

```typescript
import { Paper, PaperProps } from '@mui/material';
import { auraTokens } from '../../theme/auraTokens';

export const AuraCard = (props: PaperProps) => (
  <Paper
    {...props}
    sx={{
      p: auraTokens.spacing.md,
      borderRadius: auraTokens.borderRadius.lg,
      boxShadow: auraTokens.shadows.card,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: auraTokens.shadows.cardHover,
        transform: 'translateY(-2px)',
      },
      ...props.sx,
    }}
  />
);
```

**File:** `packages/design-system/src/components/aura/AuraGradientCard.tsx`

```typescript
export const AuraGradientCard = (props: PaperProps) => (
  <Paper
    {...props}
    sx={{
      p: auraTokens.spacing.md,
      borderRadius: auraTokens.borderRadius.lg,
      background: auraTokens.gradients.primary,
      color: 'white',
      ...props.sx,
    }}
  />
);
```

**File:** `packages/design-system/src/components/aura/AuraDialog.tsx`

```typescript
export const AuraDialog = ({ children, title, ...props }: DialogProps) => (
  <Dialog {...props} maxWidth="md" fullWidth>
    <DialogTitle
      sx={{
        background: auraTokens.gradients.primary,
        color: 'white',
        p: auraTokens.spacing.md,
      }}
    >
      {title}
    </DialogTitle>
    <DialogContent sx={{ p: auraTokens.spacing.md }}>
      {children}
    </DialogContent>
  </Dialog>
);
```

---

## 📋 Implementation Checklist

### Step 1: Create Tokens ✅
- [ ] Create `auraTokens.ts`
- [ ] Export from design system
- [ ] Update theme to use tokens

### Step 2: Create Base Components ✅
- [ ] `AuraCard.tsx`
- [ ] `AuraGradientCard.tsx`
- [ ] `AuraDialog.tsx`
- [ ] `AuraButton.tsx`
- [ ] `AuraTextField.tsx`

### Step 3: Refactor Existing Components
**Clinic Dashboard:**
- [ ] `AuraIntakeKanban.tsx` - Use AuraCard
- [ ] `TreatmentPlanDialog.tsx` - Use AuraDialog
- [ ] `ScheduleAppointmentDialog.tsx` - Use AuraDialog
- [ ] `IntakeDetailsDialog.tsx` - Use AuraDialog
- [ ] `PainProgressionChart.tsx` - Use AuraCard
- [ ] `Appointments.tsx` - Standardize cards
- [ ] `Dashboard.tsx` - Standardize cards
- [ ] `MedicalRecords.tsx` - Standardize cards

**Patient Portal:**
- [ ] `TreatmentPlanCard.tsx` - Use AuraGradientCard
- [ ] `RebookingDialog.tsx` - Use AuraDialog
- [ ] `CompletePROM.tsx` - Standardize spacing
- [ ] `DashboardPage.tsx` - Standardize cards

### Step 4: Documentation
- [ ] Update design system docs
- [ ] Create usage examples
- [ ] Add Storybook stories

---

## 🎯 Expected Outcomes

### Before (Current State)
```typescript
// Inconsistent everywhere
sx={{ p: 2.5, borderRadius: 3, boxShadow: '0 2px 8px...' }}
sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}
sx={{ p: 2, borderRadius: 4, boxShadow: '0 4px 16px...' }}
```

### After (Consistent)
```typescript
// Using tokens
<AuraCard>Content</AuraCard>

// Or with tokens
sx={{ 
  p: auraTokens.spacing.md,
  borderRadius: auraTokens.borderRadius.lg,
  boxShadow: auraTokens.shadows.card,
}}
```

---

## 📊 Impact Analysis

### Benefits
✅ **Consistency** - Same look everywhere
✅ **Maintainability** - Change once, update everywhere
✅ **Speed** - Faster development with reusable components
✅ **Quality** - Professional, polished appearance
✅ **Brand** - Strong Aura identity

### Effort
- **Tokens:** 30 minutes
- **Base Components:** 1 hour
- **Refactoring:** 2-3 hours
- **Testing:** 1 hour
- **Total:** ~5 hours

### Risk
⚠️ **Low** - Non-breaking changes, visual only

---

## 🚀 Quick Wins (Do First)

### 1. Create Tokens (30 min)
Most impactful, enables everything else

### 2. Create AuraCard & AuraGradientCard (30 min)
Used everywhere, biggest visual impact

### 3. Refactor Top 5 Pages (1 hour)
- Dashboard
- Intake Management
- Medical Records
- Appointments
- Patient Portal Dashboard

---

## 📝 Next Steps

1. **Create tokens file** - Foundation for consistency
2. **Create 3 base components** - AuraCard, AuraGradientCard, AuraDialog
3. **Refactor patient flow pages** - Use new components
4. **Test visually** - Ensure no regressions
5. **Document** - Update design system docs

**Estimated Time:** 5 hours total
**Priority:** HIGH - Improves brand consistency significantly

---

**Status:** 📋 READY TO IMPLEMENT  
**Owner:** TBD  
**Timeline:** 1 day sprint
