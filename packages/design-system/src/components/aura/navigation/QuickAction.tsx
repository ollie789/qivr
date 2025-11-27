import { Box, Typography, ButtonBase } from '@mui/material';
import { ReactNode } from 'react';
import { auraTokens } from '../../../theme/auraTokens';

export interface QuickActionProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  color?: string;
  disabled?: boolean;
}

export const QuickAction = ({ icon, label, onClick, color = 'primary.main', disabled = false }: QuickActionProps) => (
  <ButtonBase
    onClick={onClick}
    disabled={disabled}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
      p: auraTokens.spacing.md,
      borderRadius: auraTokens.borderRadius.lg,
      transition: auraTokens.transitions.default,
      opacity: disabled ? 0.5 : 1,
      '&:hover': { bgcolor: 'action.hover' },
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: auraTokens.borderRadius.md,
        bgcolor: `${color}15`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& svg': { fontSize: 24 },
      }}
    >
      {icon}
    </Box>
    <Typography variant="caption" color="text.secondary" textAlign="center">
      {label}
    </Typography>
  </ButtonBase>
);
