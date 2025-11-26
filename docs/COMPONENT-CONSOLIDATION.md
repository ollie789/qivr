# Component Consolidation Plan

**Date:** 2025-11-26  
**Issue:** Components scattered across apps causing inconsistency  
**Goal:** Move reusable components to design system

---

## 🔍 Current Situation

### Design System
- **87 components** in `packages/design-system/src/components/`

### Clinic Dashboard
- **27 components** in `apps/clinic-dashboard/src/components/`
- Many are Aura-styled and reusable!

### Patient Portal
- **6 components** in `apps/patient-portal/src/components/`
- Some duplicates (TenantSelector, PrivateRoute)

---

## 📦 Components Analysis

### Clinic Dashboard Components

#### ✅ Should Move to Design System (Reusable)
```
AuraActivityTimeline.tsx      → design-system/components/aura/
AuraAppointmentCard.tsx        → design-system/components/aura/
AuraDocumentCard.tsx           → design-system/components/aura/
AuraGlassChartCard.tsx         → design-system/components/aura/
AuraGlassStatCard.tsx          → design-system/components/aura/
AuraIntakeKanban.tsx           → design-system/components/aura/
AuraMessageCard.tsx            → design-system/components/aura/
AuraSettingsCard.tsx           → design-system/components/aura/
```
**Why:** These are Aura-styled, reusable UI components

```
IntakeDetailsDialog.tsx        → design-system/components/dialogs/
ScheduleAppointmentDialog.tsx  → design-system/components/dialogs/
TreatmentPlanDialog.tsx        → design-system/components/dialogs/
SendPromDialog.tsx             → design-system/components/dialogs/
PatientInviteDialog.tsx        → design-system/components/dialogs/
```
**Why:** Reusable dialog components

```
PainProgressionChart.tsx       → design-system/components/pain-map/
```
**Why:** Pain-related visualization

```
DocumentUploader.tsx           → design-system/components/forms/
FileUpload.tsx                 → design-system/components/forms/
SelectField.tsx                → design-system/components/forms/
```
**Why:** Reusable form components

```
MessageComposer.tsx            → design-system/components/messaging/
MessageTemplateManager.tsx     → design-system/components/messaging/
```
**Why:** Messaging components

```
OCRResultsViewer.tsx           → design-system/components/common/
PromPreview.tsx                → design-system/components/common/
PROMSender.tsx                 → design-system/components/common/
```
**Why:** Reusable utility components

#### ⚠️ Keep in App (App-Specific)
```
DashboardLayout.tsx            ✅ App-specific layout
NotificationBell.tsx           ✅ App-specific (uses app state)
PrivateRoute.tsx               ✅ App-specific routing
TenantInfo.tsx                 ✅ App-specific
TenantSelector.tsx             ✅ App-specific (but duplicated!)
```

---

### Patient Portal Components

#### ✅ Should Move to Design System
```
TreatmentPlanCard.tsx          → design-system/components/aura/
RebookingDialog.tsx            → design-system/components/dialogs/
LoadingScreen.tsx              → design-system/components/feedback/
```

#### ⚠️ Keep in App (Duplicates to Resolve)
```
MainLayout.tsx                 ✅ App-specific
PrivateRoute.tsx               ⚠️ DUPLICATE (also in clinic-dashboard)
TenantSelector.tsx             ⚠️ DUPLICATE (also in clinic-dashboard)
```

---

## 🎯 Consolidation Strategy

### Phase 1: Extract Aura UI Theme (DONE IN PREVIOUS PLAN)
- Extract theme, styled components
- Create AuraCard, AuraButton, etc.

### Phase 2: Move Aura Components (1 hour)

**Move these to design system:**
```bash
# Aura components
mv apps/clinic-dashboard/src/components/AuraActivityTimeline.tsx \
   packages/design-system/src/components/aura/

mv apps/clinic-dashboard/src/components/AuraAppointmentCard.tsx \
   packages/design-system/src/components/aura/

mv apps/clinic-dashboard/src/components/AuraDocumentCard.tsx \
   packages/design-system/src/components/aura/

mv apps/clinic-dashboard/src/components/AuraGlassChartCard.tsx \
   packages/design-system/src/components/aura/

mv apps/clinic-dashboard/src/components/AuraGlassStatCard.tsx \
   packages/design-system/src/components/aura/

mv apps/clinic-dashboard/src/components/AuraIntakeKanban.tsx \
   packages/design-system/src/components/aura/

mv apps/clinic-dashboard/src/components/AuraMessageCard.tsx \
   packages/design-system/src/components/aura/

mv apps/clinic-dashboard/src/components/AuraSettingsCard.tsx \
   packages/design-system/src/components/aura/

mv apps/patient-portal/src/components/TreatmentPlanCard.tsx \
   packages/design-system/src/components/aura/
```

### Phase 3: Move Dialogs (30 min)

```bash
mv apps/clinic-dashboard/src/components/IntakeDetailsDialog.tsx \
   packages/design-system/src/components/dialogs/

mv apps/clinic-dashboard/src/components/ScheduleAppointmentDialog.tsx \
   packages/design-system/src/components/dialogs/

mv apps/clinic-dashboard/src/components/TreatmentPlanDialog.tsx \
   packages/design-system/src/components/dialogs/

mv apps/clinic-dashboard/src/components/SendPromDialog.tsx \
   packages/design-system/src/components/dialogs/

mv apps/clinic-dashboard/src/components/PatientInviteDialog.tsx \
   packages/design-system/src/components/dialogs/

mv apps/patient-portal/src/components/RebookingDialog.tsx \
   packages/design-system/src/components/dialogs/
```

### Phase 4: Move Other Reusable Components (30 min)

```bash
# Pain map
mv apps/clinic-dashboard/src/components/PainProgressionChart.tsx \
   packages/design-system/src/components/pain-map/

# Forms
mv apps/clinic-dashboard/src/components/DocumentUploader.tsx \
   packages/design-system/src/components/forms/

mv apps/clinic-dashboard/src/components/FileUpload.tsx \
   packages/design-system/src/components/forms/

mv apps/clinic-dashboard/src/components/SelectField.tsx \
   packages/design-system/src/components/forms/

# Messaging
mv apps/clinic-dashboard/src/components/MessageComposer.tsx \
   packages/design-system/src/components/messaging/

mv apps/clinic-dashboard/src/components/MessageTemplateManager.tsx \
   packages/design-system/src/components/messaging/

# Common
mv apps/clinic-dashboard/src/components/OCRResultsViewer.tsx \
   packages/design-system/src/components/common/

mv apps/clinic-dashboard/src/components/PromPreview.tsx \
   packages/design-system/src/components/common/

mv apps/clinic-dashboard/src/components/PROMSender.tsx \
   packages/design-system/src/components/common/

# Feedback
mv apps/patient-portal/src/components/LoadingScreen.tsx \
   packages/design-system/src/components/feedback/
```

### Phase 5: Resolve Duplicates (15 min)

**PrivateRoute.tsx** - Keep one version in design system
```bash
# Compare both versions
diff apps/clinic-dashboard/src/components/PrivateRoute.tsx \
     apps/patient-portal/src/components/PrivateRoute.tsx

# Move better version to design system
mv apps/clinic-dashboard/src/components/PrivateRoute.tsx \
   packages/design-system/src/components/common/

# Delete duplicate
rm apps/patient-portal/src/components/PrivateRoute.tsx
```

**TenantSelector.tsx** - Keep one version
```bash
# Compare both versions
diff apps/clinic-dashboard/src/components/TenantSelector.tsx \
     apps/patient-portal/src/components/TenantSelector.tsx

# Move to design system
mv apps/clinic-dashboard/src/components/TenantSelector.tsx \
   packages/design-system/src/components/common/

# Delete duplicate
rm apps/patient-portal/src/components/TenantSelector.tsx
```

### Phase 6: Update Imports (1 hour)

**Update all imports in apps:**

**Before:**
```typescript
import { AuraIntakeKanban } from '../components/AuraIntakeKanban';
import { TreatmentPlanDialog } from '../components/TreatmentPlanDialog';
```

**After:**
```typescript
import { AuraIntakeKanban, TreatmentPlanDialog } from '@qivr/design-system';
```

**Files to update:**
- All pages in `apps/clinic-dashboard/src/pages/`
- All pages in `apps/patient-portal/src/pages/`
- Any remaining components that import moved components

---

## 📊 Before vs After

### Before
```
Design System: 87 components
Clinic Dashboard: 27 components (many reusable!)
Patient Portal: 6 components (some duplicates)
Total: 120 components scattered
```

### After
```
Design System: 110+ components (all reusable)
Clinic Dashboard: 5 components (app-specific only)
Patient Portal: 2 components (app-specific only)
Total: 117 components (3 duplicates removed)
```

---

## 🎯 Benefits

### Consistency
✅ All Aura components in one place
✅ Single source of truth
✅ No duplicates

### Reusability
✅ Easy to use across apps
✅ Import from design system
✅ Shared styling

### Maintainability
✅ Update once, applies everywhere
✅ Clear separation (reusable vs app-specific)
✅ Easier to find components

---

## 📋 Execution Checklist

### Phase 1: Aura UI Extraction (from previous plan)
- [ ] Extract Aura theme
- [ ] Create AuraCard, AuraButton, etc.

### Phase 2: Move Aura Components
- [ ] Move 8 Aura components from clinic-dashboard
- [ ] Move TreatmentPlanCard from patient-portal
- [ ] Export from design system

### Phase 3: Move Dialogs
- [ ] Move 5 dialogs from clinic-dashboard
- [ ] Move RebookingDialog from patient-portal
- [ ] Export from design system

### Phase 4: Move Other Components
- [ ] Move PainProgressionChart
- [ ] Move form components (3)
- [ ] Move messaging components (2)
- [ ] Move common components (3)
- [ ] Move LoadingScreen
- [ ] Export all from design system

### Phase 5: Resolve Duplicates
- [ ] Compare PrivateRoute versions
- [ ] Move best version to design system
- [ ] Compare TenantSelector versions
- [ ] Move best version to design system
- [ ] Delete duplicates

### Phase 6: Update Imports
- [ ] Update clinic-dashboard imports
- [ ] Update patient-portal imports
- [ ] Test builds
- [ ] Fix any import errors

### Phase 7: Cleanup
- [ ] Remove empty component folders
- [ ] Update component indexes
- [ ] Update documentation
- [ ] Commit changes

---

## 🚀 Combined Execution Plan

### Day 1: Extraction & Consolidation (4 hours)
1. Extract Aura UI theme (1 hour)
2. Move all components to design system (2 hours)
3. Update imports (1 hour)

### Day 2: Testing & Polish (2 hours)
1. Test all pages (1 hour)
2. Fix any issues (30 min)
3. Documentation (30 min)

---

## 📝 Final Structure

```
packages/design-system/src/components/
├── aura/                      ✅ 9 Aura components
│   ├── AuraCard.tsx
│   ├── AuraButton.tsx
│   ├── AuraActivityTimeline.tsx
│   ├── AuraAppointmentCard.tsx
│   ├── AuraDocumentCard.tsx
│   ├── AuraGlassChartCard.tsx
│   ├── AuraGlassStatCard.tsx
│   ├── AuraIntakeKanban.tsx
│   ├── AuraMessageCard.tsx
│   ├── AuraSettingsCard.tsx
│   └── TreatmentPlanCard.tsx
│
├── dialogs/                   ✅ 6 dialogs
│   ├── IntakeDetailsDialog.tsx
│   ├── ScheduleAppointmentDialog.tsx
│   ├── TreatmentPlanDialog.tsx
│   ├── SendPromDialog.tsx
│   ├── PatientInviteDialog.tsx
│   └── RebookingDialog.tsx
│
├── pain-map/                  ✅ Pain components
│   └── PainProgressionChart.tsx
│
├── forms/                     ✅ Form components
│   ├── DocumentUploader.tsx
│   ├── FileUpload.tsx
│   └── SelectField.tsx
│
├── messaging/                 ✅ Messaging
│   ├── MessageComposer.tsx
│   └── MessageTemplateManager.tsx
│
├── common/                    ✅ Shared utilities
│   ├── PrivateRoute.tsx
│   ├── TenantSelector.tsx
│   ├── OCRResultsViewer.tsx
│   ├── PromPreview.tsx
│   └── PROMSender.tsx
│
└── feedback/                  ✅ Loading states
    └── LoadingScreen.tsx

apps/clinic-dashboard/src/components/
├── DashboardLayout.tsx        ✅ App-specific
├── NotificationBell.tsx       ✅ App-specific
└── TenantInfo.tsx             ✅ App-specific

apps/patient-portal/src/components/
└── MainLayout.tsx             ✅ App-specific
```

---

**Status:** 📋 READY TO EXECUTE  
**Time:** 6 hours total  
**Impact:** MASSIVE - Single source of truth, no duplicates, full consistency
