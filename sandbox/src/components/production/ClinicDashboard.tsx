import React, { useState } from 'react';
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
  LinearProgress,
  Stack,
  IconButton,
  Paper,
  alpha,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  LocalHospital as HospitalIcon,
  Assignment as ClipboardIcon,
  Star as StarIcon,
  Groups as GroupsIcon,
  Speed as SpeedIcon,
  Psychology as MoodIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';

interface StatCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const ClinicDashboard: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('today');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for clinic metrics
  const stats: StatCard[] = [
    {
      title: 'Today\'s Appointments',
      value: 28,
      change: 12,
      icon: <CalendarIcon />,
      color: theme.palette.primary.main,
      subtitle: '6 remaining',
    },
    {
      title: 'Active Providers',
      value: 12,
      icon: <HospitalIcon />,
      color: theme.palette.success.main,
      subtitle: '2 on break',
    },
    {
      title: 'Avg Wait Time',
      value: '18 min',
      change: -15,
      icon: <TimeIcon />,
      color: theme.palette.info.main,
      subtitle: '↓ from 21 min',
    },
    {
      title: 'Today\'s Revenue',
      value: '$8,450',
      change: 8.5,
      icon: <MoneyIcon />,
      color: theme.palette.success.main,
      subtitle: '62 transactions',
    },
    {
      title: 'Patient Satisfaction',
      value: '4.8',
      change: 2,
      icon: <StarIcon />,
      color: theme.palette.warning.main,
      subtitle: 'from 142 reviews',
    },
    {
      title: 'Bed Occupancy',
      value: '87%',
      change: 5,
      icon: <GroupsIcon />,
      color: theme.palette.secondary.main,
      subtitle: '26/30 beds',
    },
  ];

  // Mock appointment flow data
  const appointmentFlow = [
    { time: '8:00', scheduled: 4, completed: 3, noShow: 1 },
    { time: '9:00', scheduled: 6, completed: 5, noShow: 0 },
    { time: '10:00', scheduled: 8, completed: 7, noShow: 1 },
    { time: '11:00', scheduled: 7, completed: 6, noShow: 0 },
    { time: '12:00', scheduled: 3, completed: 3, noShow: 0 },
    { time: '1:00', scheduled: 4, completed: 2, noShow: 0 },
    { time: '2:00', scheduled: 6, completed: 4, noShow: 1 },
    { time: '3:00', scheduled: 5, completed: 0, noShow: 0 },
    { time: '4:00', scheduled: 4, completed: 0, noShow: 0 },
  ];

  // Mock provider performance data
  const providerPerformance = [
    { name: 'Dr. Smith', patients: 12, satisfaction: 95, efficiency: 88 },
    { name: 'Dr. Johnson', patients: 10, satisfaction: 92, efficiency: 85 },
    { name: 'Dr. Williams', patients: 14, satisfaction: 98, efficiency: 92 },
    { name: 'Dr. Brown', patients: 8, satisfaction: 89, efficiency: 78 },
    { name: 'Dr. Davis', patients: 11, satisfaction: 94, efficiency: 90 },
  ];

  // Mock department utilization
  const departmentUtilization = [
    { name: 'Emergency', value: 92, fill: theme.palette.error.main },
    { name: 'Cardiology', value: 78, fill: theme.palette.primary.main },
    { name: 'Orthopedics', value: 65, fill: theme.palette.info.main },
    { name: 'Pediatrics', value: 71, fill: theme.palette.success.main },
    { name: 'Radiology', value: 85, fill: theme.palette.warning.main },
  ];

  // Mock revenue breakdown
  const revenueBreakdown = [
    { name: 'Consultations', value: 45, color: theme.palette.primary.main },
    { name: 'Procedures', value: 30, color: theme.palette.secondary.main },
    { name: 'Lab Tests', value: 15, color: theme.palette.info.main },
    { name: 'Medications', value: 10, color: theme.palette.warning.main },
  ];

  // Mock upcoming appointments
  const upcomingAppointments = [
    {
      id: '1',
      patient: 'Sarah Johnson',
      time: '2:30 PM',
      type: 'Follow-up',
      provider: 'Dr. Smith',
      status: 'confirmed',
    },
    {
      id: '2',
      patient: 'Michael Chen',
      time: '3:00 PM',
      type: 'Consultation',
      provider: 'Dr. Johnson',
      status: 'waiting',
    },
    {
      id: '3',
      patient: 'Emma Wilson',
      time: '3:15 PM',
      type: 'Procedure',
      provider: 'Dr. Williams',
      status: 'in-progress',
    },
    {
      id: '4',
      patient: 'Robert Lee',
      time: '3:30 PM',
      type: 'Check-up',
      provider: 'Dr. Brown',
      status: 'confirmed',
    },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return theme.palette.success.main;
      case 'waiting': return theme.palette.warning.main;
      case 'in-progress': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckIcon fontSize="small" />;
      case 'waiting': return <TimeIcon fontSize="small" />;
      case 'in-progress': return <SpeedIcon fontSize="small" />;
      default: return null;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Clinic Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time clinic operations overview
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card
              sx={{
                height: '100%',
                background: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.background.paper, 0.9)
                  : theme.palette.background.paper,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Avatar
                      sx={{
                        bgcolor: alpha(stat.color, 0.1),
                        color: stat.color,
                        width: 40,
                        height: 40,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    {stat.change !== undefined && (
                      <Chip
                        label={`${stat.change > 0 ? '+' : ''}${stat.change}%`}
                        size="small"
                        sx={{
                          bgcolor: stat.change > 0 
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                          color: stat.change > 0 
                            ? theme.palette.success.main
                            : theme.palette.error.main,
                          fontSize: '0.7rem',
                          height: 22,
                        }}
                        icon={stat.change > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      />
                    )}
                  </Stack>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    {stat.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {stat.subtitle}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Appointment Flow Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Appointment Flow
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={appointmentFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="scheduled"
                  stackId="1"
                  stroke={theme.palette.primary.main}
                  fill={alpha(theme.palette.primary.main, 0.6)}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="2"
                  stroke={theme.palette.success.main}
                  fill={alpha(theme.palette.success.main, 0.6)}
                />
                <Area
                  type="monotone"
                  dataKey="noShow"
                  stackId="2"
                  stroke={theme.palette.error.main}
                  fill={alpha(theme.palette.error.main, 0.6)}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Revenue Breakdown */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Revenue Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Provider Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Provider Performance
            </Typography>
            <List>
              {providerPerformance.map((provider, index) => (
                <ListItem
                  key={index}
                  sx={{
                    mb: 1,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    borderRadius: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      {provider.name.split(' ')[1][0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={provider.name}
                    secondary={`${provider.patients} patients today`}
                  />
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Satisfaction
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {provider.satisfaction}%
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Efficiency
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {provider.efficiency}%
                      </Typography>
                    </Box>
                  </Stack>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Upcoming Appointments
            </Typography>
            <List>
              {upcomingAppointments.map((apt) => (
                <ListItem
                  key={apt.id}
                  sx={{
                    mb: 1,
                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                    borderRadius: 1,
                    borderLeft: `3px solid ${getStatusColor(apt.status)}`,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: alpha(getStatusColor(apt.status), 0.1) }}>
                      {getStatusIcon(apt.status)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2">
                          {apt.patient}
                        </Typography>
                        <Chip
                          label={apt.type}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={2}>
                        <Typography variant="caption">
                          {apt.time} • {apt.provider}
                        </Typography>
                      </Stack>
                    }
                  />
                  <Chip
                    label={apt.status}
                    size="small"
                    sx={{
                      bgcolor: alpha(getStatusColor(apt.status), 0.1),
                      color: getStatusColor(apt.status),
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Department Utilization */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Department Utilization
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={departmentUtilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {departmentUtilization.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ClinicDashboard;