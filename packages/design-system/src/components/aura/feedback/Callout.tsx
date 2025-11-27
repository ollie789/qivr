import { Box, Typography, Stack } from '@mui/material';
import { Info, Warning, Error, CheckCircle } from '@mui/icons-material';
import { ReactNode } from 'react';
import { auraTokens } from '../../../theme/auraTokens';

export interface CalloutProps {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
}

const variants = {
  info: { icon: <Info />, color: 'info.main', bg: 'info.lighter' },
  warning: { icon: <Warning />, color: 'warning.main', bg: 'warning.lighter' },
  error: { icon: <Error />, color: 'error.main', bg: 'error.lighter' },
  success: { icon: <CheckCircle />, color: 'success.main', bg: 'success.lighter' },
};

export const Callout = ({ variant = 'info', title, children, icon }: CalloutProps) => {
  const config = variants[variant];
  return (
    <Box
      sx={{
        p: auraTokens.spacing.md,
        borderRadius: auraTokens.borderRadius.md,
        bgcolor: config.bg,
        borderLeft: 4,
        borderColor: config.color,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ color: config.color, mt: 0.25 }}>{icon || config.icon}</Box>
        <Box>
          {title && <Typography variant="subtitle2" fontWeight={600} gutterBottom>{title}</Typography>}
          <Typography variant="body2" color="text.secondary">{children}</Typography>
        </Box>
      </Stack>
    </Box>
  );
};
