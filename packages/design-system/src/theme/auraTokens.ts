/**
 * Aura Design Tokens
 * Centralized design tokens for consistent styling across the platform
 */

import { auraColors, auraGradients } from './auraColors';

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

  // Gradients - Single source of truth
  gradients: {
    primary: `linear-gradient(135deg, ${auraColors.blue.main} 0%, ${auraColors.purple.main} 100%)`,
    blue: `linear-gradient(135deg, ${auraColors.blue.main} 0%, ${auraColors.blue.dark} 100%)`,
    purple: `linear-gradient(135deg, ${auraColors.purple.main} 0%, ${auraColors.purple.dark} 100%)`,
    success: `linear-gradient(135deg, ${auraColors.green.main} 0%, ${auraColors.green.dark} 100%)`,
    warning: `linear-gradient(135deg, ${auraColors.orange.main} 0%, ${auraColors.orange.dark} 100%)`,
    error: `linear-gradient(135deg, ${auraColors.red.main} 0%, ${auraColors.red.dark} 100%)`,
    subtle: 'linear-gradient(135deg, rgba(51, 133, 240, 0.02) 0%, rgba(166, 65, 250, 0.02) 100%)',
    glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
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

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
} as const;

// Glass effect styles
export const glassEffect = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
};

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
