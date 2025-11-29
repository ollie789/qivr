import { useState } from "react";
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
} from "@mui/icons-material";
import {
  AuraButton,
  Callout,
  auraTokens,
} from "@qivr/design-system";
import { treatmentPlansApi } from "../lib/api";
import { useSnackbar } from "notistack";
import { ScheduleAppointmentDialog } from "../components/dialogs/ScheduleAppointmentDialog";

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
  const [tabValue, setTabValue] = useState(0);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const { data: plan, isLoading, error } = useQuery({
    queryKey: ["treatment-plan", id],
    queryFn: () => treatmentPlansApi.get(id!),
    enabled: !!id,
  });

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

  const getStatusColor = (
    status: string
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
            {plan.durationWeeks} weeks |{" "}
            Started {new Date(plan.startDate).toLocaleDateString()}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
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

      {/* Tabs */}
      <Paper sx={{ mt: 3, borderRadius: auraTokens.borderRadius.lg }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab label="Overview" icon={<Assessment />} iconPosition="start" />
          <Tab label="Phases" icon={<Timeline />} iconPosition="start" />
          <Tab label="Exercises" icon={<FitnessCenter />} iconPosition="start" />
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
                  <Accordion key={index} defaultExpanded={phase.status === "InProgress"}>
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
                            {phase.durationWeeks} weeks | {phase.sessionsPerWeek}{" "}
                            sessions/week | {phase.exercises?.length || 0} exercises
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
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
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
            {plan.phases?.length > 0 ? (
              <Grid container spacing={2}>
                {plan.phases.flatMap((phase: any) =>
                  phase.exercises?.map((exercise: any, i: number) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${phase.phaseNumber}-${i}`}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: auraTokens.borderRadius.md,
                          height: "100%",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <FitnessCenter color="primary" />
                          <Typography variant="subtitle1" fontWeight={600}>
                            {exercise.name}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {exercise.description || "No description"}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="caption">Sets</Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {exercise.sets}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="caption">Reps</Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {exercise.reps}
                          </Typography>
                        </Box>
                        {exercise.holdSeconds && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 1,
                            }}
                          >
                            <Typography variant="caption">Hold</Typography>
                            <Typography variant="caption" fontWeight={600}>
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
                          <Typography variant="caption">Frequency</Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {exercise.frequency || "Daily"}
                          </Typography>
                        </Box>
                        <Chip
                          label={`Phase ${phase.phaseNumber}`}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 2 }}
                        />
                      </Paper>
                    </Grid>
                  ))
                )}
              </Grid>
            ) : plan.exercises?.length > 0 ? (
              <Grid container spacing={2}>
                {plan.exercises.map((exercise: any, i: number) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: auraTokens.borderRadius.md,
                        height: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <FitnessCenter color="primary" />
                        <Typography variant="subtitle1" fontWeight={600}>
                          {exercise.name}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {exercise.description || "No description"}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Alert severity="info">
                No exercises defined for this treatment plan.
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
    </Box>
  );
}
