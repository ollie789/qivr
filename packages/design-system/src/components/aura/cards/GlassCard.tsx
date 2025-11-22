import { Paper, SxProps } from '@mui/material';
import { ReactNode } from 'react';
import { CardHeader } from './CardHeader';
import * as tokens from '../../../tokens';

export interface GlassCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps;
  intensity?: 'light' | 'medium' | 'dark';
}

export const GlassCard = ({ 
  title, 
  subtitle, 
  action, 
  children, 
  sx,
  intensity = 'light'
}: GlassCardProps) => {
  const backgrounds = {
    light: tokens.GlassBackgroundLight,
    medium: tokens.GlassBackgroundMedium,
    dark: tokens.GlassBackgroundDark,
  };

  return (
    <Paper 
      sx={{ 
        p: { xs: 3, md: 5 }, 
        height: 1,
        backgroundColor: backgrounds[intensity],
        backdropFilter: `blur(${tokens.GlassBlurMd})`,
        border: `1px solid ${tokens.GlassBorder}`,
        ...sx 
      }}
    >
      {title && <CardHeader title={title} subtitle={subtitle} action={action} />}
      {children}
    </Paper>
  );
};
