import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  alpha,
  useTheme,
  LinearProgress,
} from "@mui/material";
import {
  CheckCircle,
  RadioButtonUnchecked,
  PlayCircle,
  Flag,
} from "@mui/icons-material";

export interface TreatmentPhase {
  phaseNumber: number;
  name: string;
  description?: string;
  durationWeeks: number;
  goals: string[];
  status: "NotStarted" | "InProgress" | "Completed";
  startDate?: string;
  endDate?: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
  }>;
  sessionsPerWeek: number;
  phaseProgressPercentage?: number;
}

interface TreatmentTimelineProps {
  phases: TreatmentPhase[];
  currentWeek: number;
  totalWeeks: number;
}

export function TreatmentTimeline({
  phases,
  currentWeek,
  totalWeeks,
}: TreatmentTimelineProps) {
  const theme = useTheme();

  const getStepIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <CheckCircle
            sx={{
              color: "success.main",
              fontSize: 28,
            }}
          />
        );
      case "InProgress":
        return (
          <PlayCircle
            sx={{
              color: "primary.main",
              fontSize: 28,
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.5 },
                "100%": { opacity: 1 },
              },
            }}
          />
        );
      default:
        return (
          <RadioButtonUnchecked
            sx={{
              color: "grey.400",
              fontSize: 28,
            }}
          />
        );
    }
  };

  const activeStep = phases.findIndex(
    (p) => p.status === "InProgress" || p.status === "NotStarted"
  );

  return (
    <Box>
      {/* Overall Progress Header */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, 0.1),
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Treatment Progress
          </Typography>
          <Typography variant="subtitle2" color="primary" fontWeight={600}>
            Week {currentWeek} of {totalWeeks}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={(currentWeek / totalWeeks) * 100}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
            },
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {phases.filter((p) => p.status === "Completed").length} of{" "}
            {phases.length} phases complete
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {Math.round((currentWeek / totalWeeks) * 100)}%
          </Typography>
        </Box>
      </Box>

      {/* Phase Timeline */}
      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        sx={{
          "& .MuiStepConnector-line": {
            borderLeftWidth: 3,
            borderLeftStyle: "dashed",
            minHeight: 40,
          },
        }}
      >
        {phases.map((phase, index) => (
          <Step key={index} completed={phase.status === "Completed"}>
            <StepLabel
              StepIconComponent={() => getStepIcon(phase.status)}
              sx={{
                "& .MuiStepLabel-label": {
                  fontWeight: phase.status === "InProgress" ? 600 : 400,
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={phase.status === "InProgress" ? 600 : 400}
                  color={
                    phase.status === "Completed"
                      ? "text.secondary"
                      : "text.primary"
                  }
                >
                  Phase {phase.phaseNumber}: {phase.name}
                </Typography>
                <Chip
                  label={`${phase.durationWeeks}w`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 20 }}
                />
              </Box>
            </StepLabel>
            <StepContent>
              <Box sx={{ pl: 1, pb: 2 }}>
                {phase.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    {phase.description}
                  </Typography>
                )}

                {/* Phase Progress (for in-progress phases) */}
                {phase.status === "InProgress" &&
                  phase.phaseProgressPercentage !== undefined && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Phase Progress
                        </Typography>
                        <Typography
                          variant="caption"
                          color="primary"
                          fontWeight={600}
                        >
                          {Math.round(phase.phaseProgressPercentage)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={phase.phaseProgressPercentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                        }}
                      />
                    </Box>
                  )}

                {/* Goals */}
                {phase.goals.length > 0 && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Flag fontSize="inherit" /> Goals
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}
                    >
                      {phase.goals.map((goal, i) => (
                        <Chip
                          key={i}
                          label={goal}
                          size="small"
                          sx={{
                            bgcolor:
                              phase.status === "Completed"
                                ? alpha(theme.palette.success.main, 0.1)
                                : alpha(theme.palette.primary.main, 0.1),
                            color:
                              phase.status === "Completed"
                                ? "success.dark"
                                : "primary.dark",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Exercise count */}
                <Typography variant="caption" color="text.secondary">
                  {phase.exercises.length} exercises | {phase.sessionsPerWeek}{" "}
                  sessions/week
                </Typography>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

export default TreatmentTimeline;
