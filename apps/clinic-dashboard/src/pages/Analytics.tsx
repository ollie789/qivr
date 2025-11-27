import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  PainMapMetrics,
  PageHeader,
  StatCardSkeleton,
  InfoCard,
  AuraButton,
  AuraGlassStatCard,
  auraTokens,
  LoadingSpinner,
  SectionLoader,
  auraColors,
} from "@qivr/design-system";
import analyticsApi from "../services/analyticsApi";
import { TopDiagnosesCard } from "../features/analytics";
import type { DiagnosisDatum } from "../features/analytics";
import { useAuthUser } from "../stores/authStore";

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState("30");
  const [activeTab, setActiveTab] = useState(0);
  const [painAvatarType, setPainAvatarType] = useState("male");
  const [painViewOrientation, setPainViewOrientation] = useState("front");

  const user = useAuthUser();
  const { canMakeApiCalls } = useAuthGuard();
  const tenantId = user?.tenantId;

  const getDateRange = () => {
    const to = new Date();
    const days = parseInt(dateRange, 10) || 30;
    const from = subDays(to, days);
    return { from, to };
  };

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
  });

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
  });

  const { data: painAnalytics, isLoading: painAnalyticsLoading, error: painError } = useQuery({
    queryKey: ["painAnalytics", tenantId, dateRange],
    queryFn: () => {
      const { from, to } = getDateRange();
      return analyticsApi.getPainMapAnalytics(from, to);
    },
    enabled: canMakeApiCalls && Boolean(tenantId) && activeTab === 1,
  });

  const isLoading = metricsLoading || clinicalLoading;
  const isFetching = metricsFetching || clinicalFetching;
  const error = metricsError || clinicalError || painError;

  const refetch = () => {
    refetchMetrics();
    refetchClinical();
  };

  const loading = isLoading || isFetching;

  const conditionData: DiagnosisDatum[] = React.useMemo(() => {
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
          "var(--qivr-palette-primary-main)",
          "var(--qivr-palette-secondary-main)",
          "var(--qivr-palette-success-main)",
          "var(--qivr-palette-warning-main)",
          "var(--qivr-palette-neutral-500, #64748b)",
        ][index % 5],
      }));
  }, [clinicalAnalytics]);

  const statCards = [
    {
      id: "total-patients",
      label: "Total Patients",
      value: dashboardMetrics?.totalPatients.toLocaleString() || "0",
      trend: { value: 12.5, label: "vs last period", isPositive: true },
      icon: <PeopleIcon />,
      color: auraColors.purple.main,
    },
    {
      id: "appointments-period",
      label: "Appointments Today",
      value: dashboardMetrics?.todayAppointments.toLocaleString() || "0",
      trend: { value: 8.3, label: "vs yesterday", isPositive: true },
      icon: <CalendarIcon />,
      color: auraColors.blue.main,
    },
    {
      id: "revenue",
      label: "Estimated Revenue",
      value: `$${dashboardMetrics?.estimatedRevenue.toLocaleString() || "0"}`,
      trend: { value: 15.2, label: "vs last period", isPositive: true },
      icon: <MoneyIcon />,
      color: auraColors.green.main,
    },
    {
      id: "prom-score",
      label: "Avg PROM Score",
      value: clinicalAnalytics?.averagePromScore.toFixed(1) || "0",
      trend: { value: 2.1, label: "vs last period", isPositive: true },
      icon: <AssessmentIcon />,
      color: auraColors.orange.main,
    },
  ];

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load analytics data. Please try again.
        </Alert>
        <AuraButton onClick={refetch} startIcon={<RefreshIcon />}>
          Retry
        </AuraButton>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 12, md: 3 }} key={i}>
              <StatCardSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box className="page-enter">
      <PageHeader
        title="Analytics Dashboard"
        description="Track your clinic's performance and patient outcomes"
        actions={
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
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
          </Box>
        }
      />

      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        sx={{ mb: 3 }}
      >
        <Tab label="Clinic Overview" />
        <Tab label="Pain Analytics" />
      </Tabs>

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {activeTab === 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCardSkeleton />
                  </Grid>
                ))
              : statCards.map((stat, index) => (
                  <Grid key={stat.id} size={{ xs: 12, sm: 6, md: 3 }}>
                    <Box
                      sx={{
                        animation: "fadeInUp 0.5s ease-out",
                        animationDelay: `${index * 0.1}s`,
                        animationFillMode: "both",
                        "@keyframes fadeInUp": {
                          from: {
                            opacity: 0,
                            transform: "translateY(20px)",
                          },
                          to: {
                            opacity: 1,
                            transform: "translateY(0)",
                          },
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

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TopDiagnosesCard
                title="Top Conditions"
                data={conditionData}
                emptyMessage="No diagnosis data available for the selected range"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <InfoCard title="Clinical Metrics">
                <Box sx={{ p: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Average Pain Intensity
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                      {clinicalAnalytics?.averagePainIntensity.toFixed(1) ||
                        "0"}
                      /10
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Patient Improvement Rate
                    </Typography>
                    <Typography variant="h4" gutterBottom>
                      {clinicalAnalytics?.patientImprovementRate.toFixed(1) ||
                        "0"}
                      %
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Total Evaluations
                    </Typography>
                    <Typography variant="h4">
                      {clinicalAnalytics?.totalEvaluations || 0}
                    </Typography>
                  </Box>
                </Box>
              </InfoCard>
            </Grid>
          </Grid>
        </>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid size={12}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
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
            <InfoCard
              title="Pain Region Heat Map"
              subtitle="Aggregated pain data from all patients showing most commonly affected regions"
            >
              {painAnalyticsLoading ? (
                <SectionLoader />
              ) : painAnalytics?.painPoints3D && painAnalytics.painPoints3D.length > 0 ? (
                <Box
                  sx={{
                    bgcolor: "grey.100",
                    borderRadius: auraTokens.borderRadius.sm,
                    p: 2,
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    3D heat map visualization coming soon. Currently showing{" "}
                    {painAnalytics.painPoints3D.length} data points.
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info">
                  No pain map data available for the selected filters
                </Alert>
              )}
            </InfoCard>
          </Grid>

          <Grid size={12}>
            <PainMapMetrics 
              data={painAnalytics as any} 
              loading={painAnalyticsLoading} 
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Analytics;
