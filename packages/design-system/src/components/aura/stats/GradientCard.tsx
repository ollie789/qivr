import { Box, Paper, Typography, alpha } from '@mui/material';
import { ReactNode } from 'react';

export interface AuraGradientCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  gradient: {
    from: string;
    to: string;
  };
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
}

export const AuraGradientCard = ({
  title,
  value,
  icon,
  gradient,
  subtitle,
  trend,
}: AuraGradientCardProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: { xs: 2.5, md: 3 },
        borderRadius: 2,
        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40%',
          height: '100%',
          background: `radial-gradient(circle at top right, ${alpha('#fff', 0.1)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, position: 'relative', zIndex: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.9)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {title}
        </Typography>

        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            background: alpha('#fff', 0.2),
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          {icon}
        </Box>
      </Box>

      {/* Value */}
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          mb: trend || subtitle ? 1.5 : 0,
          color: 'white',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>

      {/* Trend or Subtitle */}
      {trend && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, position: 'relative', zIndex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.95)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              bgcolor: alpha('#fff', 0.15),
              px: 1,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            ↑ {trend.value}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            {trend.label}
          </Typography>
        </Box>
      )}

      {subtitle && !trend && (
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', position: 'relative', zIndex: 1 }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};
