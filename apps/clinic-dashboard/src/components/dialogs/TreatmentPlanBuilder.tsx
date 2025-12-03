import React, { useState, useMemo, useCallback } from "react";
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  LinearProgress,
  InputAdornment,
  Divider,
  Collapse,
  Stack,
  Paper,
} from "@mui/material";
import {
  AutoAwesome as AIIcon,
  FitnessCenter,
  Add,
  Delete,
  CheckCircle,
  Search as SearchIcon,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  StepperDialog,
  FormSection,
  FormRow,
  Callout,
  AuraButton,
} from "@qivr/design-system";
import {
  treatmentPlansApi,
  exerciseLibraryApi,
  deviceTrackingApi,
  AvailableDevice,
} from "../../lib/api";
import { patientApi } from "../../services/patientApi";
import { intakeApi } from "../../services/intakeApi";
import { DeviceSelector } from "../devices/DeviceSelector";

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
  expanded?: boolean;
}

// Body region templates with suggested phases
const BODY_REGION_TEMPLATES: Record<
  string,
  { phases: Array<Omit<Phase, "phaseNumber">> }
> = {
  "Lower Back": {
    phases: [
      {
        name: "Pain Management",
        description: "Focus on pain reduction and gentle mobility",
        durationWeeks: 2,
        goals: ["Reduce pain levels", "Improve mobility"],
        exercises: [],
        sessionsPerWeek: 2,
        expanded: true,
      },
      {
        name: "Core Strengthening",
        description: "Progressive core strengthening",
        durationWeeks: 3,
        goals: ["Build core strength", "Improve stability"],
        exercises: [],
        sessionsPerWeek: 3,
      },
      {
        name: "Functional Recovery",
        description: "Return to normal activities",
        durationWeeks: 3,
        goals: ["Return to daily activities", "Prevent recurrence"],
        exercises: [],
        sessionsPerWeek: 3,
      },
    ],
  },
  Neck: {
    phases: [
      {
        name: "Pain Relief",
        description: "Reduce pain and tension",
        durationWeeks: 2,
        goals: ["Reduce pain", "Decrease muscle tension"],
        exercises: [],
        sessionsPerWeek: 2,
        expanded: true,
      },
      {
        name: "Mobility & Strength",
        description: "Improve range of motion and strength",
        durationWeeks: 3,
        goals: ["Improve cervical mobility", "Strengthen neck muscles"],
        exercises: [],
        sessionsPerWeek: 3,
      },
      {
        name: "Postural Training",
        description: "Long-term posture correction",
        durationWeeks: 3,
        goals: ["Correct posture", "Maintain gains"],
        exercises: [],
        sessionsPerWeek: 2,
      },
    ],
  },
  Shoulder: {
    phases: [
      {
        name: "Acute Phase",
        description: "Pain management and gentle mobility",
        durationWeeks: 2,
        goals: ["Reduce inflammation", "Maintain range of motion"],
        exercises: [],
        sessionsPerWeek: 2,
        expanded: true,
      },
      {
        name: "Strengthening",
        description: "Rotator cuff and scapular strengthening",
        durationWeeks: 4,
        goals: ["Strengthen rotator cuff", "Improve scapular control"],
        exercises: [],
        sessionsPerWeek: 3,
      },
      {
        name: "Return to Activity",
        description: "Sport/work-specific training",
        durationWeeks: 2,
        goals: ["Return to full activity", "Prevent re-injury"],
        exercises: [],
        sessionsPerWeek: 3,
      },
    ],
  },
  Knee: {
    phases: [
      {
        name: "Initial Recovery",
        description: "Reduce swelling and pain",
        durationWeeks: 2,
        goals: ["Reduce swelling", "Restore basic mobility"],
        exercises: [],
        sessionsPerWeek: 2,
        expanded: true,
      },
      {
        name: "Strength Building",
        description: "Quadriceps and hamstring strengthening",
        durationWeeks: 4,
        goals: ["Build quad strength", "Improve balance"],
        exercises: [],
        sessionsPerWeek: 3,
      },
      {
        name: "Functional Phase",
        description: "Return to normal activities",
        durationWeeks: 2,
        goals: ["Full weight bearing", "Return to activities"],
        exercises: [],
        sessionsPerWeek: 3,
      },
    ],
  },
  Hip: {
    phases: [
      {
        name: "Mobility Phase",
        description: "Restore hip range of motion",
        durationWeeks: 2,
        goals: ["Improve hip mobility", "Reduce pain"],
        exercises: [],
        sessionsPerWeek: 2,
        expanded: true,
      },
      {
        name: "Strengthening",
        description: "Hip and glute strengthening",
        durationWeeks: 4,
        goals: ["Strengthen hip muscles", "Improve stability"],
        exercises: [],
        sessionsPerWeek: 3,
      },
      {
        name: "Functional Integration",
        description: "Return to full function",
        durationWeeks: 2,
        goals: ["Full functional recovery", "Prevent recurrence"],
        exercises: [],
        sessionsPerWeek: 3,
      },
    ],
  },
  General: {
    phases: [
      {
        name: "Phase 1",
        description: "Initial treatment phase",
        durationWeeks: 2,
        goals: ["Reduce symptoms", "Establish baseline"],
        exercises: [],
        sessionsPerWeek: 2,
        expanded: true,
      },
      {
        name: "Phase 2",
        description: "Progressive treatment",
        durationWeeks: 3,
        goals: ["Build strength", "Improve function"],
        exercises: [],
        sessionsPerWeek: 3,
      },
      {
        name: "Phase 3",
        description: "Maintenance and discharge",
        durationWeeks: 3,
        goals: ["Maintain gains", "Independent management"],
        exercises: [],
        sessionsPerWeek: 2,
      },
    ],
  },
};

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
    bodyRegion: "",
    startDate: new Date().toISOString().split("T")[0],
    durationWeeks: 8,
    sessionsPerWeek: 2,
    focusAreas: [] as string[],
    contraindications: [] as string[],
  });

  const [phases, setPhases] = useState<Phase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<AvailableDevice | null>(
    null,
  );

  // Exercise browser state
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseFilterCategory, setExerciseFilterCategory] =
    useState<string>("all");
  const [exerciseFilterRegion, setExerciseFilterRegion] =
    useState<string>("all");
  const [expandedPhaseIndex, setExpandedPhaseIndex] = useState<number | null>(
    0,
  );

  // Queries
  const { data: patientsData } = useQuery({
    queryKey: ["patients-list"],
    queryFn: () => patientApi.getPatients({ limit: 100 }),
    enabled: !initialPatient && !isBulkMode,
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
    queryFn: () => exerciseLibraryApi.list({ pageSize: 200 }),
  });

  const allExercises = exerciseLibrary?.data || [];

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    return allExercises.filter((ex: any) => {
      const matchesSearch =
        !exerciseSearch ||
        ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        ex.description?.toLowerCase().includes(exerciseSearch.toLowerCase());
      const matchesCategory =
        exerciseFilterCategory === "all" ||
        ex.category === exerciseFilterCategory;
      const matchesRegion =
        exerciseFilterRegion === "all" ||
        ex.bodyRegion === exerciseFilterRegion;
      return matchesSearch && matchesCategory && matchesRegion;
    });
  }, [
    allExercises,
    exerciseSearch,
    exerciseFilterCategory,
    exerciseFilterRegion,
  ]);

  // Steps
  const steps = useMemo(() => {
    if (isBulkMode) {
      return ["Review Patients", "Settings", "Processing", "Complete"];
    }
    return initialPatient
      ? ["Plan Details", "Exercises", "Review"]
      : ["Patient & Condition", "Exercises", "Review"];
  }, [initialPatient, isBulkMode]);

  // Apply body region template
  const applyTemplate = useCallback((region: string) => {
    const template =
      BODY_REGION_TEMPLATES[region] ?? BODY_REGION_TEMPLATES["General"];
    if (!template) return;
    setPhases(
      template.phases.map((p, idx) => ({
        ...p,
        phaseNumber: idx + 1,
        expanded: idx === 0,
      })),
    );
    setBasicInfo((prev) => ({
      ...prev,
      bodyRegion: region,
      title: prev.title || `${region} Rehabilitation Program`,
    }));
  }, []);

  // Mutations
  const generateMutation = useMutation({
    mutationFn: treatmentPlansApi.generate,
    onSuccess: (data) => {
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
            expanded: idx === 0,
          })),
        );
      }
      setBasicInfo((prev) => ({
        ...prev,
        title: data.title || prev.title,
        diagnosis: data.diagnosis || prev.diagnosis,
        durationWeeks: data.totalDurationWeeks || prev.durationWeeks,
      }));
      setIsGenerating(false);
      enqueueSnackbar("AI suggestions applied! Review and customize below.", {
        variant: "success",
      });
    },
    onError: (error: any) => {
      setIsGenerating(false);
      enqueueSnackbar(
        error?.message ||
          "AI generation failed. You can still add exercises manually.",
        { variant: "warning" },
      );
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

  // Bulk processing
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
        const generatedPlan = await treatmentPlansApi.generate({
          patientId: currentPatient.id,
          preferredDurationWeeks: basicInfo.durationWeeks,
          sessionsPerWeek: basicInfo.sessionsPerWeek,
          focusAreas:
            basicInfo.focusAreas.length > 0 ? basicInfo.focusAreas : undefined,
          contraindications:
            basicInfo.contraindications.length > 0
              ? basicInfo.contraindications
              : undefined,
        });

        await treatmentPlansApi.create({
          patientId: currentPatient.id,
          title: generatedPlan.title || `Treatment Plan for ${patientName}`,
          diagnosis:
            generatedPlan.diagnosis || currentPatient.reasonForVisit || "",
          startDate: new Date().toISOString(),
          durationWeeks:
            generatedPlan.totalDurationWeeks || basicInfo.durationWeeks,
          phases: generatedPlan.phases || [],
          aiGeneratedSummary: generatedPlan.summary,
          aiRationale: generatedPlan.rationale,
          aiConfidence: generatedPlan.confidence,
        });

        completed.push(patientName);
        setBulkProgress((prev) => ({
          ...prev,
          completed: [...prev.completed, patientName],
        }));
      } catch {
        failed.push(patientName);
        setBulkProgress((prev) => ({
          ...prev,
          failed: [...prev.failed, patientName],
        }));
      }
    }

    setIsBulkProcessing(false);
    queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });

    if (completed.length > 0) {
      enqueueSnackbar(
        `Created ${completed.length} treatment plan${completed.length !== 1 ? "s" : ""} successfully!`,
        { variant: "success" },
      );
    }
    if (failed.length > 0) {
      enqueueSnackbar(
        `Failed to create ${failed.length} plan${failed.length !== 1 ? "s" : ""}`,
        { variant: "error" },
      );
    }

    setActiveStep(steps.length - 1);
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedPatient(initialPatient || null);
    setBasicInfo({
      title: "",
      diagnosis: "",
      bodyRegion: "",
      startDate: new Date().toISOString().split("T")[0],
      durationWeeks: 8,
      sessionsPerWeek: 2,
      focusAreas: [],
      contraindications: [],
    });
    setPhases([]);
    setIsGenerating(false);
    setSelectedDevice(null);
    setExerciseSearch("");
    setExerciseFilterCategory("all");
    setExerciseFilterRegion("all");
    setBulkProgress({ current: 0, total: 0, completed: [], failed: [] });
    setIsBulkProcessing(false);
    onClose();
  };

  const handleAISuggest = async (_phaseIndex?: number) => {
    if (!selectedPatient && !isBulkMode) {
      enqueueSnackbar("Please select a patient first", { variant: "warning" });
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate({
      patientId: selectedPatient?.id || "",
      evaluationId,
      preferredDurationWeeks: basicInfo.durationWeeks,
      sessionsPerWeek: basicInfo.sessionsPerWeek,
      focusAreas: basicInfo.bodyRegion
        ? [basicInfo.bodyRegion]
        : basicInfo.focusAreas.length > 0
          ? basicInfo.focusAreas
          : undefined,
      contraindications:
        basicInfo.contraindications.length > 0
          ? basicInfo.contraindications
          : undefined,
    });
  };

  const handleCreatePlan = async () => {
    if (!selectedPatient) return;

    if (selectedDevice) {
      try {
        await deviceTrackingApi.recordUsage({
          deviceId: selectedDevice.id,
          patientId: selectedPatient.id,
          procedureType: basicInfo.diagnosis || undefined,
          notes: `Linked to treatment plan: ${basicInfo.title || "Treatment Plan"}`,
        });
      } catch (error) {
        console.error("Failed to record device usage:", error);
      }
    }

    createMutation.mutate({
      patientId: selectedPatient.id,
      title:
        basicInfo.title ||
        `Treatment Plan for ${selectedPatient.firstName} ${selectedPatient.lastName}`,
      diagnosis: basicInfo.diagnosis,
      startDate: basicInfo.startDate
        ? new Date(basicInfo.startDate).toISOString()
        : new Date().toISOString(),
      durationWeeks: basicInfo.durationWeeks,
      phases: phases.map(({ expanded: _, ...p }) => p),
      sourceEvaluationId: evaluationId,
      linkedDeviceId: selectedDevice?.id,
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
      expanded: true,
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

  const handleAddExerciseToPhase = (_phaseIndex: number, exercise: any) => {
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
      if (updated[_phaseIndex]) {
        updated[_phaseIndex] = {
          ...updated[_phaseIndex],
          exercises: [...updated[_phaseIndex].exercises, newExercise],
        };
      }
      return updated;
    });
    enqueueSnackbar(
      `Added "${exercise.name}" to ${phases[_phaseIndex]?.name}`,
      { variant: "success" },
    );
  };

  const handleRemoveExerciseFromPhase = (
    _phaseIndex: number,
    exerciseIndex: number,
  ) => {
    setPhases((prev) => {
      const updated = [...prev];
      if (updated[_phaseIndex]) {
        updated[_phaseIndex] = {
          ...updated[_phaseIndex],
          exercises: updated[_phaseIndex].exercises.filter(
            (_, i) => i !== exerciseIndex,
          ),
        };
      }
      return updated;
    });
  };

  const handleUpdateExercise = (
    _phaseIndex: number,
    exerciseIndex: number,
    updates: Partial<Exercise>,
  ) => {
    setPhases((prev) => {
      const updated = [...prev];
      if (updated[_phaseIndex]?.exercises[exerciseIndex]) {
        updated[_phaseIndex].exercises[exerciseIndex] = {
          ...updated[_phaseIndex].exercises[exerciseIndex],
          ...updates,
        };
      }
      return updated;
    });
  };

  // Validation
  const isStepValid = useMemo(() => {
    const currentStepName = steps[activeStep];

    if (isBulkMode) {
      switch (currentStepName) {
        case "Review Patients":
          return bulkPatients.length > 0;
        case "Settings":
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
      case "Patient & Condition":
        return !!selectedPatient && !!basicInfo.bodyRegion;
      case "Plan Details":
        return !!basicInfo.bodyRegion && !!basicInfo.title;
      case "Exercises":
        return phases.length > 0 && phases.some((p) => p.exercises.length > 0);
      case "Review":
        return true;
      default:
        return true;
    }
  }, [
    activeStep,
    selectedPatient,
    basicInfo,
    phases,
    steps,
    isBulkMode,
    bulkPatients,
    isBulkProcessing,
  ]);

  const handleNext = () => {
    const currentStepName = steps[activeStep];

    if (isBulkMode && currentStepName === "Settings") {
      setActiveStep((prev) => prev + 1);
      processBulkPlans();
      return;
    }

    // Apply template when moving from first step if phases are empty
    if (
      (currentStepName === "Patient & Condition" ||
        currentStepName === "Plan Details") &&
      phases.length === 0 &&
      basicInfo.bodyRegion
    ) {
      applyTemplate(basicInfo.bodyRegion);
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (isBulkMode && isBulkProcessing) return;
    setActiveStep((prev) => prev - 1);
  };

  const totalExercises = phases.reduce((acc, p) => acc + p.exercises.length, 0);

  // Render step content
  const renderStepContent = () => {
    const currentStepName = steps[activeStep];

    // Bulk mode rendering
    if (isBulkMode) {
      switch (currentStepName) {
        case "Review Patients":
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Typography variant="h6">
                Creating Treatment Plans for {bulkPatients.length} Patient
                {bulkPatients.length !== 1 ? "s" : ""}
              </Typography>
              <Callout variant="info">
                AI will generate personalized treatment plans for each patient
                based on their medical history and evaluation data.
              </Callout>
              <List dense>
                {bulkPatients.map((patient, index) => (
                  <ListItem
                    key={patient.id}
                    sx={{ bgcolor: "action.hover", borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {patient.firstName.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={`${patient.firstName} ${patient.lastName}`}
                      secondary={
                        patient.reasonForVisit ||
                        patient.appointmentType ||
                        "Patient"
                      }
                    />
                    <Chip
                      label={`#${index + 1}`}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          );

        case "Settings":
          return (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <FormSection title="Default Settings">
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Configure default settings for all plans. AI will adapt each
                  plan to the individual patient.
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
                  options={exerciseFilters?.bodyRegions || BODY_REGIONS}
                  value={basicInfo.focusAreas}
                  onChange={(_, value) =>
                    setBasicInfo({ ...basicInfo, focusAreas: value })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Focus Areas (optional)"
                      placeholder="e.g., Lower Back, Shoulder"
                    />
                  )}
                  sx={{ mt: 2 }}
                />
              </FormSection>
            </Box>
          );

        case "Processing":
          return (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, py: 4 }}
            >
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
                  <Typography
                    variant="subtitle2"
                    color="success.main"
                    gutterBottom
                  >
                    Completed ({bulkProgress.completed.length}):
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {bulkProgress.completed.map((name) => (
                      <Chip
                        key={name}
                        label={name}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {bulkProgress.failed.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="error.main"
                    gutterBottom
                  >
                    Failed ({bulkProgress.failed.length}):
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {bulkProgress.failed.map((name) => (
                      <Chip
                        key={name}
                        label={name}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          );

        case "Complete":
          return (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, py: 4 }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: "success.main",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h5" fontWeight={600}>
                  Bulk Creation Complete!
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {bulkProgress.completed.length} plan
                  {bulkProgress.completed.length !== 1 ? "s" : ""} created
                  successfully
                  {bulkProgress.failed.length > 0 &&
                    `, ${bulkProgress.failed.length} failed`}
                </Typography>
              </Box>
            </Box>
          );

        default:
          return null;
      }
    }

    // Single plan mode
    switch (currentStepName) {
      case "Patient & Condition":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

            <FormSection title="Condition & Body Region">
              <TextField
                label="Diagnosis / Chief Complaint"
                value={basicInfo.diagnosis}
                onChange={(e) =>
                  setBasicInfo({ ...basicInfo, diagnosis: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
                placeholder="e.g., Chronic lower back pain, Post-surgical knee rehabilitation"
              />

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Select Body Region (applies template)
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {BODY_REGIONS.map((region) => (
                  <Chip
                    key={region}
                    label={region}
                    onClick={() => {
                      setBasicInfo((prev) => ({ ...prev, bodyRegion: region }));
                    }}
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

              {evaluationData && (
                <Box sx={{ mt: 2 }}>
                  <Callout variant="info">
                    <Typography variant="body2">
                      <strong>Evaluation linked:</strong>{" "}
                      {evaluationData.evaluation?.conditionType ||
                        "Patient evaluation data will be used for AI suggestions."}
                    </Typography>
                  </Callout>
                </Box>
              )}
            </FormSection>
          </Box>
        );

      case "Plan Details":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <FormSection title="Plan Details">
              <TextField
                label="Plan Title"
                value={basicInfo.title}
                onChange={(e) =>
                  setBasicInfo({ ...basicInfo, title: e.target.value })
                }
                required
                fullWidth
                placeholder="e.g., Lower Back Rehabilitation Program"
              />

              <TextField
                label="Diagnosis / Chief Complaint"
                value={basicInfo.diagnosis}
                onChange={(e) =>
                  setBasicInfo({ ...basicInfo, diagnosis: e.target.value })
                }
                fullWidth
                multiline
                rows={2}
                sx={{ mt: 2 }}
              />

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Body Region
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

            <FormSection title="Link Device (Optional)">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Link to an implanted device to track outcomes for research
                partners.
              </Typography>
              <DeviceSelector
                value={selectedDevice}
                onChange={setSelectedDevice}
                showRecent={true}
              />
            </FormSection>
          </Box>
        );

      case "Exercises":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* AI Suggest Button */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6">Treatment Phases</Typography>
              <Stack direction="row" spacing={1}>
                <AuraButton
                  variant="outlined"
                  startIcon={
                    isGenerating ? <CircularProgress size={16} /> : <AIIcon />
                  }
                  onClick={() => handleAISuggest()}
                  disabled={isGenerating}
                  size="small"
                >
                  {isGenerating ? "Generating..." : "AI Suggest Exercises"}
                </AuraButton>
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
                No phases created yet. Click "Add Phase" to create manually, or
                "AI Suggest Exercises" to generate a complete plan.
              </Callout>
            )}

            {/* Phases */}
            <Stack spacing={1}>
              {phases.map((phase, _phaseIndex) => (
                <Paper
                  key={_phaseIndex}
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
                        expandedPhaseIndex === _phaseIndex
                          ? "action.selected"
                          : "transparent",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                    onClick={() =>
                      setExpandedPhaseIndex(
                        expandedPhaseIndex === _phaseIndex ? null : _phaseIndex,
                      )
                    }
                  >
                    {expandedPhaseIndex === _phaseIndex ? (
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
                        handleRemovePhase(_phaseIndex);
                      }}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Phase Content */}
                  <Collapse in={expandedPhaseIndex === _phaseIndex}>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            label="Phase Name"
                            value={phase.name}
                            onChange={(e) =>
                              handleUpdatePhase(_phaseIndex, {
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
                              handleUpdatePhase(_phaseIndex, {
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
                              handleUpdatePhase(_phaseIndex, {
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
                              handleUpdatePhase(_phaseIndex, {
                                description: e.target.value,
                              })
                            }
                            fullWidth
                            size="small"
                          />
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2 }} />

                      {/* Exercises in this phase */}
                      <Typography variant="subtitle2" gutterBottom>
                        Exercises ({phase.exercises.length})
                      </Typography>

                      {phase.exercises.length === 0 ? (
                        <Alert severity="info" sx={{ py: 0.5, mb: 2 }}>
                          No exercises yet. Browse the library below to add
                          exercises.
                        </Alert>
                      ) : (
                        <List dense sx={{ mb: 2 }}>
                          {phase.exercises.map((exercise, exIdx) => (
                            <ListItem
                              key={exercise.id}
                              sx={{
                                bgcolor: "action.hover",
                                borderRadius: 1,
                                mb: 0.5,
                                flexWrap: "wrap",
                                gap: 1,
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <FitnessCenter
                                  color="primary"
                                  fontSize="small"
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={exercise.name}
                                secondary={`${exercise.sets} sets × ${exercise.reps} reps${exercise.holdSeconds ? ` (${exercise.holdSeconds}s hold)` : ""}`}
                                sx={{ flex: "1 1 auto", minWidth: 150 }}
                              />
                              <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                <TextField
                                  label="Sets"
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) =>
                                    handleUpdateExercise(_phaseIndex, exIdx, {
                                      sets: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  size="small"
                                  sx={{ width: 70 }}
                                  inputProps={{ min: 1, max: 10 }}
                                />
                                <TextField
                                  label="Reps"
                                  type="number"
                                  value={exercise.reps}
                                  onChange={(e) =>
                                    handleUpdateExercise(_phaseIndex, exIdx, {
                                      reps: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  size="small"
                                  sx={{ width: 70 }}
                                  inputProps={{ min: 1, max: 50 }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleRemoveExerciseFromPhase(
                                      _phaseIndex,
                                      exIdx,
                                    )
                                  }
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Stack>
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
              <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Exercise Library
                </Typography>

                {/* Filters */}
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ mb: 2 }}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <TextField
                    placeholder="Search exercises..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200, flex: 1 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Autocomplete
                    options={["all", ...(exerciseFilters?.categories || [])]}
                    value={exerciseFilterCategory}
                    onChange={(_, v) => setExerciseFilterCategory(v || "all")}
                    size="small"
                    sx={{ minWidth: 150 }}
                    renderInput={(params) => (
                      <TextField {...params} label="Category" />
                    )}
                  />
                  <Autocomplete
                    options={[
                      "all",
                      ...(exerciseFilters?.bodyRegions || BODY_REGIONS),
                    ]}
                    value={exerciseFilterRegion}
                    onChange={(_, v) => setExerciseFilterRegion(v || "all")}
                    size="small"
                    sx={{ minWidth: 150 }}
                    renderInput={(params) => (
                      <TextField {...params} label="Body Region" />
                    )}
                  />
                </Stack>

                {/* Exercise List */}
                <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                  {filteredExercises.length === 0 ? (
                    <ListItem>
                      <ListItemText
                        primary="No exercises found"
                        secondary="Try adjusting your filters"
                      />
                    </ListItem>
                  ) : (
                    filteredExercises.slice(0, 50).map((exercise: any) => (
                      <ListItem
                        key={exercise.id}
                        sx={{
                          bgcolor: "background.paper",
                          mb: 0.5,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                        secondaryAction={
                          <Autocomplete
                            options={phases}
                            getOptionLabel={(p) => p.name}
                            size="small"
                            sx={{ width: 150 }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Add to..."
                                size="small"
                              />
                            )}
                            onChange={(_, selectedPhase) => {
                              if (selectedPhase) {
                                const _phaseIndex = phases.findIndex(
                                  (p) =>
                                    p.phaseNumber === selectedPhase.phaseNumber,
                                );
                                if (_phaseIndex !== -1) {
                                  handleAddExerciseToPhase(
                                    _phaseIndex,
                                    exercise,
                                  );
                                }
                              }
                            }}
                            value={null}
                          />
                        }
                      >
                        <ListItemIcon>
                          <FitnessCenter fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={exercise.name}
                          secondary={
                            <Stack
                              direction="row"
                              spacing={0.5}
                              component="span"
                            >
                              <Chip
                                label={exercise.category}
                                size="small"
                                sx={{ height: 18, fontSize: "0.65rem" }}
                              />
                              <Chip
                                label={exercise.bodyRegion}
                                size="small"
                                sx={{ height: 18, fontSize: "0.65rem" }}
                              />
                              <Chip
                                label={exercise.difficulty}
                                size="small"
                                sx={{ height: 18, fontSize: "0.65rem" }}
                              />
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))
                  )}
                </List>
                {filteredExercises.length > 50 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Showing 50 of {filteredExercises.length} exercises. Use
                    filters to narrow down.
                  </Typography>
                )}
              </Paper>
            )}
          </Box>
        );

      case "Review":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="h6">Review Treatment Plan</Typography>

            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1">
                {selectedPatient?.firstName} {selectedPatient?.lastName}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Plan Details
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {basicInfo.title || "Treatment Plan"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {basicInfo.durationWeeks} weeks | {phases.length} phases |{" "}
                {totalExercises} exercises
              </Typography>
              {basicInfo.diagnosis && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Diagnosis:</strong> {basicInfo.diagnosis}
                </Typography>
              )}
            </Paper>

            {phases.map((phase) => (
              <Paper key={phase.phaseNumber} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phase {phase.phaseNumber}: {phase.name}
                </Typography>
                <Typography variant="body2">
                  {phase.durationWeeks} weeks | {phase.exercises.length}{" "}
                  exercises | {phase.sessionsPerWeek} sessions/week
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

            {selectedDevice && (
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "primary.light",
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Linked Device
                </Typography>
                <Typography variant="body1">{selectedDevice.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDevice.partnerName} | {selectedDevice.deviceCode}
                </Typography>
              </Paper>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const isBulkComplete = isBulkMode && steps[activeStep] === "Complete";
  const isBulkProcessingStep = isBulkMode && steps[activeStep] === "Processing";

  return (
    <StepperDialog
      open={open}
      onClose={handleClose}
      title={
        isBulkMode
          ? `Create ${bulkPatients.length} Treatment Plans`
          : "Create Treatment Plan"
      }
      steps={steps}
      activeStep={activeStep}
      onNext={handleNext}
      onBack={handleBack}
      onComplete={isBulkMode ? handleClose : handleCreatePlan}
      isStepValid={isBulkComplete || isStepValid}
      loading={createMutation.isPending || isBulkProcessingStep}
      maxWidth="lg"
      completeLabel={isBulkComplete ? "Done" : "Create Plan"}
      nextLabel={
        isBulkMode && steps[activeStep] === "Settings"
          ? "Generate Plans"
          : "Next"
      }
    >
      {renderStepContent()}
    </StepperDialog>
  );
};

export default TreatmentPlanBuilder;
