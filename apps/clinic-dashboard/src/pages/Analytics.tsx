import React, { useMemo, useState } from 'react';
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
  ClinicAnalytics,
  AppointmentTrend,
  ProviderPerformance,
  PromCompletionBreakdown,
} from '../services/analyticsApi';
import { useAuthStore } from '../stores/authStore';

interface StatCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

const buildDashboardStats = (analytics?: ClinicAnalytics | null) => {
  if (!analytics) {
    return {
      todayAppointments: 0,
      pendingIntakes: 0,
      activePatients: 0,
      completedToday: 0,
      averageWaitTime: 0,
      patientSatisfaction: 0,
    };
  }

  const totalPatients =
    analytics.patientMetrics.newPatients + analytics.patientMetrics.returningPatients;

  return {
    todayAppointments: analytics.appointmentMetrics.totalScheduled,
    pendingIntakes: Math.max(analytics.promMetrics.totalSent - analytics.promMetrics.completed, 0),
    activePatients: totalPatients,
    completedToday: analytics.appointmentMetrics.completed,
    averageWaitTime: analytics.appointmentMetrics.averageWaitTime,
    patientSatisfaction: analytics.patientMetrics.patientSatisfactionScore,
  };
};

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');
  const [selectedTab, setSelectedTab] = useState(0);
  const user = useAuthStore((state) => state.user);
  const clinicId = user?.clinicId;

  const getDateRange = () => {
    const to = new Date();
    const days = parseInt(dateRange, 10) || 30;
    const from = subDays(to, days);
    return { from, to };
  };

  const { data: clinicAnalytics, isLoading, isFetching, refetch } = useQuery<ClinicAnalytics | null>({
    queryKey: ['clinicAnalytics', clinicId, dateRange],
    queryFn: async () => {
      if (!clinicId) {
        return null;
      }
      const { from, to } = getDateRange();
      return analyticsApi.getClinicAnalytics(clinicId, { from, to });
    },
    enabled: Boolean(clinicId),
  });

  const dashboardStats = useMemo(() => buildDashboardStats(clinicAnalytics ?? undefined), [clinicAnalytics]);

  const appointmentData = useMemo(() => {
    if (!clinicAnalytics?.appointmentTrends) {
      return [] as Array<Record<string, any>>;
    }
    return clinicAnalytics.appointmentTrends.map((trend: AppointmentTrend) => ({
      name: format(new Date(trend.date), 'MMM d'),
      appointments: trend.appointments,
      completed: trend.completed,
      cancellations: trend.cancellations,
      noShows: trend.noShows,
      newPatients: trend.newPatients,
    }));
  }, [clinicAnalytics]);

  const conditionData = useMemo(() => {
    const diagnoses = clinicAnalytics?.topDiagnoses ?? [];
    const total = diagnoses.reduce((sum, item) => sum + item.count, 0) || 1;

    return diagnoses.slice(0, 5).map((diagnosis, index) => ({
      name: diagnosis.description,
      value: diagnosis.count,
      percentage: (diagnosis.count / total) * 100,
      color: ['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#6b7280'][index % 5],
    }));
  }, [clinicAnalytics]);

  const practitionerPerformance = useMemo(() => clinicAnalytics?.providerPerformance ?? [], [clinicAnalytics]);

  const promCompletionData = useMemo(() => {
    const breakdown = clinicAnalytics?.promCompletionBreakdown ?? [];
    if (breakdown.length === 0) {
      return [] as { name: string; completed: number; pending: number; completionRate: number }[];
    }
    return breakdown.map((item: PromCompletionBreakdown) => ({
      name: item.templateName,
      completed: Math.round(item.completionRate),
      pending: 100 - Math.round(item.completionRate),
      completionRate: item.completionRate,
    }));
  }, [clinicAnalytics]);

  const revenueData = useMemo(() => {
    if (!clinicAnalytics) {
      return [] as { month: string; revenue: number; expenses: number }[];
    }
    const { revenueMetrics } = clinicAnalytics;
    const expenses = Math.max(revenueMetrics.totalBilled - revenueMetrics.totalCollected, 0);
    return [
      {
        month: format(new Date(), 'MMM yyyy'),
        revenue: revenueMetrics.totalCollected,
        expenses,
      },
    ];
  }, [clinicAnalytics]);

  const statCards: StatCard[] = [
    {
      title: 'Total Patients',
      value: dashboardStats.activePatients.toLocaleString(),
      change: 12.5,
      icon: <PeopleIcon />,
      color: 'primary.main',
    },
    {
      title: 'Appointments This Period',
      value: clinicAnalytics
        ? clinicAnalytics.appointmentMetrics.totalScheduled.toLocaleString()
        : dashboardStats.todayAppointments.toLocaleString(),
      change: 8.3,
      icon: <CalendarIcon />,
      color: 'secondary.main',
    },
    {
      title: 'Revenue',
      value: clinicAnalytics
        ? `$${clinicAnalytics.revenueMetrics.totalCollected.toLocaleString()}`
        : '$0',
      change: 15.2,
      icon: <MoneyIcon />,
      color: 'success.main',
    },
    {
      title: 'Patient Satisfaction',
      value: `${dashboardStats.patientSatisfaction.toFixed(1)}/5`,
      change: 2.1,
      icon: <AssessmentIcon />,
      color: 'warning.main',
    },
  ];

  const handleRefresh = () => {
    refetch();
  };

  const loading = isLoading || isFetching;

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your clinic's performance and patient outcomes
          </Typography>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
            <InputLabel>Range</InputLabel>
            <Select
              label="Range"
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
            >
              <MenuItem value="7">7 days</MenuItem>
              <MenuItem value="30">30 days</MenuItem>
              <MenuItem value="90">90 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={18} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {clinicAnalytics == null && !loading && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a clinic to view analytics.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5">{stat.value}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: stat.color }}>{stat.icon}</Avatar>
                </Box>
                <Chip
                  icon={stat.change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  label={`${Math.abs(stat.change)}%`}
                  color={stat.change >= 0 ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Patient Appointments Trend</Typography>
                <Typography variant="body2" color="text.secondary">
                  Showing {appointmentData.length} data points
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={appointmentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="appointments" stroke="#2563eb" fillOpacity={1} fill="url(#colorAppointments)" />
                  <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PROM Response Rate
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={(promCompletionData.length > 0
                      ? promCompletionData.map((item) => ({
                          name: item.name,
                          value: item.completed,
                          color:
                            item.completed >= 85 ? '#10b981' : item.completed >= 60 ? '#f59e0b' : '#ef4444',
                        }))
                      : [{ name: 'No Data', value: 100, color: '#e5e7eb' }])}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => (entry.name !== 'No Data' ? `${entry.name}: ${entry.value}%` : '')}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {(promCompletionData.length > 0
                      ? promCompletionData.map((item) => ({
                          color:
                            item.completed >= 85 ? '#10b981' : item.completed >= 60 ? '#f59e0b' : '#ef4444',
                        }))
                      : [{ color: '#e5e7eb' }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {promCompletionData.length > 0
                    ? `Average completion rate: ${Math.round(
                        promCompletionData.reduce((sum, item) => sum + item.completed, 0) /
                          promCompletionData.length,
                      )}%`
                    : 'No PROM data available'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Diagnoses
              </Typography>
              {conditionData.length === 0 ? (
                <Skeleton variant="rectangular" height={240} />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={conditionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="percentage">
                      {conditionData.map((item, index) => (
                        <Cell key={`bar-${index}`} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Provider Performance
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Provider</TableCell>
                      <TableCell align="right">Patients</TableCell>
                      <TableCell align="right">Completed</TableCell>
                      <TableCell align="right">No-Show %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {practitionerPerformance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No provider data available for the selected range
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      practitionerPerformance.map((provider) => (
                        <TableRow key={provider.providerId}>
                          <TableCell>{provider.providerName}</TableCell>
                          <TableCell align="right">{provider.patients}</TableCell>
                          <TableCell align="right">{provider.appointmentsCompleted}</TableCell>
                          <TableCell align="right">{provider.noShowRate.toFixed(2)}%</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Revenue Overview</Typography>
                <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>
                  Export report
                </Button>
              </Box>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
