import { auraTokens } from '../../../theme/auraTokens';
import { Paper, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface AuraMetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down';
  icon?: ReactNode;
  iconColor?: string;
}

export const AuraMetricCard = ({ 
  title, 
  value, 
  change, 
  changeLabel,
  trend,
  icon,
  iconColor 
}: AuraMetricCardProps) => {
  return (
    <Paper sx={{ p: { xs: 3, md: 5 }, height: 1 }}>
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
        {icon && (
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
        )}
        <div>
          <Typography variant="h4" sx={{ fontWeight: 500, mb: 0.5 }}>
            {value}
          </Typography>
          {(change !== undefined || changeLabel) && (
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                color: trend === 'up' ? 'success.main' : trend === 'down' ? 'error.main' : 'text.secondary' 
              }}
            >
              {change !== undefined && `${change > 0 ? '+' : ''}${change}%`}
              {changeLabel && ` ${changeLabel}`}
            </Typography>
          )}
        </div>
      </Stack>
    </Paper>
  );
};
