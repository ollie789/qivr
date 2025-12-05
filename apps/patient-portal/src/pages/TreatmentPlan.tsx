import { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  alpha,
  useTheme,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  LocalFireDepartment,
  EmojiEvents,
  CalendarMonth,
  FitnessCenter,
  CheckCircle,
  Star,
  Refresh,
  AccessTime,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  AuraCard,
  AuraButton,
  SectionLoader,
  AuraEmptyState,
  Callout,
  PageHeader,
  AuraGlassStatCard,
} from "@qivr/design-system";
import {
  treatmentPlansApi,
  type MyTreatmentPlan,
  type ExerciseCompletion,
  type DailyCheckInData,
} from "../lib/api-client";
import {
  ExerciseCard,
  TreatmentTimeline,
  DailyCheckIn,
  type Exercise,
} from "../components/treatment-plan";

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
      {value === index && children}
    </Box>
  );
}

export default function TreatmentPlan() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);

  const {
    data: plan,
    isLoading,
    error,
    refetch,
  } = useQuery<MyTreatmentPlan | null>({
    queryKey: ["my-treatment-plan"],
    queryFn: () => treatmentPlansApi.getMyPlan(),
    retry: 1,
  });

  const completeExerciseMutation = useMutation({
    mutationFn: async ({
      exerciseId,
      data,
    }: {
      exerciseId: string;
      data: ExerciseCompletion;
    }) => {
      if (!plan) throw new Error("No plan loaded");
      return treatmentPlansApi.completeExercise(plan.id, exerciseId, data);
    },
    // Optimistic update
    onMutate: async ({ exerciseId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["my-treatment-plan"] });

      // Snapshot previous value
      const previousPlan = queryClient.getQueryData<MyTreatmentPlan>([
        "my-treatment-plan",
      ]);

      // Optimistically update the task as completed
      if (previousPlan) {
        queryClient.setQueryData<MyTreatmentPlan>(["my-treatment-plan"], {
          ...previousPlan,
          todaysTasks: previousPlan.todaysTasks.map((task) =>
            task.exerciseId === exerciseId
              ? {
                  ...task,
                  isCompleted: true,
                  completedAt: new Date().toISOString(),
                }
              : task,
          ),
        });
      }

      return { previousPlan };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousPlan) {
        queryClient.setQueryData(["my-treatment-plan"], context.previousPlan);
      }
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: ["my-treatment-plan"] });
    },
  });

  const submitCheckInMutation = useMutation({
    mutationFn: async (data: DailyCheckInData) => {
      if (!plan) throw new Error("No plan loaded");
      return treatmentPlansApi.submitCheckIn(plan.id, data);
    },
    // Optimistic update
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["my-treatment-plan"] });

      const previousPlan = queryClient.getQueryData<MyTreatmentPlan>([
        "my-treatment-plan",
      ]);

      if (previousPlan) {
        queryClient.setQueryData<MyTreatmentPlan>(["my-treatment-plan"], {
          ...previousPlan,
          checkInStatus: {
            hasCheckedInToday: true,
            lastCheckIn: {
              painLevel: data.painLevel,
              mood: data.mood,
              notes: data.notes,
              date: new Date().toISOString(),
            },
          },
          // Optimistically increment streak
          currentStreak: previousPlan.currentStreak + 1,
          totalPoints: previousPlan.totalPoints + data.exercisesCompleted * 10,
        });
      }

      return { previousPlan };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData(["my-treatment-plan"], context.previousPlan);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-treatment-plan"] });
    },
  });

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

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Treatment Plan
        </Typography>
        <Callout variant="error">
          Failed to load your treatment plan. Please try again.
        </Callout>
        <Box sx={{ mt: 2 }}>
          <AuraButton onClick={() => refetch()} startIcon={<Refresh />}>
            Retry
          </AuraButton>
        </Box>
      </Box>
    );
  }

  if (!plan) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Treatment Plan"
          description="Your personalized recovery journey"
        />
        <AuraEmptyState
          title="No Active Treatment Plan"
          description="Your healthcare provider will create a personalized treatment plan for you during your next visit. Once activated, you'll be able to track exercises, milestones, and your progress here."
          icon={
            <FitnessCenter sx={{ fontSize: 64, color: "text.secondary" }} />
          }
        />
      </Box>
    );
  }

  const completedTodayCount = (plan.todaysTasks || []).filter(
    (t) => t.isCompleted,
  ).length;
  const totalTodayTasks = (plan.todaysTasks || []).length;
  const todayProgress =
    totalTodayTasks > 0 ? (completedTodayCount / totalTodayTasks) * 100 : 0;

  const handleExerciseComplete = (
    exerciseId: string,
    data: { setsCompleted: number; repsCompleted: number },
  ) => {
    completeExerciseMutation.mutate({ exerciseId, data });
  };

  const handleCheckInSubmit = (data: {
    painLevel: number;
    mood: number;
    notes?: string;
    exercisesCompleted: number;
  }) => {
    submitCheckInMutation.mutate(data);
  };

  // Map today's tasks to Exercise format
  const exercises: Exercise[] = (plan.todaysTasks || []).map((task) => ({
    id: task.exerciseId,
    name: task.name,
    sets: task.sets,
    reps: task.reps,
    holdSeconds: task.holdSeconds,
    instructions: task.instructions,
    description: task.description,
    category: task.category,
    bodyRegion: task.bodyRegion,
    difficulty: task.difficulty,
  }));

  const unlockedMilestones = (plan.milestones || []).filter(
    (m) => m.isAchieved,
  );
  const upcomingMilestones = (plan.milestones || []).filter(
    (m) => !m.isAchieved,
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="My Treatment Plan"
        description={plan.diagnosis}
        actions={
          <Chip
            label={plan.status}
            color={plan.status === "Active" ? "success" : "default"}
            variant="filled"
          />
        }
      />

      {/* Stats Row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <AuraGlassStatCard
          title="Current Streak"
          value={`${plan.currentStreak} days`}
          icon={<LocalFireDepartment />}
          color="error.main"
        />
        <AuraGlassStatCard
          title="Total Points"
          value={plan.totalPoints}
          icon={<Star />}
          color="warning.main"
        />
        <AuraGlassStatCard
          title="Week"
          value={`${plan.currentWeek}/${plan.totalWeeks}`}
          icon={<CalendarMonth />}
          color="info.main"
        />
        <AuraGlassStatCard
          title="Progress"
          value={`${Math.round(plan.overallProgress)}%`}
          icon={<EmojiEvents />}
          color="success.main"
        />
      </Box>

      {/* Today's Progress Banner */}
      <AuraCard sx={{ mb: 3 }}>
        <Box sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Today's Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(new Date(), "EEEE, MMMM d")}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="h5" fontWeight={700} color="primary">
                {completedTodayCount}/{totalTodayTasks}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                exercises done
              </Typography>
            </Box>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={todayProgress}
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
          {todayProgress === 100 && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mt: 1.5 }}
            >
              <CheckCircle color="success" />
              <Typography variant="body2" color="success.main" fontWeight={500}>
                All exercises completed today! Great job!
              </Typography>
            </Stack>
          )}
        </Box>
      </AuraCard>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<FitnessCenter />}
            iconPosition="start"
            label={`Today's Exercises (${totalTodayTasks})`}
          />
          <Tab
            icon={<CalendarMonth />}
            iconPosition="start"
            label="Treatment Timeline"
          />
          <Tab
            icon={<EmojiEvents />}
            iconPosition="start"
            label={`Milestones (${unlockedMilestones.length}/${(plan.milestones || []).length})`}
          />
        </Tabs>
      </Box>

      {/* Tab: Today's Exercises */}
      <TabPanel value={activeTab} index={0}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            gap: 3,
          }}
        >
          {/* Exercises List */}
          <Box>
            <Stack spacing={2}>
              {exercises.length > 0 ? (
                exercises.map((exercise) => {
                  const task = plan.todaysTasks.find(
                    (t) => t.exerciseId === exercise.id,
                  );
                  return (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      isCompletedToday={task?.isCompleted || false}
                      onComplete={handleExerciseComplete}
                    />
                  );
                })
              ) : (
                <AuraCard>
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <CheckCircle
                      sx={{ fontSize: 48, color: "success.main", mb: 2 }}
                    />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      No Exercises Today
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Take a rest day! Your next exercises are scheduled for
                      tomorrow.
                    </Typography>
                  </Box>
                </AuraCard>
              )}
            </Stack>
          </Box>

          {/* Daily Check-in Sidebar */}
          <Box>
            <DailyCheckIn
              onSubmit={handleCheckInSubmit}
              exerciseCount={totalTodayTasks}
              completedExerciseCount={completedTodayCount}
              isSubmitting={submitCheckInMutation.isPending}
              alreadyCheckedIn={plan.checkInStatus?.hasCheckedInToday ?? false}
              lastCheckIn={plan.checkInStatus?.lastCheckIn}
            />
          </Box>
        </Box>
      </TabPanel>

      {/* Tab: Treatment Timeline */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ maxWidth: 800 }}>
          <TreatmentTimeline
            phases={plan.phases}
            currentWeek={plan.currentWeek}
            totalWeeks={plan.totalWeeks}
          />
        </Box>
      </TabPanel>

      {/* Tab: Milestones */}
      <TabPanel value={activeTab} index={2}>
        <Stack spacing={4}>
          {/* Unlocked Milestones */}
          {unlockedMilestones.length > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <EmojiEvents color="warning" /> Unlocked
              </Typography>
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
                {unlockedMilestones.map((milestone) => (
                  <AuraCard key={milestone.id}>
                    <Box
                      sx={{
                        p: 2.5,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        borderBottom: "1px solid",
                        borderColor: alpha(theme.palette.success.main, 0.2),
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.success.main, 0.15),
                            color: "success.main",
                            display: "flex",
                          }}
                        >
                          <CheckCircle />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {milestone.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            +{milestone.pointsAwarded} points
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {milestone.description}
                      </Typography>
                      {milestone.achievedDate && (
                        <Typography
                          variant="caption"
                          color="success.main"
                          sx={{ display: "block", mt: 1 }}
                        >
                          Achieved on{" "}
                          {format(
                            parseISO(milestone.achievedDate),
                            "MMM d, yyyy",
                          )}
                        </Typography>
                      )}
                    </Box>
                  </AuraCard>
                ))}
              </Box>
            </Box>
          )}

          {/* Upcoming Milestones */}
          {upcomingMilestones.length > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <AccessTime color="action" /> Upcoming
              </Typography>
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
                {upcomingMilestones.map((milestone) => (
                  <AuraCard
                    key={milestone.id}
                    sx={{
                      opacity: 0.8,
                      border: "1px dashed",
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ p: 2.5 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.grey[500], 0.1),
                            color: "text.secondary",
                            display: "flex",
                          }}
                        >
                          <Star />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {milestone.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            +{milestone.pointsAwarded} points
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {milestone.description}
                      </Typography>
                      {milestone.targetDate && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 1 }}
                        >
                          Target:{" "}
                          {format(
                            parseISO(milestone.targetDate),
                            "MMM d, yyyy",
                          )}
                        </Typography>
                      )}
                    </Box>
                  </AuraCard>
                ))}
              </Box>
            </Box>
          )}

          {(plan.milestones || []).length === 0 && (
            <AuraEmptyState
              title="No Milestones Yet"
              description="Milestones will appear here as your treatment plan progresses."
              icon={
                <EmojiEvents sx={{ fontSize: 48, color: "text.secondary" }} />
              }
            />
          )}
        </Stack>
      </TabPanel>
    </Box>
  );
}
