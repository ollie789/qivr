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
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: iconColor,
          boxShadow: `0 4px 20px ${alpha(iconColor?.startsWith('#') ? iconColor : '#3385F0', 0.08)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      {/* Header with Icon */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.7rem',
          }}
        >
          {title}
        </Typography>

        <Avatar
          variant="rounded"
          sx={{
            width: 36,
            height: 36,
            bgcolor: (theme) => alpha(iconColor, 0.08),
            borderRadius: 1.5,
          }}
        >
          <Box sx={{ color: iconColor, display: 'flex', fontSize: 20 }}>
            {icon}
          </Box>
        </Avatar>
      </Box>

      {/* Value */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: trend || subtitle ? 0.5 : 0,
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
              fontSize: '0.7rem',
            }}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            {trend.label}
          </Typography>
        </Box>
      )}

      {/* Subtitle */}
      {subtitle && !trend && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};
