# Design System Cleanup Plan

**Date:** 2025-11-26  
**Issue:** Confusing structure with duplicates and unused code  
**Priority:** HIGH

---

## 🔍 Current Mess

```
packages/design-system/
├── Aura UI/                    ❌ REFERENCE ONLY - 4 complete apps!
│   ├── next-ts/               ❌ Full Next.js app
│   ├── next-ts-starter/       ❌ Full Next.js app
│   ├── vite-ts/               ❌ Full Vite app
│   └── vite-ts-starter/       ❌ Full Vite app (68 components)
│
├── src/
│   ├── aura/                  ❌ DUPLICATE - Full app structure!
│   │   ├── components/        ❌ Duplicate components
│   │   ├── pages/             ❌ Full pages (shouldn't be here)
│   │   ├── layouts/           ❌ Full layouts
│   │   ├── routes/            ❌ Routing (shouldn't be here)
│   │   ├── services/          ❌ Services (shouldn't be here)
│   │   ├── providers/         ❌ Providers
│   │   ├── reducers/          ❌ State management
│   │   └── theme/             ❌ Duplicate theme
│   │
│   ├── components/            ✅ OUR ACTUAL COMPONENTS (87)
│   │   ├── aura/              ⚠️ Aura-specific (small)
│   │   ├── calendar/          ✅ Keep
│   │   ├── cards/             ✅ Keep
│   │   ├── pain-map/          ✅ Keep
│   │   └── ...                ✅ Keep all
│   │
│   ├── theme/                 ✅ OUR THEME
│   ├── theme.disabled/        ❌ DELETE
│   ├── providers.disabled/    ❌ DELETE
│   ├── styles/                ✅ Keep
│   ├── tokens/                ✅ Keep
│   └── types/                 ✅ Keep
│
└── tokens/                    ⚠️ DUPLICATE of src/tokens?
```

---

## 🎯 Problems

### 1. **Aura UI Folder** (BIGGEST ISSUE)
- Contains 4 COMPLETE applications
- Each has full src/, public/, node_modules/
- Taking up massive space
- Only needed as reference, not in our package

**Size:** ~500MB+

---

### 2. **src/aura/** (DUPLICATE)
- Full application structure copied in
- Has pages, routes, services, reducers
- Design system shouldn't have app logic
- Duplicates our actual components

**Size:** ~50MB

---

### 3. **Disabled Folders**
- `theme.disabled/`
- `providers.disabled/`
- Old code that's not used

---

### 4. **Duplicate tokens/**
- `src/tokens/` ✅
- `tokens/` ❌ (root level)

---

## 🧹 Cleanup Plan

### Phase 1: Remove Aura UI Reference Apps (IMMEDIATE)

**Action:** Move to separate reference folder outside package

```bash
# Move Aura UI out of design system
mv packages/design-system/Aura\ UI ~/Documents/aura-ui-reference/

# Or delete if we don't need reference
rm -rf packages/design-system/Aura\ UI/
```

**Impact:** Saves ~500MB, removes confusion

---

### Phase 2: Remove src/aura/ Duplicate

**What to Keep:**
```
src/aura/theme/        → Extract useful theme configs
src/aura/components/   → Check if any unique components
```

**What to Delete:**
```
src/aura/pages/        ❌ DELETE (app pages)
src/aura/routes/       ❌ DELETE (routing)
src/aura/services/     ❌ DELETE (app services)
src/aura/providers/    ❌ DELETE (app providers)
src/aura/reducers/     ❌ DELETE (state management)
src/aura/layouts/      ❌ DELETE (app layouts)
src/aura/locales/      ❌ DELETE (i18n)
src/aura/data/         ❌ DELETE (mock data)
src/aura/docs/         ❌ DELETE (docs)
src/aura/helpers/      ❌ DELETE (app helpers)
src/aura/hooks/        ❌ DELETE (app hooks)
src/aura/lib/          ❌ DELETE (app lib)
src/aura/types/        ❌ DELETE (app types)
```

**Action:**
```bash
# Extract theme if useful
cp -r src/aura/theme src/theme/aura-reference

# Delete the rest
rm -rf src/aura/
```

---

### Phase 3: Clean Disabled Folders

```bash
rm -rf src/theme.disabled/
rm -rf src/providers.disabled/
```

---

### Phase 4: Consolidate Tokens

```bash
# Keep src/tokens/, remove root tokens/
rm -rf tokens/
```

---

## ✅ Final Clean Structure

```
packages/design-system/
├── src/
│   ├── components/           ✅ All our components (87)
│   │   ├── calendar/
│   │   ├── cards/
│   │   ├── pain-map/
│   │   ├── feedback/
│   │   ├── forms/
│   │   └── ...
│   │
│   ├── theme/                ✅ Theme configuration
│   │   ├── auraColors.ts
│   │   ├── theme.ts
│   │   └── ...
│   │
│   ├── tokens/               ✅ Design tokens
│   ├── styles/               ✅ Global styles
│   ├── types/                ✅ TypeScript types
│   ├── utils/                ✅ Utilities
│   └── index.ts              ✅ Main export
│
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 📋 Step-by-Step Cleanup

### Step 1: Backup (5 min)
```bash
cd /Users/oliver/Projects/qivr/packages/design-system
tar -czf ~/design-system-backup-$(date +%Y%m%d).tar.gz .
```

### Step 2: Move Aura UI Reference (2 min)
```bash
mkdir -p ~/Documents/aura-ui-reference
mv "Aura UI" ~/Documents/aura-ui-reference/
```

### Step 3: Extract Useful Aura Theme (10 min)
```bash
# Check what's useful in src/aura/theme
ls -la src/aura/theme/

# Copy useful files to our theme
cp src/aura/theme/auraColors.ts src/theme/ 2>/dev/null || true
```

### Step 4: Delete Aura App Structure (1 min)
```bash
rm -rf src/aura/
```

### Step 5: Clean Disabled Folders (1 min)
```bash
rm -rf src/theme.disabled/
rm -rf src/providers.disabled/
```

### Step 6: Remove Duplicate Tokens (1 min)
```bash
rm -rf tokens/
```

### Step 7: Verify Exports (5 min)
```bash
# Check src/index.ts still exports everything
cat src/index.ts

# Test build
npm run build
```

### Step 8: Update Apps (10 min)
```bash
# Rebuild apps to ensure imports still work
cd ../../apps/clinic-dashboard && npm run build
cd ../patient-portal && npm run build
```

---

## 🎯 Expected Results

### Before Cleanup
```
Size: ~600MB
Folders: 50+
Confusion: HIGH
Duplicates: Many
```

### After Cleanup
```
Size: ~50MB (90% reduction!)
Folders: 10
Confusion: NONE
Duplicates: ZERO
```

---

## ⚠️ Risks

### Low Risk
- Aura UI folder is just reference
- src/aura/ is duplicate
- Disabled folders are unused

### Mitigation
- ✅ Create backup first
- ✅ Test builds after cleanup
- ✅ Can restore from backup if needed

---

## 🚀 Benefits

1. **Clarity** - Clear structure, no confusion
2. **Size** - 90% smaller package
3. **Speed** - Faster installs, faster builds
4. **Maintainability** - Easy to understand
5. **Consistency** - One source of truth

---

## 📝 Checklist

- [ ] Create backup
- [ ] Move Aura UI to reference folder
- [ ] Extract useful theme configs
- [ ] Delete src/aura/
- [ ] Delete disabled folders
- [ ] Remove duplicate tokens/
- [ ] Verify exports in index.ts
- [ ] Test build
- [ ] Test clinic-dashboard build
- [ ] Test patient-portal build
- [ ] Commit changes
- [ ] Update documentation

---

## 🎉 After Cleanup

**Clean Structure:**
```
design-system/
├── src/
│   ├── components/  ← All our components
│   ├── theme/       ← Theme config
│   ├── tokens/      ← Design tokens
│   └── index.ts     ← Exports
└── package.json
```

**Clear Purpose:**
- Design system = reusable components + theme
- No app logic
- No duplicate code
- Easy to understand

---

**Status:** 📋 READY TO EXECUTE  
**Time:** ~30 minutes  
**Impact:** MASSIVE improvement in clarity
