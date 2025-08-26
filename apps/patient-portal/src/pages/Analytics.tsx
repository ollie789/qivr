import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Stack,
  Paper,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarIcon,
  FavoriteOutlined as HealthIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  RadarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';

interface HealthMetric {
  label: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  color: string;
}

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState('3months');
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Mock data for personal health trends
  const painTrendData = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM d'),
    pain: Math.max(0, 8 - (i * 0.2) + Math.random() * 2),
    mobility: Math.min(10, 4 + (i * 0.15) + Math.random() * 1.5),
    mood: Math.min(10, 5 + (i * 0.1) + Math.random() * 2),
  }));

  const promScoreHistory = [
    { month: 'Jan', PHQ9: 12, Pain: 65, QoL: 55 },
    { month: 'Feb', PHQ9: 11, Pain: 62, QoL: 58 },
    { month: 'Mar', PHQ9: 9, Pain: 58, QoL: 62 },
    { month: 'Apr', PHQ9: 8, Pain: 52, QoL: 65 },
    { month: 'May', PHQ9: 7, Pain: 48, QoL: 70 },
    { month: 'Jun', PHQ9: 6, Pain: 45, QoL: 72 },
  ];

  const functionalCapacity = [
    { category: 'Walking', current: 75, baseline: 40 },
    { category: 'Sitting', current: 85, baseline: 50 },
    { category: 'Lifting', current: 60, baseline: 30 },
    { category: 'Bending', current: 65, baseline: 35 },
    { category: 'Standing', current: 70, baseline: 45 },
    { category: 'Sleeping', current: 80, baseline: 60 },
  ];

  const weeklyActivity = [
    { day: 'Mon', exercises: 3, stretching: 2, walking: 45 },
    { day: 'Tue', exercises: 2, stretching: 3, walking: 30 },
    { day: 'Wed', exercises: 3, stretching: 2, walking: 60 },
    { day: 'Thu', exercises: 1, stretching: 2, walking: 20 },
    { day: 'Fri', exercises: 3, stretching: 3, walking: 50 },
    { day: 'Sat', exercises: 2, stretching: 1, walking: 90 },
    { day: 'Sun', exercises: 0, stretching: 2, walking: 30 },
  ];

  const healthMetrics: HealthMetric[] = [
    {
      label: 'Pain Level',
      value: 3.5,
      unit: '/10',
      trend: 'down',
      change: -45,
      color: '#10b981',
    },
    {
      label: 'Mobility Score',
      value: 7.2,
      unit: '/10',
      trend: 'up',
      change: 35,
      color: '#3b82f6',
    },
    {
      label: 'Sleep Quality',
      value: 6.8,
      unit: '/10',
      trend: 'up',
      change: 20,
      color: '#8b5cf6',
    },
    {
      label: 'Overall Wellness',
      value: 72,
      unit: '%',
      trend: 'up',
      change: 28,
      color: '#f59e0b',
    },
  ];

  const medications = [
    { name: 'Ibuprofen', adherence: 95 },
    { name: 'Physical Therapy', adherence: 88 },
    { name: 'Stretching Routine', adherence: 75 },
    { name: 'Meditation', adherence: 60 },
  ];

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Your Health Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track your progress and health trends over time
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="1month">Last Month</MenuItem>
                  <MenuItem value="3months">Last 3 Months</MenuItem>
                  <MenuItem value="6months">Last 6 Months</MenuItem>
                  <MenuItem value="1year">Last Year</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" startIcon={<DownloadIcon />}>
                Export
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Health Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {healthMetrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.label}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography color="text.secondary" variant="body2">
                    {metric.label}
                  </Typography>
                  {metric.trend === 'up' ? (
                    <TrendingUpIcon fontSize="small" sx={{ color: metric.color }} />
                  ) : metric.trend === 'down' ? (
                    <TrendingDownIcon fontSize="small" sx={{ color: metric.color }} />
                  ) : null}
                </Box>
                <Typography variant="h3" sx={{ color: metric.color }}>
                  {metric.value}
                  <Typography component="span" variant="h5" color="text.secondary">
                    {metric.unit}
                  </Typography>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: metric.trend === 'down' && metric.label === 'Pain Level' 
                      ? 'success.main' 
                      : metric.trend === 'up' && metric.label !== 'Pain Level'
                      ? 'success.main'
                      : 'text.secondary'
                  }}
                >
                  {Math.abs(metric.change)}% {metric.trend === 'up' ? 'increase' : 'decrease'} from baseline
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Pain & Wellness Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pain & Wellness Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={painTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pain" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Pain Level"
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mobility" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Mobility"
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Mood"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Functional Capacity Radar */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Functional Capacity
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={functionalCapacity}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Current" 
                    dataKey="current" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                  />
                  <Radar 
                    name="Baseline" 
                    dataKey="baseline" 
                    stroke="#6b7280" 
                    fill="#6b7280" 
                    fillOpacity={0.1}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* PROM Score History */}
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PROM Score History
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={promScoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="QoL" 
                    stackId="1" 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Quality of Life"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Pain" 
                    stackId="1" 
                    stroke="#f59e0b" 
                    fill="#f59e0b"
                    fillOpacity={0.6}
                    name="Pain Score"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="PHQ9" 
                    stackId="1" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="PHQ-9"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Treatment Adherence */}
        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Treatment Adherence
              </Typography>
              <Stack spacing={2}>
                {medications.map((med) => (
                  <Box key={med.name}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2">{med.name}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {med.adherence}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={med.adherence} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: med.adherence >= 80 ? '#10b981' : med.adherence >= 60 ? '#f59e0b' : '#ef4444'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Stack>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Maintaining high adherence to your treatment plan improves outcomes
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Activity Summary
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="exercises" fill="#8b5cf6" name="Exercises (count)" />
                  <Bar dataKey="stretching" fill="#3b82f6" name="Stretching (count)" />
                  <Bar dataKey="walking" fill="#10b981" name="Walking (minutes)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Progress Summary
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <HealthIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Great Progress!</Typography>
                    <Typography variant="body2">
                      Your pain levels have decreased by 45% over the last 3 months
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <TimelineIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Consistent Improvement</Typography>
                    <Typography variant="body2">
                      Mobility score improved by 35% with regular exercise
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <CalendarIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">Next Milestone</Typography>
                    <Typography variant="body2">
                      Complete 2 more PROMs to track monthly progress
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};
