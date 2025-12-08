import { useState, useEffect } from "react";
import {
  TextField,
  Typography,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Stack,
  Paper,
  alpha,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  AutoAwesome as AIIcon,
  FitnessCenter,
  Add,
  Delete,
  ExpandMore,
  ExpandLess,
  Edit as EditIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  StepperDialog,
  FormSection,
  FormRow,
  Callout,
  AuraButton,
} from "@qivr/design-system";
import { treatmentPlansApi } from "../../lib/api";
import { ExerciseLibraryBrowser } from "../treatment-plan";

export interface TemplateBuilderProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (templateId: string) => void;
  /** Optional template to edit */
  editTemplate?: {
    id: string;
    title: string;
    bodyRegion?: string;
    conditionType?: string;
    durationWeeks: number;
    phases?: Phase[];
  };
}

interface Exercise {
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
}

interface Phase {
  phaseNumber: number;
  name: string;
  description?: string;
  durationWeeks: number;
  goals: string[];
  exercises: Exercise[];
  sessionsPerWeek: number;
}

const BODY_REGIONS = [
  "Lower Back",
  "Neck",
  "Shoulder",
  "Knee",
  "Hip",
  "Ankle",
  "Wrist",
  "General",
];

// Default phase structure for each body region
const getDefaultPhases = (region: string): Phase[] => {
  const basePhases: Phase[] = [
    {
      phaseNumber: 1,
      name: "Initial Phase",
      description: "Focus on pain reduction and mobility",
      durationWeeks: 2,
      goals: ["Reduce pain", "Restore basic mobility"],
      exercises: [],
      sessionsPerWeek: 2,
    },
    {
      phaseNumber: 2,
      name: "Strengthening Phase",
      description: "Progressive strengthening",
      durationWeeks: 4,
      goals: ["Build strength", "Improve function"],
      exercises: [],
      sessionsPerWeek: 3,
    },
    {
      phaseNumber: 3,
      name: "Return to Activity",
      description: "Functional recovery and maintenance",
      durationWeeks: 2,
      goals: ["Full recovery", "Prevent recurrence"],
      exercises: [],
      sessionsPerWeek: 2,
    },
  ];

  // Customize phase names based on region
  if (
    region === "Lower Back" &&
    basePhases[0] &&
    basePhases[1] &&
    basePhases[2]
  ) {
    basePhases[0].name = "Pain Management";
    basePhases[1].name = "Core Strengthening";
    basePhases[2].name = "Functional Recovery";
  } else if (
    region === "Shoulder" &&
    basePhases[0] &&
    basePhases[1] &&
    basePhases[2]
  ) {
    basePhases[0].name = "Acute Phase";
    basePhases[1].name = "Rotator Cuff Strengthening";
    basePhases[2].name = "Sport/Work Return";
  } else if (
    region === "Knee" &&
    basePhases[0] &&
    basePhases[1] &&
    basePhases[2]
  ) {
    basePhases[0].name = "Initial Recovery";
    basePhases[1].name = "Quad & Hamstring Building";
    basePhases[2].name = "Functional Phase";
  }

  return basePhases;
};

export function TemplateBuilder({
  open,
  onClose,
  onSuccess,
  editTemplate,
}: TemplateBuilderProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [mode, setMode] = useState<"manual" | "ai">("manual");

  // Form state
  const [basicInfo, setBasicInfo] = useState({
    title: "",
    condition: "",
    bodyRegion: "",
    durationWeeks: 8,
    sessionsPerWeek: 2,
  });

  const [phases, setPhases] = useState<Phase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedPhaseIndex, setExpandedPhaseIndex] = useState<number | null>(
    0,
  );

  // AI prompt for generation
  const [aiPrompt, setAiPrompt] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (editTemplate) {
        setBasicInfo({
          title: editTemplate.title,
          condition: editTemplate.conditionType || "",
          bodyRegion: editTemplate.bodyRegion || "",
          durationWeeks: editTemplate.durationWeeks,
          sessionsPerWeek: 2,
        });
        setPhases(editTemplate.phases || []);
        setMode("manual");
      } else {
        setBasicInfo({
          title: "",
          condition: "",
          bodyRegion: "",
          durationWeeks: 8,
          sessionsPerWeek: 2,
        });
        setPhases([]);
        setMode("manual");
        setAiPrompt("");
      }
      setActiveStep(0);
      setExpandedPhaseIndex(0);
    }
  }, [open, editTemplate]);

  // Steps
  const steps = ["Template Info", "Build Phases", "Review"];

  // AI Preview mutation
  const previewMutation = useMutation({
    mutationFn: treatmentPlansApi.preview,
    onSuccess: (data) => {
      if (data.phases && data.phases.length > 0) {
        setPhases(
          data.phases.map((p: any, idx: number) => ({
            phaseNumber: idx + 1,
            name: p.name,
            description: p.description,
            durationWeeks: p.durationWeeks,
            goals: p.goals || [],
            exercises:
              p.exercises?.map((e: any) => ({
                id: e.id || `ex-${Math.random().toString(36).substr(2, 9)}`,
                name: e.name,
                description: e.description,
                instructions: e.instructions,
                sets: e.sets || 3,
                reps: e.reps || 10,
                holdSeconds: e.holdSeconds,
                frequency: e.frequency,
                category: e.category,
                bodyRegion: e.bodyRegion,
                difficulty: e.difficulty,
              })) || [],
            sessionsPerWeek: p.sessionsPerWeek || 2,
          })),
        );
        setBasicInfo((prev) => ({
          ...prev,
          title: data.title || prev.title,
          durationWeeks: data.totalDurationWeeks || prev.durationWeeks,
        }));
        enqueueSnackbar(
          `AI generated ${data.phases.length} phases! Review and customize below.`,
          { variant: "success" },
        );
        setActiveStep(1); // Move to Build Phases step
      } else {
        enqueueSnackbar("AI generation completed but returned no phases.", {
          variant: "warning",
        });
      }
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
      enqueueSnackbar("AI generation failed. Try manual creation.", {
        variant: "error",
      });
    },
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: treatmentPlansApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-templates"] });
      enqueueSnackbar(
        editTemplate ? "Template updated!" : "Template created!",
        { variant: "success" },
      );
      onSuccess?.(data.id);
      handleClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.message || "Failed to save template", {
        variant: "error",
      });
    },
  });

  const handleClose = () => {
    setActiveStep(0);
    setBasicInfo({
      title: "",
      condition: "",
      bodyRegion: "",
      durationWeeks: 8,
      sessionsPerWeek: 2,
    });
    setPhases([]);
    setIsGenerating(false);
    setAiPrompt("");
    onClose();
  };

  const handleAIGenerate = () => {
    if (!basicInfo.bodyRegion && !aiPrompt) {
      enqueueSnackbar("Please select a body region or describe the condition", {
        variant: "warning",
      });
      return;
    }

    setIsGenerating(true);
    previewMutation.mutate({
      patientId: "", // No patient for templates
      preferredDurationWeeks: basicInfo.durationWeeks,
      sessionsPerWeek: basicInfo.sessionsPerWeek,
      focusAreas: basicInfo.bodyRegion ? [basicInfo.bodyRegion] : undefined,
    });
  };

  const handleApplyDefaultPhases = () => {
    if (!basicInfo.bodyRegion) {
      enqueueSnackbar("Please select a body region first", {
        variant: "warning",
      });
      return;
    }
    setPhases(getDefaultPhases(basicInfo.bodyRegion));
    enqueueSnackbar("Default phases applied. Customize as needed.", {
      variant: "info",
    });
  };

  const handleCreateTemplate = () => {
    createMutation.mutate({
      isTemplate: true,
      title: basicInfo.title || `${basicInfo.bodyRegion} Template`,
      bodyRegion: basicInfo.bodyRegion,
      conditionType: basicInfo.condition,
      templateSource: phases.some((p) => p.exercises.length > 0)
        ? "ai_generated"
        : "clinic_created",
      durationWeeks: basicInfo.durationWeeks,
      phases: phases.map(({ ...p }) => p),
      startDate: new Date().toISOString(),
    });
  };

  // Phase management
  const handleAddPhase = () => {
    const newPhase: Phase = {
      phaseNumber: phases.length + 1,
      name: `Phase ${phases.length + 1}`,
      description: "",
      durationWeeks: 2,
      goals: [],
      exercises: [],
      sessionsPerWeek: basicInfo.sessionsPerWeek,
    };
    setPhases([...phases, newPhase]);
    setExpandedPhaseIndex(phases.length);
  };

  const handleRemovePhase = (index: number) => {
    const updated = phases.filter((_, i) => i !== index);
    updated.forEach((p, i) => (p.phaseNumber = i + 1));
    setPhases(updated);
  };

  const handleUpdatePhase = (index: number, updates: Partial<Phase>) => {
    setPhases((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
      }
      return updated;
    });
  };

  const handleAddExerciseToPhase = (phaseIndex: number, exercise: any) => {
    const newExercise: Exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      sets: exercise.defaultSets || 3,
      reps: exercise.defaultReps || 10,
      holdSeconds: exercise.defaultHoldSeconds,
      frequency: exercise.defaultFrequency || "Daily",
      category: exercise.category,
      bodyRegion: exercise.bodyRegion,
      difficulty: exercise.difficulty,
    };
    setPhases((prev) => {
      const updated = [...prev];
      if (updated[phaseIndex]) {
        updated[phaseIndex] = {
          ...updated[phaseIndex],
          exercises: [...updated[phaseIndex].exercises, newExercise],
        };
      }
      return updated;
    });
    enqueueSnackbar(`Added "${exercise.name}" to ${phases[phaseIndex]?.name}`, {
      variant: "success",
    });
  };

  const handleRemoveExercise = (phaseIndex: number, exerciseIndex: number) => {
    setPhases((prev) => {
      const updated = [...prev];
      if (updated[phaseIndex]) {
        updated[phaseIndex] = {
          ...updated[phaseIndex],
          exercises: updated[phaseIndex].exercises.filter(
            (_, i) => i !== exerciseIndex,
          ),
        };
      }
      return updated;
    });
  };

  // Validation
  const isStepValid = () => {
    switch (activeStep) {
      case 0: // Template Info
        return !!basicInfo.bodyRegion && !!basicInfo.title;
      case 1: // Build Phases
        return phases.length > 0;
      case 2: // Review
        return true;
      default:
        return true;
    }
  };

  const totalExercises = phases.reduce((acc, p) => acc + p.exercises.length, 0);

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Template Info
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Mode Selection Cards */}
            <Box sx={{ display: "flex", gap: 2 }}>
              {/* Manual Option */}
              <Paper
                onClick={() => setMode("manual")}
                sx={{
                  flex: 1,
                  p: 2.5,
                  cursor: "pointer",
                  border: "2px solid",
                  borderColor: mode === "manual" ? "primary.main" : "divider",
                  bgcolor: mode === "manual" ? alpha("#2196f3", 0.04) : "transparent",
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  position: "relative",
                  "&:hover": {
                    borderColor: mode === "manual" ? "primary.main" : "primary.light",
                    bgcolor: mode === "manual" ? alpha("#2196f3", 0.06) : alpha("#2196f3", 0.02),
                  },
                }}
              >
                {mode === "manual" && (
                  <CheckIcon
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "primary.main",
                      fontSize: 20,
                    }}
                  />
                )}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <EditIcon color={mode === "manual" ? "primary" : "action"} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Manual
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Build phases and add exercises yourself from our library
                </Typography>
              </Paper>

              {/* AI Option */}
              <Paper
                onClick={() => setMode("ai")}
                sx={{
                  flex: 1,
                  p: 2.5,
                  cursor: "pointer",
                  border: "2px solid",
                  borderColor: mode === "ai" ? "secondary.main" : "divider",
                  bgcolor: mode === "ai" ? alpha("#9c27b0", 0.04) : "transparent",
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  position: "relative",
                  "&:hover": {
                    borderColor: mode === "ai" ? "secondary.main" : "secondary.light",
                    bgcolor: mode === "ai" ? alpha("#9c27b0", 0.06) : alpha("#9c27b0", 0.02),
                  },
                }}
              >
                {mode === "ai" && (
                  <CheckIcon
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: "secondary.main",
                      fontSize: 20,
                    }}
                  />
                )}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <AIIcon color={mode === "ai" ? "secondary" : "action"} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    AI Assisted
                  </Typography>
                  <Chip label="Recommended" size="small" color="secondary" sx={{ height: 20, fontSize: "0.7rem" }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Let AI generate phases and exercises based on your requirements
                </Typography>
              </Paper>
            </Box>

            <FormSection title="Template Details">
              <TextField
                label="Template Name"
                value={basicInfo.title}
                onChange={(e) =>
                  setBasicInfo({ ...basicInfo, title: e.target.value })
                }
                required
                fullWidth
                placeholder="e.g., ACL Reconstruction Protocol"
              />

              <TextField
                label="Condition / Use Case (optional)"
                value={basicInfo.condition}
                onChange={(e) =>
                  setBasicInfo({ ...basicInfo, condition: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
                sx={{ mt: 2 }}
                placeholder="e.g., Post-surgical ACL reconstruction"
              />

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Body Region *
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {BODY_REGIONS.map((region) => (
                  <Chip
                    key={region}
                    label={region}
                    onClick={() =>
                      setBasicInfo((prev) => ({ ...prev, bodyRegion: region }))
                    }
                    color={
                      basicInfo.bodyRegion === region ? "primary" : "default"
                    }
                    variant={
                      basicInfo.bodyRegion === region ? "filled" : "outlined"
                    }
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </Box>

              <FormRow>
                <TextField
                  label="Duration (weeks)"
                  type="number"
                  value={basicInfo.durationWeeks}
                  onChange={(e) =>
                    setBasicInfo({
                      ...basicInfo,
                      durationWeeks: parseInt(e.target.value) || 8,
                    })
                  }
                  fullWidth
                  inputProps={{ min: 1, max: 52 }}
                />
                <TextField
                  label="Sessions/week"
                  type="number"
                  value={basicInfo.sessionsPerWeek}
                  onChange={(e) =>
                    setBasicInfo({
                      ...basicInfo,
                      sessionsPerWeek: parseInt(e.target.value) || 2,
                    })
                  }
                  fullWidth
                  inputProps={{ min: 1, max: 7 }}
                />
              </FormRow>
            </FormSection>

            {/* AI Generation Section */}
            {mode === "ai" && (
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: alpha("#9c27b0", 0.03),
                  border: "1px solid",
                  borderColor: alpha("#9c27b0", 0.2),
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <AIIcon color="secondary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    AI Generation Options
                  </Typography>
                </Box>
                <TextField
                  label="Additional instructions (optional)"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="e.g., Focus on rotator cuff strengthening, patient has limited ROM"
                  size="small"
                />
                <AuraButton
                  variant="contained"
                  color="secondary"
                  startIcon={
                    isGenerating ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <AIIcon />
                    )
                  }
                  onClick={handleAIGenerate}
                  disabled={isGenerating || !basicInfo.bodyRegion || !basicInfo.title}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  {isGenerating ? "Generating Template..." : "Generate with AI"}
                </AuraButton>
                {(!basicInfo.bodyRegion || !basicInfo.title) && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Fill in template name and body region above to enable AI generation
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        );

      case 1: // Build Phases
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Phases</Typography>
              <Stack direction="row" spacing={1}>
                {phases.length === 0 && (
                  <AuraButton
                    variant="outlined"
                    size="small"
                    onClick={handleApplyDefaultPhases}
                  >
                    Use Defaults
                  </AuraButton>
                )}
                <AuraButton
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddPhase}
                  size="small"
                >
                  Add Phase
                </AuraButton>
              </Stack>
            </Box>

            {phases.length === 0 && (
              <Callout variant="info">
                No phases yet. Click "Use Defaults" for a starting point, or
                "Add Phase" to build from scratch.
              </Callout>
            )}

            {/* Phases List */}
            <Stack spacing={1}>
              {phases.map((phase, phaseIndex) => (
                <Paper
                  key={phaseIndex}
                  variant="outlined"
                  sx={{ borderRadius: 2, overflow: "hidden" }}
                >
                  {/* Phase Header */}
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      cursor: "pointer",
                      bgcolor:
                        expandedPhaseIndex === phaseIndex
                          ? "action.selected"
                          : "transparent",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() =>
                      setExpandedPhaseIndex(
                        expandedPhaseIndex === phaseIndex ? null : phaseIndex,
                      )
                    }
                  >
                    {expandedPhaseIndex === phaseIndex ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    )}
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{ flex: 1 }}
                    >
                      {phase.name}
                    </Typography>
                    <Chip label={`${phase.durationWeeks}w`} size="small" />
                    <Chip
                      label={`${phase.exercises.length} exercises`}
                      size="small"
                      color={phase.exercises.length > 0 ? "success" : "default"}
                      variant="outlined"
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhase(phaseIndex);
                      }}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Phase Content */}
                  <Collapse in={expandedPhaseIndex === phaseIndex}>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Phase Name"
                            value={phase.name}
                            onChange={(e) =>
                              handleUpdatePhase(phaseIndex, {
                                name: e.target.value,
                              })
                            }
                            fullWidth
                            size="small"
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            label="Weeks"
                            type="number"
                            value={phase.durationWeeks}
                            onChange={(e) =>
                              handleUpdatePhase(phaseIndex, {
                                durationWeeks: parseInt(e.target.value) || 2,
                              })
                            }
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 12 }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            label="Sessions/wk"
                            type="number"
                            value={phase.sessionsPerWeek}
                            onChange={(e) =>
                              handleUpdatePhase(phaseIndex, {
                                sessionsPerWeek: parseInt(e.target.value) || 2,
                              })
                            }
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 7 }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Description"
                            value={phase.description || ""}
                            onChange={(e) =>
                              handleUpdatePhase(phaseIndex, {
                                description: e.target.value,
                              })
                            }
                            fullWidth
                            size="small"
                          />
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      {/* Exercises */}
                      <Typography variant="subtitle2" gutterBottom>
                        Exercises ({phase.exercises.length})
                      </Typography>

                      {phase.exercises.length === 0 ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          No exercises yet. Browse the library below.
                        </Typography>
                      ) : (
                        <List dense sx={{ mb: 2 }}>
                          {phase.exercises.map((exercise, exIdx) => (
                            <ListItem
                              key={exercise.id}
                              sx={{
                                bgcolor: "action.hover",
                                borderRadius: 1,
                                mb: 0.5,
                              }}
                              secondaryAction={
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleRemoveExercise(phaseIndex, exIdx)
                                  }
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              }
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <FitnessCenter
                                  color="primary"
                                  fontSize="small"
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={exercise.name}
                                secondary={`${exercise.sets} sets × ${exercise.reps} reps`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  </Collapse>
                </Paper>
              ))}
            </Stack>

            {/* Exercise Library Browser */}
            {phases.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <ExerciseLibraryBrowser
                  phases={phases.map((p) => ({
                    phaseNumber: p.phaseNumber,
                    name: p.name,
                  }))}
                  onAddExercise={(exercise, phaseIndex) =>
                    handleAddExerciseToPhase(phaseIndex, exercise)
                  }
                  bodyRegionHint={basicInfo.bodyRegion}
                />
              </Box>
            )}
          </Box>
        );

      case 2: // Review
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6">Review Template</Typography>

            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Template Details
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {basicInfo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {basicInfo.bodyRegion} | {basicInfo.durationWeeks} weeks |{" "}
                {phases.length} phases | {totalExercises} exercises
              </Typography>
              {basicInfo.condition && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Condition:</strong> {basicInfo.condition}
                </Typography>
              )}
            </Paper>

            {phases.map((phase) => (
              <Paper key={phase.phaseNumber} sx={{ p: 2, borderRadius: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Phase {phase.phaseNumber}: {phase.name}
                  </Typography>
                  <Chip
                    label={`${phase.exercises.length} exercises`}
                    size="small"
                    color={phase.exercises.length > 0 ? "success" : "default"}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="body2">
                  {phase.durationWeeks} weeks | {phase.sessionsPerWeek}{" "}
                  sessions/week
                </Typography>
                {phase.exercises.length > 0 && (
                  <Box
                    sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}
                  >
                    {phase.exercises.slice(0, 5).map((ex, i) => (
                      <Chip
                        key={i}
                        label={ex.name}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {phase.exercises.length > 5 && (
                      <Chip
                        label={`+${phase.exercises.length - 5} more`}
                        size="small"
                      />
                    )}
                  </Box>
                )}
              </Paper>
            ))}

            {totalExercises === 0 && (
              <Callout variant="warning">
                This template has no exercises. You can add them after creation.
              </Callout>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <StepperDialog
      open={open}
      onClose={handleClose}
      title={editTemplate ? "Edit Template" : "Create Template"}
      steps={steps}
      activeStep={activeStep}
      onNext={() => setActiveStep((prev) => prev + 1)}
      onBack={() => setActiveStep((prev) => prev - 1)}
      onComplete={handleCreateTemplate}
      isStepValid={isStepValid()}
      loading={createMutation.isPending}
      maxWidth="lg"
      completeLabel={editTemplate ? "Save Template" : "Create Template"}
    >
      {renderStepContent()}
    </StepperDialog>
  );
}

export default TemplateBuilder;
