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
  // e.g., sx={{ width: auraTokens.responsive.sidebar }}
  responsive: {
    // Sidebar widths - hidden on mobile, visible on md+
    sidebar: { xs: 0, md: 260 },
    sidebarFull: { xs: '100%', md: 260 },

    // Patient/detail sidebars (wider)
    detailSidebar: { xs: '100%', md: 320 },

    // Message/conversation panels
    messagePanel: { xs: '100%', md: 320 },
    conversationList: { xs: '100%', md: 360 },

    // Dialog max-widths that respect screen size
    dialog: { xs: '95vw', sm: 520, md: 720 },
    dialogSmall: { xs: '95vw', sm: 400 },
    dialogLarge: { xs: '95vw', sm: '90vw', md: 900 },
    dialogFullscreen: { xs: '100vw', md: '90vw' },

    // Drawer widths
    drawer: { xs: '85vw', sm: 280, md: 260 },

    // Card widths for grids
    card: { xs: '100%', sm: 320, md: 360 },
    cardWide: { xs: '100%', sm: '100%', md: 480 },

    // Panel widths (notifications, menus)
    panel: { xs: '90vw', sm: 320, md: 360 },

    // Form container widths
    formContainer: { xs: '100%', sm: '100%', md: 600 },
    formContainerWide: { xs: '100%', sm: '100%', md: 800 },

    // Content area max widths
    contentNarrow: { xs: '100%', sm: 540, md: 720 },
    contentMedium: { xs: '100%', sm: '100%', md: 960 },
    contentWide: { xs: '100%', sm: '100%', md: 1200 },

    // Search bar width
    searchBar: { xs: '100%', sm: 300, md: 400 },
  },

  // Responsive heights - for panels, dialogs, content areas
  responsiveHeights: {
    // Message/chat areas
    messageArea: { xs: 400, sm: 500, md: 600 },
    messageAreaFull: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 180px)', md: 'calc(100vh - 160px)' },

    // Sidebar/panel heights
    sidebarPanel: { xs: 300, sm: 400, md: 'auto' },

    // Dialog content heights
    dialogContent: { xs: '70vh', sm: '65vh', md: '60vh' },
    dialogContentTall: { xs: '85vh', sm: '80vh', md: '75vh' },

    // Card min heights
    cardMin: { xs: 120, sm: 140, md: 160 },
    statCard: { xs: 100, sm: 120, md: 140 },

    // List/table areas
    listArea: { xs: 300, sm: 400, md: 500 },
    tableArea: { xs: 350, sm: 450, md: 600 },
  },

  // Responsive padding - for containers and sections
  responsivePadding: {
    // Page-level padding
    page: { xs: 2, sm: 3, md: 4 },
    pageX: { xs: 2, sm: 3, md: 4 },
    pageY: { xs: 2, sm: 3, md: 3 },

    // Section padding
    section: { xs: 2, sm: 3, md: 4 },
    sectionCompact: { xs: 1.5, sm: 2, md: 2.5 },

    // Card padding
    card: { xs: 2, sm: 2.5, md: 3 },
    cardCompact: { xs: 1.5, sm: 2, md: 2 },

    // Dialog padding
    dialogContent: { xs: 2, sm: 3, md: 3 },
  },

  // Responsive gaps - for flex/grid layouts
  responsiveGap: {
    // Grid gaps
    grid: { xs: 2, sm: 2.5, md: 3 },
    gridCompact: { xs: 1.5, sm: 2, md: 2 },
    gridWide: { xs: 2, sm: 3, md: 4 },

    // Stack/flex gaps
    stack: { xs: 1.5, sm: 2, md: 2 },
    stackCompact: { xs: 1, sm: 1.5, md: 1.5 },
    stackWide: { xs: 2, sm: 2.5, md: 3 },
  },

  // Display helpers - for showing/hiding elements at breakpoints
  display: {
    // Hide on mobile, show on tablet+
    hideOnMobile: { xs: 'none', sm: 'block' },
    hideOnMobileFlex: { xs: 'none', sm: 'flex' },

    // Hide on mobile/tablet, show on desktop
    hideUntilDesktop: { xs: 'none', md: 'block' },
    hideUntilDesktopFlex: { xs: 'none', md: 'flex' },

    // Show on mobile only
    mobileOnly: { xs: 'block', sm: 'none' },
    mobileOnlyFlex: { xs: 'flex', sm: 'none' },

    // Show on mobile/tablet, hide on desktop
    untilDesktop: { xs: 'block', md: 'none' },
    untilDesktopFlex: { xs: 'flex', md: 'none' },
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

  // Avatar sizes - standardized scale
  avatar: {
    xs: 24,   // tiny inline avatars
    sm: 32,   // list items, compact cards
    md: 40,   // default avatar size
    lg: 56,   // profile cards, headers
    xl: 72,   // profile pages
    xxl: 120, // profile edit pages
  },

  // Form control minimum widths
  formControl: {
    xs: 80,    // very compact (chip-like)
    sm: 100,   // small selects
    md: 120,   // default selects
    lg: 150,   // medium inputs
    xl: 200,   // larger inputs
  },

  // Chart/visualization heights
  chart: {
    xs: 150,   // sparklines, mini charts
    sm: 200,   // compact charts
    md: 280,   // default charts
    lg: 400,   // detailed charts
    xl: 500,   // full-page charts
  },

  // Responsive chart heights
  responsiveChart: {
    sparkline: { xs: 100, sm: 120, md: 150 },
    compact: { xs: 150, sm: 180, md: 200 },
    standard: { xs: 200, sm: 250, md: 280 },
    detailed: { xs: 280, sm: 350, md: 400 },
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

/**
 * Layout Patterns - Pre-built sx objects for common responsive layouts
 * Use these to ensure consistent responsive behavior across the app
 *
 * Usage:
 *   import { layoutPatterns } from '@qivr/design-system';
 *   <Box sx={layoutPatterns.splitView.container}>
 *     <Box sx={layoutPatterns.splitView.sidebar}>Sidebar</Box>
 *     <Box sx={layoutPatterns.splitView.content}>Content</Box>
 *   </Box>
 */
export const layoutPatterns = {
  // Split view - sidebar + content (like Messages, Medical Records)
  splitView: {
    container: {
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: auraTokens.responsiveGap.grid,
      height: '100%',
      minHeight: 0,
    },
    sidebar: {
      width: auraTokens.responsive.detailSidebar,
      flexShrink: 0,
      display: { xs: 'none', md: 'block' },
      overflow: 'auto',
    },
    sidebarAlwaysVisible: {
      width: auraTokens.responsive.detailSidebar,
      flexShrink: 0,
      overflow: 'auto',
    },
    content: {
      flex: 1,
      minWidth: 0,
      overflow: 'auto',
    },
  },

  // Message/conversation layout
  messageView: {
    container: {
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      gap: auraTokens.responsiveGap.grid,
      height: auraTokens.responsiveHeights.messageAreaFull,
    },
    list: {
      width: auraTokens.responsive.conversationList,
      flexShrink: 0,
      display: { xs: 'none', md: 'block' },
      overflow: 'auto',
      borderRight: { md: '1px solid' },
      borderColor: { md: 'divider' },
    },
    listMobile: {
      width: '100%',
      display: { xs: 'block', md: 'none' },
      overflow: 'auto',
    },
    thread: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
  },

  // Page container with responsive padding
  pageContainer: {
    p: auraTokens.responsivePadding.page,
    maxWidth: auraTokens.responsive.contentWide,
    mx: 'auto',
    width: '100%',
  },

  // Page container narrow (for forms, settings)
  pageContainerNarrow: {
    p: auraTokens.responsivePadding.page,
    maxWidth: auraTokens.responsive.formContainerWide,
    mx: 'auto',
    width: '100%',
  },

  // Dialog responsive sizing
  dialogResponsive: {
    paper: {
      width: auraTokens.responsive.dialog,
      maxHeight: auraTokens.responsiveHeights.dialogContentTall,
      m: { xs: 1, sm: 2 },
    },
    content: {
      p: auraTokens.responsivePadding.dialogContent,
      overflow: 'auto',
    },
  },

  // Grid layouts
  cardGrid: {
    display: 'grid',
    gap: auraTokens.responsiveGap.grid,
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
      lg: 'repeat(4, 1fr)',
    },
  },
  cardGridCompact: {
    display: 'grid',
    gap: auraTokens.responsiveGap.gridCompact,
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
    },
  },
  statCardGrid: {
    display: 'grid',
    gap: auraTokens.responsiveGap.grid,
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(4, 1fr)',
    },
  },

  // Form layouts
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: auraTokens.responsiveGap.stack,
    maxWidth: auraTokens.responsive.formContainer,
  },
  formRow: {
    display: 'flex',
    flexDirection: { xs: 'column', sm: 'row' },
    gap: auraTokens.responsiveGap.stack,
    '& > *': {
      flex: { xs: '1 1 100%', sm: 1 },
    },
  },

  // Mobile/desktop toggle patterns
  showOnMobile: {
    display: auraTokens.display.mobileOnly,
  },
  hideOnMobile: {
    display: auraTokens.display.hideOnMobile,
  },
  showOnDesktop: {
    display: auraTokens.display.hideUntilDesktop,
  },
  hideOnDesktop: {
    display: auraTokens.display.untilDesktop,
  },
} as const;

export type AuraTokens = typeof auraTokens;
export type LayoutPatterns = typeof layoutPatterns;
