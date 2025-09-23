import React from "react";
import { format, subDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  Skeleton,
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
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useAuthStore } from "../stores/authStore";
import dashboardApi from "../services/dashboardApi";
import analyticsApi, { ClinicAnalytics } from "../services/analyticsApi";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [chartPeriod, setChartPeriod] = React.useState("7d");

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.getStats,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: dashboardApi.getRecentActivity,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch today's appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["today-appointments"],
    queryFn: dashboardApi.getTodayAppointments,
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
      return analyticsApi.getClinicAnalytics(user.clinicId, { from, to });
    },
    enabled: Boolean(user?.clinicId),
  });

  // Create stats array with real data
  const appointmentTrends = React.useMemo(() => {
    if (!clinicAnalytics?.appointmentTrends) {
      return [] as Array<Record<string, any>>;
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

  const promCompletionData = React.useMemo(() => {
    const breakdown = clinicAnalytics?.promCompletionBreakdown ?? [];
    if (breakdown.length === 0) {
      return [] as {
        name: string;
        completed: number;
        pending: number;
        completionRate: number;
      }[];
    }
    return breakdown.map((item) => ({
      name: item.templateName,
      completed: Math.round(item.completionRate),
      pending: 100 - Math.round(item.completionRate),
      completionRate: item.completionRate,
    }));
  }, [clinicAnalytics]);

  const conditionData = React.useMemo(() => {
    const diagnoses = clinicAnalytics?.topDiagnoses ?? [];
    const total = diagnoses.reduce((sum, item) => sum + item.count, 0) || 1;

    return diagnoses.slice(0, 5).map((diagnosis, index) => ({
      name: diagnosis.description,
      value: diagnosis.count,
      percentage: (diagnosis.count / total) * 100,
      color: ["#2563eb", "#7c3aed", "#10b981", "#f59e0b", "#6b7280"][index % 5],
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
        title: "Appointments Today",
        value: derivedStats.todayAppointments.toString(),
        icon: <CalendarIcon />,
        color: "#2563eb",
      },
      {
        title: "Pending Intakes",
        value: derivedStats.pendingIntakes.toString(),
        icon: <AssignmentIcon />,
        color: "#f59e0b",
      },
      {
        title: "Active Patients",
        value: derivedStats.activePatients.toString(),
        icon: <PeopleIcon />,
        color: "#7c3aed",
      },
      {
        title: "Avg Wait Time",
        value: `${derivedStats.averageWaitTime} min`,
        icon: <AccessTimeIcon />,
        color: "#10b981",
      },
      {
        title: "Completed Today",
        value: derivedStats.completedToday.toString(),
        icon: <CheckCircleIcon />,
        color: "#10b981",
      },
      {
        title: "Patient Satisfaction",
        value: derivedStats.patientSatisfaction.toFixed(1),
        icon: <StarIcon />,
        color: "#f59e0b",
      },
    ],
    [derivedStats],
  );

  const isStatsLoading = statsLoading && !clinicAnalytics;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name || "Doctor"}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Here's your clinic overview for today
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {isStatsLoading
          ? // Loading skeletons
            [...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={2} key={index}>
                <Card>
                  <CardContent>
                    <Skeleton variant="rectangular" height={80} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={2} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography color="text.secondary" variant="body2">
                          {stat.title}
                        </Typography>
                        <Typography variant="h5">{stat.value}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
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
                  <Typography variant="body2" color="text.secondary">
                    No appointments scheduled for today
                  </Typography>
                )}
              </List>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate("/appointments")}
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
                                  ? "#ef4444"
                                  : "#6b7280",
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
                  <Typography variant="body2" color="text.secondary">
                    No recent intake submissions
                  </Typography>
                )}
              </List>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate("/intake-queue")}
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
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">Patient Appointments Trend</Typography>
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
                  data={appointmentTrends || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorAppointments"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="appointments"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorAppointments)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
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
                    data={
                      promCompletionData.length > 0
                        ? promCompletionData.map((p) => ({
                            name: p.name,
                            value: p.completed,
                            color:
                              p.completed > 80
                                ? "#10b981"
                                : p.completed > 50
                                  ? "#f59e0b"
                                  : "#ef4444",
                          }))
                        : [{ name: "No Data", value: 100, color: "#e5e7eb" }]
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) =>
                      entry.name !== "No Data"
                        ? `${entry.name}: ${entry.value}%`
                        : ""
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(promCompletionData.length > 0
                      ? promCompletionData.map((p) => ({
                          name: p.name,
                          value: p.completed,
                          color:
                            p.completed > 80
                              ? "#10b981"
                              : p.completed > 50
                                ? "#f59e0b"
                                : "#ef4444",
                        }))
                      : [{ name: "No Data", value: 100, color: "#e5e7eb" }]
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {promCompletionData.length > 0
                    ? `Overall response rate: ${Math.round(promCompletionData.reduce((sum, p) => sum + p.completed, 0) / promCompletionData.length)}%`
                    : "No PROM data available"}
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
                  data={
                    conditionData.length > 0
                      ? conditionData
                      : [{ name: "No Data", percentage: 0 }]
                  }
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) =>
                      `${value.toFixed ? value.toFixed(1) : value}%`
                    }
                  />
                  <Bar dataKey="percentage" fill="#7c3aed" />
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
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.6}
                  />
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
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
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
