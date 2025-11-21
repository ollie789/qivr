import { Paper, Stack, Typography, Divider } from '@mui/material';
import { ReactNode } from 'react';

export interface GreetingCardProps {
  title: string;
  subtitle?: string;
  stats?: ReactNode;
  action?: ReactNode;
}

export const GreetingCard = ({ title, subtitle, stats, action }: GreetingCardProps) => {
  return (
    <Paper sx={{ px: { xs: 3, md: 5 }, py: 3 }}>
      <Stack
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ columnGap: { lg: 3, xl: 5 }, rowGap: 1, flexDirection: { xs: 'column', lg: 'row' } }}
      >
        <div>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ pb: 1 }}>
              {subtitle}
            </Typography>
          )}
        </div>

        <Stack
          sx={{
            flex: 1,
            gap: 4,
            alignItems: { sm: 'flex-end' },
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          {stats}
          {action}
        </Stack>
      </Stack>
    </Paper>
  );
};
