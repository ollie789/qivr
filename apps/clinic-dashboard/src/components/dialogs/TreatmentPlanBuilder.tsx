import React, { useState, useMemo } from "react";
import {
  TextField,
  Typography,
  Box,
  Chip,
  Avatar,
  Autocomplete,
  IconButton,
  Alert,
  CircularProgress,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  LinearProgress,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  Edit as ManualIcon,
  ExpandMore,
  FitnessCenter,
  Add,
  Delete,
  CheckCircle,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  StepperDialog,
  FormSection,
  FormRow,
  Callout,
  auraTokens,
} from "@qivr/design-system";
import { treatmentPlansApi, exerciseLibraryApi } from "../../lib/api";
import { patientApi } from "../../services/patientApi";
import { intakeApi } from "../../services/intakeApi";

export interface BulkPatient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  appointmentId?: string;
  appointmentType?: string;
  reasonForVisit?: string;
}

export interface TreatmentPlanBuilderProps {
  open: boolean;
  onClose: () => void;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  evaluationId?: string;
  onSuccess?: (planId: string) => void;
  /** For bulk creation - array of patients to create plans for */
  bulkPatients?: BulkPatient[];
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

type CreationMode = "ai" | "manual" | null;

export const TreatmentPlanBuilder: React.FC<TreatmentPlanBuilderProps> = ({
  open,
  onClose,
  patient: initialPatient,
  evaluationId,
  onSuccess,
  bulkPatients = [],
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [creationMode, setCreationMode] = useState<CreationMode>(null);

  // Bulk mode state
  const isBulkMode = bulkPatients.length > 0;
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    completed: string[];
    failed: string[];
  }>({ current: 0, total: 0, completed: [], failed: [] });
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Form state
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null>(initialPatient || null);

  const [basicInfo, setBasicInfo] = useState({
    title: "",
    diagnosis: "",
    startDate: new Date().toISOString().split("T")[0],
    durationWeeks: 8,
    sessionsPerWeek: 2,
    focusAreas: [] as string[],
    contraindications: [] as string[],
  });

  const [phases, setPhases] = useState<Phase[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Queries
  const { data: patientsData } = useQuery({
    queryKey: ["patients-list"],
    queryFn: () => patientApi.getPatients({ limit: 100 }),
    enabled: !initialPatient,
  });
  const patients = patientsData?.data || [];

  const { data: evaluationData } = useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: () => intakeApi.getIntakeDetails(evaluationId!),
    enabled: !!evaluationId,
  });

  const { data: exerciseFilters } = useQuery({
    queryKey: ["exercise-filters"],
    queryFn: () => exerciseLibraryApi.getFilters(),
  });

  const { data: exerciseLibrary } = useQuery({
    queryKey: ["exercise-library"],
    queryFn: () => exerciseLibraryApi.list({ pageSize: 100 }),
  });

  // Steps based on mode
  const steps = useMemo(() => {
    if (isBulkMode) {
      return ["Review Patients", "AI Generation Settings", "Processing", "Complete"];
    }
    if (!initialPatient) {
      return creationMode === "ai"
        ? ["Patient", "AI Generation", "Review & Customize", "Confirm"]
        : ["Patient", "Basic Info", "Phases & Exercises", "Confirm"];
    }
    return creationMode === "ai"
      ? ["AI Generation", "Review & Customize", "Confirm"]
      : ["Basic Info", "Phases & Exercises", "Confirm"];
  }, [initialPatient, creationMode, isBulkMode]);

  // Mutations
  const generateMutation = useMutation({
    mutationFn: treatmentPlansApi.generate,
    onSuccess: (data) => {
      setGeneratedPlan(data);
      // Convert generated plan to phases
      if (data.phases) {
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
                sets: e.sets,
                reps: e.reps,
                holdSeconds: e.holdSeconds,
                frequency: e.frequency,
                category: e.category,
                bodyRegion: e.bodyRegion,
                difficulty: e.difficulty,
              })) || [],
            sessionsPerWeek: p.sessionsPerWeek || 2,
          }))
        );
      }
      setBasicInfo((prev) => ({
        ...prev,
        title: data.title || prev.title,
        diagnosis: data.diagnosis || prev.diagnosis,
        durationWeeks: data.totalDurationWeeks || prev.durationWeeks,
      }));
      setIsGenerating(false);
      setActiveStep((prev) => prev + 1);
    },
    onError: (error: any) => {
      setIsGenerating(false);
      console.error("Treatment plan generation failed:", error);
      const errorMessage = error?.response?.data?.error
        || error?.response?.data?.message
        || error?.message
        || "Failed to generate treatment plan. The AI service may be unavailable.";
      enqueueSnackbar(errorMessage, { variant: "error" });
    },
  });

  const createMutation = useMutation({
    mutationFn: treatmentPlansApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
      enqueueSnackbar("Treatment plan created successfully!", {
        variant: "success",
      });
      onSuccess?.(data.id);
      handleClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.message || "Failed to create treatment plan", {
        variant: "error",
      });
    },
  });

  // Bulk processing function
  const processBulkPlans = async () => {
    if (!isBulkMode) return;

    setIsBulkProcessing(true);
    setBulkProgress({
      current: 0,
      total: bulkPatients.length,
      completed: [],
      failed: [],
    });

    const completed: string[] = [];
    const failed: string[] = [];

    for (let i = 0; i < bulkPatients.length; i++) {
      const currentPatient = bulkPatients[i];
      if (!currentPatient) continue;

      const patientName = `${currentPatient.firstName} ${currentPatient.lastName}`;
      setBulkProgress((prev) => ({ ...prev, current: i + 1 }));

      try {
        // Generate AI plan for this patient
        const generatedPlan = await treatmentPlansApi.generate({
          patientId: currentPatient.id,
          preferredDurationWeeks: basicInfo.durationWeeks,
          sessionsPerWeek: basicInfo.sessionsPerWeek,
          focusAreas: basicInfo.focusAreas.length > 0 ? basicInfo.focusAreas : undefined,
          contraindications: basicInfo.contraindications.length > 0 ? basicInfo.contraindications : undefined,
        });

        // Create the plan
        await treatmentPlansApi.create({
          patientId: currentPatient.id,
          title: generatedPlan.title || `Treatment Plan for ${patientName}`,
          diagnosis: generatedPlan.diagnosis || currentPatient.reasonForVisit || "",
          startDate: new Date().toISOString(),
          durationWeeks: generatedPlan.totalDurationWeeks || basicInfo.durationWeeks,
          phases: generatedPlan.phases || [],
          aiGeneratedSummary: generatedPlan.summary,
          aiRationale: generatedPlan.rationale,
          aiConfidence: generatedPlan.confidence,
        });

        completed.push(patientName);
        setBulkProgress((prev) => ({ ...prev, completed: [...prev.completed, patientName] }));
      } catch (error) {
        failed.push(patientName);
        setBulkProgress((prev) => ({ ...prev, failed: [...prev.failed, patientName] }));
      }
    }

    setIsBulkProcessing(false);
    queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });

    if (completed.length > 0) {
      enqueueSnackbar(`Created ${completed.length} treatment plan${completed.length !== 1 ? "s" : ""} successfully!`, {
        variant: "success",
      });
    }
    if (failed.length > 0) {
      enqueueSnackbar(`Failed to create ${failed.length} plan${failed.length !== 1 ? "s" : ""}`, {
        variant: "error",
      });
    }

    // Move to complete step
    setActiveStep(steps.length - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    setCreationMode(null);
    setSelectedPatient(initialPatient || null);
    setBasicInfo({
      title: "",
      diagnosis: "",
      startDate: new Date().toISOString().split("T")[0],
      durationWeeks: 8,
      sessionsPerWeek: 2,
      focusAreas: [],
      contraindications: [],
    });
    setPhases([]);
    setGeneratedPlan(null);
    setIsGenerating(false);
    setBulkProgress({ current: 0, total: 0, completed: [], failed: [] });
    setIsBulkProcessing(false);
    onClose();
  };

  const handleModeSelect = (mode: CreationMode) => {
    setCreationMode(mode);
    // Always start at step 0 - which is "Patient" if no initialPatient, or first content step if patient provided
    setActiveStep(0);
  };

  const handleGeneratePlan = async () => {
    if (!selectedPatient) {
      enqueueSnackbar("Please select a patient first", { variant: "warning" });
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate({
      patientId: selectedPatient.id,
      evaluationId: evaluationId,
      preferredDurationWeeks: basicInfo.durationWeeks,
      sessionsPerWeek: basicInfo.sessionsPerWeek,
      focusAreas: basicInfo.focusAreas.length > 0 ? basicInfo.focusAreas : undefined,
      contraindications: basicInfo.contraindications.length > 0 ? basicInfo.contraindications : undefined,
    });
  };

  const handleCreatePlan = () => {
    if (!selectedPatient) return;
    createMutation.mutate({
      patientId: selectedPatient.id,
      title: basicInfo.title || `Treatment Plan for ${selectedPatient.firstName} ${selectedPatient.lastName}`,
      diagnosis: basicInfo.diagnosis,
      startDate: basicInfo.startDate ? new Date(basicInfo.startDate).toISOString() : new Date().toISOString(),
      durationWeeks: basicInfo.durationWeeks,
      phases: phases,
      aiGeneratedSummary: generatedPlan?.summary,
      aiRationale: generatedPlan?.rationale,
      aiConfidence: generatedPlan?.confidence,
      sourceEvaluationId: evaluationId,
    });
  };

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
  };

  const handleRemovePhase = (index: number) => {
    const updated = phases.filter((_, i) => i !== index);
    // Renumber phases
    updated.forEach((p, i) => (p.phaseNumber = i + 1));
    setPhases(updated);
  };

  const handleUpdatePhase = (index: number, updates: Partial<Phase>) => {
    setPhases(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
      }
      return updated;
    });
  };

  const handleAddExerciseToPhase = (phaseIndex: number, exercise: Exercise) => {
    setPhases(prev => {
      const updated = [...prev];
      if (updated[phaseIndex]) {
        updated[phaseIndex] = {
          ...updated[phaseIndex],
          exercises: [...updated[phaseIndex].exercises, exercise]
        };
      }
      return updated;
    });
  };

  const handleRemoveExerciseFromPhase = (phaseIndex: number, exerciseIndex: number) => {
    setPhases(prev => {
      const updated = [...prev];
      if (updated[phaseIndex]) {
        updated[phaseIndex] = {
          ...updated[phaseIndex],
          exercises: updated[phaseIndex].exercises.filter((_, i) => i !== exerciseIndex)
        };
      }
      return updated;
    });
  };

  // Validation
  const isStepValid = useMemo(() => {
    const currentStepName = steps[activeStep];

    // Bulk mode validation
    if (isBulkMode) {
      switch (currentStepName) {
        case "Review Patients":
          return bulkPatients.length > 0;
        case "AI Generation Settings":
          return basicInfo.durationWeeks > 0 && basicInfo.sessionsPerWeek > 0;
        case "Processing":
          return !isBulkProcessing;
        case "Complete":
          return true;
        default:
          return true;
      }
    }

    switch (currentStepName) {
      case "Patient":
        return !!selectedPatient;
      case "AI Generation":
        return !isGenerating;
      case "Basic Info":
        return !!basicInfo.title && !!basicInfo.startDate && basicInfo.durationWeeks > 0;
      case "Phases & Exercises":
      case "Review & Customize":
        return phases.length > 0 && phases.every((p) => p.exercises.length > 0);
      case "Confirm":
        return true;
      default:
        return true;
    }
  }, [activeStep, selectedPatient, basicInfo, phases, isGenerating, steps, isBulkMode, bulkPatients, isBulkProcessing]);

  const handleNext = () => {
    const currentStepName = steps[activeStep];

    // Bulk mode - start processing on step 2
    if (isBulkMode && currentStepName === "AI Generation Settings") {
      setActiveStep((prev) => prev + 1);
      processBulkPlans();
      return;
    }

    if (currentStepName === "AI Generation" && creationMode === "ai") {
      handleGeneratePlan();
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    // Bulk mode - can't go back during processing
    if (isBulkMode && isBulkProcessing) return;

    // At step 0, go back to mode selection
    if (activeStep === 0 && !isBulkMode) {
      setCreationMode(null);
      return;
    }
    setActiveStep((prev) => prev - 1);
  };

  // Render step content
  const renderStepContent = () => {
    const currentStepName = steps[activeStep];

    // Bulk mode rendering
    if (isBulkMode) {
      switch (currentStepName) {
        case "Review Patients":
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography variant="h6" gutterBottom>
                Creating Treatment Plans for {bulkPatients.length} Patient{bulkPatients.length !== 1 ? "s" : ""}
              </Typography>
              <Callout variant="info">
                <Typography variant="body2">
                  AI will generate personalized treatment plans for each patient based on their
                  medical history, evaluations, and the settings you configure in the next step.
                </Typography>
              </Callout>
              <List dense>
                {bulkPatients.map((patient, index) => (
                  <ListItem key={patient.id} sx={{ bgcolor: "action.hover", borderRadius: 1, mb: 0.5 }}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {patient.firstName.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={`${patient.firstName} ${patient.lastName}`}
                      secondary={
                        patient.reasonForVisit
                          ? `${patient.appointmentType || "Appointment"}: ${patient.reasonForVisit}`
                          : patient.appointmentType || "Patient"
                      }
                    />
                    <Chip label={`#${index + 1}`} size="small" variant="outlined" />
                  </ListItem>
                ))}
              </List>
            </Box>
          );

        case "AI Generation Settings":
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <FormSection title="AI Generation Settings">
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Configure default settings for all plans. AI will adapt each plan to the individual patient.
                </Typography>

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
                    inputProps={{ min: 1, max: 52 }}
                    fullWidth
                  />
                  <TextField
                    label="Sessions per week"
                    type="number"
                    value={basicInfo.sessionsPerWeek}
                    onChange={(e) =>
                      setBasicInfo({
                        ...basicInfo,
                        sessionsPerWeek: parseInt(e.target.value) || 2,
                      })
                    }
                    inputProps={{ min: 1, max: 7 }}
                    fullWidth
                  />
                </FormRow>

                <Autocomplete
                  multiple
                  freeSolo
                  options={exerciseFilters?.bodyRegions || []}
                  value={basicInfo.focusAreas}
                  onChange={(_, value) =>
                    setBasicInfo({ ...basicInfo, focusAreas: value })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Focus Areas (optional)"
                      placeholder="e.g., Lower Back, Shoulder"
                      helperText="Leave empty to let AI determine based on each patient&apos;s needs"
                    />
                  )}
                  sx={{ mt: 2 }}
                />

                <Autocomplete
                  multiple
                  freeSolo
                  options={[
                    "Recent surgery",
                    "Osteoporosis",
                    "Heart condition",
                    "Pregnancy",
                    "Severe pain",
                  ]}
                  value={basicInfo.contraindications}
                  onChange={(_, value) =>
                    setBasicInfo({ ...basicInfo, contraindications: value })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Common Contraindications (optional)"
                      placeholder="Conditions to avoid for all patients"
                    />
                  )}
                  sx={{ mt: 2 }}
                />
              </FormSection>
            </Box>
          );

        case "Processing":
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 4 }}>
              <Box sx={{ textAlign: "center" }}>
                <CircularProgress size={64} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Creating Treatment Plans...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Processing {bulkProgress.current} of {bulkProgress.total}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={(bulkProgress.current / bulkProgress.total) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />

              {bulkProgress.completed.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Completed ({bulkProgress.completed.length}):
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {bulkProgress.completed.map((name) => (
                      <Chip key={name} label={name} size="small" color="success" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {bulkProgress.failed.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    Failed ({bulkProgress.failed.length}):
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {bulkProgress.failed.map((name) => (
                      <Chip key={name} label={name} size="small" color="error" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          );

        case "Complete":
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 4 }}>
              <Box sx={{ textAlign: "center" }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: "success.main", mx: "auto", mb: 2 }}>
                  <CheckCircle sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={600}>
                  Bulk Creation Complete!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  {bulkProgress.completed.length} plan{bulkProgress.completed.length !== 1 ? "s" : ""} created successfully
                  {bulkProgress.failed.length > 0 && `, ${bulkProgress.failed.length} failed`}
                </Typography>
              </Box>

              {bulkProgress.completed.length > 0 && (
                <Callout variant="success">
                  <Typography variant="body2">
                    <strong>Created plans for:</strong> {bulkProgress.completed.join(", ")}
                  </Typography>
                </Callout>
              )}

              {bulkProgress.failed.length > 0 && (
                <Callout variant="error">
                  <Typography variant="body2">
                    <strong>Failed for:</strong> {bulkProgress.failed.join(", ")}
                  </Typography>
                  <Typography variant="caption">
                    You can try creating plans for these patients individually.
                  </Typography>
                </Callout>
              )}
            </Box>
          );

        default:
          return null;
      }
    }

    // Mode selection (shown before steps)
    if (creationMode === null && !isBulkMode) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Typography variant="h6" gutterBottom>
            How would you like to create this treatment plan?
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Box
              onClick={() => handleModeSelect("ai")}
              sx={{
                p: 3,
                border: "2px solid",
                borderColor: "primary.main",
                borderRadius: auraTokens.borderRadius.lg,
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <AIIcon />
                </Avatar>
                <Typography variant="h6">AI-Assisted</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Let AI analyze the patient&apos;s evaluation, medical history, and
                PROM scores to generate a personalized treatment plan with
                recommended exercises and phases.
              </Typography>
              <Chip
                label="Recommended"
                color="primary"
                size="small"
                sx={{ mt: 2 }}
              />
            </Box>

            <Box
              onClick={() => handleModeSelect("manual")}
              sx={{
                p: 3,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: auraTokens.borderRadius.lg,
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: "grey.600" }}>
                  <ManualIcon />
                </Avatar>
                <Typography variant="h6">Manual Setup</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Create a treatment plan manually by defining phases, selecting
                exercises from the library, and setting goals yourself.
              </Typography>
            </Box>
          </Box>

          {evaluationId && evaluationData && (
            <Callout variant="info">
              <Typography variant="body2">
                <strong>Evaluation detected:</strong> This plan will be linked to
                the patient&apos;s recent evaluation, allowing AI to use symptoms,
                pain maps, and questionnaire responses for better recommendations.
              </Typography>
            </Callout>
          )}
        </Box>
      );
    }

    switch (currentStepName) {
      case "Patient":
        return (
          <FormSection title="Select Patient">
            <Autocomplete
              options={patients}
              value={selectedPatient}
              onChange={(_, value) => setSelectedPatient(value)}
              getOptionLabel={(option) =>
                `${option.firstName} ${option.lastName}`
              }
              renderInput={(params) => (
                <TextField {...params} label="Patient" required fullWidth />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </FormSection>
        );

      case "AI Generation":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <FormSection title="AI Generation Settings">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure options for AI-generated treatment plan. The AI will
                analyze the patient&apos;s data and create a personalized plan.
              </Typography>

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
                  inputProps={{ min: 1, max: 52 }}
                  fullWidth
                />
                <TextField
                  label="Sessions per week"
                  type="number"
                  value={basicInfo.sessionsPerWeek}
                  onChange={(e) =>
                    setBasicInfo({
                      ...basicInfo,
                      sessionsPerWeek: parseInt(e.target.value) || 2,
                    })
                  }
                  inputProps={{ min: 1, max: 7 }}
                  fullWidth
                />
              </FormRow>

              <Autocomplete
                multiple
                freeSolo
                options={exerciseFilters?.bodyRegions || []}
                value={basicInfo.focusAreas}
                onChange={(_, value) =>
                  setBasicInfo({ ...basicInfo, focusAreas: value })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Focus Areas (optional)"
                    placeholder="e.g., Lower Back, Shoulder"
                    helperText="Leave empty to let AI determine based on evaluation"
                  />
                )}
                sx={{ mt: 2 }}
              />

              <Autocomplete
                multiple
                freeSolo
                options={[
                  "Recent surgery",
                  "Osteoporosis",
                  "Heart condition",
                  "Pregnancy",
                  "Severe pain",
                ]}
                value={basicInfo.contraindications}
                onChange={(_, value) =>
                  setBasicInfo({ ...basicInfo, contraindications: value })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Contraindications (optional)"
                    placeholder="Conditions to avoid"
                  />
                )}
                sx={{ mt: 2 }}
              />
            </FormSection>

            {isGenerating && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CircularProgress size={48} />
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Generating Treatment Plan...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analyzing patient data and creating personalized
                  recommendations
                </Typography>
              </Box>
            )}
          </Box>
        );

      case "Basic Info":
        return (
          <FormSection title="Treatment Plan Details">
            <TextField
              label="Title"
              value={basicInfo.title}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, title: e.target.value })
              }
              required
              fullWidth
              placeholder="e.g., Lower Back Rehabilitation Program"
            />

            <TextField
              label="Diagnosis"
              value={basicInfo.diagnosis}
              onChange={(e) =>
                setBasicInfo({ ...basicInfo, diagnosis: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
              sx={{ mt: 2 }}
            />

            <FormRow>
              <TextField
                label="Start Date"
                type="date"
                value={basicInfo.startDate}
                onChange={(e) =>
                  setBasicInfo({ ...basicInfo, startDate: e.target.value })
                }
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
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
                required
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
        );

      case "Phases & Exercises":
      case "Review & Customize":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {generatedPlan && (
              <Callout variant="success">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AIIcon />
                  <Typography variant="body2">
                    <strong>AI Generated:</strong> {generatedPlan.summary}
                    {generatedPlan.confidence && (
                      <Chip
                        label={`${Math.round(generatedPlan.confidence * 100)}% confidence`}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Box>
              </Callout>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6">Treatment Phases</Typography>
              <Chip
                icon={<Add />}
                label="Add Phase"
                onClick={handleAddPhase}
                clickable
                color="primary"
                variant="outlined"
              />
            </Box>

            {phases.map((phase, phaseIndex) => (
              <PhaseEditor
                key={phaseIndex}
                phase={phase}
                phaseIndex={phaseIndex}
                exerciseLibrary={exerciseLibrary?.data || []}
                onUpdate={(updates) => handleUpdatePhase(phaseIndex, updates)}
                onRemove={() => handleRemovePhase(phaseIndex)}
                onAddExercise={(exercise) =>
                  handleAddExerciseToPhase(phaseIndex, exercise)
                }
                onRemoveExercise={(exerciseIndex) =>
                  handleRemoveExerciseFromPhase(phaseIndex, exerciseIndex)
                }
              />
            ))}

            {phases.length === 0 && (
              <Alert severity="info">
                Click "Add Phase" to start building your treatment plan. Each
                phase can have its own duration, goals, and exercises.
              </Alert>
            )}
          </Box>
        );

      case "Confirm":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="h6">Review Treatment Plan</Typography>

            <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1">
                {selectedPatient?.firstName} {selectedPatient?.lastName}
              </Typography>
            </Box>

            <Box sx={{ bgcolor: "action.hover", borderRadius: 2, p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Plan Details
              </Typography>
              <Typography variant="body1">{basicInfo.title || "Treatment Plan"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {basicInfo.durationWeeks} weeks | {phases.length} phases |{" "}
                {phases.reduce((acc, p) => acc + p.exercises.length, 0)} exercises
              </Typography>
            </Box>

            {phases.map((phase) => (
              <Box
                key={phase.phaseNumber}
                sx={{ bgcolor: "action.hover", borderRadius: 2, p: 2 }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Phase {phase.phaseNumber}: {phase.name}
                </Typography>
                <Typography variant="body2">
                  {phase.durationWeeks} weeks | {phase.exercises.length}{" "}
                  exercises | {phase.sessionsPerWeek} sessions/week
                </Typography>
                {phase.goals.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {phase.goals.map((goal, i) => (
                      <Chip key={i} label={goal} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                )}
              </Box>
            ))}

            {generatedPlan?.rationale && (
              <Callout variant="info">
                <Typography variant="body2">
                  <strong>AI Rationale:</strong> {generatedPlan.rationale}
                </Typography>
              </Callout>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  // Determine if we're on the final step for bulk mode
  const isBulkComplete = isBulkMode && steps[activeStep] === "Complete";
  const isBulkProcessingStep = isBulkMode && steps[activeStep] === "Processing";

  // For bulk mode processing/complete steps, use special handling
  const showAsComplete = isBulkComplete;

  return (
    <StepperDialog
      open={open}
      onClose={handleClose}
      title={isBulkMode ? `Create ${bulkPatients.length} Treatment Plans` : "Create Treatment Plan"}
      steps={isBulkMode ? steps : (creationMode === null ? ["Select Mode"] : steps)}
      activeStep={isBulkMode ? (showAsComplete ? steps.length - 1 : activeStep) : (creationMode === null ? 0 : activeStep)}
      onNext={isBulkMode ? handleNext : (creationMode === null ? () => {} : handleNext)}
      onBack={isBulkMode ? handleBack : (creationMode === null ? () => {} : handleBack)}
      onComplete={isBulkMode ? handleClose : handleCreatePlan}
      isStepValid={isBulkMode ? (showAsComplete || isStepValid) : (creationMode === null ? false : isStepValid)}
      loading={createMutation.isPending || isGenerating || isBulkProcessingStep}
      maxWidth="md"
      completeLabel={isBulkComplete ? "Done" : "Create Plan"}
      nextLabel={
        isBulkMode && steps[activeStep] === "AI Generation Settings"
          ? "Generate Plans"
          : steps[activeStep] === "AI Generation"
            ? "Generate"
            : "Next"
      }
    >
      {renderStepContent()}
    </StepperDialog>
  );
};

// Phase Editor Component
interface PhaseEditorProps {
  phase: Phase;
  phaseIndex: number;
  exerciseLibrary: any[];
  onUpdate: (updates: Partial<Phase>) => void;
  onRemove: () => void;
  onAddExercise: (exercise: Exercise) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
}

const PhaseEditor: React.FC<PhaseEditorProps> = ({
  phase,
  phaseIndex,
  exerciseLibrary,
  onUpdate,
  onRemove,
  onAddExercise,
  onRemoveExercise,
}) => {
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [newGoal, setNewGoal] = useState("");

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      onUpdate({ goals: [...phase.goals, newGoal.trim()] });
      setNewGoal("");
    }
  };

  const handleRemoveGoal = (index: number) => {
    onUpdate({ goals: phase.goals.filter((_, i) => i !== index) });
  };

  const handleSelectExercise = (libraryExercise: any) => {
    const exercise: Exercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: libraryExercise.name,
      description: libraryExercise.description,
      instructions: libraryExercise.instructions,
      sets: libraryExercise.defaultSets || 3,
      reps: libraryExercise.defaultReps || 10,
      holdSeconds: libraryExercise.defaultHoldSeconds,
      frequency: libraryExercise.defaultFrequency || "Daily",
      category: libraryExercise.category,
      bodyRegion: libraryExercise.bodyRegion,
      difficulty: libraryExercise.difficulty,
    };
    onAddExercise(exercise);
    setShowExerciseSelector(false);
  };

  return (
    <Accordion defaultExpanded={phaseIndex === 0}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Phase {phase.phaseNumber}: {phase.name}
          </Typography>
          <Chip label={`${phase.durationWeeks}w`} size="small" />
          <Chip label={`${phase.exercises.length} exercises`} size="small" variant="outlined" />
          <Box sx={{ flexGrow: 1 }} />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            color="error"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Phase Name"
              value={phase.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Duration (weeks)"
              type="number"
              value={phase.durationWeeks}
              onChange={(e) =>
                onUpdate({ durationWeeks: parseInt(e.target.value) || 2 })
              }
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 12 }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Sessions/week"
              type="number"
              value={phase.sessionsPerWeek}
              onChange={(e) =>
                onUpdate({ sessionsPerWeek: parseInt(e.target.value) || 2 })
              }
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 7 }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Description"
              value={phase.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        {/* Goals */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Goals
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
            {phase.goals.map((goal, i) => (
              <Chip
                key={i}
                label={goal}
                size="small"
                onDelete={() => handleRemoveGoal(i)}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add a goal..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddGoal()}
              sx={{ flexGrow: 1 }}
            />
            <IconButton onClick={handleAddGoal} disabled={!newGoal.trim()}>
              <Add />
            </IconButton>
          </Box>
        </Box>

        {/* Exercises */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle2">Exercises</Typography>
            <Chip
              icon={<Add />}
              label="Add Exercise"
              onClick={() => setShowExerciseSelector(true)}
              clickable
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>

          {phase.exercises.length === 0 ? (
            <Alert severity="info" sx={{ py: 0.5 }}>
              No exercises added yet
            </Alert>
          ) : (
            <List dense>
              {phase.exercises.map((exercise, exIdx) => (
                <ListItem
                  key={exercise.id}
                  sx={{ bgcolor: "action.hover", borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemIcon>
                    <FitnessCenter color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={exercise.name}
                    secondary={`${exercise.sets} sets × ${exercise.reps} reps${exercise.holdSeconds ? ` (${exercise.holdSeconds}s hold)` : ""} | ${exercise.frequency}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => onRemoveExercise(exIdx)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          {/* Exercise Selector */}
          <Collapse in={showExerciseSelector}>
            <Box
              sx={{
                mt: 2,
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Select from Exercise Library
              </Typography>
              <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                {exerciseLibrary
                  .filter(
                    (e) =>
                      !phase.exercises.some((pe) => pe.name === e.name)
                  )
                  .map((exercise) => (
                    <ListItem
                      key={exercise.id}
                      disablePadding
                      sx={{ bgcolor: "background.paper", mb: 0.5, borderRadius: 1 }}
                    >
                      <ListItemButton onClick={() => handleSelectExercise(exercise)}>
                        <ListItemIcon>
                          <FitnessCenter fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={exercise.name}
                          secondary={`${exercise.category} | ${exercise.bodyRegion} | ${exercise.difficulty}`}
                        />
                        <Chip label="Add" size="small" color="primary" />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
              <Box sx={{ mt: 1, textAlign: "right" }}>
                <Chip
                  label="Close"
                  onClick={() => setShowExerciseSelector(false)}
                  size="small"
                />
              </Box>
            </Box>
          </Collapse>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default TreatmentPlanBuilder;
