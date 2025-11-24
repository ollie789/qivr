import { SxProps } from '@mui/material';
import * as tokens from '../tokens';

export const glassStyles = {
  light: {
    backgroundColor: tokens.GlassBackgroundLight,
    backdropFilter: `blur(${tokens.GlassBlurMd})`,
    border: `1px solid ${tokens.GlassBorder}`,
  } as SxProps,
  
  medium: {
    backgroundColor: tokens.GlassBackgroundMedium,
    backdropFilter: `blur(${tokens.GlassBlurMd})`,
    border: `1px solid ${tokens.GlassBorder}`,
  } as SxProps,
  
  dark: {
    backgroundColor: tokens.GlassBackgroundDark,
    backdropFilter: `blur(${tokens.GlassBlurLg})`,
    border: `1px solid ${tokens.GlassBorder}`,
  } as SxProps,
};

export const glassCard = (intensity: 'light' | 'medium' | 'dark' = 'light'): SxProps => ({
  ...glassStyles[intensity],
  borderRadius: 2,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
});
