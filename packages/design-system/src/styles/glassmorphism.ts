import { SxProps, Theme } from '@mui/material';
import { glassTokens, glassEffect } from '../theme/auraTokens';

/**
 * Glass Styles - Using unified glass token system
 *
 * @example
 * // Basic usage
 * <Box sx={glassStyles.standard} />
 *
 * // With intensity
 * <Paper sx={glassCard('subtle')} />
 */
export const glassStyles = {
  /** Subtle glass - 50% opacity, 4px blur - for overlays */
  subtle: {
    backgroundColor: glassTokens.background.medium,
    backdropFilter: `blur(${glassTokens.blur.subtle})`,
    WebkitBackdropFilter: `blur(${glassTokens.blur.subtle})`,
    border: `1px solid ${glassTokens.border.subtle}`,
  } as SxProps,

  /** Standard glass - 70% opacity, 8px blur - default for cards */
  standard: {
    backgroundColor: glassTokens.background.light,
    backdropFilter: `blur(${glassTokens.blur.standard})`,
    WebkitBackdropFilter: `blur(${glassTokens.blur.standard})`,
    border: `1px solid ${glassTokens.border.light}`,
  } as SxProps,

  /** Strong glass - 70% opacity, 12px blur - for prominent elements */
  strong: {
    backgroundColor: glassTokens.background.light,
    backdropFilter: `blur(${glassTokens.blur.strong})`,
    WebkitBackdropFilter: `blur(${glassTokens.blur.strong})`,
    border: `1px solid ${glassTokens.border.light}`,
  } as SxProps,

  // Legacy aliases for backward compatibility
  light: {} as SxProps,
  medium: {} as SxProps,
  dark: {} as SxProps,
};

// Set legacy aliases
glassStyles.light = glassStyles.standard;
glassStyles.medium = glassStyles.subtle;
glassStyles.dark = glassStyles.strong;

export type GlassIntensity = 'subtle' | 'standard' | 'strong' | 'light' | 'medium' | 'dark';

/**
 * Glass Card - Complete glass card styling with hover effects
 *
 * @param intensity - Glass intensity level
 * @returns SxProps for glass card styling
 *
 * @example
 * <Paper sx={glassCard('standard')} />
 */
export const glassCard = (intensity: GlassIntensity = 'standard'): SxProps<Theme> => {
  // Map legacy names to new names
  const normalizedIntensity =
    intensity === 'light' ? 'standard' :
    intensity === 'medium' ? 'subtle' :
    intensity === 'dark' ? 'strong' :
    intensity;

  const baseStyle = glassStyles[normalizedIntensity] || glassStyles.standard;

  return {
    ...baseStyle,
    borderRadius: 2,
    boxShadow: glassTokens.shadow.standard,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: glassTokens.shadow.elevated,
      borderColor: glassTokens.border.medium,
    },
  };
};

/**
 * Glass Panel - Glass styling without hover effects
 * Useful for static panels, sidebars, headers
 */
export const glassPanel = (intensity: GlassIntensity = 'standard'): SxProps<Theme> => {
  const normalizedIntensity =
    intensity === 'light' ? 'standard' :
    intensity === 'medium' ? 'subtle' :
    intensity === 'dark' ? 'strong' :
    intensity;

  return {
    ...glassStyles[normalizedIntensity],
    borderRadius: 2,
    boxShadow: glassTokens.shadow.subtle,
  };
};

// Re-export tokens for direct access
export { glassTokens, glassEffect };


// Aura Stepper styles for consistent wizard appearance
export const auraStepper = {
  mb: 4,
  '& .MuiStepLabel-root .Mui-completed': {
    color: 'success.main',
  },
  '& .MuiStepLabel-root .Mui-active': {
    color: 'primary.main',
  },
  '& .MuiStepConnector-line': {
    borderColor: 'divider',
  },
  '& .MuiStepIcon-root': {
    fontSize: 28,
  },
  '& .MuiStepLabel-label': {
    fontWeight: 500,
  },
  '& .MuiStepLabel-label.Mui-active': {
    fontWeight: 600,
  },
};
