import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Collapse,
  LinearProgress,
  Paper,
  alpha,
  useTheme,
} from "@mui/material";
import {
  FitnessCenter,
  ExpandMore,
  CheckCircle,
  PlayArrow,
  Timer,
  Replay,
} from "@mui/icons-material";
import { AuraButton } from "@qivr/design-system";

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  sets: number;
  reps: number;
  holdSeconds?: number;
  frequency?: string;
  category?: string;
  bodyRegion?: string;
  difficulty?: string;
  videoUrl?: string;
  imageUrl?: string;
  completions?: Array<{
    completedAt: string;
    setsCompleted: number;
    repsCompleted: number;
  }>;
}

interface ExerciseCardProps {
  exercise: Exercise;
  isCompletedToday?: boolean;
  onComplete?: (exerciseId: string, data: {
    setsCompleted: number;
    repsCompleted: number;
    painLevelBefore?: number;
    painLevelAfter?: number;
    notes?: string;
  }) => void;
  showInstructions?: boolean;
}

export function ExerciseCard({
  exercise,
  isCompletedToday = false,
  onComplete,
  showInstructions = true,
}: ExerciseCardProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [setsCompleted, setSetsCompleted] = useState(0);

  const handleCompleteSet = () => {
    if (setsCompleted < exercise.sets) {
      setSetsCompleted((prev) => prev + 1);
    }
  };

  const handleFinishExercise = () => {
    if (onComplete) {
      setIsCompleting(true);
      onComplete(exercise.id, {
        setsCompleted,
        repsCompleted: setsCompleted * exercise.reps,
      });
      // Reset after completion
      setTimeout(() => {
        setIsCompleting(false);
        setSetsCompleted(0);
      }, 1000);
    }
  };

  const progress = (setsCompleted / exercise.sets) * 100;
  const difficultyColor = {
    Beginner: "success",
    Intermediate: "warning",
    Advanced: "error",
  }[exercise.difficulty || "Beginner"] as "success" | "warning" | "error";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: isCompletedToday
          ? alpha(theme.palette.success.main, 0.3)
          : "divider",
        bgcolor: isCompletedToday
          ? alpha(theme.palette.success.main, 0.05)
          : "background.paper",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isCompletedToday ? (
            <CheckCircle color="success" />
          ) : (
            <FitnessCenter color="primary" />
          )}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {exercise.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
            <Chip
              label={`${exercise.sets} sets × ${exercise.reps} reps`}
              size="small"
              variant="outlined"
            />
            {exercise.holdSeconds && (
              <Chip
                icon={<Timer sx={{ fontSize: 14 }} />}
                label={`${exercise.holdSeconds}s hold`}
                size="small"
                variant="outlined"
              />
            )}
            {exercise.difficulty && (
              <Chip
                label={exercise.difficulty}
                size="small"
                color={difficultyColor}
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        {showInstructions && (
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <ExpandMore />
          </IconButton>
        )}
      </Box>

      {/* Progress during exercise */}
      {setsCompleted > 0 && !isCompletedToday && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Progress
            </Typography>
            <Typography variant="caption" color="primary" fontWeight={600}>
              {setsCompleted}/{exercise.sets} sets
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          />
        </Box>
      )}

      {/* Action buttons */}
      {!isCompletedToday && onComplete && (
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          {setsCompleted < exercise.sets ? (
            <AuraButton
              variant="contained"
              size="small"
              startIcon={<PlayArrow />}
              onClick={handleCompleteSet}
              fullWidth
            >
              {setsCompleted === 0
                ? "Start Exercise"
                : `Complete Set ${setsCompleted + 1}`}
            </AuraButton>
          ) : (
            <AuraButton
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircle />}
              onClick={handleFinishExercise}
              loading={isCompleting}
              fullWidth
            >
              Mark Complete
            </AuraButton>
          )}
          {setsCompleted > 0 && (
            <IconButton
              size="small"
              onClick={() => setSetsCompleted(0)}
              title="Reset"
            >
              <Replay />
            </IconButton>
          )}
        </Box>
      )}

      {/* Completed badge */}
      {isCompletedToday && (
        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "success.main",
          }}
        >
          <CheckCircle fontSize="small" />
          <Typography variant="body2" fontWeight={500}>
            Completed today!
          </Typography>
        </Box>
      )}

      {/* Expandable instructions */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          {exercise.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {exercise.description}
            </Typography>
          )}
          {exercise.instructions && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Instructions:
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "pre-line" }}
              >
                {exercise.instructions}
              </Typography>
            </Box>
          )}
          {exercise.bodyRegion && (
            <Chip
              label={exercise.bodyRegion}
              size="small"
              sx={{ mt: 2 }}
              variant="outlined"
            />
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

export default ExerciseCard;
