/**
 * Shadow System
 * Aurora UI 7-level shadow system with separate dark mode shadows
 *
 * Shadows provide depth perception and visual hierarchy.
 * Use higher levels sparingly for important elevated elements.
 */

/**
 * Light Mode Shadows (7 levels)
 * Multi-layer sophisticated shadows for depth and realism
 */
export const lightShadows = [
  // Level 1: Subtle elevation - cards, buttons
  '2px 2px 10px 0px rgba(0, 0, 0, 0.09), 0px 1px 1px 0px rgba(0, 0, 0, 0.03)',

  // Level 2: Low elevation - dropdowns, tooltips
  '2px 9px 11px 0px rgba(0, 0, 0, 0.04), 1px 3.92px 5.79px 0px rgba(0, 0, 0, 0.04), 0px 1.36px 2.867px 0px rgba(0, 0, 0, 0.03), 0px 0.286px 1.134px 0px rgba(0, 0, 0, 0.02)',

  // Level 3: Medium elevation - popovers, menus
  '4px 0px 18px 0px rgba(0, 0, 0, 0.04), 0px 6.147px 9.475px 0px rgba(0, 0, 0, 0.03), 0px 2.258px 4.692px 0px rgba(0, 0, 0, 0.02), 0px -2.46px 3.86px 0px rgba(0, 0, 0, 0.02)',

  // Level 4: High elevation - dialogs, drawers
  '3px 24px 42px 0px rgba(0, 0, 0, 0.07), 1px 10.271px 9.478px 0px rgba(0, 0, 0, 0.03), 0px 5.695px 3.531px 0px rgba(0, 0, 0, 0.01), 0px -1px 3.15px 0px rgba(0, 0, 0, 0.02)',

  // Level 5: Higher elevation - modal overlays
  '4px 38px 47px 0px rgba(0, 0, 0, 0.07), 0px 20px 17.48px 0px rgba(0, 0, 0, 0.03), 1px 10px 10px 0px rgba(0, 0, 0, 0.01), 0px -2px 6px 0px rgba(0, 0, 0, 0.03)',

  // Level 6: Very high elevation - full-screen dialogs
  '6px 33px 46px 0px rgba(0, 0, 0, 0.07), 1px 20px 19px 0px rgba(0, 0, 0, 0.03), 2px 10px 10px 0px rgba(0, 0, 0, 0.01), 0px -2px 6px 0px rgba(0, 0, 0, 0.03)',

  // Level 7: Maximum elevation - critical modals, notifications
  '16px 39px 67px 0px rgba(0, 0, 0, 0.11), 1px 20px 65px 0px rgba(0, 0, 0, 0.02), 2px 10px 10px 0px rgba(0, 0, 0, 0.01), 0px -2px 6px 0px rgba(0, 0, 0, 0.03)',
];

/**
 * Dark Mode Shadows
 * Single high-contrast shadow for dark backgrounds
 * Provides depth without competing with dark UI
 */
export const darkShadows = [
  '0px 12px 51px 0px rgba(0, 0, 0, 0.60), 0px 3px 24px 0px rgba(0, 0, 0, 0.56), 0px 1px 16px 0px rgba(0, 0, 0, 0.10)',
];

/**
 * Shadow elevation mapping (for reference)
 *
 * Level 0: None (default for most elements)
 * Level 1: Cards, buttons, chips
 * Level 2: Dropdowns, tooltips, autocomplete
 * Level 3: Popovers, menus, date pickers
 * Level 4: Dialogs, side drawers
 * Level 5: Modal overlays
 * Level 6: Full-screen dialogs
 * Level 7: Critical alerts, toasts
 */
