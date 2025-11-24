import React from "react";
import { format, subDays } from "date-fns";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useAuthUser } from "../stores/authStore";
import { useAuthGuard } from "../hooks/useAuthGuard";
import dashboardApi from "../services/dashboardApi";
import analyticsApi, { ClinicAnalytics } from "../services/analyticsApi";
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

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.getStats,
    enabled: canMakeApiCalls,
    refetchInterval: 60000, // Refresh every minute
  });

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

  const { data: clinicAnalytics } = useQuery<ClinicAnalytics | null>({
    queryKey: ["clinicAnalytics", user?.clinicId, "30"],
    queryFn: async () => {
      if (!user?.clinicId) {
        return null;
      }
      const to = new Date();
      const from = subDays(to, 30);
      return analyticsApi.getClinicAnalytics(undefined, { from, to });
    },
    enabled: Boolean(user?.clinicId) && canMakeApiCalls,
  });

  // Create stats array with real data
  const appointmentTrends = React.useMemo<AppointmentTrendDatum[]>(() => {
    if (!clinicAnalytics?.appointmentTrends) {
      return [];
    }
    const days = chartPeriod === "7d" ? 7 : chartPeriod === "30d" ? 30 : 90;
    const cutoff = subDays(new Date(), days);

    return clinicAnalytics.appointmentTrends
      .filter((trend) => new Date(trend.date) >= cutoff)
      .map((trend) => ({
        name: format(new Date(trend.date), "MMM d"),
        appointments: trend.appointments,
        completed: trend.completed,
        cancellations: trend.cancellations,
        noShows: trend.noShows,
        newPatients: trend.newPatients,
      }));
  }, [clinicAnalytics, chartPeriod]);

  const promCompletionData = React.useMemo<PromCompletionDatum[]>(() => {
    const breakdown = clinicAnalytics?.promCompletionBreakdown ?? [];
    if (breakdown.length === 0) {
      return [];
    }
    return breakdown.map((item) => ({
      name: item.templateName,
      completed: Math.round(item.completionRate),
      pending: 100 - Math.round(item.completionRate),
      completionRate: item.completionRate,
    }));
  }, [clinicAnalytics]);

  const conditionData = React.useMemo<DiagnosisDatum[]>(() => {
    const diagnoses = clinicAnalytics?.topDiagnoses ?? [];
    const total = diagnoses.reduce((sum, item) => sum + item.count, 0) || 1;

    return diagnoses.slice(0, 5).map((diagnosis, index) => ({
      name: diagnosis.description,
      percentage: (diagnosis.count / total) * 100,
      value: diagnosis.count,
      color: [
        "var(--qivr-palette-primary-main)",
        "var(--qivr-palette-secondary-main)",
        "var(--qivr-palette-success-main)",
        "var(--qivr-palette-warning-main)",
        "var(--qivr-palette-neutral-500, #64748b)",
      ][index % 5],
    }));
  }, [clinicAnalytics]);

  const providerPerformance = React.useMemo(
    () => clinicAnalytics?.providerPerformance ?? [],
    [clinicAnalytics],
  );

  const providerPerformanceRadar = React.useMemo(() => {
    return providerPerformance.length > 0
      ? providerPerformance.map((provider) => ({
          metric: provider.providerName,
          value: provider.appointmentsCompleted,
        }))
      : [];
  }, [providerPerformance]);

  const derivedStats = React.useMemo(() => {
    if (clinicAnalytics) {
      const totalPatients =
        clinicAnalytics.patientMetrics.newPatients +
        clinicAnalytics.patientMetrics.returningPatients;
      return {
        todayAppointments: clinicAnalytics.appointmentMetrics.totalScheduled,
        pendingIntakes: Math.max(
          clinicAnalytics.promMetrics.totalSent -
            clinicAnalytics.promMetrics.completed,
          0,
        ),
        activePatients: totalPatients,
        completedToday: clinicAnalytics.appointmentMetrics.completed,
        averageWaitTime: clinicAnalytics.appointmentMetrics.averageWaitTime,
        patientSatisfaction:
          clinicAnalytics.patientMetrics.patientSatisfactionScore,
      };
    }

    if (statsData) {
      return statsData;
    }

    return {
      todayAppointments: 0,
      pendingIntakes: 0,
      activePatients: 0,
      completedToday: 0,
      averageWaitTime: 0,
      patientSatisfaction: 0,
    };
  }, [clinicAnalytics, statsData]);

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

  const isStatsLoading = statsLoading && !clinicAnalytics;

  return (
    <Box>
      <GreetingCard
        title={`Welcome back, ${user?.name || "Doctor"}`}
        subtitle="Here's your clinic overview for today"
      />

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        {isStatsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <StatCardSkeleton />
              </Grid>
            ))
          : stats.map((stat) => (
              <Grid key={stat.id} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <AuraStatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  iconColor={stat.avatarColor}
                  trend={stat.trend}
                />
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

        {/* Clinic Performance Metrics */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AuraChartCard title="Clinic Performance Metrics">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart
                data={
                  providerPerformanceRadar.length > 0
                    ? providerPerformanceRadar
                    : [{ metric: "No Data", value: 0 }]
                }
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="var(--qivr-palette-primary-main)"
                  fill="var(--qivr-palette-primary-main)"
                  fillOpacity={0.6}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </AuraChartCard>
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
