import { Paper, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface AuraStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconColor?: string;
}

export const AuraStatCard = ({ title, value, subtitle, icon, iconColor }: AuraStatCardProps) => {
  return (
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        height: 1,
      }}
    >
      <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, mb: 2 }}>
        {title}
      </Typography>
      <Stack
        sx={{
          gap: 1,
          flexDirection: { xs: 'column', md: 'row', lg: 'column' },
          justifyContent: 'space-between',
        }}
      >
        <Stack
          sx={{
            flexShrink: 0,
            order: { md: 1, lg: 0 },
            fontSize: 48,
            color: iconColor || 'primary.main',
            '& > svg': {
              fontSize: 48,
            },
          }}
        >
          {icon}
        </Stack>
        <div>
          <Typography variant="h4" sx={{ fontWeight: 500, mb: 0.5 }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </div>
      </Stack>
    </Paper>
  );
};
