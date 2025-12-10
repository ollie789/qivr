/**
 * Custom SX Configuration
 * Extends MUI's sx prop with custom CSS utilities
 *
 * @example
 * // Truncate text to 2 lines:
 * <Typography sx={{ lineClamp: 2 }}>Long text here...</Typography>
 *
 * // Glass effect:
 * <Box sx={{ glassEffect: true }}>Frosted content</Box>
 */

import { SxConfig } from '@mui/system';
import { glassTokens } from './auraTokens';

const sxConfig: SxConfig = {
  /**
   * Line clamp utility - truncates text to N lines with ellipsis
   * Uses -webkit-line-clamp for multi-line text truncation
   */
  lineClamp: {
    style: (props) => {
      const lineClamp = (props as Record<string, unknown>)['lineClamp'];
      if (typeof lineClamp !== 'number') return {};
      return {
        display: '-webkit-box',
        WebkitLineClamp: String(lineClamp),
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      };
    },
  },

  /**
   * Glass effect utility - creates frosted glass background
   * Uses unified glass token system for consistency
   */
  glassEffect: {
    style: (props) => {
      const glassEffect = (props as Record<string, unknown>)['glassEffect'];
      return glassEffect
        ? {
            backgroundColor: glassTokens.background.light,
            backdropFilter: `blur(${glassTokens.blur.standard})`,
            WebkitBackdropFilter: `blur(${glassTokens.blur.standard})`,
            border: `1px solid ${glassTokens.border.light}`,
          }
        : {};
    },
  },

  /**
   * Smooth scroll utility - hides scrollbar while maintaining scroll functionality
   * Useful for custom scrollable containers
   */
  smoothScroll: {
    style: (props) => {
      const smoothScroll = (props as Record<string, unknown>)['smoothScroll'];
      return smoothScroll
        ? {
            overflowY: 'auto' as const,
            scrollBehavior: 'smooth' as const,
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }
        : {};
    },
  },
};

export default sxConfig;
