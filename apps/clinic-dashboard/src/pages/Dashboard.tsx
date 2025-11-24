import React from "react";
import { subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuthUser } from "../stores/authStore";
import { useAuthGuard } from "../hooks/useAuthGuard";
import dashboardApi from "../services/dashboardApi";
import analyticsApi from "../services/analyticsApi";
import {
  AppointmentTrendCard,
  PromCompletionCard,
  TopDiagnosesCard,
} from "../features/analytics";
import type {
  AppointmentTrendDatum,
  DiagnosisDatum,
  PromCompletionDatum,
} from "../features/analytics";
import {
  AuraButton,
  AuraEmptyState,
  SkeletonLoader,
  AuraStatCard,
  StatCardSkeleton,
  GreetingCard,
  InfoCard,
  AuraChartCard,
} from "@qivr/design-system";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthUser();
  const { canMakeApiCalls } = useAuthGuard();
  const [chartPeriod, setChartPeriod] = React.useState("7d");

  // Fetch new comprehensive dashboard metrics
  const { data: dashboardMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => analyticsApi.getDashboardMetrics(),
    enabled: canMakeApiCalls,
    refetchInterval: 60000,
  });

  // Fetch clinical analytics
  const { data: clinicalAnalytics, isLoading: clinicalLoading } = useQuery({
    queryKey: ["clinical-analytics", chartPeriod],
    queryFn: () => {
      const days = chartPeriod === "7d" ? 7 : chartPeriod === "30d" ? 30 : 90;
      const to = new Date();
      const from = subDays(to, days);
      return analyticsApi.getClinicalAnalytics(from, to);
    },
    enabled: canMakeApiCalls,
    refetchInterval: 60000,
  });

  const isLoadingStats = metricsLoading || clinicalLoading;

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: dashboardApi.getRecentActivity,
    enabled: canMakeApiCalls,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch today's appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: dashboardApi.getTodayAppointments,
    enabled: canMakeApiCalls,
    refetchInterval: 60000,
  });

  // Create stats array with real data
  const appointmentTrends = React.useMemo<AppointmentTrendDatum[]>(() => {
    // TODO: Add appointment trends to clinical analytics
    return [];
  }, []);

  const promCompletionData = React.useMemo<PromCompletionDatum[]>(() => {
    // TODO: Add PROM completion to clinical analytics
    return [];
  }, []);

  const conditionData = React.useMemo<DiagnosisDatum[]>(() => {
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
        percentage: (condition.count / total) * 100,
        value: condition.count,
        color: [
          "var(--qivr-palette-primary-main)",
          "var(--qivr-palette-secondary-main)",
          "var(--qivr-palette-success-main)",
          "var(--qivr-palette-warning-main)",
          "var(--qivr-palette-neutral-500, #64748b)",
        ][index % 5],
      }));
  }, [clinicalAnalytics]);

  const derivedStats = React.useMemo(() => {
    if (dashboardMetrics) {
      return {
        todayAppointments: dashboardMetrics.todayAppointments,
        pendingIntakes: dashboardMetrics.pendingIntakes,
        activePatients: dashboardMetrics.totalPatients,
        completedToday: dashboardMetrics.completedToday,
        averageWaitTime: dashboardMetrics.averageWaitTime,
        patientSatisfaction: 4.5, // TODO: Add to backend
        completionRate: dashboardMetrics.completionRate,
        noShowRate: dashboardMetrics.noShowRate,
        staffUtilization: dashboardMetrics.staffUtilization,
        estimatedRevenue: dashboardMetrics.estimatedRevenue,
      };
    }

    return {
      todayAppointments: 0,
      pendingIntakes: 0,
      activePatients: 0,
      completedToday: 0,
      averageWaitTime: 0,
      patientSatisfaction: 0,
    };
  }, [dashboardMetrics]);

  const stats = React.useMemo(
    () => [
      {
        id: "appointments-today",
        title: "Appointments Today",
        value: derivedStats.todayAppointments.toString(),
        icon: <CalendarIcon />,
        avatarColor: "#3385F0", // Aura blue
        trend: { value: 8.2, label: "vs yesterday", isPositive: true },
      },
      {
        id: "pending-intakes",
        title: "Pending Intakes",
        value: derivedStats.pendingIntakes.toString(),
        icon: <AssignmentIcon />,
        avatarColor: "#F68D2A", // Aura orange
        trend: { value: 3.5, label: "vs yesterday", isPositive: false },
      },
      {
        id: "active-patients",
        title: "Active Patients",
        value: derivedStats.activePatients.toString(),
        icon: <PeopleIcon />,
        avatarColor: "#A641FA", // Aura purple
        trend: { value: 12.3, label: "vs last month", isPositive: true },
      },
      {
        id: "average-wait-time",
        title: "Avg Wait Time",
        value: `${derivedStats.averageWaitTime} min`,
        icon: <AccessTimeIcon />,
        avatarColor: "#26CD82", // Aura green
        trend: { value: 5.1, label: "vs yesterday", isPositive: false },
      },
      {
        id: "completed-today",
        title: "Completed Today",
        value: derivedStats.completedToday.toString(),
        icon: <CheckCircleIcon />,
        avatarColor: "#26CD82", // Aura green
        trend: { value: 15.7, label: "vs yesterday", isPositive: true },
      },
      {
        id: "patient-satisfaction",
        title: "Patient Satisfaction",
        value: derivedStats.patientSatisfaction.toFixed(1),
        icon: <StarIcon />,
        avatarColor: "#F68D2A", // Aura orange
        trend: { value: 2.4, label: "vs last week", isPositive: true },
      },
    ],
    [derivedStats],
  );

  const isStatsLoading = isLoadingStats && !clinicalAnalytics;

  return (
    <Box className="page-enter">
      <Box
        sx={{
          animation: "fadeIn 0.6s ease-out",
          "@keyframes fadeIn": {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        <GreetingCard
          title={`Welcome back, ${user?.name || "Doctor"}`}
          subtitle="Here's your clinic overview for today"
        />
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {isStatsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <StatCardSkeleton />
              </Grid>
            ))
          : stats.map((stat, index) => (
              <Grid key={stat.id} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
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
                  <AuraStatCard
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    iconColor={stat.avatarColor}
                    trend={stat.trend}
                  />
                </Box>
              </Grid>
            ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Upcoming Appointments */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard title="Today's Appointments">
            <List>
              {appointmentsLoading ? (
                <SkeletonLoader type="list" count={3} />
              ) : appointmentsData?.length ? (
                appointmentsData.map((apt) => (
                  <ListItem key={apt.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar>
                        {apt.patientName
                          .split(" ")
                          .map((segment) => segment[0])
                          .join("")}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={apt.patientName}
                      secondary={`${apt.time} - ${apt.type}`}
                    />
                    <Chip
                      label={apt.status}
                      size="small"
                      color={
                        apt.status === "completed"
                          ? "success"
                          : apt.status === "in-progress"
                            ? "info"
                            : apt.status === "scheduled"
                              ? "default"
                              : "warning"
                      }
                      variant="outlined"
                    />
                  </ListItem>
                ))
              ) : (
                <AuraEmptyState
                  icon={<CalendarIcon />}
                  title="No appointments today"
                  description="Your schedule is clear for today."
                  actionText="Schedule New"
                  onAction={() => navigate("/appointments")}
                  sx={{ py: 3 }}
                />
              )}
            </List>
            <AuraButton
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate("/appointments")}
            >
              View All Appointments
            </AuraButton>
          </InfoCard>
        </Grid>

        {/* Recent Intakes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard title="Recent Intake Submissions">
            <List>
              {activityLoading ? (
                <SkeletonLoader type="list" count={3} />
              ) : activityData?.length ? (
                activityData
                  .filter((activity) => activity.type === "intake")
                  .slice(0, 3)
                  .map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              activity.status === "urgent"
                                ? "var(--qivr-palette-error-main)"
                                : "var(--qivr-palette-neutral-500, #6b7280)",
                          }}
                        >
                          {activity.status === "urgent" ? (
                            <WarningIcon />
                          ) : (
                            (activity.patientName?.[0] ?? "?")
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.patientName}
                        secondary={`${activity.description} • ${new Date(activity.timestamp).toLocaleTimeString()}`}
                      />
                      <Chip
                        label={activity.status || "pending"}
                        size="small"
                        color={
                          activity.status === "urgent"
                            ? "error"
                            : activity.status === "pending"
                              ? "warning"
                              : "default"
                        }
                      />
                    </ListItem>
                  ))
              ) : (
                <AuraEmptyState
                  icon={<AssignmentIcon />}
                  title="No recent intakes"
                  description="No intake submissions to review."
                  actionText="View Queue"
                  onAction={() => navigate("/intake")}
                  sx={{ py: 3 }}
                />
              )}
            </List>
            <AuraButton
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate("/intake")}
            >
              Review Intake Queue
            </AuraButton>
          </InfoCard>
        </Grid>

        {/* Analytics Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <AppointmentTrendCard
            data={appointmentTrends}
            headerAction={
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
            }
          />
        </Grid>

        {/* PROM Response Rate */}
        <Grid size={{ xs: 12, md: 4 }}>
          <PromCompletionCard
            data={promCompletionData}
            summaryFormatter={(average, { isEmpty }) =>
              isEmpty
                ? "No PROM data available"
                : `Overall response rate: ${average}%`
            }
          />
        </Grid>

        {/* Patient Conditions Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TopDiagnosesCard
            title="Patient Conditions Distribution"
            data={conditionData}
            emptyMessage="No condition data available"
          />
        </Grid>

        {/* Weekly Activity Heatmap */}
        <Grid size={12}>
          <AuraChartCard title="Weekly Activity Overview">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart
                data={
                  appointmentTrends.length > 0
                    ? appointmentTrends
                    : [{ name: "No Data", appointments: 0, completed: 0 }]
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="var(--qivr-palette-primary-main)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--qivr-palette-success-main)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </AuraChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
