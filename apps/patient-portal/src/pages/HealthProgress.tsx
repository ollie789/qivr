import {
  Box,
  Typography,
  Stack,
  alpha,
  useTheme,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  EmojiEvents,
  LocalFireDepartment,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Star,
  Refresh,
  Assignment,
  FlagCircle,
  FitnessCenter,
  BarChart,
  Whatshot,
  AutoAwesome,
  Bolt,
  Timeline,
  Healing,
  SentimentSatisfiedAlt,
  SentimentDissatisfied,
  ShowChart,
  EventAvailable,
} from "@mui/icons-material";
import {
  AuraGlassStatCard,
  AuraCard,
  AuraButton,
  SectionLoader,
  Callout,
  PageHeader,
} from "@qivr/design-system";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import api, { treatmentPlansApi, type TreatmentProgressResponse } from "../lib/api-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

// Map achievement icons from API to MUI icons
const achievementIconMap: Record<string, React.ReactNode> = {
  "🎯": <FlagCircle />,
  "💪": <FitnessCenter />,
  "🏆": <EmojiEvents />,
  "📊": <BarChart />,
  "📈": <TrendingUp />,
  "🔥": <Whatshot />,
  "⚡": <Bolt />,
  "✨": <AutoAwesome />,
  "⭐": <Star />,
};

const getAchievementIcon = (icon: string) =>
  achievementIconMap[icon] || <Star />;

const calculateHealthScore = (data: any) => {
  if (!data) return 0;
  const appointmentScore = Math.min((data.completedAppointments || 0) * 5, 30);
  const promScore = Math.min((data.totalPromCompleted || 0) * 3, 30);
  const improvementScore = Math.min(data.promImprovement || 0, 40);
  return Math.min(appointmentScore + promScore + improvementScore, 100);
};

const getPainLevelLabel = (level: number) => {
  if (level <= 2) return { label: "Minimal", color: "success" as const };
  if (level <= 4) return { label: "Mild", color: "info" as const };
  if (level <= 6) return { label: "Moderate", color: "warning" as const };
  return { label: "Severe", color: "error" as const };
};

export default function HealthProgress() {
  const theme = useTheme();
  const navigate = useNavigate();

  // Fetch dashboard summary data
  const {
    data: rawData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["patient-analytics-dashboard"],
    queryFn: async () => {
      const response: any = await api.get("/api/patient-analytics/dashboard");
      return response.data || response;
    },
    retry: 2,
  });

  // Fetch progress timeline data for charts
  const { data: progressData } = useQuery({
    queryKey: ["patient-analytics-progress"],
    queryFn: async () => {
      const from = subDays(new Date(), 90).toISOString();
      const to = new Date().toISOString();
      const response: any = await api.get(
        `/api/patient-analytics/progress?from=${from}&to=${to}`,
      );
      return response.data || response;
    },
    retry: 2,
  });

  // Fetch treatment plan progress
  const { data: treatmentProgress } = useQuery<TreatmentProgressResponse>({
    queryKey: ["treatment-plan-progress"],
    queryFn: () => treatmentPlansApi.getProgress(),
    retry: 1,
  });

  const stats = rawData
    ? {
        healthScore: calculateHealthScore(rawData),
        appointmentStreak: rawData.currentStreak || 0,
        promStreak: rawData.currentStreak || 0,
        totalAppointments: rawData.totalAppointments || 0,
        completedAppointments: rawData.completedAppointments || 0,
        upcomingAppointments: rawData.upcomingAppointments || 0,
        completedProms: rawData.totalPromCompleted || 0,
        improvementRate: rawData.promImprovement || 0,
        currentPromScore: rawData.currentPromScore || 0,
        currentPainLevel: rawData.currentPainLevel || 0,
        painReduction: rawData.painReduction || 0,
        nextMilestone: {
          current: rawData.completedAppointments || 0,
          target: 15,
        },
        achievements: rawData.achievements || [],
        level: rawData.level || 1,
        pointsToNextLevel: rawData.pointsToNextLevel || 50,
      }
    : null;

  // Format chart data
  const promChartData =
    progressData?.promScoreTimeline?.map((point: any) => ({
      date: format(new Date(point.date), "MMM d"),
      score: point.score,
      type: point.type,
    })) || [];

  const painChartData =
    progressData?.painIntensityTimeline?.map((point: any) => ({
      date: format(new Date(point.date), "MMM d"),
      intensity: point.intensity,
      region: point.bodyRegion,
    })) || [];

  const healthScore = stats?.healthScore || 0;
  const painInfo = getPainLevelLabel(stats?.currentPainLevel || 0);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Health Progress
        </Typography>
        <Callout variant="error">
          Failed to load your health data. Please try again.
        </Callout>
        <Box sx={{ mt: 2 }}>
          <AuraButton onClick={() => refetch()} startIcon={<Refresh />}>
            Retry
          </AuraButton>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <SectionLoader />
      </Box>
    );
  }

  const achievements = stats?.achievements || [];
  const milestoneProgress =
    ((stats?.nextMilestone?.current || 0) /
      (stats?.nextMilestone?.target || 15)) *
    100;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Health Progress"
        description="Track your recovery journey with real insights from your appointments, assessments, and outcomes"
      />

      <Stack spacing={3}>
        {/* Key Health Metrics Row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 2,
          }}
        >
          <AuraGlassStatCard
            title="Health Score"
            value={healthScore}
            icon={<EmojiEvents />}
            color={
              healthScore >= 80
                ? "success.main"
                : healthScore >= 60
                  ? "warning.main"
                  : "error.main"
            }
            trend={
              stats?.improvementRate
                ? {
                    value: Math.abs(stats.improvementRate),
                    isPositive: stats.improvementRate > 0,
                    label: "from baseline",
                  }
                : undefined
            }
          />
          <AuraGlassStatCard
            title="Current Pain Level"
            value={`${stats?.currentPainLevel || 0}/10`}
            icon={
              stats?.currentPainLevel && stats.currentPainLevel <= 4 ? (
                <SentimentSatisfiedAlt />
              ) : (
                <SentimentDissatisfied />
              )
            }
            color={painInfo.color + ".main"}
            trend={
              stats?.painReduction
                ? {
                    value: Math.abs(stats.painReduction),
                    isPositive: stats.painReduction > 0,
                    label: "point reduction",
                  }
                : undefined
            }
          />
          <AuraGlassStatCard
            title="PROM Score"
            value={stats?.currentPromScore || 0}
            icon={<ShowChart />}
            color="info.main"
            trend={
              stats?.improvementRate
                ? {
                    value: Math.abs(stats.improvementRate),
                    isPositive: stats.improvementRate > 0,
                    label: "improvement",
                  }
                : undefined
            }
          />
          <AuraGlassStatCard
            title="Attendance Streak"
            value={`${stats?.appointmentStreak || 0} weeks`}
            icon={<LocalFireDepartment />}
            color="error.main"
          />
        </Box>

        {/* Appointment Summary */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          <AuraCard>
            <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: "success.main",
                  display: "flex",
                }}
              >
                <CheckCircle />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {stats?.completedAppointments || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Sessions
                </Typography>
              </Box>
            </Box>
          </AuraCard>
          <AuraCard>
            <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                  display: "flex",
                }}
              >
                <EventAvailable />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {stats?.upcomingAppointments || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upcoming Appointments
                </Typography>
              </Box>
            </Box>
          </AuraCard>
          <AuraCard>
            <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  color: "info.main",
                  display: "flex",
                }}
              >
                <Assignment />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {stats?.completedProms || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Assessments Completed
                </Typography>
              </Box>
            </Box>
          </AuraCard>
        </Box>

        {/* Treatment Plan Progress */}
        {treatmentProgress?.hasPlan && treatmentProgress.progress && (
          <AuraCard>
            <Box sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <FitnessCenter sx={{ color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={600}>
                    Treatment Plan Progress
                  </Typography>
                </Stack>
                <AuraButton
                  variant="outlined"
                  size="small"
                  onClick={() => navigate("/treatment-plan")}
                >
                  View Plan
                </AuraButton>
              </Stack>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {treatmentProgress.progress.diagnosis} - Week{" "}
                {treatmentProgress.progress.currentWeek} of{" "}
                {treatmentProgress.progress.totalWeeks}
              </Typography>

              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    Overall Progress
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight={600}
                  >
                    {Math.round(treatmentProgress.progress.overallProgress)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={treatmentProgress.progress.overallProgress}
                  sx={{
                    height: 12,
                    borderRadius: 6,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 6,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                    },
                  }}
                />
              </Box>

              {/* Treatment Stats Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h5" fontWeight={700} color="info.main">
                    {treatmentProgress.progress.completedSessions}/
                    {treatmentProgress.progress.totalSessions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sessions
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    textAlign: "center",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.5}
                  >
                    <LocalFireDepartment
                      sx={{ fontSize: 20, color: "error.main" }}
                    />
                    <Typography variant="h5" fontWeight={700} color="error.main">
                      {treatmentProgress.progress.currentStreak}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Day Streak
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    textAlign: "center",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={0.5}
                  >
                    <Star sx={{ fontSize: 20, color: "warning.main" }} />
                    <Typography
                      variant="h5"
                      fontWeight={700}
                      color="warning.main"
                    >
                      {treatmentProgress.progress.totalPoints}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Points
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {treatmentProgress.progress.currentPhase}/
                    {treatmentProgress.progress.totalPhases}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Phase
                  </Typography>
                </Box>
              </Box>

              {/* Today's Exercises Summary */}
              {treatmentProgress.progress.todaysExercises > 0 && (
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.15),
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FitnessCenter
                        sx={{ color: "primary.main", fontSize: 20 }}
                      />
                      <Typography variant="body2">
                        Today's Exercises:{" "}
                        <strong>
                          {treatmentProgress.progress.todaysCompletedExercises}/
                          {treatmentProgress.progress.todaysExercises}
                        </strong>{" "}
                        completed
                      </Typography>
                    </Stack>
                    {treatmentProgress.progress.todaysCompletedExercises ===
                    treatmentProgress.progress.todaysExercises ? (
                      <Chip
                        size="small"
                        icon={<CheckCircle sx={{ fontSize: 16 }} />}
                        label="All done!"
                        color="success"
                      />
                    ) : (
                      <AuraButton
                        variant="contained"
                        size="small"
                        onClick={() => navigate("/treatment-plan")}
                      >
                        Continue
                      </AuraButton>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Milestones Preview */}
              {treatmentProgress.progress.unlockedMilestones?.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                    Recent Milestones
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {treatmentProgress.progress.unlockedMilestones
                      .slice(0, 3)
                      .map((milestone: any) => (
                        <Chip
                          key={milestone.id}
                          icon={<EmojiEvents sx={{ fontSize: 16 }} />}
                          label={milestone.title}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </AuraCard>
        )}

        {/* Progress Charts */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
            gap: 3,
          }}
        >
          {/* PROM Score Trend */}
          <AuraCard>
            <Box sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <ShowChart sx={{ color: "info.main" }} />
                <Typography variant="h6" fontWeight={600}>
                  Assessment Score Trend
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your PROM scores over the last 90 days
              </Typography>
              {promChartData.length > 0 ? (
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={promChartData}>
                      <defs>
                        <linearGradient
                          id="scoreGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={theme.palette.info.main}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={theme.palette.info.main}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={alpha(theme.palette.divider, 0.3)}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{
                          fontSize: 12,
                          fill: theme.palette.text.secondary,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 12,
                          fill: theme.palette.text.secondary,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={theme.palette.info.main}
                        strokeWidth={2}
                        fill="url(#scoreGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.action.hover, 0.3),
                    borderRadius: 2,
                  }}
                >
                  <Stack alignItems="center" spacing={1}>
                    <Timeline sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary">
                      Complete assessments to see your progress trend
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Box>
          </AuraCard>

          {/* Pain Level Trend */}
          <AuraCard>
            <Box sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Healing sx={{ color: "success.main" }} />
                <Typography variant="h6" fontWeight={600}>
                  Pain Level Trend
                </Typography>
                {stats?.painReduction && stats.painReduction > 0 && (
                  <Chip
                    size="small"
                    icon={<TrendingDown sx={{ fontSize: 16 }} />}
                    label={`${stats.painReduction} point reduction`}
                    color="success"
                    sx={{ ml: "auto" }}
                  />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your pain levels from evaluations over time
              </Typography>
              {painChartData.length > 0 ? (
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={painChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={alpha(theme.palette.divider, 0.3)}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{
                          fontSize: 12,
                          fill: theme.palette.text.secondary,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{
                          fontSize: 12,
                          fill: theme.palette.text.secondary,
                        }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                        }}
                        formatter={(value: number) => [
                          `${value}/10`,
                          "Pain Level",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="intensity"
                        stroke={theme.palette.success.main}
                        strokeWidth={2}
                        dot={{ fill: theme.palette.success.main, r: 4 }}
                        activeDot={{ r: 6, fill: theme.palette.success.main }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(theme.palette.action.hover, 0.3),
                    borderRadius: 2,
                  }}
                >
                  <Stack alignItems="center" spacing={1}>
                    <Healing sx={{ fontSize: 40, color: "text.disabled" }} />
                    <Typography variant="body2" color="text.secondary">
                      Pain data will appear after evaluations
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Box>
          </AuraCard>
        </Box>

        {/* Achievements Section */}
        <AuraCard>
          <Box sx={{ p: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Achievements
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {achievements.length} unlocked
                </Typography>
              </Box>
              <Box
                sx={{
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: "warning.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <EmojiEvents sx={{ fontSize: 18 }} />
                <Typography variant="body2" fontWeight={600}>
                  Level {stats?.level || 1}
                </Typography>
              </Box>
            </Stack>

            {achievements.length > 0 ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {achievements.map((achievement: any, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      border: "1px solid",
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                        borderColor: alpha(theme.palette.primary.main, 0.4),
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: alpha(theme.palette.warning.main, 0.15),
                          color: "warning.main",
                          display: "flex",
                          "& svg": { fontSize: 24 },
                        }}
                      >
                        {getAchievementIcon(achievement.icon)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            {achievement.name}
                          </Typography>
                          <Star sx={{ fontSize: 16, color: "warning.main" }} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {achievement.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  bgcolor: alpha(theme.palette.action.hover, 0.5),
                  borderRadius: 2,
                }}
              >
                <EmojiEvents
                  sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Complete appointments and PROMs to unlock achievements
                </Typography>
              </Box>
            )}
          </Box>
        </AuraCard>

        {/* Progress Cards Row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            gap: 3,
          }}
        >
          {/* Next Milestone */}
          <AuraCard>
            <Box sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <FlagCircle sx={{ color: "primary.main" }} />
                <Typography variant="h6" fontWeight={600}>
                  Next Milestone
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Keep going! You're making great progress.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {stats?.nextMilestone?.current || 0} /{" "}
                    {stats?.nextMilestone?.target || 15} appointments
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight={600}
                  >
                    {Math.round(milestoneProgress)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={milestoneProgress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 5,
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  border: "1px solid",
                  borderColor: alpha(theme.palette.info.main, 0.2),
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckCircle sx={{ color: "info.main", fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>
                      {(stats?.nextMilestone?.target || 15) -
                        (stats?.nextMilestone?.current || 0)}
                    </strong>{" "}
                    more to unlock "Dedicated Patient" badge
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </AuraCard>

          {/* Streaks */}
          <AuraCard>
            <Box sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Whatshot sx={{ color: "error.main" }} />
                <Typography variant="h6" fontWeight={600}>
                  Your Streaks
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Consistency is key to recovery
              </Typography>

              <Stack spacing={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    border: "1px solid",
                    borderColor: alpha(theme.palette.error.main, 0.2),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.error.main, 0.15),
                        display: "flex",
                      }}
                    >
                      <LocalFireDepartment sx={{ color: "error.main" }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {stats?.appointmentStreak || 0} weeks
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Streak
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        display: "flex",
                      }}
                    >
                      <Assignment sx={{ color: "primary.main" }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {stats?.completedProms || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        PROMs Completed
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {(stats?.improvementRate ?? 0) > 0 && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      border: "1px solid",
                      borderColor: alpha(theme.palette.success.main, 0.2),
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.15),
                          display: "flex",
                        }}
                      >
                        <TrendingUp sx={{ color: "success.main" }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          color="success.main"
                        >
                          +{stats?.improvementRate}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Overall Improvement
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Box>
          </AuraCard>
        </Box>
      </Stack>
    </Box>
  );
}
