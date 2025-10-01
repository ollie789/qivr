// Production-Ready Vitals Monitoring Components for QIVR
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  IconButton,
  Paper,
  LinearProgress,
  alpha,
  useTheme,
  Tooltip,
  Button,
  Badge,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Favorite,
  MonitorHeart,
  Air,
  Thermostat,
  Bloodtype,
  ShowChart,
  Timeline,
  Warning,
  CheckCircle,
  Error,
  TrendingUp,
  TrendingDown,
  Pause,
  PlayArrow,
  Refresh,
  Settings,
  Download,
  Print,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import { customStyles } from '../theme/theme';

// ECG Waveform Component with realistic cardiac rhythm
interface ECGMonitorProps {
  heartRate: number;
  isLive?: boolean;
  showGrid?: boolean;
  height?: number;
  color?: string;
  rhythm?: 'normal' | 'tachycardia' | 'bradycardia' | 'arrhythmia';
}

export const ECGMonitor: React.FC<ECGMonitorProps> = ({
  heartRate = 72,
  isLive = true,
  showGrid = true,
  height = 200,
  color,
  rhythm = 'normal',
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isPaused, setIsPaused] = useState(false);
  
  const waveColor = color || theme.palette.success.main;
  const gridColor = alpha(theme.palette.divider, 0.2);
  
  useEffect(() => {
    if (!canvasRef.current || !isLive || isPaused) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = height;
    
    let x = 0;
    const speed = 2;
    const amplitude = height / 3;
    const baseline = height / 2;
    
    const drawGrid = () => {
      if (!showGrid) return;
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      
      // Draw horizontal lines
      for (let i = 0; i <= height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
      
      // Draw vertical lines
      for (let i = 0; i <= canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
    };
    
    const drawECG = () => {
      // Clear previous frame
      ctx.fillStyle = theme.palette.background.paper;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      drawGrid();
      
      // Draw ECG line
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = alpha(waveColor, 0.4);
      ctx.beginPath();
      
      for (let i = 0; i < canvas.width; i++) {
        const t = (i + x) * 0.02;
        let y = baseline;
        
        // Create realistic ECG pattern (PQRST wave)
        const beatPosition = t % (60 / heartRate * 4);
        
        if (beatPosition < 0.1) {
          // P wave
          y = baseline - amplitude * 0.2 * Math.sin(beatPosition * 31.4);
        } else if (beatPosition < 0.2) {
          // PR segment
          y = baseline;
        } else if (beatPosition < 0.3) {
          // QRS complex
          if (beatPosition < 0.22) {
            y = baseline + amplitude * 0.1; // Q
          } else if (beatPosition < 0.25) {
            y = baseline - amplitude * 1.2; // R
          } else {
            y = baseline + amplitude * 0.3; // S
          }
        } else if (beatPosition < 0.5) {
          // T wave
          y = baseline - amplitude * 0.3 * Math.sin((beatPosition - 0.3) * 10);
        } else {
          // Baseline
          y = baseline + Math.random() * 2 - 1; // Small noise
        }
        
        // Apply rhythm variations
        if (rhythm === 'arrhythmia') {
          y += Math.random() * 10 - 5;
        }
        
        if (i === 0) {
          ctx.moveTo(i, y);
        } else {
          ctx.lineTo(i, y);
        }
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Draw sweep line
      const sweepX = (x * speed) % canvas.width;
      ctx.strokeStyle = alpha(waveColor, 0.3);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.stroke();
      
      x += 1;
      animationRef.current = requestAnimationFrame(drawECG);
    };
    
    drawECG();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [heartRate, isLive, isPaused, showGrid, height, waveColor, gridColor, rhythm, theme]);
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        background: alpha(theme.palette.background.paper, 0.95),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: alpha(waveColor, 0.1),
              color: waveColor,
              width: 36,
              height: 36,
            }}
          >
            <MonitorHeart />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              ECG Monitor
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" fontWeight={700} color={waveColor}>
                {heartRate}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                bpm
              </Typography>
              <Chip
                label={rhythm}
                size="small"
                color={rhythm === 'normal' ? 'success' : 'warning'}
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </Stack>
          </Box>
        </Stack>
        
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={isPaused ? "Resume" : "Pause"}>
            <IconButton
              size="small"
              onClick={() => setIsPaused(!isPaused)}
              sx={{ color: theme.palette.text.secondary }}
            >
              {isPaused ? <PlayArrow /> : <Pause />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
              <Settings />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      
      <Box
        sx={{
          position: 'relative',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.common.black, 0.4)
            : alpha(theme.palette.common.white, 0.6),
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: `${height}px`,
            display: 'block',
          }}
        />
        {isLive && (
          <Chip
            label="LIVE"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: alpha(theme.palette.error.main, 0.9),
              color: theme.palette.common.white,
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 20,
              ...customStyles.pulseAnimation,
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

// Advanced Vital Signs Panel
interface VitalSignData {
  label: string;
  value: number | string;
  unit: string;
  min: number;
  max: number;
  normal: { min: number; max: number };
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  history: Array<{ time: Date; value: number }>;
}

interface VitalSignsPanelProps {
  heartRate?: VitalSignData;
  bloodPressure?: { systolic: VitalSignData; diastolic: VitalSignData };
  oxygenSaturation?: VitalSignData;
  temperature?: VitalSignData;
  respiratoryRate?: VitalSignData;
  bloodGlucose?: VitalSignData;
}

export const VitalSignsPanel: React.FC<VitalSignsPanelProps> = ({
  heartRate = {
    label: 'Heart Rate',
    value: 72,
    unit: 'bpm',
    min: 40,
    max: 180,
    normal: { min: 60, max: 100 },
    trend: 'stable',
    lastUpdated: new Date(),
    history: [],
  },
  bloodPressure = {
    systolic: {
      label: 'Systolic',
      value: 120,
      unit: 'mmHg',
      min: 70,
      max: 200,
      normal: { min: 90, max: 140 },
      trend: 'stable',
      lastUpdated: new Date(),
      history: [],
    },
    diastolic: {
      label: 'Diastolic',
      value: 80,
      unit: 'mmHg',
      min: 40,
      max: 130,
      normal: { min: 60, max: 90 },
      trend: 'stable',
      lastUpdated: new Date(),
      history: [],
    },
  },
  oxygenSaturation = {
    label: 'O₂ Saturation',
    value: 98,
    unit: '%',
    min: 70,
    max: 100,
    normal: { min: 95, max: 100 },
    trend: 'stable',
    lastUpdated: new Date(),
    history: [],
  },
  temperature = {
    label: 'Temperature',
    value: 98.6,
    unit: '°F',
    min: 95,
    max: 105,
    normal: { min: 97, max: 99 },
    trend: 'stable',
    lastUpdated: new Date(),
    history: [],
  },
  respiratoryRate = {
    label: 'Respiratory Rate',
    value: 16,
    unit: 'breaths/min',
    min: 8,
    max: 40,
    normal: { min: 12, max: 20 },
    trend: 'stable',
    lastUpdated: new Date(),
    history: [],
  },
  bloodGlucose = {
    label: 'Blood Glucose',
    value: 95,
    unit: 'mg/dL',
    min: 40,
    max: 400,
    normal: { min: 70, max: 140 },
    trend: 'stable',
    lastUpdated: new Date(),
    history: [],
  },
}) => {
  const theme = useTheme();
  
  const getVitalStatus = (vital: VitalSignData): 'critical' | 'warning' | 'normal' => {
    const value = typeof vital.value === 'string' ? parseFloat(vital.value) : vital.value;
    if (value < vital.normal.min || value > vital.normal.max) {
      if (value < vital.min || value > vital.max) {
        return 'critical';
      }
      return 'warning';
    }
    return 'normal';
  };
  
  const getStatusColor = (status: 'critical' | 'warning' | 'normal') => {
    switch (status) {
      case 'critical': return theme.palette.error;
      case 'warning': return theme.palette.warning;
      default: return theme.palette.success;
    }
  };
  
  const renderVitalCard = (vital: VitalSignData, icon: React.ReactNode) => {
    const status = getVitalStatus(vital);
    const statusColor = getStatusColor(status);
    const value = typeof vital.value === 'string' ? parseFloat(vital.value) : vital.value;
    const percentage = ((value - vital.min) / (vital.max - vital.min)) * 100;
    
    return (
      <Card
        sx={{
          height: '100%',
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.8)
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(statusColor.main, 0.2)}`,
          borderLeft: `4px solid ${statusColor.main}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 24px ${alpha(statusColor.main, 0.15)}`,
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: alpha(statusColor.main, 0.1),
                    color: statusColor.main,
                    width: 40,
                    height: 40,
                  }}
                >
                  {icon}
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {vital.label}
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${statusColor.light} 0%, ${statusColor.main} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {vital.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vital.unit}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              
              <Stack alignItems="flex-end" spacing={0.5}>
                {vital.trend !== 'stable' && (
                  <Chip
                    size="small"
                    icon={vital.trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                    label={vital.trend}
                    sx={{
                      height: 22,
                      backgroundColor: alpha(
                        vital.trend === 'up' ? theme.palette.info.main : theme.palette.warning.main,
                        0.1
                      ),
                      color: vital.trend === 'up' ? theme.palette.info.main : theme.palette.warning.main,
                      '& .MuiChip-icon': {
                        fontSize: '0.875rem',
                      },
                    }}
                  />
                )}
                {status !== 'normal' && (
                  <Chip
                    size="small"
                    icon={status === 'critical' ? <Error /> : <Warning />}
                    label={status}
                    color={status === 'critical' ? 'error' : 'warning'}
                    sx={{ height: 22 }}
                  />
                )}
              </Stack>
            </Stack>
            
            <Box>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.disabled">
                  Range: {vital.normal.min}-{vital.normal.max} {vital.unit}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {Math.round(percentage)}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={percentage}
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
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Vital Signs Monitor
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<Download />}
            sx={{ color: theme.palette.text.secondary }}
          >
            Export
          </Button>
          <Button
            size="small"
            startIcon={<Print />}
            sx={{ color: theme.palette.text.secondary }}
          >
            Print
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<Refresh />}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          {renderVitalCard(heartRate, <Favorite />)}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.8)
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      width: 40,
                      height: 40,
                    }}
                  >
                    <Bloodtype />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      Blood Pressure
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {bloodPressure.systolic.value}/{bloodPressure.diastolic.value}
                      <Typography component="span" variant="body2" color="text.secondary" ml={0.5}>
                        mmHg
                      </Typography>
                    </Typography>
                  </Box>
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption">Systolic</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {bloodPressure.systolic.value}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(Number(bloodPressure.systolic.value) - 70) / (200 - 70) * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption">Diastolic</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {bloodPressure.diastolic.value}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(Number(bloodPressure.diastolic.value) - 40) / (130 - 40) * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {renderVitalCard(oxygenSaturation, <Air />)}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {renderVitalCard(temperature, <Thermostat />)}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {renderVitalCard(respiratoryRate, <Air />)}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          {renderVitalCard(bloodGlucose, <ShowChart />)}
        </Grid>
      </Grid>
    </Box>
  );
};

export default {
  ECGMonitor,
  VitalSignsPanel,
};