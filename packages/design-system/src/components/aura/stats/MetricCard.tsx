import { Paper, Stack, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export interface AuraMetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  color?: string;
}

export const AuraMetricCard = ({ 
  label, 
  value, 
  change, 
  changeLabel,
  icon, 
  color = 'primary.main' 
}: AuraMetricCardProps) => {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Stack spacing={2}>
        {icon && (
          <Box sx={{ color, fontSize: 32 }}>
            {icon}
          </Box>
        )}
        <div>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </div>
        {change !== undefined && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {isPositive ? (
              <TrendingUp fontSize="small" color="success" />
            ) : (
              <TrendingDown fontSize="small" color="error" />
            )}
            <Typography 
              variant="caption" 
              color={isPositive ? 'success.main' : 'error.main'}
              fontWeight={600}
            >
              {Math.abs(change)}%
            </Typography>
            {changeLabel && (
              <Typography variant="caption" color="text.secondary">
                {changeLabel}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
