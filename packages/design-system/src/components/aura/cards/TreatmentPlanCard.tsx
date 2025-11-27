import { auraTokens } from "../../../theme/auraTokens";
import React from "react";
import {
  Paper,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Chip,
  Divider,
} from "@mui/material";
import {
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  FitnessCenter as ExerciseIcon,
  TrendingUp as ProgressIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

interface TreatmentPlan {
  id: string;
  title: string;
  goals: string;
  frequency: string;
  duration: string;
  sessionLength: number;
  homeExercises: string;
  expectedOutcomes: string;
  promSchedule: string;
  status: string;
  startDate: string;
  durationWeeks: number;
  sessionsCompleted?: number;
  totalSessions?: number;
  nextAppointment?: string;
}

export const TreatmentPlanCard: React.FC = () => {
  const { data: plan, isLoading } = useQuery<TreatmentPlan>({
    queryKey: ["treatment-plan"],
    queryFn: async () => {
      const response = await fetch("/api/treatment-plans/current", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch treatment plan");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: auraTokens.spacing.lg, borderRadius: auraTokens.borderRadius.lg }}>
        <Typography>Loading treatment plan...</Typography>
      </Paper>
    );
  }

  if (!plan) {
    return (
      <Paper sx={{ p: auraTokens.spacing.lg, borderRadius: auraTokens.borderRadius.lg, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No active treatment plan
        </Typography>
      </Paper>
    );
  }

  const goals = plan.goals?.split(",").map((g) => g.trim()) || [];
  const sessionsCompleted = plan.sessionsCompleted || 0;
  const totalSessions = plan.totalSessions || plan.durationWeeks * 2; // Estimate
  const progress = (sessionsCompleted / totalSessions) * 100;

  // Parse notes to extract frequency
  const frequency = plan.frequency || "2x per week";

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: auraTokens.borderRadius.lg,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
      }}
    >
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            My Treatment Plan
          </Typography>
          <Chip
            label={plan.status}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              color: "white",
              fontWeight: 600,
            }}
          />
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

        {/* Goals */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <CheckIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Treatment Goals
            </Typography>
          </Stack>
          {goals.map((goal, idx) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {goal}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: auraTokens.borderRadius.lg,
                  bgcolor: "rgba(255,255,255,0.2)",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: "white",
                  },
                }}
              />
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />

        {/* Schedule */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <ScheduleIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Schedule
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {frequency} for {plan.durationWeeks} weeks
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9 }}>
            {sessionsCompleted} of {totalSessions} sessions completed
          </Typography>
        </Box>

        {/* Next Appointment */}
        {plan.nextAppointment && (
          <>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Next Appointment
              </Typography>
              <Typography variant="body2">
                {format(parseISO(plan.nextAppointment), "EEEE, MMMM d 'at' h:mm a")}
              </Typography>
            </Box>
          </>
        )}

        {/* Home Exercises */}
        {plan.homeExercises && (
          <>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.2)" }} />
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <ExerciseIcon />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Home Exercises
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-line", opacity: 0.95 }}
              >
                {plan.homeExercises}
              </Typography>
            </Box>
          </>
        )}

        {/* Progress */}
        <Box
          sx={{
            p: 2,
            bgcolor: "rgba(255,255,255,0.1)",
            borderRadius: auraTokens.borderRadius.md,
            textAlign: "center",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
            <ProgressIcon />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {Math.round(progress)}%
            </Typography>
          </Stack>
          <Typography variant="caption">Treatment Progress</Typography>
        </Box>
      </Stack>
    </Paper>
  );
};
