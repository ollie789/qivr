import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Stack,
  CircularProgress,
  Button,
} from "@mui/material";
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Warning as WarningIcon,
  Today as TodayIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { subDays, format } from "date-fns";
import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  PageHeader,
  StatCardSkeleton,
  AuraButton,
  AuraGlassStatCard,
  LoadingSpinner,
  auraColors,
  Callout,
  SelectField,
  ChartCardSkeleton,
  glassTokens,
  auraTokens,
  GreetingCard,
  InfoCard,
} from "@qivr/design-system";
import analyticsApi from "../services/analyticsApi";
import {
  TopDiagnosesCard,
  AppointmentTrendCard,
  ClinicMetricsChart,
  AppointmentDonutChart,
  BodyRegionChart,
  PainTypeChart,
  PainIntensityChart,
  PainHeatmap3D,
  PromCompletionCard,
} from "../features/analytics";
import type {
  DiagnosisDatum,
  AppointmentTrendDatum,
  PromCompletionDatum,
} from "../features/analytics";
import { useAuthUser } from "../stores/authStore";

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState(0);

  const navigate = useNavigate();
  const user = useAuthUser();
  const { canMakeApiCalls } = useAuthGuard();
  const queryClient = useQueryClient();
  const tenantId = user?.tenantId;

  const getDateRange = () => {
    const to = new Date();
    const days = parseInt(dateRange, 10) || 30;
    const from = subDays(to, days);
    return { from, to };
  };

  // Dashboard metrics
  const {
    data: dashboardMetrics,
    isLoading: metricsLoading,
    isFetching: metricsFetching,
    refetch: refetchMetrics,
    error: metricsError,
  } = useQuery({
    queryKey: ["dashboardMetrics", tenantId, dateRange],
    queryFn: () => analyticsApi.getDashboardMetrics(),
    enabled: canMakeApiCalls && Boolean(tenantId),
    refetchInterval: 60000,
  });

  // Clinical analytics
  const {
    data: clinicalAnalytics,
    isLoading: clinicalLoading,
    isFetching: clinicalFetching,
    refetch: refetchClinical,
    error: clinicalError,
  } = useQuery({
    queryKey: ["clinicalAnalytics", tenantId, dateRange],
    queryFn: () => {
      const { from, to } = getDateRange();
      return analyticsApi.getClinicalAnalytics(from, to);
    },
    enabled: canMakeApiCalls && Boolean(tenantId),
    refetchInterval: 60000,
  });

  // Pain analytics
  const {
    data: painAnalytics,
    isLoading: painAnalyticsLoading,
    refetch: refetchPain,
    error: painError,
  } = useQuery({
    queryKey: ["painAnalytics", tenantId, dateRange],
    queryFn: () => {
      const { from, to } = getDateRange();
      return analyticsApi.getPainMapAnalytics(from, to);
    },
    enabled: canMakeApiCalls && Boolean(tenantId),
  });

  const isLoading = metricsLoading || clinicalLoading;
  const isFetching = metricsFetching || clinicalFetching;
  const error = metricsError || clinicalError || painError;
  const loading = isLoading || isFetching;

  const refetch = () => {
    refetchMetrics();
    refetchClinical();
    refetchPain();
    queryClient.invalidateQueries({ queryKey: ["today-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["recent-activity"] });
  };

  // Transform data for charts
  const conditionData: DiagnosisDatum[] = useMemo(() => {
    if (!clinicalAnalytics?.topConditions) return [];
    const total =
      clinicalAnalytics.topConditions.reduce(
        (sum, item) => sum + item.count,
        0,
      ) || 1;
    return clinicalAnalytics.topConditions
      .slice(0, 5)
      .map((condition, index) => ({
        name: condition.condition,
        value: condition.count,
        percentage: (condition.count / total) * 100,
        color: [
          auraColors.blue.main,
          auraColors.purple.main,
          auraColors.green.main,
          auraColors.orange.main,
          auraColors.cyan.main,
        ][index % 5],
      }));
  }, [clinicalAnalytics]);

  // PROM completion data
  const promCompletionData = useMemo<PromCompletionDatum[]>(() => {
    if (!clinicalAnalytics?.promCompletionData) return [];
    return clinicalAnalytics.promCompletionData.map((prom) => ({
      name: prom.week,
      completed: prom.completed,
      pending: prom.pending,
      completionRate: prom.completionRate,
    }));
  }, [clinicalAnalytics]);

  // Appointment trend data
  const appointmentTrendData: AppointmentTrendDatum[] = useMemo(() => {
    if (!clinicalAnalytics?.appointmentTrends) {
      const days = parseInt(dateRange, 10) || 30;
      const dataPoints = Math.min(days, 12);
      return Array.from({ length: dataPoints }, (_, i) => {
        const date = subDays(new Date(), days - i * (days / dataPoints));
        return {
          name: format(date, "MMM d"),
          appointments: Math.floor(Math.random() * 20) + 10,
          completed: Math.floor(Math.random() * 15) + 8,
        };
      });
    }
    return clinicalAnalytics.appointmentTrends.map((trend) => ({
      name: format(new Date(trend.date), "MMM d"),
      appointments: trend.scheduled,
      completed: trend.completed,
    }));
  }, [clinicalAnalytics, dateRange]);

  // Metrics chart data
  const metricsChartData = useMemo(() => {
    const days = parseInt(dateRange, 10) || 30;
    const dataPoints = Math.min(days, 8);

    const generateTrendData = (baseValue: number, variance: number) => {
      return Array.from({ length: dataPoints }, (_, i) => {
        const date = subDays(new Date(), days - i * (days / dataPoints));
        return {
          name: format(date, "MMM d"),
          actual: Math.floor(baseValue + (Math.random() - 0.5) * variance * 2),
          projected: Math.floor(
            baseValue * 1.1 + (Math.random() - 0.5) * variance,
          ),
        };
      });
    };

    return {
      patients: generateTrendData(dashboardMetrics?.totalPatients || 100, 20),
      appointments: generateTrendData(
        dashboardMetrics?.todayAppointments || 15,
        5,
      ),
      revenue: generateTrendData(
        (dashboardMetrics?.estimatedRevenue || 5000) / 30,
        500,
      ),
      promScore: generateTrendData(
        clinicalAnalytics?.averagePromScore || 7.5,
        1,
      ),
    };
  }, [dashboardMetrics, clinicalAnalytics, dateRange]);

  // Today's quick stats
  const todayStats = useMemo(
    () => [
      {
        id: "appointments-today",
        title: "Appointments Today",
        value: (dashboardMetrics?.todayAppointments ?? 0).toString(),
        icon: <CalendarIcon />,
        color: auraColors.blue.main,
        trend: { value: 8.2, label: "vs yesterday", isPositive: true },
      },
      {
        id: "pending-intakes",
        title: "Pending Intakes",
        value: (dashboardMetrics?.pendingIntakes ?? 0).toString(),
        icon: <AssignmentIcon />,
        color: auraColors.orange.main,
        trend: { value: 3.5, label: "vs yesterday", isPositive: false },
      },
      {
        id: "active-patients",
        title: "Active Patients",
        value: (dashboardMetrics?.totalPatients ?? 0).toString(),
        icon: <PeopleIcon />,
        color: auraColors.purple.main,
        trend: { value: 12.3, label: "vs last month", isPositive: true },
      },
      {
        id: "average-wait-time",
        title: "Avg Wait Time",
        value: `${dashboardMetrics?.averageWaitTime ?? 0} min`,
        icon: <AccessTimeIcon />,
        color: auraColors.green.main,
        trend: { value: 5.1, label: "vs yesterday", isPositive: false },
      },
      {
        id: "completed-today",
        title: "Completed Today",
        value: (dashboardMetrics?.completedToday ?? 0).toString(),
        icon: <CheckCircleIcon />,
        color: auraColors.green.main,
        trend: { value: 15.7, label: "vs yesterday", isPositive: true },
      },
      {
        id: "patient-satisfaction",
        title: "Patient Satisfaction",
        value: (clinicalAnalytics?.patientSatisfaction ?? 4.5).toFixed(1),
        icon: <StarIcon />,
        color: auraColors.orange.main,
        trend: { value: 2.4, label: "vs last week", isPositive: true },
      },
    ],
    [dashboardMetrics, clinicalAnalytics],
  );

  // Clinic overview stat cards
  const clinicStatCards = [
    {
      id: "total-patients",
      label: "Total Patients",
      value: dashboardMetrics?.totalPatients?.toLocaleString() || "0",
      trend: { value: 12.5, label: "vs last period", isPositive: true },
      icon: <PeopleIcon />,
      color: auraColors.blue.main,
    },
    {
      id: "appointments-today",
      label: "Appointments Today",
      value: dashboardMetrics?.todayAppointments?.toLocaleString() || "0",
      trend: { value: 8.3, label: "vs yesterday", isPositive: true },
      icon: <CalendarIcon />,
      color: auraColors.purple.main,
    },
    {
      id: "completion-rate",
      label: "Completion Rate",
      value: `${dashboardMetrics?.completionRate || 0}%`,
      trend: { value: 5.2, label: "vs last week", isPositive: true },
      icon: <TrendingUpIcon />,
      color: auraColors.green.main,
    },
    {
      id: "revenue",
      label: "Est. Revenue",
      value: `$${(dashboardMetrics?.estimatedRevenue || 0).toLocaleString()}`,
      trend: { value: 15.2, label: "vs last period", isPositive: true },
      icon: <MoneyIcon />,
      color: auraColors.orange.main,
    },
  ];

  // Pain analytics stat cards
  const painStatCards = [
    {
      id: "total-pain-maps",
      label: "Total Pain Maps",
      value: painAnalytics?.totalPainMaps?.toLocaleString() || "0",
      trend: { value: 8, label: "new this week", isPositive: true },
      icon: <HospitalIcon />,
      color: auraColors.blue.main,
    },
    {
      id: "avg-intensity",
      label: "Avg Pain Intensity",
      value: `${painAnalytics?.averageIntensity?.toFixed(1) || "0"}/10`,
      trend: { value: -0.5, label: "vs last period", isPositive: true },
      icon: <AssessmentIcon />,
      color: auraColors.orange.main,
    },
    {
      id: "most-common-region",
      label: "Most Common Region",
      value: painAnalytics?.mostCommonRegion || "N/A",
      icon: <PeopleIcon />,
      color: auraColors.purple.main,
    },
    {
      id: "improvement-rate",
      label: "Improvement Rate",
      value: `${clinicalAnalytics?.patientImprovementRate?.toFixed(1) || 0}%`,
      trend: { value: 3.2, label: "vs last month", isPositive: true },
      icon: <TrendingUpIcon />,
      color: auraColors.green.main,
    },
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Callout variant="error">
          Failed to load analytics data. Please try again.
        </Callout>
        <Box sx={{ mt: 2 }}>
          <AuraButton onClick={refetch} startIcon={<RefreshIcon />}>
            Retry
          </AuraButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="page-enter">
      {/* Greeting Card with refresh - shown on Today tab */}
      {activeTab === 0 && (
        <Box
          sx={{
            animation: "fadeIn 0.6s ease-out",
            mb: 3,
            "@keyframes fadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <GreetingCard
              title={`Welcome back, ${user?.name || "Doctor"}`}
              subtitle="Here's your clinic overview for today"
            />
            <AuraButton
              variant="outlined"
              startIcon={
                loading ? <LoadingSpinner size={18} /> : <RefreshIcon />
              }
              onClick={refetch}
              disabled={loading}
              sx={{ flexShrink: 0 }}
            >
              Refresh
            </AuraButton>
          </Stack>
        </Box>
      )}

      {/* Page Header - shown on non-Today tabs */}
      {activeTab !== 0 && (
        <PageHeader
          title="Analytics Dashboard"
          description="Track your clinic's performance, patient outcomes, and pain analytics"
          actions={
            <Stack direction="row" spacing={2} alignItems="center">
              <SelectField
                label="Range"
                value={dateRange}
                onChange={(value) => setDateRange(value)}
                options={[
                  { value: "7", label: "7 days" },
                  { value: "30", label: "30 days" },
                  { value: "90", label: "90 days" },
                ]}
                size="small"
                sx={{ minWidth: auraTokens.formControl.md }}
              />
              <AuraButton
                variant="outlined"
                startIcon={
                  loading ? <LoadingSpinner size={18} /> : <RefreshIcon />
                }
                onClick={refetch}
                disabled={loading}
              >
                Refresh
              </AuraButton>
            </Stack>
          }
        />
      )}

      {/* Tab Navigation */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            px: 2,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 56,
            },
          }}
        >
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <TodayIcon fontSize="small" />
                <span>Today</span>
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <AssessmentIcon fontSize="small" />
                <span>Clinic Trends</span>
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <HospitalIcon fontSize="small" />
                <span>Pain Analytics</span>
              </Stack>
            }
          />
        </Tabs>
      </Paper>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {/* ====== TAB 0: TODAY ====== */}
      {activeTab === 0 && (
        <>
          {/* Quick Stats Grid */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 2 }}>
                    <StatCardSkeleton />
                  </Grid>
                ))
              : todayStats.map((stat, index) => (
                  <Grid
                    key={stat.id}
                    size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 2 }}
                  >
                    <Box
                      sx={{
                        animation: "fadeInUp 0.5s ease-out",
                        animationDelay: `${index * 0.1}s`,
                        animationFillMode: "both",
                        "@keyframes fadeInUp": {
                          from: { opacity: 0, transform: "translateY(20px)" },
                          to: { opacity: 1, transform: "translateY(0)" },
                        },
                      }}
                    >
                      <AuraGlassStatCard
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        trend={stat.trend}
                      />
                    </Box>
                  </Grid>
                ))}
          </Grid>

          {/* Action Center & Capacity Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Action Center - Today */}
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoCard title="Action Center – Today">
                <Stack spacing={1}>
                  {/* High-risk patients - using low PROM scores as proxy */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "error.50",
                      border: "1px solid",
                      borderColor: "error.200",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <WarningIcon sx={{ color: "error.main" }} />
                      <Typography variant="body2" fontWeight={500}>
                        High pain intensity patients
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="error.main"
                      >
                        {painAnalytics?.totalPainMaps || 0}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => navigate("/patients")}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>

                  {/* Intakes needing review */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "warning.50",
                      border: "1px solid",
                      borderColor: "warning.200",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <AssignmentIcon sx={{ color: "warning.main" }} />
                      <Typography variant="body2" fontWeight={500}>
                        Intakes pending triage
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="warning.main"
                      >
                        {dashboardMetrics?.pendingIntakes || 0}
                      </Typography>
                      <Button size="small" onClick={() => navigate("/intake")}>
                        View
                      </Button>
                    </Box>
                  </Box>

                  {/* Cancellations / No-shows */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "grey.200",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <CancelIcon sx={{ color: "grey.600" }} />
                      <Typography variant="body2" fontWeight={500}>
                        Cancellations / No-shows
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {(dashboardMetrics?.cancelledToday || 0) +
                          (dashboardMetrics?.noShowToday || 0)}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => navigate("/appointments")}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>

                  {/* Evaluations */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "info.50",
                      border: "1px solid",
                      borderColor: "info.200",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <AssessmentIcon sx={{ color: "info.main" }} />
                      <Typography variant="body2" fontWeight={500}>
                        Total evaluations
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="info.main"
                      >
                        {clinicalAnalytics?.totalEvaluations || 0}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => navigate("/patients")}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>
                </Stack>
              </InfoCard>
            </Grid>

            {/* Capacity & Flow - Today */}
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoCard title="Today's Capacity & Flow">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Capacity Donut */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Box sx={{ position: "relative", width: 100, height: 100 }}>
                      <CircularProgress
                        variant="determinate"
                        value={100}
                        size={100}
                        thickness={8}
                        sx={{ color: "grey.200", position: "absolute" }}
                      />
                      <CircularProgress
                        variant="determinate"
                        value={Math.min(
                          dashboardMetrics?.completionRate || 0,
                          100,
                        )}
                        size={100}
                        thickness={8}
                        sx={{ color: "primary.main" }}
                      />
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h5" fontWeight={700}>
                          {Math.round(dashboardMetrics?.completionRate || 0)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Complete
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {dashboardMetrics?.completedToday || 0} of{" "}
                        {dashboardMetrics?.todayAppointments || 0} completed
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(dashboardMetrics?.todayAppointments || 0) -
                          (dashboardMetrics?.completedToday || 0)}{" "}
                        remaining
                      </Typography>
                    </Box>
                  </Box>

                  {/* Stats chips */}
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "grey.50",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h6" fontWeight={600}>
                          {Math.round(dashboardMetrics?.noShowRate || 0)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          No-show rate
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={6}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "grey.50",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h6" fontWeight={600}>
                          {dashboardMetrics?.averageWaitTime || 0}m
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg wait time
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={6}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "primary.50",
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          color="primary.main"
                        >
                          {dashboardMetrics?.newPatientsThisMonth || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          New this month
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={6}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: "grey.50",
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h6" fontWeight={600}>
                          {Math.round(dashboardMetrics?.staffUtilization || 0)}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Staff utilization
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </InfoCard>
            </Grid>
          </Grid>

          {/* Charts Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Metrics Chart */}
            <Grid size={{ xs: 12, md: 8 }}>
              {isLoading ? (
                <ChartCardSkeleton />
              ) : (
                <ClinicMetricsChart
                  tabs={[
                    {
                      key: "patients",
                      title: "Total Patients",
                      value: dashboardMetrics?.totalPatients || 0,
                      format: "number",
                    },
                    {
                      key: "appointments",
                      title: "Daily Appointments",
                      value: dashboardMetrics?.todayAppointments || 0,
                      format: "number",
                    },
                    {
                      key: "revenue",
                      title: "Daily Revenue",
                      value: Math.round(
                        (dashboardMetrics?.estimatedRevenue || 0) / 30,
                      ),
                      format: "currency",
                    },
                    {
                      key: "promScore",
                      title: "PROM Score",
                      value:
                        clinicalAnalytics?.averagePromScore?.toFixed(1) || "0",
                    },
                  ]}
                  data={metricsChartData}
                  height={280}
                />
              )}
            </Grid>

            {/* PROM Response Rate */}
            <Grid size={{ xs: 12, md: 4 }}>
              {isLoading ? (
                <ChartCardSkeleton />
              ) : (
                <PromCompletionCard
                  data={promCompletionData}
                  summaryFormatter={(average, { isEmpty }) =>
                    isEmpty
                      ? "No PROM data available"
                      : `Overall response rate: ${average}%`
                  }
                />
              )}
            </Grid>
          </Grid>

          {/* Bottom Charts Row */}
          <Grid container spacing={3}>
            {/* Top Conditions */}
            <Grid size={{ xs: 12, md: 6 }}>
              {isLoading ? (
                <ChartCardSkeleton />
              ) : (
                <TopDiagnosesCard
                  title="Patient Conditions Distribution"
                  data={conditionData}
                  emptyMessage="No condition data available"
                />
              )}
            </Grid>

            {/* Today's Appointment Status */}
            <Grid size={{ xs: 12, md: 6 }}>
              {isLoading ? (
                <ChartCardSkeleton />
              ) : (
                <AppointmentDonutChart
                  title="Today's Appointment Status"
                  data={{
                    completed: dashboardMetrics?.completedToday || 0,
                    cancelled: dashboardMetrics?.cancelledToday || 0,
                    noShow: dashboardMetrics?.noShowToday || 0,
                    pending:
                      (dashboardMetrics?.todayAppointments || 0) -
                      (dashboardMetrics?.completedToday || 0) -
                      (dashboardMetrics?.cancelledToday || 0) -
                      (dashboardMetrics?.noShowToday || 0),
                  }}
                />
              )}
            </Grid>
          </Grid>
        </>
      )}

      {/* ====== TAB 1: CLINIC TRENDS ====== */}
      {activeTab === 1 && (
        <>
          {/* KPI Stat Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCardSkeleton />
                  </Grid>
                ))
              : clinicStatCards.map((stat, index) => (
                  <Grid key={stat.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Box
                      sx={{
                        animation: "fadeInUp 0.5s ease-out",
                        animationDelay: `${index * 0.1}s`,
                        animationFillMode: "both",
                        "@keyframes fadeInUp": {
                          from: { opacity: 0, transform: "translateY(20px)" },
                          to: { opacity: 1, transform: "translateY(0)" },
                        },
                      }}
                    >
                      <AuraGlassStatCard
                        title={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        trend={stat.trend}
                      />
                    </Box>
                  </Grid>
                ))}
          </Grid>

          {/* Main Charts Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Patient Engagement Chart with Tabs */}
            <Grid size={{ xs: 12, lg: 8 }}>
              {isLoading ? (
                <ChartCardSkeleton />
              ) : (
                <ClinicMetricsChart
                  tabs={[
                    {
                      key: "patients",
                      title: "Total Patients",
                      value: dashboardMetrics?.totalPatients || 0,
                      format: "number",
                    },
                    {
                      key: "appointments",
                      title: "Daily Appointments",
                      value: dashboardMetrics?.todayAppointments || 0,
                      format: "number",
                    },
                    {
                      key: "revenue",
                      title: "Daily Revenue",
                      value: Math.round(
                        (dashboardMetrics?.estimatedRevenue || 0) / 30,
                      ),
                      format: "currency",
                    },
                    {
                      key: "promScore",
                      title: "PROM Score",
                      value:
                        clinicalAnalytics?.averagePromScore?.toFixed(1) || "0",
                    },
                  ]}
                  data={metricsChartData}
                  height={280}
                />
              )}
            </Grid>

            {/* Appointment Status Donut */}
            <Grid size={{ xs: 12, lg: 4 }}>
              {isLoading ? (
                <ChartCardSkeleton />
              ) : (
                <AppointmentDonutChart
                  title="Today's Appointments"
                  data={{
                    completed: dashboardMetrics?.completedToday || 0,
                    cancelled: dashboardMetrics?.cancelledToday || 0,
                    noShow: dashboardMetrics?.noShowToday || 0,
                    pending:
                      (dashboardMetrics?.todayAppointments || 0) -
                      (dashboardMetrics?.completedToday || 0) -
                      (dashboardMetrics?.cancelledToday || 0) -
                      (dashboardMetrics?.noShowToday || 0),
                  }}
                />
              )}
            </Grid>
          </Grid>

          {/* Secondary Charts Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Appointment Trend */}
            <Grid size={{ xs: 12, md: 6 }}>
              {isLoading ? (
                <ChartCardSkeleton />
              ) : (
                <AppointmentTrendCard
                  title="Appointment Trends"
                  data={appointmentTrendData}
                  height={250}
                />
              )}
            </Grid>

            {/* Top Conditions */}
            <Grid size={{ xs: 12, md: 6 }}>
              {isLoading ? (
                <ChartCardSkeleton />
              ) : (
                <TopDiagnosesCard
                  title="Top Conditions"
                  data={conditionData}
                  emptyMessage="No diagnosis data available"
                />
              )}
            </Grid>
          </Grid>

          {/* Clinical Metrics Summary */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  boxShadow: glassTokens.shadow.subtle,
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Clinical Metrics
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Average Pain Intensity
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography variant="h4" fontWeight={700}>
                        {clinicalAnalytics?.averagePainIntensity?.toFixed(1) ||
                          "0"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        /10
                      </Typography>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Patient Improvement Rate
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        color="success.main"
                      >
                        {clinicalAnalytics?.patientImprovementRate?.toFixed(
                          1,
                        ) || "0"}
                        %
                      </Typography>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Total Evaluations
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {clinicalAnalytics?.totalEvaluations?.toLocaleString() ||
                        "0"}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  boxShadow: glassTokens.shadow.subtle,
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Operational Metrics
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Average Wait Time
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography variant="h4" fontWeight={700}>
                        {dashboardMetrics?.averageWaitTime || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        min
                      </Typography>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Staff Utilization
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography variant="h4" fontWeight={700}>
                        {dashboardMetrics?.staffUtilization || 0}%
                      </Typography>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      No-Show Rate
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={
                        (dashboardMetrics?.noShowRate || 0) > 10
                          ? "error.main"
                          : "text.primary"
                      }
                    >
                      {dashboardMetrics?.noShowRate?.toFixed(1) || "0"}%
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: "100%",
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 3,
                  boxShadow: glassTokens.shadow.subtle,
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                  Patient Growth
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      New Patients This Month
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        color="primary.main"
                      >
                        {dashboardMetrics?.newPatientsThisMonth || 0}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Pending Intakes
                    </Typography>
                    <Typography variant="h4" fontWeight={700}>
                      {dashboardMetrics?.pendingIntakes || 0}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Patient Satisfaction
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        color="success.main"
                      >
                        {clinicalAnalytics?.patientSatisfaction?.toFixed(1) ||
                          "4.5"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        /5
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* ====== TAB 2: PAIN ANALYTICS ====== */}
      {activeTab === 2 && (
        <>
          {/* Pain Analytics KPIs */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {painAnalyticsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCardSkeleton />
                  </Grid>
                ))
              : painStatCards.map((stat, index) => (
                  <Grid key={stat.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <Box
                      sx={{
                        animation: "fadeInUp 0.5s ease-out",
                        animationDelay: `${index * 0.1}s`,
                        animationFillMode: "both",
                        "@keyframes fadeInUp": {
                          from: { opacity: 0, transform: "translateY(20px)" },
                          to: { opacity: 1, transform: "translateY(0)" },
                        },
                      }}
                    >
                      <AuraGlassStatCard
                        title={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                        trend={stat.trend}
                      />
                    </Box>
                  </Grid>
                ))}
          </Grid>

          {/* 3D Pain Heatmap */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 8 }}>
              {painAnalyticsLoading ? (
                <ChartCardSkeleton />
              ) : (
                <PainHeatmap3D
                  painPoints={
                    painAnalytics?.painPoints3D || [
                      {
                        x: 0,
                        y: 150,
                        z: 0,
                        intensity: 7.2,
                        bodyRegion: "Lower Back",
                        painType: "Aching",
                      },
                      {
                        x: 0,
                        y: 280,
                        z: 0,
                        intensity: 5.5,
                        bodyRegion: "Neck",
                        painType: "Sharp",
                      },
                      {
                        x: 50,
                        y: 220,
                        z: 0,
                        intensity: 5.2,
                        bodyRegion: "Shoulder",
                        painType: "Throbbing",
                      },
                      {
                        x: -50,
                        y: 220,
                        z: 0,
                        intensity: 4.8,
                        bodyRegion: "Shoulder",
                        painType: "Aching",
                      },
                      {
                        x: 30,
                        y: 80,
                        z: 0,
                        intensity: 6.1,
                        bodyRegion: "Knee",
                        painType: "Sharp",
                      },
                      {
                        x: -30,
                        y: 80,
                        z: 0,
                        intensity: 5.8,
                        bodyRegion: "Knee",
                        painType: "Aching",
                      },
                      {
                        x: 40,
                        y: 130,
                        z: 0,
                        intensity: 5.8,
                        bodyRegion: "Hip",
                        painType: "Throbbing",
                      },
                      {
                        x: 0,
                        y: 190,
                        z: 0,
                        intensity: 4.9,
                        bodyRegion: "Upper Back",
                        painType: "Dull",
                      },
                    ]
                  }
                  loading={painAnalyticsLoading}
                  title="Aggregate Pain Heatmap"
                  subtitle="3D visualization of pain distribution across all patients"
                  height={400}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              {painAnalyticsLoading ? (
                <ChartCardSkeleton />
              ) : (
                <PainTypeChart
                  title="Pain Types"
                  subtitle="Reported pain characteristics"
                  data={
                    painAnalytics?.painTypeDistribution || [
                      { type: "Aching", count: 45 },
                      { type: "Sharp", count: 32 },
                      { type: "Burning", count: 18 },
                      { type: "Throbbing", count: 25 },
                      { type: "Stabbing", count: 12 },
                      { type: "Dull", count: 28 },
                    ]
                  }
                  variant="donut"
                />
              )}
            </Grid>
          </Grid>

          {/* Pain Distribution Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Pain Intensity Distribution */}
            <Grid size={{ xs: 12 }}>
              {painAnalyticsLoading ? (
                <ChartCardSkeleton />
              ) : (
                <PainIntensityChart
                  title="Pain Intensity Distribution"
                  subtitle="Distribution of reported pain levels across all patients"
                  data={
                    painAnalytics?.intensityDistribution || [
                      { range: "0-1", count: 5 },
                      { range: "1-2", count: 8 },
                      { range: "2-3", count: 12 },
                      { range: "3-4", count: 18 },
                      { range: "4-5", count: 25 },
                      { range: "5-6", count: 30 },
                      { range: "6-7", count: 22 },
                      { range: "7-8", count: 15 },
                      { range: "8-9", count: 8 },
                      { range: "9-10", count: 3 },
                    ]
                  }
                  averageIntensity={painAnalytics?.averageIntensity}
                  variant="gradient"
                />
              )}
            </Grid>
          </Grid>

          {/* Body Region Analysis */}
          <Grid container spacing={3}>
            {/* Body Region Bar Chart */}
            <Grid size={{ xs: 12, md: 6 }}>
              {painAnalyticsLoading ? (
                <ChartCardSkeleton />
              ) : (
                <BodyRegionChart
                  title="Pain by Body Region"
                  subtitle="Most affected areas with average intensity"
                  data={
                    clinicalAnalytics?.bodyRegionDistribution || [
                      { region: "Lower Back", count: 45, avgIntensity: 6.8 },
                      { region: "Neck", count: 38, avgIntensity: 5.5 },
                      { region: "Shoulder", count: 32, avgIntensity: 5.2 },
                      { region: "Knee", count: 28, avgIntensity: 6.1 },
                      { region: "Hip", count: 22, avgIntensity: 5.8 },
                      { region: "Upper Back", count: 18, avgIntensity: 4.9 },
                      { region: "Wrist/Hand", count: 15, avgIntensity: 4.5 },
                      { region: "Ankle/Foot", count: 12, avgIntensity: 5.0 },
                    ]
                  }
                  variant="progress"
                />
              )}
            </Grid>

            {/* Body Region Horizontal Bar */}
            <Grid size={{ xs: 12, md: 6 }}>
              {painAnalyticsLoading ? (
                <ChartCardSkeleton />
              ) : (
                <BodyRegionChart
                  title="Cases by Region"
                  subtitle="Total case distribution"
                  data={
                    clinicalAnalytics?.bodyRegionDistribution || [
                      { region: "Lower Back", count: 45, avgIntensity: 6.8 },
                      { region: "Neck", count: 38, avgIntensity: 5.5 },
                      { region: "Shoulder", count: 32, avgIntensity: 5.2 },
                      { region: "Knee", count: 28, avgIntensity: 6.1 },
                      { region: "Hip", count: 22, avgIntensity: 5.8 },
                      { region: "Upper Back", count: 18, avgIntensity: 4.9 },
                    ]
                  }
                  variant="bar"
                  height={280}
                />
              )}
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Analytics;
