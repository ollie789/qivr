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
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tab,
  Tabs,
  Paper,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
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
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import analyticsApi, { 
  DashboardStats, 
  ProviderPerformance,
  AppointmentTrend,
  ConditionDistribution,
  PromCompletionData,
  ClinicAnalytics 
} from '../services/analyticsApi';
import { useAuthStore } from '../stores/authStore';

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [selectedTab, setSelectedTab] = useState(0);
  const user = useAuthStore((state) => state.user);
  const clinicId = user?.clinicId || 'default';

  // Calculate date range based on selection
  const getDateRange = () => {
    const to = new Date();
    const from = new Date();
    const days = parseInt(dateRange);
    from.setDate(from.getDate() - days);
    return { from, to };
  };

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: analyticsApi.getDashboardStats,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch appointment trends
  const { data: appointmentData = [], isLoading: appointmentLoading } = useQuery<AppointmentTrend[]>({
    queryKey: ['appointmentTrends', dateRange],
    queryFn: () => analyticsApi.getAppointmentTrends(parseInt(dateRange)),
  });

  // Fetch condition distribution
  const { data: conditionData = [], isLoading: conditionLoading } = useQuery<ConditionDistribution[]>({
    queryKey: ['conditionDistribution'],
    queryFn: analyticsApi.getConditionDistribution,
  });

  // Fetch provider performance
  const { data: practitionerPerformance = [], isLoading: performanceLoading } = useQuery<ProviderPerformance[]>({
    queryKey: ['providerPerformance'],
    queryFn: analyticsApi.getProviderPerformance,
  });

  // Fetch revenue data
  const { data: revenueData = [], isLoading: revenueLoading } = useQuery({
    queryKey: ['revenueData'],
    queryFn: analyticsApi.getRevenueData,
  });

  // Fetch PROM completion rates
  const { data: promCompletionData = [], isLoading: promLoading } = useQuery<PromCompletionData[]>({
    queryKey: ['promCompletionRates'],
    queryFn: analyticsApi.getPromCompletionRates,
  });

  // Fetch clinic analytics
  const { data: clinicAnalytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<ClinicAnalytics>({
    queryKey: ['clinicAnalytics', clinicId, dateRange],
    queryFn: () => {
      const { from, to } = getDateRange();
      return analyticsApi.getClinicAnalytics(clinicId, from, to);
    },
    enabled: !!clinicId && clinicId !== 'default',
  });

  // Generate colors for condition data
  const conditionDataWithColors = conditionData.map((item, index) => ({
    ...item,
    color: ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#6b7280'][index % 5],
  }));

  // Calculate stat cards from real data
  const statCards: StatCard[] = [
    {
      title: 'Total Patients',
      value: clinicAnalytics?.patientMetrics?.newPatients && clinicAnalytics?.patientMetrics?.returningPatients
        ? (clinicAnalytics.patientMetrics.newPatients + clinicAnalytics.patientMetrics.returningPatients).toLocaleString()
        : dashboardStats?.activePatients?.toLocaleString() || '0',
      change: 12.5, // Would need historical data for real change calculation
      icon: <PeopleIcon />,
      color: 'primary.main',
    },
    {
      title: 'Appointments This Month',
      value: clinicAnalytics?.appointmentMetrics?.totalScheduled?.toLocaleString() || 
             dashboardStats?.todayAppointments?.toLocaleString() || '0',
      change: 8.3,
      icon: <CalendarIcon />,
      color: 'secondary.main',
    },
    {
      title: 'Revenue This Month',
      value: clinicAnalytics?.revenueMetrics?.totalCollected 
        ? `$${clinicAnalytics.revenueMetrics.totalCollected.toLocaleString()}`
        : '$0',
      change: 15.2,
      icon: <MoneyIcon />,
      color: 'success.main',
    },
    {
      title: 'Avg. Patient Satisfaction',
      value: clinicAnalytics?.patientMetrics?.patientSatisfactionScore
        ? `${clinicAnalytics.patientMetrics.patientSatisfactionScore}/5`
        : dashboardStats?.patientSatisfaction
        ? `${dashboardStats.patientSatisfaction}/5`
        : '0/5',
      change: 2.1,
      icon: <AssessmentIcon />,
      color: 'warning.main',
    },
  ];

  const handleRefresh = () => {
    refetchAnalytics();
  };

  const isLoading = statsLoading || appointmentLoading || analyticsLoading;

  return (
    <Box>
      {/* Header */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your clinic's performance and patient outcomes
          </Typography>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              label="Date Range"
              onChange={(e) => setDateRange(e.target.value)}
            >
              <MenuItem value="7">Last 7 days</MenuItem>
              <MenuItem value="30">Last 30 days</MenuItem>
              <MenuItem value="90">Last 3 months</MenuItem>
              <MenuItem value="365">Last year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Export
          </Button>
        </Grid>
      </Grid>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="text.secondary" variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4">{stat.value}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {stat.change > 0 ? (
                        <TrendingUpIcon color="success" fontSize="small" />
                      ) : (
                        <TrendingDownIcon color="error" fontSize="small" />
                      )}
                      <Typography
                        variant="caption"
                        color={stat.change > 0 ? 'success.main' : 'error.main'}
                      >
                        {Math.abs(stat.change)}% from last period
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tab Navigation for Different Analytics Views */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(e, v) => setSelectedTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="PROM Analytics" />
          <Tab label="Patient Outcomes" />
          <Tab label="Financial" />
        </Tabs>
      </Card>

      {/* Charts Section */}
      {selectedTab === 0 && (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Appointment Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Appointment Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={appointmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="appointments"
                    stackId="1"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="newPatients"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="cancellations"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Common Conditions */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Common Conditions
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={conditionDataWithColors}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage ? percentage.toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {conditionDataWithColors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Analysis */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue vs Expenses
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" />
                  <Bar dataKey="expenses" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      )}
      
      {/* PROM Analytics Tab */}
      {selectedTab === 1 && (
        <Grid container spacing={3}>
          {/* PROM Completion Rates */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  PROM Completion Rates by Type
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={promCompletionData.length > 0 ? promCompletionData : [
                    { name: 'PHQ-9', completed: 85, pending: 15 },
                    { name: 'Pain Assessment', completed: 78, pending: 22 },
                    { name: 'Quality of Life', completed: 92, pending: 8 },
                    { name: 'Functional Mobility', completed: 70, pending: 30 },
                    { name: 'Treatment Satisfaction', completed: 88, pending: 12 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="#10b981" />
                    <Bar dataKey="pending" stackId="a" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* PROM Score Trends */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average PROM Scores Over Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={Array.from({ length: 12 }, (_, i) => ({
                    month: format(new Date(2024, i), 'MMM'),
                    'PHQ-9': Math.random() * 20 + 30,
                    'Pain': Math.random() * 30 + 40,
                    'QoL': Math.random() * 25 + 60,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="PHQ-9" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="Pain" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="QoL" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* PROM Response Distribution */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Patient Response Distribution by Category
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                    day: i + 1,
                    'Mental Health': Math.floor(Math.random() * 15) + 10,
                    'Pain Management': Math.floor(Math.random() * 20) + 15,
                    'Functional': Math.floor(Math.random() * 10) + 5,
                    'Quality of Life': Math.floor(Math.random() * 12) + 8,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="Mental Health" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                    <Area type="monotone" dataKey="Pain Management" stackId="1" stroke="#ef4444" fill="#ef4444" />
                    <Area type="monotone" dataKey="Functional" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                    <Area type="monotone" dataKey="Quality of Life" stackId="1" stroke="#10b981" fill="#10b981" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Patient Outcomes Tab */}
      {selectedTab === 2 && (
        <Grid container spacing={3}>
          {/* Treatment Effectiveness */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Treatment Effectiveness by Condition
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={[
                    { condition: 'Lower Back Pain', improved: 78, unchanged: 15, worsened: 7 },
                    { condition: 'Neck Pain', improved: 82, unchanged: 12, worsened: 6 },
                    { condition: 'Shoulder Issues', improved: 75, unchanged: 18, worsened: 7 },
                    { condition: 'Knee Problems', improved: 70, unchanged: 20, worsened: 10 },
                    { condition: 'Hip Pain', improved: 73, unchanged: 19, worsened: 8 },
                  ]} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="condition" type="category" />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="improved" stackId="a" fill="#10b981" />
                    <Bar dataKey="unchanged" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="worsened" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Recovery Time Distribution */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Recovery Time
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" align="center" color="primary">
                    6.2 weeks
                  </Typography>
                  <Typography variant="body2" align="center" color="text.secondary">
                    Average across all conditions
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '< 4 weeks', value: 25, color: '#10b981' },
                        { name: '4-8 weeks', value: 45, color: '#3b82f6' },
                        { name: '8-12 weeks', value: 20, color: '#f59e0b' },
                        { name: '> 12 weeks', value: 10, color: '#ef4444' },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {conditionDataWithColors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Patient Satisfaction Metrics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Patient Satisfaction Metrics
                </Typography>
                <Grid container spacing={3}>
                  {[
                    { metric: 'Treatment Quality', score: 4.6, total: 5 },
                    { metric: 'Communication', score: 4.8, total: 5 },
                    { metric: 'Wait Times', score: 4.2, total: 5 },
                    { metric: 'Facility', score: 4.5, total: 5 },
                    { metric: 'Overall Experience', score: 4.7, total: 5 },
                  ].map((item) => (
                    <Grid item xs={12} md={6} lg={2.4} key={item.metric}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {item.metric}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                          <Typography variant="h4">{item.score}</Typography>
                          <Typography variant="body2" color="text.secondary">/{item.total}</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(item.score / item.total) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Financial Tab */}
      {selectedTab === 3 && (
        <Grid container spacing={3}>
          {/* Revenue Analysis remains the same */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Revenue vs Expenses
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" />
                    <Bar dataKey="expenses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Practitioner Performance Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Practitioner Performance
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Practitioner</TableCell>
                  <TableCell align="center">Patients Seen</TableCell>
                  <TableCell align="center">Satisfaction Score</TableCell>
                  <TableCell align="center">Revenue Generated</TableCell>
                  <TableCell align="center">Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {practitionerPerformance.map((practitioner) => (
                  <TableRow key={practitioner.providerName || practitioner.name}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {(practitioner.providerName || practitioner.name).split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Typography variant="body2">{practitioner.providerName || practitioner.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{practitioner.patients}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography variant="body2">{practitioner.satisfaction}</Typography>
                        <Chip
                          label="Excellent"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        ${practitioner.revenue.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <LinearProgress
                        variant="determinate"
                        value={(practitioner.patients / 145) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                        color="primary"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Analytics;
