import { Paper, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';
import { CardHeader } from './CardHeader';
import { glassTokens } from '../../theme/auraTokens';

export interface InfoCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
  /** Card variant - 'default' uses solid bg, 'glass' uses glassmorphism */
  variant?: 'default' | 'glass';
}

export const InfoCard = ({
  title,
  subtitle,
  action,
  children,
  sx,
  variant = 'default',
}: InfoCardProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        height: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
        transition: 'all 0.2s ease-in-out',
        ...(variant === 'glass' && {
          backdropFilter: `blur(${glassTokens.blur.standard})`,
          WebkitBackdropFilter: `blur(${glassTokens.blur.standard})`,
        }),
        '&:hover': {
          boxShadow: glassTokens.shadow.standard,
        },
        ...sx,
      }}
    >
      <CardHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </Paper>
  );
};
