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
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.18)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});


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
