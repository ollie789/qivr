/**
 * Aura UI Color Palette - Healthcare-optimized colors
 *
 * Design principles:
 * - Calming, professional tones suitable for healthcare
 * - High contrast for accessibility (WCAG AA compliant)
 * - Distinct semantic colors for clear communication
 * - Harmonious color relationships
 */

export const auraColors = {
  // Primary Blue - Trust, professionalism, calm
  // Slightly deeper and more saturated for better contrast
  blue: {
    50: '#EBF5FF',
    100: '#D6EBFF',
    200: '#ADD6FF',
    300: '#85C1FF',
    400: '#5CACFF',
    500: '#3391FF',  // Brighter, more vibrant primary
    600: '#2979E6',
    700: '#1F61CC',
    800: '#1549B3',
    900: '#0B3199',
    lighter: '#EBF5FF',
    light: '#85C1FF',
    main: '#3391FF',
    dark: '#1F61CC',
    darker: '#0B3199',
  },

  // Secondary Purple - Innovation, premium feel
  // Softer, more sophisticated purple
  purple: {
    50: '#F5F0FF',
    100: '#EDE5FF',
    200: '#D9C7FF',
    300: '#C5A8FF',
    400: '#B18AFF',
    500: '#9D6BFF',  // Softer, more refined
    600: '#8552E6',
    700: '#6D39CC',
    800: '#5520B3',
    900: '#3D0799',
    lighter: '#F5F0FF',
    light: '#C5A8FF',
    main: '#9D6BFF',
    dark: '#6D39CC',
    darker: '#3D0799',
  },

  // Success Green - Health, positive outcomes
  // Teal-tinged green for healthcare context
  green: {
    50: '#E8FAF5',
    100: '#D1F5EB',
    200: '#A3EBD7',
    300: '#75E0C3',
    400: '#47D6AF',
    500: '#19CC9B',  // Teal-green, calming success
    600: '#14B389',
    700: '#0F9977',
    800: '#0A8065',
    900: '#056653',
    lighter: '#E8FAF5',
    light: '#75E0C3',
    main: '#19CC9B',
    dark: '#0F9977',
    darker: '#056653',
  },

  // Warning Amber - Attention without alarm
  // Warmer, less aggressive amber
  amber: {
    50: '#FFF8E6',
    100: '#FFF0CC',
    200: '#FFE199',
    300: '#FFD266',
    400: '#FFC333',
    500: '#FFB400',  // Warm amber, professional
    600: '#E6A200',
    700: '#CC9000',
    800: '#B37E00',
    900: '#996C00',
    lighter: '#FFF8E6',
    light: '#FFD266',
    main: '#FFB400',
    dark: '#CC9000',
    darker: '#996C00',
  },

  // Legacy orange (alias for backward compatibility)
  orange: {
    50: '#FFF4E6',
    100: '#FFE8CC',
    200: '#FFD199',
    300: '#FFBA66',
    400: '#FFA333',
    500: '#FF8C00',  // Vivid orange for emphasis
    600: '#E67E00',
    700: '#CC7000',
    800: '#B36200',
    900: '#995400',
    lighter: '#FFF4E6',
    light: '#FFBA66',
    main: '#FF8C00',
    dark: '#CC7000',
    darker: '#995400',
  },

  // Error Red - Clear but not alarming
  // Rose-tinted red, less aggressive
  red: {
    50: '#FFF0F3',
    100: '#FFE0E6',
    200: '#FFC1CD',
    300: '#FFA3B4',
    400: '#FF849B',
    500: '#FF6582',  // Rose red, clear but softer
    600: '#E65470',
    700: '#CC435E',
    800: '#B3324C',
    900: '#99213A',
    lighter: '#FFF0F3',
    light: '#FFA3B4',
    main: '#FF6582',
    dark: '#CC435E',
    darker: '#99213A',
  },

  // Info Cyan - Information, guidance
  // Clear, professional cyan
  cyan: {
    50: '#E6FAFB',
    100: '#CCF5F7',
    200: '#99EBEF',
    300: '#66E0E7',
    400: '#33D6DF',
    500: '#00CCD7',  // Clear cyan for information
    600: '#00B8C2',
    700: '#00A3AC',
    800: '#008F97',
    900: '#007A82',
    lighter: '#E6FAFB',
    light: '#66E0E7',
    main: '#00CCD7',
    dark: '#00A3AC',
    darker: '#007A82',
  },

  // Neutral Greys - Refined with subtle blue undertone
  // Cooler greys for modern, clinical feel
  grey: {
    50: '#F8FAFC',   // Barely tinted
    100: '#F1F5F9',  // Cool white
    200: '#E2E8F0',  // Light grey
    300: '#CBD5E1',  // Medium-light
    400: '#94A3B8',  // Mid grey
    500: '#64748B',  // Balanced grey
    600: '#475569',  // Dark grey
    700: '#334155',  // Darker
    800: '#1E293B',  // Very dark
    900: '#0F172A',  // Near black
    950: '#020617',  // Deepest
  },
};

// Additional semantic color mappings for healthcare context
export const healthcareColors = {
  // Patient status indicators
  stable: auraColors.green.main,
  improving: auraColors.cyan.main,
  attention: auraColors.amber.main,
  critical: auraColors.red.main,

  // Appointment status
  scheduled: auraColors.blue.main,
  confirmed: auraColors.green.main,
  pending: auraColors.amber.main,
  cancelled: auraColors.red.main,
  completed: auraColors.grey[500],

  // Pain scale colors (0-10)
  painScale: {
    none: '#19CC9B',      // 0 - Green
    mild: '#47D6AF',      // 1-3 - Light green
    moderate: '#FFB400',  // 4-6 - Amber
    severe: '#FF8C00',    // 7-8 - Orange
    extreme: '#FF6582',   // 9-10 - Red
  },
};

// Gradient Presets - Updated with new colors
export const auraGradients = {
  // Primary gradient - professional blue
  primary: {
    from: auraColors.blue[400],
    to: auraColors.blue[700],
    css: `linear-gradient(135deg, ${auraColors.blue[400]} 0%, ${auraColors.blue[700]} 100%)`,
  },
  // Success - calming teal-green
  success: {
    from: auraColors.green[400],
    to: auraColors.green[700],
    css: `linear-gradient(135deg, ${auraColors.green[400]} 0%, ${auraColors.green[700]} 100%)`,
  },
  // Warning - warm amber
  warning: {
    from: auraColors.amber[400],
    to: auraColors.amber[700],
    css: `linear-gradient(135deg, ${auraColors.amber[400]} 0%, ${auraColors.amber[700]} 100%)`,
  },
  // Error - rose red
  error: {
    from: auraColors.red[400],
    to: auraColors.red[700],
    css: `linear-gradient(135deg, ${auraColors.red[400]} 0%, ${auraColors.red[700]} 100%)`,
  },
  // Purple/secondary
  purple: {
    from: auraColors.purple[400],
    to: auraColors.purple[700],
    css: `linear-gradient(135deg, ${auraColors.purple[400]} 0%, ${auraColors.purple[700]} 100%)`,
  },
  // Info cyan
  info: {
    from: auraColors.cyan[400],
    to: auraColors.cyan[700],
    css: `linear-gradient(135deg, ${auraColors.cyan[400]} 0%, ${auraColors.cyan[700]} 100%)`,
  },

  // Multi-color gradients for special uses
  ocean: {
    from: auraColors.blue[400],
    via: auraColors.cyan[500],
    to: auraColors.green[500],
    css: `linear-gradient(135deg, ${auraColors.blue[400]} 0%, ${auraColors.cyan[500]} 50%, ${auraColors.green[500]} 100%)`,
  },
  sunset: {
    from: auraColors.amber[400],
    via: auraColors.orange[500],
    to: auraColors.red[500],
    css: `linear-gradient(135deg, ${auraColors.amber[400]} 0%, ${auraColors.orange[500]} 50%, ${auraColors.red[500]} 100%)`,
  },
  aurora: {
    from: auraColors.purple[400],
    via: auraColors.blue[500],
    to: auraColors.cyan[500],
    css: `linear-gradient(135deg, ${auraColors.purple[400]} 0%, ${auraColors.blue[500]} 50%, ${auraColors.cyan[500]} 100%)`,
  },
  forest: {
    from: auraColors.green[400],
    to: auraColors.cyan[600],
    css: `linear-gradient(135deg, ${auraColors.green[400]} 0%, ${auraColors.cyan[600]} 100%)`,
  },
  royal: {
    from: auraColors.purple[400],
    to: auraColors.blue[600],
    css: `linear-gradient(135deg, ${auraColors.purple[400]} 0%, ${auraColors.blue[600]} 100%)`,
  },

  // Subtle gradients for backgrounds
  subtlePrimary: {
    css: `linear-gradient(135deg, rgba(51, 145, 255, 0.05) 0%, rgba(31, 97, 204, 0.05) 100%)`,
  },
  subtleSuccess: {
    css: `linear-gradient(135deg, rgba(25, 204, 155, 0.05) 0%, rgba(15, 153, 119, 0.05) 100%)`,
  },
  subtleWarning: {
    css: `linear-gradient(135deg, rgba(255, 180, 0, 0.05) 0%, rgba(204, 144, 0, 0.05) 100%)`,
  },
  glass: {
    css: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },
};

// Chart/Data Visualization Colors
// Carefully selected for:
// - Distinct hues that work together
// - Good contrast in both light/dark modes
// - Colorblind-friendly combinations
export const chartColors = {
  // Primary sequence (most common charts)
  primary: [
    auraColors.blue[500],    // Primary blue
    auraColors.green[500],   // Teal green
    auraColors.purple[500],  // Purple
    auraColors.amber[500],   // Amber
    auraColors.cyan[500],    // Cyan
    auraColors.red[500],     // Rose red
    auraColors.orange[500],  // Orange
  ],

  // Categorical (for distinct categories)
  categorical: [
    '#3391FF',  // Blue
    '#19CC9B',  // Teal
    '#9D6BFF',  // Purple
    '#FFB400',  // Amber
    '#00CCD7',  // Cyan
    '#FF6582',  // Rose
    '#FF8C00',  // Orange
    '#64748B',  // Grey
  ],

  // Sequential blue (for ranges/intensity)
  sequentialBlue: [
    auraColors.blue[100],
    auraColors.blue[200],
    auraColors.blue[300],
    auraColors.blue[400],
    auraColors.blue[500],
    auraColors.blue[600],
    auraColors.blue[700],
  ],

  // Sequential green (for positive metrics)
  sequentialGreen: [
    auraColors.green[100],
    auraColors.green[200],
    auraColors.green[300],
    auraColors.green[400],
    auraColors.green[500],
    auraColors.green[600],
    auraColors.green[700],
  ],

  // Diverging (for comparison, positive/negative)
  diverging: [
    auraColors.red[600],
    auraColors.red[400],
    auraColors.red[200],
    auraColors.grey[200],
    auraColors.green[200],
    auraColors.green[400],
    auraColors.green[600],
  ],

  // Comparison (two datasets)
  comparison: {
    a: auraColors.blue[500],
    b: auraColors.green[500],
    aLight: auraColors.blue[200],
    bLight: auraColors.green[200],
  },
};

// Icon Color Mappings - Updated
export const iconColors = {
  primary: auraColors.blue.main,
  secondary: auraColors.purple.main,
  success: auraColors.green.main,
  warning: auraColors.amber.main,
  error: auraColors.red.main,
  info: auraColors.cyan.main,
  neutral: auraColors.grey[500],
};
