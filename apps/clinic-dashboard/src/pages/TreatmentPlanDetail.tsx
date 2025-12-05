import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Tabs,
  Tab,
  LinearProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  ArrowBack,
  CalendarMonth as ScheduleIcon,
  AutoAwesome,
  CheckCircle,
  FitnessCenter,
  Flag,
  EmojiEvents,
  Timeline,
  ExpandMore,
  Assessment,
  Person,
  LocalHospital,
  EventRepeat as BulkScheduleIcon,
  Assignment as PromIcon,
  Schedule as ClockIcon,
  PlayArrow as ActiveIcon,
  Feedback as FeedbackIcon,
  TrendingUp,
  TrendingDown,
  Remove as NeutralIcon,
  Warning as WarningIcon,
  ThumbUp,
  ThumbDown,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayCircleOutline as VideoIcon,
  BookmarkAdd as SaveTemplateIcon,
} from "@mui/icons-material";
import {
  AuraButton,
  AuraIconButton,
  Callout,
  auraTokens,
  SelectField,
} from "@qivr/design-system";
import { treatmentPlansApi } from "../lib/api";
import {
  appointmentsApi,
  CreateAppointmentRequest,
} from "../services/appointmentsApi";
import { promApi, PromResponse } from "../services/promApi";
import { useSnackbar } from "notistack";
import { ScheduleAppointmentDialog } from "../components/dialogs/ScheduleAppointmentDialog";
import {
  ExerciseLibraryDrawer,
  ExerciseToAdd,
} from "../components/exercises/ExerciseLibraryDrawer";
import {
  format,
  addDays,
  addWeeks,
  parseISO,
  isBefore,
  isAfter,
} from "date-fns";
import { useAuthUser } from "../stores/authStore";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function TreatmentPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthUser();
  const [tabValue, setTabValue] = useState(0);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  // Bulk scheduling state
  const [bulkScheduleDialogOpen, setBulkScheduleDialogOpen] = useState(false);
  const [bulkScheduleStartDate, setBulkScheduleStartDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedPhasesForScheduling, setSelectedPhasesForScheduling] =
    useState<Set<number>>(new Set());
  const [isBulkScheduling, setIsBulkScheduling] = useState(false);

  // Exercise management state
  const [exerciseDrawerOpen, setExerciseDrawerOpen] = useState(false);
  const [selectedPhaseForExercise, setSelectedPhaseForExercise] = useState(0);
  const [editingExercise, setEditingExercise] = useState<{
    phaseIndex: number;
    exerciseIndex: number;
    exercise: any;
  } | null>(null);

  // Save as Template state
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateBodyRegion, setTemplateBodyRegion] = useState("");
  const [templateConditionType, setTemplateConditionType] = useState("");

  const {
    data: plan,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["treatment-plan", id],
    queryFn: () => treatmentPlansApi.get(id!),
    enabled: !!id,
  });

  // Fetch patient's PROM responses for timeline
  const { data: promResponses } = useQuery({
    queryKey: ["patient-proms", plan?.patientId],
    queryFn: () => promApi.getResponses({ patientId: plan?.patientId }),
    enabled: !!plan?.patientId,
  });

  // Fetch treatment progress aggregate
  const { data: treatmentProgressAggregate } = useQuery({
    queryKey: ["treatment-progress-aggregate", id],
    queryFn: () => promApi.getTreatmentProgressAggregate(id!),
    enabled: !!id && plan?.status === "Active",
  });

  // Calculate PROM timeline data
  const promTimeline = useMemo(() => {
    if (!promResponses?.data || !plan) return [];

    const planStart = plan.startDate ? parseISO(plan.startDate) : new Date();
    const planEnd = addWeeks(planStart, plan.durationWeeks || 8);

    return promResponses.data
      .filter((prom: PromResponse) => {
        const promDate = prom.scheduledAt ? parseISO(prom.scheduledAt) : null;
        if (!promDate) return false;
        return (
          isAfter(promDate, addDays(planStart, -7)) &&
          isBefore(promDate, addDays(planEnd, 7))
        );
      })
      .sort(
        (a: PromResponse, b: PromResponse) =>
          new Date(a.scheduledAt || 0).getTime() -
          new Date(b.scheduledAt || 0).getTime(),
      );
  }, [promResponses?.data, plan]);

  const approveMutation = useMutation({
    mutationFn: () => treatmentPlansApi.approve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-plan", id] });
      enqueueSnackbar("Treatment plan approved and activated", {
        variant: "success",
      });
    },
    onError: () => {
      enqueueSnackbar("Failed to approve treatment plan", { variant: "error" });
    },
  });

  // Update treatment plan mutation (for exercise changes)
  const updatePlanMutation = useMutation({
    mutationFn: (updatedPlan: any) =>
      treatmentPlansApi.update(id!, updatedPlan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-plan", id] });
      enqueueSnackbar("Treatment plan updated", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to update treatment plan", { variant: "error" });
    },
  });

  // Save as template mutation
  const saveAsTemplateMutation = useMutation({
    mutationFn: (data: {
      title: string;
      bodyRegion?: string;
      conditionType?: string;
    }) => treatmentPlansApi.saveAsTemplate(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-templates"] });
      setSaveTemplateDialogOpen(false);
      setTemplateTitle("");
      setTemplateBodyRegion("");
      setTemplateConditionType("");
      enqueueSnackbar("Plan saved as template", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to save as template", { variant: "error" });
    },
  });

  // Handle adding exercise to phase
  const handleAddExerciseToPhase = (
    exercise: ExerciseToAdd,
    phaseIndex: number,
  ) => {
    if (!plan?.phases) return;

    const updatedPhases = [...plan.phases];
    if (!updatedPhases[phaseIndex].exercises) {
      updatedPhases[phaseIndex].exercises = [];
    }
    updatedPhases[phaseIndex].exercises.push({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      instructions: exercise.instructions,
      sets: exercise.sets,
      reps: exercise.reps,
      holdSeconds: exercise.holdSeconds,
      frequency: exercise.frequency,
      category: exercise.category,
      bodyRegion: exercise.bodyRegion,
      difficulty: exercise.difficulty,
      videoUrl: exercise.videoUrl,
      thumbnailUrl: exercise.thumbnailUrl,
    });

    updatePlanMutation.mutate({ phases: updatedPhases });
    enqueueSnackbar(`Added "${exercise.name}" to Phase ${phaseIndex + 1}`, {
      variant: "info",
    });
  };

  // Handle removing exercise from phase
  const handleRemoveExercise = (phaseIndex: number, exerciseIndex: number) => {
    if (!plan?.phases) return;

    const updatedPhases = [...plan.phases];
    const exerciseName =
      updatedPhases[phaseIndex].exercises[exerciseIndex]?.name;
    updatedPhases[phaseIndex].exercises.splice(exerciseIndex, 1);

    updatePlanMutation.mutate({ phases: updatedPhases });
    enqueueSnackbar(`Removed "${exerciseName}" from Phase ${phaseIndex + 1}`, {
      variant: "info",
    });
  };

  // Handle updating exercise parameters
  const handleUpdateExercise = (
    phaseIndex: number,
    exerciseIndex: number,
    updates: Partial<ExerciseToAdd>,
  ) => {
    if (!plan?.phases) return;

    const updatedPhases = [...plan.phases];
    updatedPhases[phaseIndex].exercises[exerciseIndex] = {
      ...updatedPhases[phaseIndex].exercises[exerciseIndex],
      ...updates,
    };

    updatePlanMutation.mutate({ phases: updatedPhases });
    setEditingExercise(null);
  };

  const getStatusColor = (
    status: string,
  ): "default" | "success" | "info" | "warning" | "error" => {
    const colors: Record<
      string,
      "default" | "success" | "info" | "warning" | "error"
    > = {
      Draft: "default",
      Active: "success",
      Completed: "info",
      Cancelled: "error",
      OnHold: "warning",
    };
    return colors[status] || "default";
  };

  const getPhaseStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "success";
      case "InProgress":
        return "primary";
      default:
        return "default";
    }
  };

  // Calculate total sessions to schedule
  const calculateSessionsToSchedule = () => {
    if (!plan?.phases) return 0;
    return plan.phases
      .filter((_: any, idx: number) => selectedPhasesForScheduling.has(idx))
      .reduce(
        (sum: number, phase: any) =>
          sum + phase.durationWeeks * phase.sessionsPerWeek,
        0,
      );
  };

  // Bulk schedule sessions for selected phases
  const handleBulkScheduleSessions = async () => {
    if (!plan?.patient?.id || selectedPhasesForScheduling.size === 0) return;

    setIsBulkScheduling(true);
    let scheduledCount = 0;
    let failedCount = 0;
    let currentDate = parseISO(bulkScheduleStartDate);

    try {
      // Get selected phases in order
      const selectedPhases = plan.phases
        .map((phase: any, idx: number) => ({ ...phase, originalIndex: idx }))
        .filter((_: any, idx: number) => selectedPhasesForScheduling.has(idx));

      for (const phase of selectedPhases) {
        const sessionsPerWeek = phase.sessionsPerWeek || 2;
        const durationWeeks = phase.durationWeeks || 2;
        const totalPhaseSessions = sessionsPerWeek * durationWeeks;

        // Distribute sessions evenly across weeks
        const daysPerSession = Math.floor(7 / sessionsPerWeek);

        for (let session = 0; session < totalPhaseSessions; session++) {
          const sessionDate = addDays(currentDate, session * daysPerSession);

          try {
            const appointmentData: CreateAppointmentRequest = {
              patientId: plan.patient.id,
              providerId: user?.id || "",
              scheduledStart: format(sessionDate, "yyyy-MM-dd'T'09:00:00"),
              scheduledEnd: format(sessionDate, "yyyy-MM-dd'T'10:00:00"),
              appointmentType: "Treatment Session",
              reasonForVisit: `${plan.title} - ${phase.name} (Session ${session + 1})`,
              notes: `Treatment plan session: Phase ${phase.phaseNumber} - ${phase.name}`,
            };

            await appointmentsApi.createAppointment(appointmentData);
            scheduledCount++;
          } catch {
            failedCount++;
          }
        }

        // Move to next phase start date
        currentDate = addWeeks(currentDate, durationWeeks);
      }

      if (scheduledCount > 0) {
        enqueueSnackbar(`Scheduled ${scheduledCount} treatment sessions!`, {
          variant: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
      }
      if (failedCount > 0) {
        enqueueSnackbar(`Failed to schedule ${failedCount} sessions`, {
          variant: "warning",
        });
      }
    } catch {
      enqueueSnackbar("Failed to schedule sessions", { variant: "error" });
    } finally {
      setIsBulkScheduling(false);
      setBulkScheduleDialogOpen(false);
      setSelectedPhasesForScheduling(new Set());
    }
  };

  // Toggle phase selection for bulk scheduling
  const togglePhaseSelection = (index: number) => {
    setSelectedPhasesForScheduling((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Select all phases
  const selectAllPhases = () => {
    if (plan?.phases) {
      if (selectedPhasesForScheduling.size === plan.phases.length) {
        setSelectedPhasesForScheduling(new Set());
      } else {
        setSelectedPhasesForScheduling(
          new Set(plan.phases.map((_: any, i: number) => i)),
        );
      }
    }
  };

  // Redirect if ID is invalid
  if (!id || id === "undefined") {
    navigate("/treatment-plans", { replace: true });
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !plan) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load treatment plan</Alert>
        <AuraButton
          startIcon={<ArrowBack />}
          onClick={() => navigate("/treatment-plans")}
          sx={{ mt: 2 }}
        >
          Back to Treatment Plans
        </AuraButton>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate("/treatment-plans")}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h5" fontWeight={600}>
              {plan.title}
            </Typography>
            {plan.aiGeneratedAt && (
              <Tooltip title="AI Generated">
                <AutoAwesome fontSize="small" color="primary" />
              </Tooltip>
            )}
            <Chip
              label={plan.status}
              size="small"
              color={getStatusColor(plan.status)}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {plan.patient?.firstName} {plan.patient?.lastName} |{" "}
            {plan.durationWeeks} weeks | Started{" "}
            {new Date(plan.startDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Bulk Schedule Sessions Button */}
          {plan.phases?.length > 0 && plan.status !== "Completed" && (
            <Tooltip title="Schedule all treatment sessions at once">
              <AuraButton
                variant="outlined"
                startIcon={<BulkScheduleIcon />}
                onClick={() => {
                  setSelectedPhasesForScheduling(
                    new Set(plan.phases.map((_: any, i: number) => i)),
                  );
                  setBulkScheduleDialogOpen(true);
                }}
              >
                Schedule All Sessions
              </AuraButton>
            </Tooltip>
          )}
          {plan.status === "Draft" && (
            <AuraButton
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => approveMutation.mutate()}
              loading={approveMutation.isPending}
            >
              Approve & Activate
            </AuraButton>
          )}
          {/* Save as Template - only for patient plans, not templates */}
          {!plan.isTemplate && (
            <Tooltip title="Save this treatment plan as a reusable template">
              <AuraButton
                variant="outlined"
                startIcon={<SaveTemplateIcon />}
                onClick={() => {
                  setTemplateTitle(plan.title + " Template");
                  setTemplateBodyRegion(
                    plan.phases?.[0]?.exercises?.[0]?.bodyRegion || "",
                  );
                  setTemplateConditionType(plan.diagnosis || "");
                  setSaveTemplateDialogOpen(true);
                }}
              >
                Save as Template
              </AuraButton>
            </Tooltip>
          )}
          <AuraButton
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setScheduleDialogOpen(true)}
          >
            Schedule Session
          </AuraButton>
        </Box>
      </Box>

      {/* Progress Overview */}
      {plan.status === "Active" && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: auraTokens.borderRadius.lg }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Overall Progress
              </Typography>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}
              >
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={plan.progressPercentage || 0}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="h6" color="primary">
                  {Math.round(plan.progressPercentage || 0)}%
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Sessions
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {plan.completedSessions || 0}/{plan.totalSessions || 0}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Current Week
              </Typography>
              <Typography variant="h5" fontWeight={600}>
                {plan.currentWeek || 1}/{plan.durationWeeks}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Streak
              </Typography>
              <Typography variant="h5" fontWeight={600} color="success.main">
                {plan.exerciseStreak || 0} days
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Points
              </Typography>
              <Typography variant="h5" fontWeight={600} color="warning.main">
                {plan.pointsEarned || 0}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* AI Summary */}
      {plan.aiGeneratedSummary && (
        <Callout variant="info" title="AI Summary">
          <Typography variant="body2">{plan.aiGeneratedSummary}</Typography>
          {plan.aiConfidence && (
            <Chip
              label={`${Math.round(plan.aiConfidence * 100)}% confidence`}
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Callout>
      )}

      {/* PROM Timeline Section (visible when there are PROMs) */}
      {promTimeline.length > 0 && (
        <Paper sx={{ mt: 3, p: 2, borderRadius: auraTokens.borderRadius.lg }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <PromIcon color="primary" />
            <Typography variant="h6">PROM Assessments Timeline</Typography>
            <Chip label={`${promTimeline.length} scheduled`} size="small" />
          </Box>
          <Stack direction="row" spacing={2} sx={{ overflowX: "auto", pb: 1 }}>
            {promTimeline.map((prom: PromResponse) => {
              const isPending = prom.status === "pending";
              const isCompleted = prom.status === "completed";
              const isDue =
                prom.dueDate && isBefore(parseISO(prom.dueDate), new Date());

              return (
                <Paper
                  key={prom.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    minWidth: 200,
                    borderRadius: 2,
                    borderColor: isCompleted
                      ? "success.main"
                      : isDue
                        ? "error.main"
                        : "divider",
                    bgcolor: isCompleted
                      ? "success.lighter"
                      : isDue
                        ? "error.lighter"
                        : "background.paper",
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    {isCompleted ? (
                      <CheckCircle fontSize="small" color="success" />
                    ) : isPending ? (
                      <ClockIcon fontSize="small" color="action" />
                    ) : (
                      <ActiveIcon fontSize="small" color="primary" />
                    )}
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {prom.templateName}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {prom.scheduledAt
                      ? format(parseISO(prom.scheduledAt), "MMM d, yyyy")
                      : "Not scheduled"}
                  </Typography>
                  {prom.dueDate && (
                    <Typography
                      variant="caption"
                      color={isDue ? "error.main" : "text.secondary"}
                      display="block"
                    >
                      Due: {format(parseISO(prom.dueDate), "MMM d")}
                    </Typography>
                  )}
                  {isCompleted && prom.score !== undefined && (
                    <Chip
                      label={`Score: ${Math.round(prom.score)}%`}
                      size="small"
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  )}
                  <Chip
                    label={prom.status}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1 }}
                    color={
                      isCompleted ? "success" : isDue ? "error" : "default"
                    }
                  />
                </Paper>
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* Treatment Progress Feedback Section */}
      {treatmentProgressAggregate &&
        treatmentProgressAggregate.totalFeedbacks > 0 && (
          <Paper sx={{ mt: 3, p: 3, borderRadius: auraTokens.borderRadius.lg }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <FeedbackIcon color="primary" />
              <Typography variant="h6">Patient Feedback Summary</Typography>
              <Chip
                label={`${treatmentProgressAggregate.totalFeedbacks} responses`}
                size="small"
              />
              {treatmentProgressAggregate.patientsWantingDiscussion > 0 && (
                <Chip
                  icon={<WarningIcon />}
                  label={`${treatmentProgressAggregate.patientsWantingDiscussion} want to discuss`}
                  color="warning"
                  size="small"
                />
              )}
            </Box>

            <Grid container spacing={3}>
              {/* Effectiveness Rating */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, textAlign: "center", borderRadius: 2 }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Avg. Effectiveness Rating
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    color={
                      treatmentProgressAggregate.averageEffectivenessRating !=
                      null
                        ? treatmentProgressAggregate.averageEffectivenessRating >=
                          7
                          ? "success.main"
                          : treatmentProgressAggregate.averageEffectivenessRating >=
                              4
                            ? "warning.main"
                            : "error.main"
                        : "text.secondary"
                    }
                  >
                    {treatmentProgressAggregate.averageEffectivenessRating !=
                    null
                      ? treatmentProgressAggregate.averageEffectivenessRating.toFixed(
                          1,
                        )
                      : "—"}
                    <Typography
                      component="span"
                      variant="h6"
                      color="text.secondary"
                    >
                      /10
                    </Typography>
                  </Typography>
                </Paper>
              </Grid>

              {/* Pain Change */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, textAlign: "center", borderRadius: 2 }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Avg. Pain Change
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    {treatmentProgressAggregate.averagePainChange != null ? (
                      treatmentProgressAggregate.averagePainChange > 0 ? (
                        <TrendingUp fontSize="large" color="success" />
                      ) : treatmentProgressAggregate.averagePainChange < 0 ? (
                        <TrendingDown fontSize="large" color="error" />
                      ) : (
                        <NeutralIcon fontSize="large" color="action" />
                      )
                    ) : (
                      <NeutralIcon fontSize="large" color="action" />
                    )}
                    <Typography
                      variant="h4"
                      fontWeight={700}
                      color={
                        treatmentProgressAggregate.averagePainChange != null
                          ? treatmentProgressAggregate.averagePainChange > 0
                            ? "success.main"
                            : treatmentProgressAggregate.averagePainChange < 0
                              ? "error.main"
                              : "text.secondary"
                          : "text.secondary"
                      }
                    >
                      {treatmentProgressAggregate.averagePainChange != null
                        ? treatmentProgressAggregate.averagePainChange > 0
                          ? `+${treatmentProgressAggregate.averagePainChange.toFixed(1)}`
                          : treatmentProgressAggregate.averagePainChange.toFixed(
                              1,
                            )
                        : "—"}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {treatmentProgressAggregate.averagePainChange != null &&
                    treatmentProgressAggregate.averagePainChange > 0
                      ? "Improving"
                      : treatmentProgressAggregate.averagePainChange != null &&
                          treatmentProgressAggregate.averagePainChange < 0
                        ? "Worsening"
                        : "No change"}
                  </Typography>
                </Paper>
              </Grid>

              {/* Sessions Per Week */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, textAlign: "center", borderRadius: 2 }}
                >
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Avg. Sessions/Week
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight={700}
                    color="primary.main"
                  >
                    {treatmentProgressAggregate.averageSessionsPerWeek != null
                      ? treatmentProgressAggregate.averageSessionsPerWeek.toFixed(
                          1,
                        )
                      : "—"}
                  </Typography>
                </Paper>
              </Grid>

              {/* Exercise Compliance */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Exercise Compliance
                  </Typography>
                  {Object.entries(
                    treatmentProgressAggregate.exerciseComplianceBreakdown,
                  ).length > 0 ? (
                    <Stack spacing={0.5}>
                      {Object.entries(
                        treatmentProgressAggregate.exerciseComplianceBreakdown,
                      )
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([level, count]) => (
                          <Box
                            key={level}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2">{level}</Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {count}
                            </Typography>
                          </Box>
                        ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Exercise Feedback */}
              {treatmentProgressAggregate.exerciseFeedback.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Exercise Feedback
                    </Typography>
                    <Stack spacing={1}>
                      {treatmentProgressAggregate.exerciseFeedback
                        .slice(0, 5)
                        .map((exercise) => (
                          <Box
                            key={exercise.exerciseId}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                              {exercise.exerciseName}
                            </Typography>
                            <Tooltip
                              title={`${exercise.helpfulCount} found helpful`}
                            >
                              <Chip
                                icon={<ThumbUp fontSize="small" />}
                                label={exercise.helpfulCount}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            </Tooltip>
                            <Tooltip
                              title={`${exercise.problematicCount} had issues`}
                            >
                              <Chip
                                icon={<ThumbDown fontSize="small" />}
                                label={exercise.problematicCount}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            </Tooltip>
                          </Box>
                        ))}
                    </Stack>
                  </Paper>
                </Grid>
              )}

              {/* Common Barriers */}
              {Object.keys(treatmentProgressAggregate.commonBarriers).length >
                0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Common Barriers
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
                      {Object.entries(treatmentProgressAggregate.commonBarriers)
                        .sort(([, a], [, b]) => b - a)
                        .map(([barrier, count]) => (
                          <Chip
                            key={barrier}
                            label={`${barrier} (${count})`}
                            size="small"
                            variant="outlined"
                            color="warning"
                          />
                        ))}
                    </Stack>
                  </Paper>
                </Grid>
              )}
            </Grid>

            {treatmentProgressAggregate.latestFeedbackDate && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: "block" }}
              >
                Last feedback:{" "}
                {format(
                  parseISO(treatmentProgressAggregate.latestFeedbackDate),
                  "MMM d, yyyy 'at' h:mm a",
                )}
              </Typography>
            )}
          </Paper>
        )}

      {/* Tabs */}
      <Paper sx={{ mt: 3, borderRadius: auraTokens.borderRadius.lg }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab label="Overview" icon={<Assessment />} iconPosition="start" />
          <Tab label="Phases" icon={<Timeline />} iconPosition="start" />
          <Tab
            label="Exercises"
            icon={<FitnessCenter />}
            iconPosition="start"
          />
          <Tab label="Milestones" icon={<EmojiEvents />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: auraTokens.borderRadius.md }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Person color="primary" />
                    <Typography variant="h6">Patient Information</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight={500}>
                    {plan.patient?.firstName} {plan.patient?.lastName}
                  </Typography>
                  {plan.patient?.email && (
                    <Typography variant="body2" color="text.secondary">
                      {plan.patient.email}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: auraTokens.borderRadius.md }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <LocalHospital color="primary" />
                    <Typography variant="h6">Diagnosis</Typography>
                  </Box>
                  <Typography variant="body2">
                    {plan.diagnosis || "No diagnosis specified"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: auraTokens.borderRadius.md }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <Flag color="primary" />
                    <Typography variant="h6">Goals</Typography>
                  </Box>
                  <Typography variant="body2">
                    {plan.goals || "No goals specified"}
                  </Typography>
                </Paper>
              </Grid>

              {plan.aiRationale && (
                <Grid size={{ xs: 12 }}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: auraTokens.borderRadius.md }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <AutoAwesome color="primary" />
                      <Typography variant="h6">AI Rationale</Typography>
                    </Box>
                    <Typography variant="body2">{plan.aiRationale}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          {/* Phases Tab */}
          <TabPanel value={tabValue} index={1}>
            {plan.phases?.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {plan.phases.map((phase: any, index: number) => (
                  <Accordion
                    key={index}
                    defaultExpanded={phase.status === "InProgress"}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          width: "100%",
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor:
                              phase.status === "Completed"
                                ? "success.main"
                                : phase.status === "InProgress"
                                  ? "primary.main"
                                  : "grey.300",
                          }}
                        >
                          {phase.phaseNumber}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {phase.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {phase.durationWeeks} weeks |{" "}
                            {phase.sessionsPerWeek} sessions/week |{" "}
                            {phase.exercises?.length || 0} exercises
                          </Typography>
                        </Box>
                        <Chip
                          label={phase.status || "Not Started"}
                          size="small"
                          color={getPhaseStatusColor(phase.status) as any}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {phase.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {phase.description}
                        </Typography>
                      )}

                      {phase.goals?.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Goals:
                          </Typography>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {phase.goals.map((goal: string, i: number) => (
                              <Chip key={i} label={goal} size="small" />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {phase.exercises?.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Exercises:
                          </Typography>
                          <List dense>
                            {phase.exercises.map((exercise: any, i: number) => (
                              <ListItem
                                key={i}
                                sx={{
                                  bgcolor: "action.hover",
                                  borderRadius: 1,
                                  mb: 0.5,
                                }}
                              >
                                <ListItemIcon>
                                  <FitnessCenter color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={exercise.name}
                                  secondary={`${exercise.sets} sets × ${exercise.reps} reps${exercise.holdSeconds ? ` (${exercise.holdSeconds}s hold)` : ""} | ${exercise.frequency || "Daily"}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No phases defined for this treatment plan.
              </Alert>
            )}
          </TabPanel>

          {/* Exercises Tab */}
          <TabPanel value={tabValue} index={2}>
            {/* Add Exercise Button */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
              <AuraButton
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setExerciseDrawerOpen(true)}
                disabled={!plan.phases?.length || plan.status === "Completed"}
              >
                Add Exercise from Library
              </AuraButton>
            </Box>

            {plan.phases?.length > 0 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {plan.phases.map((phase: any, phaseIndex: number) => (
                  <Paper
                    key={phaseIndex}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: auraTokens.borderRadius.md }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: "primary.main",
                            fontSize: "0.875rem",
                          }}
                        >
                          {phase.phaseNumber}
                        </Avatar>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {phase.name}
                        </Typography>
                        <Chip
                          label={`${phase.exercises?.length || 0} exercises`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <AuraButton
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSelectedPhaseForExercise(phaseIndex);
                          setExerciseDrawerOpen(true);
                        }}
                        disabled={plan.status === "Completed"}
                      >
                        Add
                      </AuraButton>
                    </Box>

                    {phase.exercises?.length > 0 ? (
                      <Grid container spacing={2}>
                        {phase.exercises.map(
                          (exercise: any, exerciseIndex: number) => (
                            <Grid
                              size={{ xs: 12, sm: 6, md: 4 }}
                              key={exerciseIndex}
                            >
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 2,
                                  borderRadius: auraTokens.borderRadius.md,
                                  height: "100%",
                                  position: "relative",
                                  "&:hover .exercise-actions": {
                                    opacity: 1,
                                  },
                                }}
                              >
                                {/* Action Buttons */}
                                {plan.status !== "Completed" && (
                                  <Box
                                    className="exercise-actions"
                                    sx={{
                                      position: "absolute",
                                      top: 8,
                                      right: 8,
                                      display: "flex",
                                      gap: 0.5,
                                      opacity: 0,
                                      transition: "opacity 0.2s",
                                    }}
                                  >
                                    <AuraIconButton
                                      tooltip="Edit parameters"
                                      size="small"
                                      onClick={() =>
                                        setEditingExercise({
                                          phaseIndex,
                                          exerciseIndex,
                                          exercise,
                                        })
                                      }
                                    >
                                      <EditIcon fontSize="small" />
                                    </AuraIconButton>
                                    <AuraIconButton
                                      tooltip="Remove exercise"
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleRemoveExercise(
                                          phaseIndex,
                                          exerciseIndex,
                                        )
                                      }
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </AuraIconButton>
                                  </Box>
                                )}

                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                  }}
                                >
                                  {exercise.thumbnailUrl ? (
                                    <Avatar
                                      src={exercise.thumbnailUrl}
                                      variant="rounded"
                                      sx={{ width: 40, height: 40 }}
                                    />
                                  ) : (
                                    <Avatar
                                      variant="rounded"
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: "primary.lighter",
                                      }}
                                    >
                                      <FitnessCenter
                                        color="primary"
                                        fontSize="small"
                                      />
                                    </Avatar>
                                  )}
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle2"
                                        fontWeight={600}
                                        noWrap
                                      >
                                        {exercise.name}
                                      </Typography>
                                      {exercise.videoUrl && (
                                        <VideoIcon
                                          fontSize="small"
                                          color="action"
                                        />
                                      )}
                                    </Box>
                                    {exercise.difficulty && (
                                      <Chip
                                        label={exercise.difficulty}
                                        size="small"
                                        color={
                                          exercise.difficulty === "Beginner"
                                            ? "success"
                                            : exercise.difficulty ===
                                                "Intermediate"
                                              ? "warning"
                                              : "error"
                                        }
                                        sx={{ height: 18, fontSize: "0.7rem" }}
                                      />
                                    )}
                                  </Box>
                                </Box>

                                <Divider sx={{ my: 1 }} />

                                <Stack spacing={0.5}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Sets × Reps
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      fontWeight={600}
                                    >
                                      {exercise.sets} × {exercise.reps}
                                    </Typography>
                                  </Box>
                                  {exercise.holdSeconds && (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        Hold
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        fontWeight={600}
                                      >
                                        {exercise.holdSeconds}s
                                      </Typography>
                                    </Box>
                                  )}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Frequency
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      fontWeight={600}
                                    >
                                      {exercise.frequency || "Daily"}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Paper>
                            </Grid>
                          ),
                        )}
                      </Grid>
                    ) : (
                      <Box
                        sx={{
                          py: 4,
                          textAlign: "center",
                          bgcolor: "action.hover",
                          borderRadius: 2,
                        }}
                      >
                        <FitnessCenter
                          sx={{ fontSize: 32, color: "text.disabled", mb: 1 }}
                        />
                        <Typography color="text.secondary" variant="body2">
                          No exercises in this phase yet
                        </Typography>
                        <AuraButton
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setSelectedPhaseForExercise(phaseIndex);
                            setExerciseDrawerOpen(true);
                          }}
                          sx={{ mt: 1 }}
                          disabled={plan.status === "Completed"}
                        >
                          Add Exercise
                        </AuraButton>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                No phases defined for this treatment plan. Add phases first
                before adding exercises.
              </Alert>
            )}
          </TabPanel>

          {/* Milestones Tab */}
          <TabPanel value={tabValue} index={3}>
            {plan.milestones?.length > 0 ? (
              <List>
                {plan.milestones.map((milestone: any, index: number) => (
                  <ListItem
                    key={index}
                    sx={{
                      bgcolor: milestone.isCompleted
                        ? "success.lighter"
                        : "action.hover",
                      borderRadius: 2,
                      mb: 1,
                    }}
                  >
                    <ListItemIcon>
                      {milestone.isCompleted ? (
                        <CheckCircle color="success" />
                      ) : (
                        <EmojiEvents color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={milestone.title}
                      secondary={
                        milestone.description ||
                        `${milestone.currentValue || 0}/${milestone.targetValue} ${milestone.type}`
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={`+${milestone.pointsAwarded} pts`}
                        size="small"
                        color={milestone.isCompleted ? "success" : "default"}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No milestones defined for this treatment plan.
              </Alert>
            )}
          </TabPanel>
        </Box>
      </Paper>

      {/* Schedule Appointment Dialog */}
      <ScheduleAppointmentDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        patient={
          plan.patient
            ? {
                id: plan.patient.id,
                firstName: plan.patient.firstName,
                lastName: plan.patient.lastName,
                email: plan.patient.email || "",
                phone: plan.patient.phone || "",
              }
            : undefined
        }
        patientId={plan.patientId}
        treatmentPlanId={plan.id}
        appointmentType="treatment"
      />

      {/* Bulk Schedule Sessions Dialog */}
      <Dialog
        open={bulkScheduleDialogOpen}
        onClose={() => setBulkScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BulkScheduleIcon color="primary" />
            Schedule Treatment Sessions
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Automatically create appointments for all sessions in the selected
            phases.
          </Typography>

          <TextField
            label="Start Date"
            type="date"
            value={bulkScheduleStartDate}
            onChange={(e) => setBulkScheduleStartDate(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
            InputLabelProps={{ shrink: true }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Select Phases to Schedule
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={
                  plan?.phases &&
                  selectedPhasesForScheduling.size === plan.phases.length
                }
                indeterminate={
                  selectedPhasesForScheduling.size > 0 &&
                  plan?.phases &&
                  selectedPhasesForScheduling.size < plan.phases.length
                }
                onChange={selectAllPhases}
              />
            }
            label={
              <Typography variant="body2" fontWeight={500}>
                Select All Phases
              </Typography>
            }
          />

          <List dense>
            {plan?.phases?.map((phase: any, index: number) => {
              const totalSessions =
                (phase.durationWeeks || 2) * (phase.sessionsPerWeek || 2);
              return (
                <ListItem
                  key={index}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: selectedPhasesForScheduling.has(index)
                      ? "action.selected"
                      : "transparent",
                  }}
                >
                  <Checkbox
                    checked={selectedPhasesForScheduling.has(index)}
                    onChange={() => togglePhaseSelection(index)}
                  />
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            fontSize: "0.8rem",
                            bgcolor: "primary.main",
                          }}
                        >
                          {phase.phaseNumber}
                        </Avatar>
                        {phase.name}
                      </Box>
                    }
                    secondary={`${phase.durationWeeks} weeks × ${phase.sessionsPerWeek} sessions/week = ${totalSessions} sessions`}
                  />
                </ListItem>
              );
            })}
          </List>

          {selectedPhasesForScheduling.size > 0 && (
            <Box sx={{ mt: 2 }}>
              <Callout variant="info">
                <Typography variant="body2">
                  This will create{" "}
                  <strong>{calculateSessionsToSchedule()}</strong> appointments
                  starting from{" "}
                  {format(parseISO(bulkScheduleStartDate), "MMMM d, yyyy")}.
                </Typography>
              </Callout>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AuraButton
            variant="outlined"
            onClick={() => setBulkScheduleDialogOpen(false)}
          >
            Cancel
          </AuraButton>
          <AuraButton
            variant="contained"
            onClick={handleBulkScheduleSessions}
            loading={isBulkScheduling}
            disabled={selectedPhasesForScheduling.size === 0}
            startIcon={<ScheduleIcon />}
          >
            Schedule {calculateSessionsToSchedule()} Sessions
          </AuraButton>
        </DialogActions>
      </Dialog>

      {/* Exercise Library Drawer */}
      <ExerciseLibraryDrawer
        open={exerciseDrawerOpen}
        onClose={() => setExerciseDrawerOpen(false)}
        onAddExercise={handleAddExerciseToPhase}
        phases={
          plan?.phases?.map((p: any, i: number) => ({
            phaseNumber: p.phaseNumber || i + 1,
            name: p.name,
          })) || []
        }
        selectedPhaseIndex={selectedPhaseForExercise}
        bodyRegionFilter={plan?.bodyRegion}
      />

      {/* Edit Exercise Dialog */}
      <Dialog
        open={!!editingExercise}
        onClose={() => setEditingExercise(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit Exercise Parameters</DialogTitle>
        <DialogContent>
          {editingExercise && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {editingExercise.exercise.name}
              </Typography>
              <TextField
                label="Sets"
                type="number"
                value={editingExercise.exercise.sets || 3}
                onChange={(e) =>
                  setEditingExercise({
                    ...editingExercise,
                    exercise: {
                      ...editingExercise.exercise,
                      sets: parseInt(e.target.value, 10) || 3,
                    },
                  })
                }
                inputProps={{ min: 1, max: 20 }}
                fullWidth
              />
              <TextField
                label="Reps"
                type="number"
                value={editingExercise.exercise.reps || 10}
                onChange={(e) =>
                  setEditingExercise({
                    ...editingExercise,
                    exercise: {
                      ...editingExercise.exercise,
                      reps: parseInt(e.target.value, 10) || 10,
                    },
                  })
                }
                inputProps={{ min: 1, max: 100 }}
                fullWidth
              />
              <TextField
                label="Hold (seconds)"
                type="number"
                value={editingExercise.exercise.holdSeconds || 0}
                onChange={(e) =>
                  setEditingExercise({
                    ...editingExercise,
                    exercise: {
                      ...editingExercise.exercise,
                      holdSeconds: parseInt(e.target.value, 10) || undefined,
                    },
                  })
                }
                inputProps={{ min: 0, max: 300 }}
                fullWidth
              />
              <TextField
                label="Frequency"
                value={editingExercise.exercise.frequency || "Daily"}
                onChange={(e) =>
                  setEditingExercise({
                    ...editingExercise,
                    exercise: {
                      ...editingExercise.exercise,
                      frequency: e.target.value,
                    },
                  })
                }
                select
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="Daily">Daily</option>
                <option value="2x per day">2x per day</option>
                <option value="3x per week">3x per week</option>
                <option value="2x per week">2x per week</option>
                <option value="As needed">As needed</option>
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <AuraButton
            variant="outlined"
            onClick={() => setEditingExercise(null)}
          >
            Cancel
          </AuraButton>
          <AuraButton
            variant="contained"
            onClick={() => {
              if (editingExercise) {
                handleUpdateExercise(
                  editingExercise.phaseIndex,
                  editingExercise.exerciseIndex,
                  {
                    sets: editingExercise.exercise.sets,
                    reps: editingExercise.exercise.reps,
                    holdSeconds: editingExercise.exercise.holdSeconds,
                    frequency: editingExercise.exercise.frequency,
                  },
                );
              }
            }}
          >
            Save Changes
          </AuraButton>
        </DialogActions>
      </Dialog>

      {/* Save as Template Dialog */}
      <Dialog
        open={saveTemplateDialogOpen}
        onClose={() => setSaveTemplateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save as Template</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Create a reusable template from this treatment plan. The template
              will include all phases and exercises but no patient-specific
              data.
            </Typography>
            <TextField
              label="Template Name"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              fullWidth
              required
              helperText="A descriptive name for the template"
            />
            <SelectField
              label="Body Region"
              value={templateBodyRegion}
              onChange={setTemplateBodyRegion}
              options={[
                { value: "", label: "Select body region..." },
                { value: "Lower Back", label: "Lower Back" },
                { value: "Neck", label: "Neck" },
                { value: "Shoulder", label: "Shoulder" },
                { value: "Knee", label: "Knee" },
                { value: "Hip", label: "Hip" },
                { value: "Ankle", label: "Ankle" },
                { value: "Wrist", label: "Wrist" },
                { value: "Elbow", label: "Elbow" },
                { value: "Full Body", label: "Full Body" },
              ]}
            />
            <TextField
              label="Condition Type"
              value={templateConditionType}
              onChange={(e) => setTemplateConditionType(e.target.value)}
              fullWidth
              placeholder="e.g., ACL Reconstruction, Rotator Cuff Repair"
              helperText="The condition this template is designed for"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <AuraButton
            variant="text"
            onClick={() => setSaveTemplateDialogOpen(false)}
          >
            Cancel
          </AuraButton>
          <AuraButton
            variant="contained"
            startIcon={<SaveTemplateIcon />}
            onClick={() => {
              if (!templateTitle.trim()) {
                enqueueSnackbar("Please enter a template name", {
                  variant: "warning",
                });
                return;
              }
              saveAsTemplateMutation.mutate({
                title: templateTitle.trim(),
                bodyRegion: templateBodyRegion || undefined,
                conditionType: templateConditionType || undefined,
              });
            }}
            loading={saveAsTemplateMutation.isPending}
          >
            Save Template
          </AuraButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
