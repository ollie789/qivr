import { Paper, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface GreetingCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const GreetingCard = ({ title, subtitle, action }: GreetingCardProps) => {
  return (
    <Paper sx={{ px: { xs: 3, md: 5 }, py: 3, mb: 3 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ pb: 1 }}>
          {subtitle}
        </Typography>
      )}
      {action}
    </Paper>
  );
};
