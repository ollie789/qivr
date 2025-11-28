import { Paper, Typography, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';
import { glassTokens } from '../../theme/auraTokens';

export interface GreetingCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  sx?: SxProps<Theme>;
}

export const GreetingCard = ({ title, subtitle, action, sx }: GreetingCardProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        px: { xs: 2, sm: 3 },
        py: 3,
        mb: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
        ...sx,
      }}
    >
      <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {action}
    </Paper>
  );
};
