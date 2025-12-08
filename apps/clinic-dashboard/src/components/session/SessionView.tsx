import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  Chip,
  TextField,
  Divider,
  Paper,
  FormControlLabel,
  Checkbox,
  Slider,
  alpha,
  useTheme,
  LinearProgress,
  CircularProgress,
  Avatar,
  Collapse,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  FitnessCenter as ExerciseIcon,
  Timer as TimerIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CompleteIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
  EventRepeat as ScheduleNextIcon,
  MedicalServices as DeviceIcon,
} from "@mui/icons-material";
import {
  format,
  parseISO,
  differenceInMinutes,
  differenceInYears,
} from "date-fns";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  auraTokens,
  AuraButton,
  AuraCard,
  AuraIconButton,
  SelectField,
} from "@qivr/design-system";
import { appointmentsApi } from "../../services/appointmentsApi";
import type { Appointment } from "../../features/appointments/types";
import { patientApi } from "../../services/patientApi";
import {
  treatmentPlansApi,
  deviceTrackingApi,
  type AvailableDevice,
} from "../../lib/api";
import {
  promApi,
  NotificationMethod,
  type PromTemplateSummary,
} from "../../services/promApi";
import { DeviceSelector } from "../devices";
import { ScheduleAppointmentDialog } from "../dialogs/ScheduleAppointmentDialog";
import { AssignTreatmentPlanDialog } from "../dialogs/AssignTreatmentPlanDialog";

interface SessionViewProps {
  appointment: Appointment;
  onClose: () => void;
  onComplete: () => void;
}

interface TreatmentPlanSummary {
  id: string;
  title: string;
  status: string;
  currentPhase?: string;
  completedSessions: number;
  totalSessions: number;
  nextSessionNumber: number;
  progressPercent: number;
  sessionsPerWeek?: number;
  phases?: any[];
}

// Session timer hook
function useSessionTimer(startTime: Date | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsed(differenceInMinutes(new Date(), startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / 60);
  const minutes = elapsed % 60;

  return {
    elapsed,
    formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
  };
}

export function SessionView({
  appointment,
  onClose,
  onComplete,
}: SessionViewProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Session state
  const [sessionStartTime] = useState<Date>(new Date());
  const { formatted: sessionDuration } = useSessionTimer(sessionStartTime);
  const [activeTab, setActiveTab] = useState(0);
  const [showPreviousNotes, setShowPreviousNotes] = useState(false);

  // SOAP Notes
  const [subjective, setSubjective] = useState("");
  const [objective, setObjective] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

  // Quick notes (combined for display)
  const [modalities, setModalities] = useState({
    manualTherapy: false,
    exerciseTherapy: false,
    dryNeedling: false,
    ultrasound: false,
    tens: false,
    heat: false,
    ice: false,
    education: false,
  });

  // Pain tracking
  const [painBefore, setPainBefore] = useState(5);
  const [painAfter, setPainAfter] = useState(5);

  // Treatment plan
  const [treatmentPlan, setTreatmentPlan] =
    useState<TreatmentPlanSummary | null>(null);
  const [updateTreatmentPlan, setUpdateTreatmentPlan] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // PROM
  const [assignPROM, setAssignPROM] = useState(false);
  const [selectedPromTemplate, setSelectedPromTemplate] = useState("");

  // Follow-up scheduling
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [suggestedNextDate, setSuggestedNextDate] = useState<Date | null>(null);

  // Assign treatment plan
  const [assignPlanDialogOpen, setAssignPlanDialogOpen] = useState(false);

  // Medical device tracking
  const [selectedDevice, setSelectedDevice] = useState<AvailableDevice | null>(
    null,
  );

  // Fetch patient details
  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ["patient", appointment.patientId],
    queryFn: () => patientApi.getPatient(appointment.patientId),
    enabled: !!appointment.patientId,
  });

  // Fetch patient's previous appointments
  const { data: previousAppointments = [] } = useQuery({
    queryKey: ["patient-appointments", appointment.patientId],
    queryFn: () => patientApi.getPatientAppointments(appointment.patientId),
    enabled: !!appointment.patientId,
  });

  // Fetch PROM templates
  const { data: promTemplates = [] } = useQuery<PromTemplateSummary[]>({
    queryKey: ["prom-templates-active"],
    queryFn: () => promApi.getTemplates({ isActive: true }),
  });

  // Filter to completed previous appointments (excluding current)
  const completedPreviousAppointments = useMemo(() => {
    return previousAppointments
      .filter(
        (apt: any) => apt.id !== appointment.id && apt.status === "completed",
      )
      .slice(0, 5);
  }, [previousAppointments, appointment.id]);

  // Load treatment plan
  useEffect(() => {
    const loadPlan = async () => {
      if (!appointment.patientId) return;
      setLoadingPlan(true);
      try {
        const plans = await treatmentPlansApi.list(appointment.patientId);
        const activePlan = (plans as any[]).find(
          (p: any) =>
            p.status === "Active" ||
            p.status === "active" ||
            p.status === "InProgress",
        );
        if (activePlan) {
          const completedSessions =
            activePlan.sessions?.filter((s: any) => s.completed)?.length ?? 0;
          const totalSessions =
            activePlan.totalSessions ?? activePlan.sessions?.length ?? 0;
          setTreatmentPlan({
            id: activePlan.id,
            title: activePlan.title,
            status: activePlan.status,
            currentPhase:
              activePlan.currentPhase ?? activePlan.phases?.[0]?.name,
            completedSessions,
            totalSessions,
            nextSessionNumber: completedSessions + 1,
            progressPercent:
              totalSessions > 0
                ? Math.round((completedSessions / totalSessions) * 100)
                : 0,
            sessionsPerWeek: activePlan.sessionsPerWeek ?? 2,
            phases: activePlan.phases,
          });
        }
      } catch (error) {
        console.error("Failed to fetch treatment plan:", error);
      } finally {
        setLoadingPlan(false);
      }
    };
    loadPlan();
  }, [appointment.patientId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const modalitiesUsed = Object.entries(modalities)
        .filter(([_, used]) => used)
        .map(([name]) => name.replace(/([A-Z])/g, " $1").trim())
        .join(", ");

      const fullNotes = [
        subjective && `S: ${subjective}`,
        objective && `O: ${objective}`,
        assessment && `A: ${assessment}`,
        plan && `P: ${plan}`,
        modalitiesUsed && `\nModalities: ${modalitiesUsed}`,
        `Pain: ${painBefore}/10 → ${painAfter}/10`,
        selectedDevice &&
          `Device: ${selectedDevice.name} (${selectedDevice.deviceCode})`,
        updateTreatmentPlan &&
          treatmentPlan &&
          `[Session ${treatmentPlan.nextSessionNumber} completed]`,
        assignPROM && "[PROM Assigned]",
      ]
        .filter(Boolean)
        .join("\n");

      await appointmentsApi.updateAppointment(appointment.id, {
        notes: fullNotes,
      });

      // Update treatment plan if enabled
      if (updateTreatmentPlan && treatmentPlan) {
        await treatmentPlansApi.completeSession(
          treatmentPlan.id,
          treatmentPlan.nextSessionNumber,
          {
            painLevelAfter: painAfter,
            notes: fullNotes,
            appointmentId: appointment.id,
          },
        );
      }

      // Record device usage if selected
      if (selectedDevice) {
        try {
          await deviceTrackingApi.recordUsage({
            deviceId: selectedDevice.id,
            patientId: appointment.patientId,
            appointmentId: appointment.id,
          });
        } catch (error) {
          console.error("Failed to record device usage:", error);
        }
      }

      // Send PROM if enabled
      if (assignPROM && selectedPromTemplate) {
        await promApi.sendProm({
          templateKey: selectedPromTemplate,
          patientId: appointment.patientId,
          scheduledFor: new Date().toISOString(),
          notificationMethod:
            NotificationMethod.Email | NotificationMethod.InApp,
          notes: `Assigned after session on ${format(new Date(), "MMM d, yyyy")}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
      enqueueSnackbar("Session notes saved", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to save notes", { variant: "error" });
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      await saveMutation.mutateAsync();
      await appointmentsApi.completeAppointment(appointment.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Session completed", { variant: "success" });

      // Suggest next appointment if treatment plan has remaining sessions
      if (
        treatmentPlan &&
        treatmentPlan.nextSessionNumber < treatmentPlan.totalSessions
      ) {
        const daysUntilNext = Math.round(
          7 / (treatmentPlan.sessionsPerWeek || 2),
        );
        const suggested = new Date();
        suggested.setDate(suggested.getDate() + daysUntilNext);
        setSuggestedNextDate(suggested);
        setScheduleDialogOpen(true);
      } else {
        onComplete();
      }
    },
    onError: () => {
      enqueueSnackbar("Failed to complete session", { variant: "error" });
    },
  });

  const patientAge = patient?.dateOfBirth
    ? differenceInYears(new Date(), parseISO(patient.dateOfBirth))
    : null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: "background.default",
        zIndex: 1300,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 1.5,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: auraTokens.shadows.sm,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <AuraIconButton tooltip="Close Session" onClick={onClose}>
            <CloseIcon />
          </AuraIconButton>
          <Divider orientation="vertical" flexItem />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "warning.main",
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%": { opacity: 1, transform: "scale(1)" },
                  "50%": { opacity: 0.5, transform: "scale(1.2)" },
                  "100%": { opacity: 1, transform: "scale(1)" },
                },
              }}
            />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Session in Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(
                  parseISO(appointment.scheduledStart),
                  "EEEE, MMMM d 'at' h:mm a",
                )}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* Session Timer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              bgcolor: alpha(theme.palette.warning.main, 0.1),
              borderRadius: 2,
            }}
          >
            <TimerIcon color="warning" />
            <Typography variant="h6" fontWeight={700} color="warning.main">
              {sessionDuration}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem />

          <AuraButton
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            Save
          </AuraButton>
          <AuraButton
            variant="contained"
            color="success"
            startIcon={<CompleteIcon />}
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            Complete Session
          </AuraButton>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Sidebar - Patient Info */}
        <Box
          sx={{
            width: 320,
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Patient Header */}
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            {loadingPatient ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: "primary.main",
                      fontSize: "1.25rem",
                    }}
                  >
                    {patient?.firstName?.[0]}
                    {patient?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {patient?.firstName} {patient?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patientAge && `${patientAge} years old`}
                      {patientAge && patient?.gender && " • "}
                      {patient?.gender}
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={1}>
                  {patient?.phone && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{patient.phone}</Typography>
                    </Box>
                  )}
                  {patient?.email && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2" noWrap>
                        {patient.email}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Chip
                    label={appointment.appointmentType}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {appointment.reasonForVisit && (
                    <Chip
                      label={appointment.reasonForVisit}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </>
            )}
          </Box>

          {/* Treatment Plan Progress */}
          <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <ExerciseIcon color="success" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                Treatment Plan
              </Typography>
            </Box>

            {loadingPlan ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            ) : treatmentPlan ? (
              <Box>
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  {treatmentPlan.title}
                </Typography>
                {treatmentPlan.currentPhase && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    gutterBottom
                  >
                    Phase: {treatmentPlan.currentPhase}
                  </Typography>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Session {treatmentPlan.nextSessionNumber} of{" "}
                    {treatmentPlan.totalSessions}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="success.main"
                  >
                    {treatmentPlan.progressPercent}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={treatmentPlan.progressPercent}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha(theme.palette.success.main, 0.15),
                    "& .MuiLinearProgress-bar": {
                      bgcolor: "success.main",
                      borderRadius: 3,
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={updateTreatmentPlan}
                      onChange={(e) => setUpdateTreatmentPlan(e.target.checked)}
                      size="small"
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="caption">
                      Mark session {treatmentPlan.nextSessionNumber} complete
                    </Typography>
                  }
                  sx={{ mt: 1 }}
                />
              </Box>
            ) : (
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  No active treatment plan
                </Typography>
                <AuraButton
                  size="small"
                  variant="outlined"
                  onClick={() => setAssignPlanDialogOpen(true)}
                >
                  Assign Plan
                </AuraButton>
              </Box>
            )}
          </Box>

          {/* Previous Sessions */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => setShowPreviousNotes(!showPreviousNotes)}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <HistoryIcon fontSize="small" color="action" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Previous Sessions ({completedPreviousAppointments.length})
                </Typography>
              </Box>
              {showPreviousNotes ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>

            <Collapse in={showPreviousNotes}>
              <Stack spacing={1} sx={{ px: 2, pb: 2 }}>
                {completedPreviousAppointments.map((apt: any) => (
                  <Paper
                    key={apt.id}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      {format(parseISO(apt.scheduledStart), "MMM d, yyyy")}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {apt.notes || "No notes recorded"}
                    </Typography>
                  </Paper>
                ))}
                {completedPreviousAppointments.length === 0 && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ px: 1 }}
                  >
                    No previous sessions
                  </Typography>
                )}
              </Stack>
            </Collapse>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Tabs */}
          <Box
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab
                icon={<AssignmentIcon />}
                iconPosition="start"
                label="SOAP Notes"
              />
              <Tab
                icon={<TrendingUpIcon />}
                iconPosition="start"
                label="Assessment"
              />
              <Tab
                icon={<CalendarIcon />}
                iconPosition="start"
                label="Follow-up"
              />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
            {activeTab === 0 && (
              <Stack spacing={3}>
                {/* SOAP Notes */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 3,
                  }}
                >
                  <TextField
                    label="Subjective"
                    placeholder="Patient's reported symptoms, concerns, and history..."
                    multiline
                    rows={4}
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Objective"
                    placeholder="Clinical findings, measurements, observations..."
                    multiline
                    rows={4}
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Assessment"
                    placeholder="Diagnosis, clinical reasoning, progress evaluation..."
                    multiline
                    rows={4}
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Plan"
                    placeholder="Treatment plan, home exercises, next steps..."
                    multiline
                    rows={4}
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                {/* Modalities */}
                <AuraCard variant="flat" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Treatment Modalities
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {Object.entries({
                      manualTherapy: "Manual Therapy",
                      exerciseTherapy: "Exercise Therapy",
                      dryNeedling: "Dry Needling",
                      ultrasound: "Ultrasound",
                      tens: "TENS",
                      heat: "Heat",
                      ice: "Ice",
                      education: "Patient Education",
                    }).map(([key, label]) => (
                      <Chip
                        key={key}
                        label={label}
                        variant={
                          modalities[key as keyof typeof modalities]
                            ? "filled"
                            : "outlined"
                        }
                        color={
                          modalities[key as keyof typeof modalities]
                            ? "primary"
                            : "default"
                        }
                        onClick={() =>
                          setModalities({
                            ...modalities,
                            [key]: !modalities[key as keyof typeof modalities],
                          })
                        }
                        sx={{ cursor: "pointer" }}
                      />
                    ))}
                  </Box>
                </AuraCard>
              </Stack>
            )}

            {activeTab === 1 && (
              <Stack spacing={3}>
                {/* Pain Tracking */}
                <AuraCard variant="flat" sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Pain Level Assessment
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 4,
                    }}
                  >
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Pain Before Session
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="error.main"
                        >
                          {painBefore}/10
                        </Typography>
                      </Box>
                      <Slider
                        value={painBefore}
                        onChange={(_, v) => setPainBefore(v as number)}
                        min={0}
                        max={10}
                        marks
                        valueLabelDisplay="auto"
                        color="error"
                      />
                    </Box>
                    <Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Pain After Session
                        </Typography>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="success.main"
                        >
                          {painAfter}/10
                        </Typography>
                      </Box>
                      <Slider
                        value={painAfter}
                        onChange={(_, v) => setPainAfter(v as number)}
                        min={0}
                        max={10}
                        marks
                        valueLabelDisplay="auto"
                        color="success"
                      />
                    </Box>
                  </Box>
                  {painBefore > painAfter && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <TrendingUpIcon color="success" />
                      <Typography
                        variant="body2"
                        color="success.main"
                        fontWeight={500}
                      >
                        Pain reduced by {painBefore - painAfter} points this
                        session
                      </Typography>
                    </Box>
                  )}
                </AuraCard>

                {/* PROM Assignment */}
                <AuraCard variant="flat" sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Outcome Measurement (PROM)
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={assignPROM}
                        onChange={(e) => setAssignPROM(e.target.checked)}
                      />
                    }
                    label="Send questionnaire to patient"
                  />
                  {assignPROM && (
                    <Box sx={{ mt: 2, maxWidth: 400 }}>
                      <SelectField
                        label="Select Questionnaire"
                        value={selectedPromTemplate}
                        onChange={setSelectedPromTemplate}
                        options={[
                          { value: "", label: "Choose questionnaire..." },
                          ...promTemplates.map((t) => ({
                            value: t.key,
                            label: t.name,
                          })),
                        ]}
                      />
                    </Box>
                  )}
                </AuraCard>

                {/* Medical Device Tracking */}
                <AuraCard variant="flat" sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <DeviceIcon color="primary" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Medical Device / Resource
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Link a medical device or resource used during this session
                  </Typography>
                  <DeviceSelector
                    value={selectedDevice}
                    onChange={setSelectedDevice}
                    showRecent
                  />
                </AuraCard>
              </Stack>
            )}

            {activeTab === 2 && (
              <Stack spacing={3}>
                {/* Follow-up Scheduling */}
                <AuraCard variant="flat" sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Schedule Follow-up
                  </Typography>
                  {treatmentPlan &&
                  treatmentPlan.nextSessionNumber <
                    treatmentPlan.totalSessions ? (
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {treatmentPlan.totalSessions -
                          treatmentPlan.nextSessionNumber}{" "}
                        sessions remaining in treatment plan
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Recommended frequency: {treatmentPlan.sessionsPerWeek}x
                        per week
                      </Typography>
                      <AuraButton
                        variant="contained"
                        startIcon={<ScheduleNextIcon />}
                        onClick={() => setScheduleDialogOpen(true)}
                        sx={{ mt: 2 }}
                      >
                        Schedule Next Session
                      </AuraButton>
                    </Box>
                  ) : (
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Schedule a follow-up appointment if needed
                      </Typography>
                      <AuraButton
                        variant="outlined"
                        startIcon={<CalendarIcon />}
                        onClick={() => setScheduleDialogOpen(true)}
                        sx={{ mt: 2 }}
                      >
                        Schedule Appointment
                      </AuraButton>
                    </Box>
                  )}
                </AuraCard>
              </Stack>
            )}
          </Box>
        </Box>
      </Box>

      {/* Schedule Dialog */}
      <ScheduleAppointmentDialog
        open={scheduleDialogOpen}
        onClose={() => {
          setScheduleDialogOpen(false);
          if (completeMutation.isSuccess) {
            onComplete();
          }
        }}
        initialDate={suggestedNextDate || undefined}
        patientId={appointment.patientId}
        treatmentPlanId={treatmentPlan?.id}
        appointmentType="treatment"
      />

      {/* Assign Treatment Plan Dialog */}
      {patient && (
        <AssignTreatmentPlanDialog
          open={assignPlanDialogOpen}
          onClose={() => setAssignPlanDialogOpen(false)}
          patient={{
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
          }}
          sessionId={appointment.id}
          onSuccess={async (planId) => {
            // Reload the treatment plan
            try {
              const plans = await treatmentPlansApi.list(appointment.patientId);
              const activePlan = (plans as any[]).find(
                (p: any) => p.id === planId,
              );
              if (activePlan) {
                const completedSessions =
                  activePlan.sessions?.filter((s: any) => s.completed)
                    ?.length ?? 0;
                const totalSessions =
                  activePlan.totalSessions ?? activePlan.sessions?.length ?? 0;
                setTreatmentPlan({
                  id: activePlan.id,
                  title: activePlan.title,
                  status: activePlan.status,
                  currentPhase:
                    activePlan.currentPhase ?? activePlan.phases?.[0]?.name,
                  completedSessions,
                  totalSessions,
                  nextSessionNumber: completedSessions + 1,
                  progressPercent:
                    totalSessions > 0
                      ? Math.round((completedSessions / totalSessions) * 100)
                      : 0,
                  sessionsPerWeek: activePlan.sessionsPerWeek ?? 2,
                  phases: activePlan.phases,
                });
              }
            } catch (error) {
              console.error("Failed to load treatment plan:", error);
            }
            setAssignPlanDialogOpen(false);
          }}
        />
      )}
    </Box>
  );
}
