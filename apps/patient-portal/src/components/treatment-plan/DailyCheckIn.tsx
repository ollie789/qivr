import { useState } from "react";
import {
  Box,
  Typography,
  Slider,
  TextField,
  alpha,
  useTheme,
  Paper,
  Collapse,
} from "@mui/material";
import {
  CheckCircle,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  ExpandMore,
} from "@mui/icons-material";
import { AuraButton } from "@qivr/design-system";

interface DailyCheckInProps {
  onSubmit: (data: {
    painLevel: number;
    mood: number;
    notes?: string;
    exercisesCompleted: number;
  }) => void;
  exerciseCount: number;
  completedExerciseCount: number;
  isSubmitting?: boolean;
  alreadyCheckedIn?: boolean;
  lastCheckIn?: {
    painLevel: number;
    mood: number;
    notes?: string;
    date: string;
  };
}

const painMarks = [
  { value: 0, label: "0" },
  { value: 2, label: "2" },
  { value: 4, label: "4" },
  { value: 6, label: "6" },
  { value: 8, label: "8" },
  { value: 10, label: "10" },
];

const moodIcons = [
  { value: 1, icon: SentimentVeryDissatisfied, label: "Very Bad", color: "error" },
  { value: 2, icon: SentimentDissatisfied, label: "Bad", color: "warning" },
  { value: 3, icon: SentimentNeutral, label: "Okay", color: "grey" },
  { value: 4, icon: SentimentSatisfied, label: "Good", color: "info" },
  { value: 5, icon: SentimentVerySatisfied, label: "Great", color: "success" },
];

export function DailyCheckIn({
  onSubmit,
  exerciseCount,
  completedExerciseCount,
  isSubmitting = false,
  alreadyCheckedIn = false,
  lastCheckIn,
}: DailyCheckInProps) {
  const theme = useTheme();
  const [painLevel, setPainLevel] = useState(lastCheckIn?.painLevel ?? 5);
  const [mood, setMood] = useState(lastCheckIn?.mood ?? 3);
  const [notes, setNotes] = useState("");
  const [expanded, setExpanded] = useState(!alreadyCheckedIn);

  const handleSubmit = () => {
    onSubmit({
      painLevel,
      mood,
      notes: notes.trim() || undefined,
      exercisesCompleted: completedExerciseCount,
    });
  };

  const getPainLevelColor = (level: number) => {
    if (level <= 2) return theme.palette.success.main;
    if (level <= 4) return theme.palette.info.main;
    if (level <= 6) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getPainLevelLabel = (level: number) => {
    if (level === 0) return "No Pain";
    if (level <= 2) return "Mild";
    if (level <= 4) return "Moderate";
    if (level <= 6) return "Uncomfortable";
    if (level <= 8) return "Severe";
    return "Extreme";
  };

  if (alreadyCheckedIn && lastCheckIn) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: alpha(theme.palette.success.main, 0.3),
          bgcolor: alpha(theme.palette.success.main, 0.05),
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <CheckCircle color="success" />
          <Typography variant="subtitle1" fontWeight={600}>
            Daily Check-in Complete
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          You've already checked in today. Pain level: {lastCheckIn.painLevel}/10
          | Mood: {moodIcons[lastCheckIn.mood - 1]?.label}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderBottom: expanded ? "1px solid" : "none",
          borderColor: "divider",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Daily Check-in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track how you're feeling today
          </Typography>
        </Box>
        <ExpandMore
          sx={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Pain Level Slider */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2">Pain Level</Typography>
              <Typography
                variant="subtitle2"
                sx={{ color: getPainLevelColor(painLevel) }}
                fontWeight={600}
              >
                {painLevel}/10 - {getPainLevelLabel(painLevel)}
              </Typography>
            </Box>
            <Slider
              value={painLevel}
              onChange={(_, value) => setPainLevel(value as number)}
              min={0}
              max={10}
              marks={painMarks}
              sx={{
                "& .MuiSlider-thumb": {
                  bgcolor: getPainLevelColor(painLevel),
                },
                "& .MuiSlider-track": {
                  bgcolor: getPainLevelColor(painLevel),
                  borderColor: getPainLevelColor(painLevel),
                },
              }}
            />
          </Box>

          {/* Mood Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              How are you feeling today?
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-around" }}>
              {moodIcons.map((item) => {
                const Icon = item.icon;
                const isSelected = mood === item.value;
                return (
                  <Box
                    key={item.value}
                    onClick={() => setMood(item.value)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer",
                      p: 1,
                      borderRadius: 2,
                      transition: "all 0.2s",
                      bgcolor: isSelected
                        ? alpha(
                            (theme.palette[item.color as keyof typeof theme.palette] as any)?.main ?? theme.palette.primary.main,
                            0.1
                          )
                        : "transparent",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <Icon
                      sx={{
                        fontSize: 40,
                        color: isSelected
                          ? `${item.color}.main`
                          : "text.secondary",
                        transition: "all 0.2s",
                        transform: isSelected ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                    <Typography
                      variant="caption"
                      color={isSelected ? `${item.color}.main` : "text.secondary"}
                      sx={{ mt: 0.5 }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Notes */}
          <TextField
            label="Notes (optional)"
            placeholder="Any symptoms, concerns, or progress to share?"
            multiline
            rows={2}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Exercise Summary */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.info.main, 0.05),
              mb: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Exercises completed today:{" "}
              <Typography
                component="span"
                variant="body2"
                fontWeight={600}
                color="primary"
              >
                {completedExerciseCount} of {exerciseCount}
              </Typography>
            </Typography>
          </Box>

          {/* Submit Button */}
          <AuraButton
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            loading={isSubmitting}
            startIcon={<CheckCircle />}
          >
            Complete Check-in
          </AuraButton>
        </Box>
      </Collapse>
    </Paper>
  );
}

export default DailyCheckIn;
