// Clinic Dashboard Sandbox Component - Enhanced Medical UI
import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  LinearProgress,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Stack,
  Badge,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
  Fade,
  Grow,
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import {
  generateMockAppointments,
  generateMockActivities,
  mockClinicStats,
  generateChartData,
  mockPromData,
  mockDiagnosisData,
  mockProviderPerformance,
  generateWeeklyTrends,
  generateRevenueData,
} from '../data/clinicMockData';
import { customStyles } from '../theme/theme';
import { VitalSignsDashboard, HealthMetric, MedicalStatus } from './MedicalUIComponents';

const ClinicDashboard: React.FC = () => {
  const theme = useTheme();
  const [chartPeriod, setChartPeriod] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('appointments');
  
  // Generate mock data
  const appointments = useMemo(() => generateMockAppointments(), []);
  const activities = useMemo(() => generateMockActivities(), []);
  const chartData = useMemo(() => {
    const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : 90;
    return generateChartData(days);
  }, [chartPeriod]);
  const weeklyTrends = useMemo(() => generateWeeklyTrends(), []);
  const revenueData = useMemo(() => generateRevenueData(), []);

  // Stat cards with icons and colors
  const statCards = [
    {
      title: 'Appointments Today',
      value: mockClinicStats.todayAppointments,
      icon: <CalendarIcon />,
      color: '#2563eb',
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'Pending Intakes',
      value: mockClinicStats.pendingIntakes,
      icon: <AssignmentIcon />,
      color: '#f59e0b',
      change: '-5%',
      trend: 'down',
    },
    {
      title: 'Active Patients',
      value: mockClinicStats.activePatients,
      icon: <PeopleIcon />,
      color: '#7c3aed',
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'Avg Wait Time',
      value: `${mockClinicStats.averageWaitTime} min`,
      icon: <AccessTimeIcon />,
      color: '#10b981',
      change: '-15%',
      trend: 'down',
    },
    {
      title: 'Completed Today',
      value: mockClinicStats.completedToday,
      icon: <CheckCircleIcon />,
      color: '#10b981',
      change: '+20%',
      trend: 'up',
    },
    {
      title: 'Patient Satisfaction',
      value: mockClinicStats.patientSatisfaction.toFixed(1),
      icon: <StarIcon />,
      color: '#f59e0b',
      change: '+0.3',
      trend: 'up',
    },
  ];

  return (
    <Box sx={{ 
      p: 3, 
      minHeight: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
        : `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
    }}>
      {/* Enhanced Header with Glass Effect */}
      <Fade in={true} timeout={600}>
        <Paper 
          elevation={0}
          sx={{ 
            mb: 4, 
            p: 3,
            ...customStyles.glassmorphism,
            borderRadius: 3,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography 
                variant="h3" 
                gutterBottom 
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Clinic Command Center
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip 
                  label="LIVE" 
                  size="small" 
                  sx={{ 
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    fontWeight: 700,
                    ...customStyles.pulseAnimation,
                  }} 
                />
                <Typography variant="body1" color="text.secondary">
                  Welcome back, Dr. Smith • {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={2}>
              <Tooltip title="Refresh data">
                <IconButton 
                  sx={{ 
                    color: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button 
                variant="contained" 
                startIcon={<AnalyticsIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                  boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                }}
              >
                Full Analytics
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Fade>
      
      {/* Enhanced Alert Banner */}
      <Grow in={true} timeout={800}>
        <Alert 
          severity="info" 
          sx={{ 
            mb: 4,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            backgroundColor: alpha(theme.palette.info.light, 0.05),
            '& .MuiAlert-icon': {
              color: theme.palette.info.main,
            },
          }}
        >
          <Typography variant="body2">
            <strong>System Update:</strong> New PROM templates have been added. AI-powered intake processing is now 40% faster.
          </Typography>
        </Alert>
      </Grow>

      {/* Enhanced Stats Grid with Medical Metrics */}
      <Fade in={true} timeout={1000}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <HealthMetric
              title="Today's Appointments"
              value={mockClinicStats.todayAppointments}
              icon={<CalendarIcon sx={{ fontSize: 28 }} />}
              color="primary"
              change={12}
              changeLabel="vs yesterday"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <HealthMetric
              title="Pending Intakes"
              value={mockClinicStats.pendingIntakes}
              icon={<AssignmentIcon sx={{ fontSize: 28 }} />}
              color="warning"
              change={-5}
              changeLabel="vs yesterday"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <HealthMetric
              title="Active Patients"
              value={mockClinicStats.activePatients}
              icon={<PeopleIcon sx={{ fontSize: 28 }} />}
              color="secondary"
              change={8}
              changeLabel="vs last week"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <HealthMetric
              title="Avg Wait Time"
              value={mockClinicStats.averageWaitTime}
              unit="min"
              icon={<AccessTimeIcon sx={{ fontSize: 28 }} />}
              color="success"
              change={-15}
              changeLabel="improvement"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <HealthMetric
              title="Completed Today"
              value={mockClinicStats.completedToday}
              icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
              color="success"
              change={20}
              changeLabel="vs yesterday"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={2}>
            <HealthMetric
              title="Patient Satisfaction"
              value={parseFloat(mockClinicStats.patientSatisfaction.toFixed(1))}
              icon={<StarIcon sx={{ fontSize: 28 }} />}
              color="warning"
              change={6}
              changeLabel="vs last month"
            />
          </Grid>
        </Grid>
      </Fade>

      {/* Enhanced Main Content Grid */}
      <Grid container spacing={3}>
        {/* Today's Appointments with Advanced Styling */}
        <Grid item xs={12} lg={4}>
          <Grow in={true} timeout={1200}>
            <Card sx={{ 
              height: '100%',
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.9)
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              ...customStyles.cardHover,
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      fontWeight="700"
                      sx={{ 
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      Today's Schedule
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {appointments.length} appointments scheduled
                    </Typography>
                  </Box>
                  <Box sx={{ position: 'relative' }}>
                    <Badge 
                      badgeContent={appointments.filter(a => a.status === 'scheduled').length} 
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          ...customStyles.pulseAnimation,
                        },
                      }}
                    >
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}>
                        <CalendarIcon />
                      </Avatar>
                    </Badge>
                  </Box>
                </Stack>
              
              <List sx={{ maxHeight: 400, overflow: 'auto', ...customStyles.scrollbar }}>
                {appointments.slice(0, 6).map((apt) => (
                  <ListItem
                    key={apt.id}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: apt.status === 'in-progress' ? 'action.selected' : 'transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: apt.telehealth ? '#7c3aed' : '#2563eb' }}>
                        {apt.telehealth ? <VideoCallIcon /> : <LocationIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" fontWeight="600">
                            {apt.patientName}
                          </Typography>
                          {apt.notes && (
                            <Tooltip title={apt.notes}>
                              <WarningIcon fontSize="small" color="warning" />
                            </Tooltip>
                          )}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="caption">
                            {apt.time} • {apt.type}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {apt.provider} • {apt.duration} min
                          </Typography>
                        </Stack>
                      }
                    />
                    <Chip
                      label={apt.status}
                      size="small"
                      color={
                        apt.status === 'completed' ? 'success' :
                        apt.status === 'in-progress' ? 'info' :
                        apt.status === 'cancelled' ? 'error' : 'default'
                      }
                      variant={apt.status === 'scheduled' ? 'outlined' : 'filled'}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                View Full Schedule
              </Button>
            </CardContent>
          </Card>
          </Grow>
        </Grid>

        {/* Charts Section */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Appointment Trends */}
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" fontWeight="bold">
                    Appointment Trends
                  </Typography>
                  <FormControl size="small">
                    <Select
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value)}
                    >
                      <MenuItem value="7d">Last 7 days</MenuItem>
                      <MenuItem value="30d">Last 30 days</MenuItem>
                      <MenuItem value="90d">Last 90 days</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="appointments"
                      stroke="#2563eb"
                      fillOpacity={1}
                      fill="url(#colorAppointments)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue & Performance Grid */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      PROM Completion Rates
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={mockPromData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="completionRate" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Diagnosis Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={mockDiagnosisData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {mockDiagnosisData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Activity
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto', ...customStyles.scrollbar }}>
                {activities.slice(0, 8).map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: activity.status === 'urgent' ? '#ef4444' :
                                  activity.status === 'new' ? '#10b981' :
                                  '#6b7280',
                          width: 36,
                          height: 36,
                        }}
                      >
                        {activity.type === 'intake' ? <AssignmentIcon fontSize="small" /> :
                         activity.type === 'appointment' ? <CalendarIcon fontSize="small" /> :
                         activity.patientName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="500">
                          {activity.patientName}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="caption">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {format(activity.timestamp, 'MMM d, h:mm a')}
                          </Typography>
                        </Stack>
                      }
                    />
                    {activity.priority && (
                      <Chip
                        label={activity.priority}
                        size="small"
                        color={
                          activity.priority === 'high' ? 'error' :
                          activity.priority === 'medium' ? 'warning' : 'default'
                        }
                        variant="outlined"
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Provider Performance */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Provider Performance Metrics
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="center">Current</TableCell>
                      <TableCell align="center">Target</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockProviderPerformance.map((metric) => (
                      <TableRow key={metric.metric}>
                        <TableCell>{metric.metric}</TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight="600">
                            {metric.value}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">{metric.target}%</TableCell>
                        <TableCell align="center">
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((metric.value / metric.target) * 100, 100)}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: metric.value >= metric.target ? 'success.main' : 'warning.main',
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Heatmap */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Weekly Activity Heatmap
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="morning" stackId="a" fill="#fcd34d" />
                  <Bar dataKey="afternoon" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="evening" stackId="a" fill="#d97706" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClinicDashboard;