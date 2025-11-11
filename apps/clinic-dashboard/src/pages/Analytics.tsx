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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { useAuthGuard } from '../hooks/useAuthGuard';
import analyticsApi, {
  ClinicAnalytics,
  AppointmentTrend,
  PromCompletionBreakdown,
} from '../services/analyticsApi';
import {
  AppointmentTrendCard,
  PromCompletionCard,
  StatCardGrid,
  TopDiagnosesCard,
} from '../features/analytics';
import type {
  AppointmentTrendDatum,
  DiagnosisDatum,
  PromCompletionDatum,
  StatCardItem,
} from '../features/analytics';
import { useAuthUser } from '../stores/authStore';

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
  const user = useAuthUser();
  const { canMakeApiCalls } = useAuthGuard();
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
      return analyticsApi.getClinicAnalytics(undefined, { from, to });
    },
    enabled: canMakeApiCalls && Boolean(clinicId),
  });

  const dashboardStats = useMemo(() => buildDashboardStats(clinicAnalytics ?? undefined), [clinicAnalytics]);

  const appointmentData = useMemo<AppointmentTrendDatum[]>(() => {
    if (!clinicAnalytics?.appointmentTrends) {
      return [];
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

  const conditionData = useMemo<DiagnosisDatum[]>(() => {
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

  const promCompletionData = useMemo<PromCompletionDatum[]>(() => {
    const breakdown = clinicAnalytics?.promCompletionBreakdown ?? [];
    if (breakdown.length === 0) {
      return [];
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

  const statCards: StatCardItem[] = [
    {
      id: 'total-patients',
      title: 'Total Patients',
      value: dashboardStats.activePatients.toLocaleString(),
      change: 12.5,
      icon: <PeopleIcon />,
      avatarColor: 'primary.main',
    },
    {
      id: 'appointments-period',
      title: 'Appointments This Period',
      value: clinicAnalytics
        ? clinicAnalytics.appointmentMetrics.totalScheduled.toLocaleString()
        : dashboardStats.todayAppointments.toLocaleString(),
      change: 8.3,
      icon: <CalendarIcon />,
      avatarColor: 'secondary.main',
    },
    {
      id: 'revenue',
      title: 'Revenue',
      value: clinicAnalytics
        ? `$${clinicAnalytics.revenueMetrics.totalCollected.toLocaleString()}`
        : '$0',
      change: 15.2,
      icon: <MoneyIcon />,
      avatarColor: 'success.main',
    },
    {
      id: 'patient-satisfaction',
      title: 'Patient Satisfaction',
      value: `${dashboardStats.patientSatisfaction.toFixed(1)}/5`,
      change: 2.1,
      icon: <AssessmentIcon />,
      avatarColor: 'warning.main',
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
            Track your clinic&apos;s performance and patient outcomes
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

      <StatCardGrid items={statCards} sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <AppointmentTrendCard
            data={appointmentData}
            showLegend
            headerAction={
              <Typography variant="body2" color="text.secondary">
                Showing {appointmentData.length} data points
              </Typography>
            }
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <PromCompletionCard
            data={promCompletionData}
            summaryFormatter={(average, { isEmpty }) =>
              isEmpty ? 'No PROM data available' : `Average completion rate: ${average}%`
            }
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TopDiagnosesCard
            title="Top Diagnoses"
            data={conditionData}
            loading={loading}
            emptyMessage="No diagnosis data available for the selected range"
            xAxisAngle={-15}
          />
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
