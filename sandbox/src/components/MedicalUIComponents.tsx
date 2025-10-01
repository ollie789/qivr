// Advanced Medical UI Utility Components
import React from 'react';
import {
  Box,
  Card,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Paper,
  alpha,
  useTheme,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  ThermostatAuto,
  Bloodtype,
  Air,
  MonitorHeart,
  LocalHospital,
  Warning,
  CheckCircle,
  Error,
  Info,
  TrendingUp,
  TrendingDown,
  Remove,
} from '@mui/icons-material';
import { customStyles } from '../theme/theme';

// Vital Sign Component with advanced styling
interface VitalSignProps {
  label: string;
  value: number | string;
  unit: string;
  status?: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  min?: number;
  max?: number;
  icon?: React.ReactNode;
}

export const VitalSign: React.FC<VitalSignProps> = ({
  label,
  value,
  unit,
  status = 'normal',
  trend,
  min,
  max,
  icon,
}) => {
  const theme = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return theme.palette.error;
      case 'warning': return theme.palette.warning;
      default: return theme.palette.success;
    }
  };

  const statusColor = getStatusColor();
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const progress = min !== undefined && max !== undefined 
    ? ((numValue - min) / (max - min)) * 100 
    : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(statusColor.main, 0.2)}`,
        borderLeft: `4px solid ${statusColor.main}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 24px ${alpha(statusColor.main, 0.15)}`,
          borderColor: alpha(statusColor.main, 0.3),
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(statusColor.light, 0.05)} 0%, transparent 100%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            {icon && (
              <Box sx={{ color: statusColor.main, display: 'flex' }}>
                {icon}
              </Box>
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: theme.palette.text.secondary,
              }}
            >
              {label}
            </Typography>
          </Stack>
          
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 300,
                fontSize: '2.5rem',
                fontFamily: theme.typography.fontFamily,
                background: statusColor.main,
                backgroundImage: `linear-gradient(135deg, ${statusColor.light} 0%, ${statusColor.main} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {value}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 500,
              }}
            >
              {unit}
            </Typography>
          </Stack>

          {min !== undefined && max !== undefined && (
            <Box sx={{ mt: 1.5 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(statusColor.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${statusColor.light} 0%, ${statusColor.main} 100%)`,
                  },
                }}
              />
              <Stack direction="row" justifyContent="space-between" mt={0.5}>
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                  {min}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                  {max}
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>

        {trend && (
          <Chip
            size="small"
            icon={
              trend === 'up' ? <TrendingUp /> : 
              trend === 'down' ? <TrendingDown /> : 
              <Remove />
            }
            label={trend}
            sx={{
              backgroundColor: alpha(statusColor.main, 0.1),
              color: statusColor.main,
              fontWeight: 600,
              '& .MuiChip-icon': {
                color: statusColor.main,
              },
            }}
          />
        )}
      </Stack>
    </Paper>
  );
};

// Health Metric Card with animation
interface HealthMetricProps {
  title: string;
  value: number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
}

export const HealthMetric: React.FC<HealthMetricProps> = ({
  title,
  value,
  unit = '',
  change,
  changeLabel = 'vs last week',
  icon,
  color = 'primary',
  onClick,
}) => {
  const theme = useTheme();
  const colorPalette = theme.palette[color];

  return (
    <Card
      onClick={onClick}
      sx={{
        p: 3,
        background: `linear-gradient(135deg, ${alpha(colorPalette.light, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
        border: `1px solid ${alpha(colorPalette.main, 0.1)}`,
        ...customStyles.cardHover,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          height: '4px',
          background: `linear-gradient(90deg, ${colorPalette.light}, ${colorPalette.main}, ${colorPalette.dark})`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover::after': {
          opacity: 1,
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
              mb: 1,
            }}
          >
            {title}
          </Typography>
          
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colorPalette.main,
              mb: 1,
            }}
          >
            {value.toLocaleString()}{unit && <span style={{ fontSize: '0.7em', fontWeight: 400 }}> {unit}</span>}
          </Typography>

          {change !== undefined && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip
                size="small"
                icon={change >= 0 ? <TrendingUp /> : <TrendingDown />}
                label={`${change >= 0 ? '+' : ''}${change}%`}
                sx={{
                  backgroundColor: change >= 0 
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.error.main, 0.1),
                  color: change >= 0 
                    ? theme.palette.success.main
                    : theme.palette.error.main,
                  fontWeight: 600,
                  height: 24,
                  '& .MuiChip-icon': {
                    fontSize: '1rem',
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                {changeLabel}
              </Typography>
            </Stack>
          )}
        </Box>

        {icon && (
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${alpha(colorPalette.light, 0.2)} 0%, ${alpha(colorPalette.main, 0.1)} 100%)`,
              color: colorPalette.main,
              ...customStyles.floatAnimation,
            }}
          >
            {icon}
          </Box>
        )}
      </Stack>
    </Card>
  );
};

// Medical Status Indicator
interface MedicalStatusProps {
  status: 'critical' | 'warning' | 'stable' | 'monitoring';
  label: string;
  description?: string;
  timestamp?: string;
  urgent?: boolean;
}

export const MedicalStatus: React.FC<MedicalStatusProps> = ({
  status,
  label,
  description,
  timestamp,
  urgent = false,
}) => {
  const theme = useTheme();

  const getStatusConfig = () => {
    switch (status) {
      case 'critical':
        return {
          color: theme.palette.error,
          icon: <Error />,
          pulse: true,
        };
      case 'warning':
        return {
          color: theme.palette.warning,
          icon: <Warning />,
          pulse: false,
        };
      case 'stable':
        return {
          color: theme.palette.success,
          icon: <CheckCircle />,
          pulse: false,
        };
      case 'monitoring':
        return {
          color: theme.palette.info,
          icon: <Info />,
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: alpha(config.color.main, 0.05),
        border: `1px solid ${alpha(config.color.main, 0.2)}`,
        borderLeft: `4px solid ${config.color.main}`,
        position: 'relative',
        ...(config.pulse && urgent && customStyles.pulseAnimation),
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            color: config.color.main,
            display: 'flex',
            mt: 0.5,
          }}
        >
          {config.icon}
        </Box>
        
        <Box flex={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: config.color.dark,
              }}
            >
              {label}
            </Typography>
            
            {timestamp && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.disabled,
                }}
              >
                {timestamp}
              </Typography>
            )}
          </Stack>
          
          {description && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                mt: 0.5,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

// Vital Signs Dashboard Component
interface VitalSignsDashboardProps {
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  temperature?: number;
  oxygenLevel?: number;
  respiratoryRate?: number;
}

export const VitalSignsDashboard: React.FC<VitalSignsDashboardProps> = ({
  heartRate = 72,
  bloodPressure = { systolic: 120, diastolic: 80 },
  temperature = 98.6,
  oxygenLevel = 98,
  respiratoryRate = 16,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        background: customStyles.glassmorphism.background,
        backdropFilter: customStyles.glassmorphism.backdropFilter,
        border: customStyles.glassmorphism.border,
        boxShadow: customStyles.glassmorphism.boxShadow,
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
        Vital Signs Monitor
      </Typography>
      
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <Box flex={1}>
            <VitalSign
              label="Heart Rate"
              value={heartRate}
              unit="bpm"
              status={heartRate < 60 || heartRate > 100 ? 'warning' : 'normal'}
              min={60}
              max={100}
              icon={<Favorite />}
              trend={heartRate > 75 ? 'up' : 'stable'}
            />
          </Box>
          
          <Box flex={1}>
            <VitalSign
              label="Blood Pressure"
              value={`${bloodPressure.systolic}/${bloodPressure.diastolic}`}
              unit="mmHg"
              status={bloodPressure.systolic > 140 ? 'warning' : 'normal'}
              icon={<MonitorHeart />}
            />
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box flex={1}>
            <VitalSign
              label="Temperature"
              value={temperature.toFixed(1)}
              unit="°F"
              status={temperature > 100.4 ? 'warning' : 'normal'}
              min={97}
              max={99}
              icon={<ThermostatAuto />}
            />
          </Box>
          
          <Box flex={1}>
            <VitalSign
              label="O₂ Saturation"
              value={oxygenLevel}
              unit="%"
              status={oxygenLevel < 95 ? 'critical' : 'normal'}
              min={95}
              max={100}
              icon={<Air />}
            />
          </Box>
        </Stack>

        <VitalSign
          label="Respiratory Rate"
          value={respiratoryRate}
          unit="breaths/min"
          status={respiratoryRate < 12 || respiratoryRate > 20 ? 'warning' : 'normal'}
          min={12}
          max={20}
          icon={<Air />}
          trend="stable"
        />
      </Stack>
    </Box>
  );
};

export default {
  VitalSign,
  HealthMetric,
  MedicalStatus,
  VitalSignsDashboard,
};