# Qivr Design System & Styling Modernization Roadmap

## Purpose
Create an enterprise-ready styling architecture that keeps product experiences consistent across the clinic dashboard, patient portal, and widget while supporting rapid iteration, theming, and AWS S3 → CloudFront deployments.

## Objectives
- Replace ad-hoc, app-specific themes with a single source of truth for tokens, typography, and component behavior.
- Upgrade the UI stack (MUI v6 + CSS variables) so brand modes/light-dark variants can be delivered through runtime tokens.
- Introduce a shared `packages/design-system` workspace that exposes tokens, theming helpers, and wrapped components.
- Establish tooling (Storybook, visual tests, linting) to enforce styling consistency as the platform scales.

## Current State Snapshot
- Themes live inside each app entry (`apps/clinic-dashboard/src/App.tsx`, `apps/patient-portal/src/theme.ts`, `apps/widget/src/Widget.tsx`) with duplicated palettes and minimal overrides.
- The clinic dashboard re-export layer (`components/mui`) simply forwards upstream MUI primitives; no custom variants exist.
- Inline `sx` styling dominates layouts such as `DashboardLayout` and `MainLayout`, making global changes hard to coordinate.
- MUI is pinned at `^5.15.x`, and `LocalizationProvider` is disabled in the patient portal because of version conflicts.
- No Storybook/visual regression tooling exists; CSS usage is negligible, so every style is defined via component props.

### Audit Scope
- Workspaces reviewed: `@qivr/clinic-dashboard`, `@qivr/patient-portal`, `@qivr/widget`, and shared UI assets in `apps/shared`.
- Focus areas: theme definitions, dependency versions, styling patterns (`sx`, `styled`, CSS), and shared component layers.

### Theme & Provider Inventory
- **Clinic dashboard**: embeds its `createTheme` directly in `App.tsx` with a single light palette, typography scale, and overrides for Buttons/Cards/Chips. The theme is not exported or parameterized, so other apps cannot reuse it.
- **Patient portal**: hosts a similar palette in `theme.ts` but lacks typographic hierarchy. `LocalizationProvider` remains commented out in `App.tsx` due to picker version conflicts, so date pickers run without locale support.
- **Widget**: defines a minimal theme inline (`Widget.tsx`) with default MUI blue/pink colors and no `CssBaseline` or component overrides.
- **Sandbox**: `sandbox/src/theme/theme.ts` contains an experimental tokenized theme (including dark mode) that is currently unused but can inform the new design system.
- None of the apps uses `CssVarsProvider` or `experimental_extendTheme`, so runtime theming and brand switching are unavailable.

### Dependency Snapshot

| Workspace | `@mui/material` | `@mui/x-*` highlights | Notes |
|-----------|-----------------|-----------------------|-------|
| Clinic dashboard (`apps/clinic-dashboard/package.json`) | `^5.15.14` | `@mui/x-date-pickers@^8.10.2`, `@mui/x-data-grid@^7.2.0`, `@mui/x-charts@^7.2.0`, `@mui/lab@^5.0.0-alpha.169` | Largest dependency footprint; also relies on FullCalendar and Recharts. |
| Patient portal (`apps/patient-portal/package.json`) | `^5.15.0` | `@mui/x-date-pickers@^8.10.2`, `@mui/x-date-pickers-pro@^8.10.2` | Picker localization disabled because of version conflicts; app layers Amplify/Cognito on top. |
| Widget (`apps/widget/package.json`) | `^5.15.0` | _Core only_ | Lightest surface area; ideal pilot for upgrades. |

`@emotion/react`/`@emotion/styled` versions also drift per workspace, and no package references MUI v6 or Joy UI yet.

### Styling Patterns & Hotspots
- Inline `sx` usage dominates: ~484 occurrences in the clinic dashboard, 174 in the patient portal, and 16 in the widget. Hot files include `Appointments.tsx`, `PromBuilder.tsx`, `Evaluations.tsx`, and both layout shells.
- There are zero `styled()` usages, indicating a lack of reusable component abstractions.
- CSS files are practically absent, so styling decisions live entirely in component code.
- `apps/clinic-dashboard/src/components/mui/index.ts` and `components/icons/index.ts` merely re-export upstream components/icons without enforcing variants or props.
- `apps/shared/components/DocumentUpload.tsx` uses Tailwind-like utility classes, introducing an additional styling approach that does not integrate with the MUI themes.

### Additional Observations
- Date localization is disabled in the patient portal and partially implemented in the clinic dashboard, underscoring the need to align on `@mui/x-date-pickers` during the upgrade.
- The widget ships a hard-coded theme, so embedding partners cannot inherit host branding.
- No Storybook, visual regression tooling, or lint rules exist to guard styling conventions; any file can import `@mui/material` directly.
- The unused sandbox theme provides a starting point for tokens/dark mode once a shared package exists.

### Audit Recommendations
1. Centralize palette/typography/shape tokens in `packages/design-system/tokens`.
2. Adopt MUI v6 with `CssVarsProvider` to unlock runtime theming and brand support.
3. Replace re-export layers with wrapped primitives (`QivrButton`, `QivrCard`, etc.) that encode spacing, colors, and interaction states.
4. Target the heaviest `sx` hotspots early to maximize impact when migrating to shared components.
5. Standardize styling approaches (retire ad-hoc Tailwind classes or map them to design-system tokens).
6. Introduce tooling (Storybook/Ladle, Chromatic or Playwright visual tests, ESLint rules blocking raw MUI imports) to enforce conventions.

## Phase Plan

### Phase 1 — Baseline Audit _(Week 1)_
- Inventory all theme definitions, `sx` hot spots, and component overrides per app.
- Confirm design requirements with Figma owners (color roles, typography scale, spacing, elevation, motion).
- Document blockers (e.g., picker localization conflicts) and gather upgrade constraints for AWS deployment.

### Phase 2 — Token & Architecture Definition _(Week 2)_
- Finalize semantic token naming in Figma and export via Tokens Studio/Specify.
- Design the `packages/design-system` structure (tokens build, theme factory, wrapped components, Storybook).
- Choose tooling: Style Dictionary (or custom script) for token builds, Storybook/Ladle for component docs, lint rules to restrict raw `@mui/material` imports.
- ✅ Scaffolded `packages/design-system` with initial token definitions, `createQivrTheme`, `QivrThemeProvider`, and starter primitives (`QivrButton`, `QivrCard`) to unblock integration work.

### Phase 3 — Design-System Package MVP _(Weeks 3–4)_
- Scaffold `packages/design-system` with:
  - `tokens/` (JSON source + build pipeline generating TS + CSS vars),
  - `theme/` (`createQivrTheme`, `QivrThemeProvider` built on `experimental_extendTheme` + `CssVarsProvider`),
  - `components/` (initial primitives such as `QivrButton`, `QivrCard`, `QivrTypography`).
- Integrate Storybook with Chromatic/Playwright visual tests.
- Publish the package as a local workspace dependency.

### Phase 4 — MUI v6 Upgrade & Pilot Integration _(Weeks 4–5)_
- Upgrade dependencies (`@mui/material`, `@mui/system`, `@mui/x-date-pickers`, `@emotion/*`) to the v6 stack in the widget app.
- Replace the widget’s inline `createTheme` usage with `QivrThemeProvider`.
- Validate build artifacts through the existing AWS pipeline (hashing for S3/CloudFront, cache invalidation plan).

### Phase 5 — App Rollout & Refactoring _(Weeks 6–8)_
- Patient Portal:
  - Adopt the shared provider and wrapped components.
  - Re-enable date localization with the upgraded picker versions.
  - Replace inline `sx` patches in layouts/data views with design-system primitives.
  - ✅ App shell now uses `QivrThemeProvider` (brand `patient`) and `QivrButton` is live in the primary layout CTA.
- Clinic Dashboard:
  - Remove raw `components/mui` re-exports in favor of `@qivr/design-system`.
  - Standardize navigation, cards, tables, and forms via shared variants.
  - ✅ Root app now uses `QivrThemeProvider` (brand `clinic`) and the tenant selector button is powered by `QivrButton`.
  - ✅ Dashboard nav buttons share extracted styles and high-traffic cards/stat grids render through `QivrCard`/`QivrButton`.
  - ✅ Appointments + Patients pages use shared cards/buttons for headers, tables, dialogs, and summary panels, significantly reducing inline `sx`.
  - ✅ Analytics widgets (trend, PROM, diagnoses) now use `DashboardSectionCard` wrappers and token-driven colors instead of hard-coded hex values.
  - ✅ Appointments + Patients pages use shared cards/buttons for headers, tables, dialogs, and summary panels, significantly reducing inline `sx`.
- Backfill tests (unit + Playwright visual) and monitor Lighthouse/perf impacts.

### Phase 6 — Governance & Continuous Delivery _(Week 9+)_
- Add lint rules preventing direct `@mui/material` imports outside the design-system package.
- Define semantic versioning + release notes for `@qivr/design-system`.
- Automate Storybook deploys and visual regression checks in CI.
- Document onboarding guidelines so new features default to design-system components.

## Tracking & Ownership
- **Product Design**: Owns Figma tokens, approves semantic naming, and reviews Storybook stories.
- **Frontend Platform**: Builds/maintains `@qivr/design-system`, manages dependency upgrades, and enforces lint/tooling rules.
- **App Teams**: Migrate feature code to wrapped components, add tests, and coordinate releases through AWS S3/CloudFront.
- Create a GitHub Project (or Linear roadmap) mirroring these phases with checklists to retain context across iterations.

## Risks & Mitigations
- **Upgrade complexity**: Stagger rollout (widget → patient portal → clinic dashboard) and maintain feature flags for theme toggles.
- **Token drift**: Keep Figma exports under version control; run token diff checks in CI.
- **AWS caching**: Version design-system releases and invalidate CloudFront distributions as part of the release checklist.

## Next Steps
1. Approve this roadmap and assign owners per phase.
2. Begin Phase 1 audit tasks (token inventory, dependency mapping).
3. Schedule design-engineering workshop to lock foundational tokens before Phase 2 starts.
