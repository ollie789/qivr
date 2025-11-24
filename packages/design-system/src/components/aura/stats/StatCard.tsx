import { Avatar, Box, Paper, Typography, alpha } from '@mui/material';
import { ReactNode } from 'react';

export interface AuraStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
}

export const AuraStatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconColor = 'primary.main',
  trend 
}: AuraStatCardProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: { xs: 2.5, md: 3 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: iconColor,
          boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Header with Icon */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {title}
        </Typography>

        <Avatar
          variant="rounded"
          sx={{
            width: 48,
            height: 48,
            bgcolor: (theme) => alpha(iconColor, 0.08),
            borderRadius: 1.5,
          }}
        >
          <Box sx={{ color: iconColor, display: 'flex', fontSize: 24 }}>
            {icon}
          </Box>
        </Avatar>
      </Box>

      {/* Value */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: trend || subtitle ? 1.5 : 0,
          color: 'text.primary',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>

      {/* Trend */}
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: trend.isPositive ? 'success.main' : 'error.main',
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
            }}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {trend.label}
          </Typography>
        </Box>
      )}

      {/* Subtitle */}
      {subtitle && !trend && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};
