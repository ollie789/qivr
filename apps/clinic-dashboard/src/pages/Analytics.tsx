import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  Tabs,
  Tab,
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
import { PainMapMetrics } from '@qivr/design-system';
import apiClient from '../lib/api-client';
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
import { DashboardSectionCard, FlexBetween, QivrButton, TableSection, PageHeader } from '@qivr/design-system';
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
  const [activeTab, setActiveTab] = useState(0);
  const [painAvatarType, setPainAvatarType] = useState('male');
  const [painViewOrientation, setPainViewOrientation] = useState('front');
  
  const user = useAuthUser();
  const { canMakeApiCalls } = useAuthGuard();
  const tenantId = user?.tenantId;

  const getDateRange = () => {
    const to = new Date();
    const days = parseInt(dateRange, 10) || 30;
    const from = subDays(to, days);
    return { from, to };
  };

  const { data: clinicAnalytics, isLoading, isFetching, refetch, error } = useQuery<ClinicAnalytics | null>({
    queryKey: ['clinicAnalytics', tenantId, dateRange],
    queryFn: async () => {
      if (!tenantId) {
        console.log('Analytics: No tenantId available');
        return null;
      }
      const { from, to } = getDateRange();
      console.log('Analytics: Fetching data for tenantId:', tenantId, 'from:', from, 'to:', to);
      const result = await analyticsApi.getClinicAnalytics(undefined, { from, to });
      console.log('Analytics: Received data:', result);
      return result;
    },
    enabled: canMakeApiCalls && Boolean(tenantId),
  });

  // Pain map analytics queries
  const { data: painHeatMap, isLoading: heatMapLoading } = useQuery({
    queryKey: ['painHeatMap', tenantId, dateRange, painAvatarType, painViewOrientation],
    queryFn: async () => {
      const { from, to } = getDateRange();
      return await apiClient.post('/api/pain-map-analytics/heatmap', {
        startDate: from.toISOString(),
        endDate: to.toISOString(),
        avatarType: painAvatarType,
        viewOrientation: painViewOrientation,
      });
    },
    enabled: canMakeApiCalls && Boolean(tenantId) && activeTab === 1,
  });

  const { data: painMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['painMetrics', tenantId, dateRange],
    queryFn: async () => {
      const { from, to } = getDateRange();
      return await apiClient.post('/api/pain-map-analytics/metrics', {
        startDate: from.toISOString(),
        endDate: to.toISOString(),
      });
    },
    enabled: canMakeApiCalls && Boolean(tenantId) && activeTab === 1,
  });

  const loading = isLoading || isFetching;

  const dashboardStats = useMemo(() => {
    const stats = buildDashboardStats(clinicAnalytics ?? undefined);
    console.log('Analytics: Dashboard stats:', stats);
    return stats;
  }, [clinicAnalytics]);

  const appointmentData = useMemo<AppointmentTrendDatum[]>(() => {
    if (!clinicAnalytics?.appointmentTrends) {
      console.log('Analytics: No appointment trends data');
      return [];
    }
    const data = clinicAnalytics.appointmentTrends.map((trend: AppointmentTrend) => ({
      name: format(new Date(trend.date), 'MMM d'),
      appointments: trend.appointments,
      completed: trend.completed,
      cancellations: trend.cancellations,
      noShows: trend.noShows,
      newPatients: trend.newPatients,
    }));
    console.log('Analytics: Appointment data:', data);
    return data;
  }, [clinicAnalytics]);

  const conditionData = useMemo<DiagnosisDatum[]>(() => {
    const diagnoses = clinicAnalytics?.topDiagnoses ?? [];
    const total = diagnoses.reduce((sum, item) => sum + item.count, 0) || 1;

    return diagnoses.slice(0, 5).map((diagnosis, index) => ({
      name: diagnosis.description,
      value: diagnosis.count,
      percentage: (diagnosis.count / total) * 100,
      color: [
        'var(--qivr-palette-primary-main)',
        'var(--qivr-palette-secondary-main)',
        'var(--qivr-palette-success-main)',
        'var(--qivr-palette-warning-main)',
        'var(--qivr-palette-neutral-500, #64748b)',
      ][index % 5],
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

  return (
    <Box>
      <PageHeader
        title="Analytics Dashboard"
        description="Track your clinic's performance and patient outcomes"
        actions={
          <FlexBetween sx={{ gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
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
            <QivrButton
              variant="outlined"
              emphasize="subtle"
              startIcon={loading ? <CircularProgress size={18} /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </QivrButton>
          </FlexBetween>
        }
      />

      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 3 }}>
        <Tab label="Clinic Overview" />
        <Tab label="Pain Analytics" />
      </Tabs>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load analytics: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      )}

      {clinicAnalytics == null && !loading && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a clinic to view analytics.
        </Alert>
      )}

      {activeTab === 0 && (
        <>
          <StatCardGrid items={statCards} sx={{ mb: 3 }} />

          <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
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

        <Grid size={{ xs: 12, md: 4 }}>
          <PromCompletionCard
            data={promCompletionData}
            summaryFormatter={(average, { isEmpty }) =>
              isEmpty ? 'No PROM data available' : `Average completion rate: ${average}%`
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TopDiagnosesCard
            title="Top Diagnoses"
            data={conditionData}
            emptyMessage="No diagnosis data available for the selected range"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TableSection
            header={<Typography variant="h6">Provider Performance</Typography>}
          >
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
          </TableSection>
        </Grid>

        <Grid size={12}>
          <DashboardSectionCard
            header={
              <FlexBetween>
                <Typography variant="h6">Revenue Overview</Typography>
                <QivrButton variant="outlined" size="small" startIcon={<DownloadIcon />} emphasize="subtle">
                  Export report
                </QivrButton>
              </FlexBetween>
            }
          >
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="var(--qivr-palette-primary-main)" />
                  <Line type="monotone" dataKey="expenses" stroke="var(--qivr-palette-error-main)" />
                </LineChart>
              </ResponsiveContainer>
          </DashboardSectionCard>
        </Grid>
      </Grid>
        </>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid size={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Avatar</InputLabel>
                  <Select
                    label="Avatar"
                    value={painAvatarType}
                    onChange={(e) => setPainAvatarType(e.target.value)}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="child">Child</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>View</InputLabel>
                  <Select
                    label="View"
                    value={painViewOrientation}
                    onChange={(e) => setPainViewOrientation(e.target.value)}
                  >
                    <MenuItem value="front">Front</MenuItem>
                    <MenuItem value="back">Back</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Grid>

          <Grid size={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Pain Region Heat Map
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Aggregated pain data from all patients showing most commonly affected regions
              </Typography>
              
              {heatMapLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : painHeatMap && painHeatMap.length > 0 ? (
                <Box sx={{ 
                  bgcolor: '#f5f5f5', 
                  borderRadius: 1, 
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    3D heat map visualization coming soon. Currently showing {painHeatMap.length} data points.
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info">
                  No pain map data available for the selected filters
                </Alert>
              )}
            </Paper>
          </Grid>

          <Grid size={12}>
            <PainMapMetrics data={painMetrics} loading={metricsLoading} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;
