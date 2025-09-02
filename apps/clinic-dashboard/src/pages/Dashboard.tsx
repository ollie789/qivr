import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Alert,
  Paper,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  RadarDataPoint,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useAuthStore } from '../stores/authStore';
import dashboardApi from '../services/dashboardApi';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chartPeriod, setChartPeriod] = React.useState('7d');

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: dashboardApi.getRecentActivity,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch today's appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: dashboardApi.getTodayAppointments,
    refetchInterval: 60000,
  });

  // Create stats array with real data
  const stats = statsData ? [
    { 
      title: 'Appointments Today', 
      value: statsData.todayAppointments.toString(), 
      icon: <CalendarIcon />, 
      color: '#2563eb' 
    },
    { 
      title: 'Pending Intakes', 
      value: statsData.pendingIntakes.toString(), 
      icon: <AssignmentIcon />, 
      color: '#f59e0b' 
    },
    { 
      title: 'Active Patients', 
      value: statsData.activePatients.toString(), 
      icon: <PeopleIcon />, 
      color: '#7c3aed' 
    },
    { 
      title: 'Avg Wait Time', 
      value: `${statsData.averageWaitTime} min`, 
      icon: <AccessTimeIcon />, 
      color: '#10b981' 
    },
    { 
      title: 'Completed Today', 
      value: statsData.completedToday.toString(), 
      icon: <CheckCircleIcon />, 
      color: '#10b981' 
    },
    { 
      title: 'Patient Satisfaction', 
      value: statsData.patientSatisfaction.toFixed(1), 
      icon: <StarIcon />, 
      color: '#f59e0b' 
    },
  ] : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name || 'Doctor'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Here's your clinic overview for today
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsLoading ? (
          // Loading skeletons
          [...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={80} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="text.secondary" variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5">
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          ))
        )}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Appointments
              </Typography>
              <List>
                {appointmentsLoading ? (
                  <Skeleton variant="rectangular" height={200} />
                ) : appointmentsData?.length ? (
                  appointmentsData.map((apt) => (
                    <ListItem key={apt.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar>{apt.patientName.split(' ').map(n => n[0]).join('')}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={apt.patientName}
                        secondary={`${apt.time} - ${apt.type}`}
                      />
                      <Chip
                        label={apt.status}
                        size="small"
                        color={
                          apt.status === 'completed' ? 'success' :
                          apt.status === 'in-progress' ? 'info' :
                          apt.status === 'scheduled' ? 'default' : 'warning'
                        }
                        variant="outlined"
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No appointments scheduled for today
                  </Typography>
                )}
              </List>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/appointments')}
              >
                View All Appointments
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Intakes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Intake Submissions
              </Typography>
              <List>
                {activityLoading ? (
                  <Skeleton variant="rectangular" height={200} />
                ) : activityData?.length ? (
                  activityData.filter(a => a.type === 'intake').slice(0, 3).map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: activity.status === 'urgent' ? '#ef4444' : '#6b7280' }}>
                          {activity.status === 'urgent' ? <WarningIcon /> : activity.patientName[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.patientName}
                        secondary={`${activity.description} • ${new Date(activity.timestamp).toLocaleTimeString()}`}
                      />
                      <Chip
                        label={activity.status || 'pending'}
                        size="small"
                        color={
                          activity.status === 'urgent' ? 'error' :
                          activity.status === 'pending' ? 'warning' : 'default'
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent intake submissions
                  </Typography>
                )}
              </List>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/intake-queue')}
              >
                Review Intake Queue
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Charts */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Patient Appointments Trend
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
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={[
                    { name: 'Mon', appointments: 12, completed: 10, cancelled: 2 },
                    { name: 'Tue', appointments: 15, completed: 14, cancelled: 1 },
                    { name: 'Wed', appointments: 18, completed: 15, cancelled: 3 },
                    { name: 'Thu', appointments: 14, completed: 12, cancelled: 2 },
                    { name: 'Fri', appointments: 20, completed: 18, cancelled: 2 },
                    { name: 'Sat', appointments: 8, completed: 7, cancelled: 1 },
                    { name: 'Sun', appointments: 5, completed: 5, cancelled: 0 },
                  ]}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="appointments" stroke="#2563eb" fillOpacity={1} fill="url(#colorAppointments)" />
                  <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* PROM Response Rate */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PROM Response Rate
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: 68, color: '#10b981' },
                      { name: 'In Progress', value: 15, color: '#f59e0b' },
                      { name: 'Not Started', value: 17, color: '#ef4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Completed', value: 68, color: '#10b981' },
                      { name: 'In Progress', value: 15, color: '#f59e0b' },
                      { name: 'Not Started', value: 17, color: '#ef4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Overall response rate: <strong>68%</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average completion time: <strong>8.5 min</strong>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Patient Conditions Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Patient Conditions Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    { condition: 'Hypertension', count: 45 },
                    { condition: 'Diabetes', count: 38 },
                    { condition: 'Asthma', count: 28 },
                    { condition: 'Arthritis', count: 22 },
                    { condition: 'Depression', count: 18 },
                    { condition: 'Anxiety', count: 15 },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="condition" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Clinic Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clinic Performance Metrics
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={[
                  { metric: 'Patient Satisfaction', value: 85 },
                  { metric: 'Wait Time', value: 75 },
                  { metric: 'PROM Completion', value: 68 },
                  { metric: 'Appointment Adherence', value: 90 },
                  { metric: 'Treatment Efficacy', value: 82 },
                  { metric: 'Staff Efficiency', value: 78 },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Activity Heatmap */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Activity Overview
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={[
                    { time: '8AM', Mon: 4, Tue: 3, Wed: 5, Thu: 4, Fri: 6, Sat: 2, Sun: 1 },
                    { time: '10AM', Mon: 12, Tue: 15, Wed: 14, Thu: 13, Fri: 16, Sat: 8, Sun: 4 },
                    { time: '12PM', Mon: 8, Tue: 10, Wed: 9, Thu: 11, Fri: 12, Sat: 5, Sun: 3 },
                    { time: '2PM', Mon: 15, Tue: 14, Wed: 16, Thu: 15, Fri: 14, Sat: 6, Sun: 2 },
                    { time: '4PM', Mon: 10, Tue: 12, Wed: 11, Thu: 10, Fri: 8, Sat: 3, Sun: 1 },
                    { time: '6PM', Mon: 5, Tue: 6, Wed: 5, Thu: 4, Fri: 3, Sat: 1, Sun: 0 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Mon" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="Tue" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="Wed" stroke="#ffc658" strokeWidth={2} />
                  <Line type="monotone" dataKey="Thu" stroke="#ff7c7c" strokeWidth={2} />
                  <Line type="monotone" dataKey="Fri" stroke="#8dd1e1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
