/**
 * Aura Design Tokens
 * Centralized design tokens for consistent styling across the platform
 */

import { auraColors, auraGradients, chartColors, healthcareColors } from './auraColors';

export const auraTokens = {
  // Border Radius - Only 3 values + round
  borderRadius: {
    sm: 1,    // 8px - subtle rounding
    md: 2,    // 16px - standard cards
    lg: 3,    // 24px - prominent elements
    round: '50%',
  },

  // Spacing - Only 5 values
  spacing: {
    xs: 0.5,  // 4px
    sm: 1,    // 8px
    md: 2,    // 16px
    lg: 3,    // 24px
    xl: 4,    // 32px
    xxl: 6,   // 48px
  },

  // Shadows - 4 standard levels
  shadows: {
    none: 'none',
    sm: '0 2px 4px rgba(0,0,0,0.08)',
    md: '0 4px 12px rgba(0,0,0,0.12)',
    lg: '0 8px 24px rgba(0,0,0,0.16)',
    xl: '0 12px 32px rgba(0,0,0,0.20)',
  },

  // Gradients - Single source of truth (using auraGradients)
  gradients: {
    primary: auraGradients.primary.css,
    blue: auraGradients.primary.css,
    purple: auraGradients.purple.css,
    success: auraGradients.success.css,
    warning: auraGradients.warning.css,
    error: auraGradients.error.css,
    info: auraGradients.info.css,
    ocean: auraGradients.ocean.css,
    sunset: auraGradients.sunset.css,
    aurora: auraGradients.aurora.css,
    forest: auraGradients.forest.css,
    royal: auraGradients.royal.css,
    subtle: auraGradients.subtlePrimary.css,
    glass: auraGradients.glass.css,
  },

  // Colors - Reference to auraColors
  colors: auraColors,

  // Transitions
  transitions: {
    fast: 'all 0.15s ease-in-out',
    default: 'all 0.2s ease-in-out',
    slow: 'all 0.3s ease-in-out',
  },

  // Typography weights
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Icon sizes - standardized scale
  iconSize: {
    xxs: 12,  // tiny indicators
    xs: 16,   // small inline icons, input small
    sm: 18,   // compact icons
    md: 20,   // default icon size, input medium
    lg: 24,   // prominent icons, input large
    xl: 32,   // card icons
    xxl: 48,  // hero icons, empty states
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },

  // Layout dimensions - standardized widths for consistent layouts
  layout: {
    drawerWidth: 260,
    drawerWidthCollapsed: 64,
    kanbanColumn: 300,
    dialogSmall: 360,
    dialogMedium: 520,
    dialogLarge: 720,
    menuPopover: 320,
    notificationPanel: 360,
  },

  // Responsive layout helpers - use with sx prop
  // e.g., sx={{ maxWidth: auraTokens.responsive.dialog }}
  responsive: {
    // Dialog max-widths that respect screen size
    dialog: { xs: '95vw', sm: 520, md: 720 },
    // Drawer widths
    drawer: { xs: '85vw', sm: 260 },
    // Card widths for grids
    card: { xs: '100%', sm: 320, md: 360 },
    // Panel widths (notifications, menus)
    panel: { xs: '90vw', sm: 320 },
  },

  // Component heights - standardized sizes
  heights: {
    chip: {
      sm: 24,
      md: 28,
      lg: 32,
    },
    button: {
      sm: 32,
      md: 40,
      lg: 48,
    },
    input: {
      sm: 36,
      md: 44,
      lg: 52,
    },
  },

  // Input field tokens - consistent sizing across all input types
  input: {
    // Padding (vertical, horizontal)
    padding: {
      sm: { y: 8, x: 12 },
      md: { y: 10, x: 14 },
      lg: { y: 12, x: 16 },
    },
    // Font sizes
    fontSize: {
      sm: '0.8125rem',   // 13px
      md: '0.875rem',    // 14px
      lg: '0.9375rem',   // 15px
    },
    // Border radius
    borderRadius: {
      sm: 6,
      md: 8,
      lg: 10,
    },
    // Icon sizes in inputs
    iconSize: {
      sm: 16,
      md: 18,
      lg: 20,
    },
  },

  // Chart colors for data visualization
  chartColors,

  // Healthcare-specific semantic colors
  healthcare: healthcareColors,
} as const;

/**
 * Unified Glass Effect System
 * Single source of truth for all glassmorphism styles
 *
 * Blur levels:
 * - subtle: 4px - for overlays, backdrops
 * - standard: 8px - for cards, panels (default)
 * - strong: 12px - for prominent elements, dialogs
 *
 * Opacity levels:
 * - light: 70% white - subtle glass
 * - medium: 50% white - balanced glass
 * - dark: 30% white - dark glass / dark mode
 */
export const glassTokens = {
  // Blur amounts
  blur: {
    subtle: '4px',
    standard: '8px',
    strong: '12px',
  },
  // Background colors with alpha
  background: {
    light: 'rgba(255, 255, 255, 0.7)',      // 70% - subtle
    medium: 'rgba(255, 255, 255, 0.5)',     // 50% - balanced
    dark: 'rgba(255, 255, 255, 0.3)',       // 30% - dark mode friendly
    // Dark mode variants
    darkMode: {
      light: 'rgba(30, 30, 30, 0.7)',
      medium: 'rgba(30, 30, 30, 0.5)',
      dark: 'rgba(30, 30, 30, 0.3)',
    },
  },
  // Border colors
  border: {
    light: 'rgba(255, 255, 255, 0.2)',
    medium: 'rgba(255, 255, 255, 0.15)',
    subtle: 'rgba(255, 255, 255, 0.1)',
    // Dark mode
    darkMode: 'rgba(255, 255, 255, 0.08)',
  },
  // Shadows for glass cards
  shadow: {
    subtle: '0 4px 16px rgba(0, 0, 0, 0.08)',
    standard: '0 8px 32px rgba(0, 0, 0, 0.12)',
    elevated: '0 12px 40px rgba(0, 0, 0, 0.16)',
  },
} as const;

// Pre-built glass effect presets for easy use
export const glassEffect = {
  // Standard glass - most common use case
  standard: {
    background: glassTokens.background.light,
    backdropFilter: `blur(${glassTokens.blur.standard})`,
    WebkitBackdropFilter: `blur(${glassTokens.blur.standard})`,
    border: `1px solid ${glassTokens.border.light}`,
  },
  // Subtle glass - for overlays, backdrops
  subtle: {
    background: glassTokens.background.medium,
    backdropFilter: `blur(${glassTokens.blur.subtle})`,
    WebkitBackdropFilter: `blur(${glassTokens.blur.subtle})`,
    border: `1px solid ${glassTokens.border.subtle}`,
  },
  // Strong glass - for prominent cards, dialogs
  strong: {
    background: glassTokens.background.light,
    backdropFilter: `blur(${glassTokens.blur.strong})`,
    WebkitBackdropFilter: `blur(${glassTokens.blur.strong})`,
    border: `1px solid ${glassTokens.border.light}`,
  },
  // Dark mode variant
  dark: {
    background: glassTokens.background.darkMode.light,
    backdropFilter: `blur(${glassTokens.blur.standard})`,
    WebkitBackdropFilter: `blur(${glassTokens.blur.standard})`,
    border: `1px solid ${glassTokens.border.darkMode}`,
  },
} as const;

// Card styles using tokens
export const cardStyles = {
  default: {
    p: auraTokens.spacing.lg,
    borderRadius: auraTokens.borderRadius.lg,
    border: '1px solid',
    borderColor: 'divider',
    transition: auraTokens.transitions.default,
  },
  hover: {
    borderColor: 'primary.main',
    boxShadow: auraTokens.shadows.md,
  },
  gradient: {
    p: auraTokens.spacing.lg,
    borderRadius: auraTokens.borderRadius.lg,
    background: auraTokens.gradients.primary,
    color: 'white',
  },
};

export type AuraTokens = typeof auraTokens;
