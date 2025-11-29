import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Description,
  CalendarMonth as ScheduleIcon,
  Visibility,
  AutoAwesome,
  CheckCircle,
  FitnessCenter,
} from "@mui/icons-material";
import {
  AuraButton,
  PageHeader,
  AuraEmptyState,
} from "@qivr/design-system";
import { treatmentPlansApi } from "../lib/api";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import {
  ScheduleAppointmentDialog,
  TreatmentPlanBuilder,
} from "../components/dialogs";

export default function TreatmentPlans() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const handleScheduleSession = (plan: any) => {
    setSelectedPlan(plan);
    setScheduleDialogOpen(true);
  };

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["treatment-plans"],
    queryFn: () => treatmentPlansApi.list(),
  });

  const approveMutation = useMutation({
    mutationFn: (planId: string) => treatmentPlansApi.approve(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
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

  const handlePlanCreated = (_planId: string) => {
    queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
    // Optionally navigate to the plan detail page
    // navigate(`/treatment-plans/${_planId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Treatment Plans"
        description="Manage patient treatment plans"
        actions={
          <AuraButton
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Plan
          </AuraButton>
        }
      />

      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : plans.length === 0 ? (
        <AuraEmptyState
          icon={<Description />}
          title="No treatment plans yet"
          description="Create your first treatment plan using AI assistance or manual setup"
          actionText="Create Plan"
          onAction={() => setShowCreateDialog(true)}
        />
      ) : (
        <Stack spacing={2}>
          {plans.map((plan: any) => (
            <Paper
              key={plan.id}
              sx={{
                p: 3,
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: 4,
                  transform: "translateY(-2px)",
                },
              }}
              onClick={() => navigate(`/treatment-plans/${plan.id}`)}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {plan.title}
                    </Typography>
                    {plan.aiGeneratedAt && (
                      <Tooltip title="AI Generated">
                        <AutoAwesome fontSize="small" color="primary" />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {plan.patient?.firstName} {plan.patient?.lastName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={plan.status}
                    size="small"
                    color={getStatusColor(plan.status)}
                  />
                  {plan.status === "Draft" && (
                    <Tooltip title="Approve & Activate">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          approveMutation.mutate(plan.id);
                        }}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Progress bar for active plans */}
              {plan.status === "Active" && plan.progressPercentage > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="caption" color="primary">
                      {Math.round(plan.progressPercentage)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={plan.progressPercentage}
                    sx={{ borderRadius: 1, height: 6 }}
                  />
                </Box>
              )}

              {plan.diagnosis && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Diagnosis:
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {plan.diagnosis}
                  </Typography>
                </Box>
              )}

              {/* Phase summary */}
              {plan.phases?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                    Phases:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {plan.phases.slice(0, 4).map((phase: any, idx: number) => (
                      <Chip
                        key={idx}
                        label={`${phase.name} (${phase.durationWeeks}w)`}
                        size="small"
                        variant={
                          phase.status === "InProgress" ? "filled" : "outlined"
                        }
                        color={
                          phase.status === "Completed"
                            ? "success"
                            : phase.status === "InProgress"
                              ? "primary"
                              : "default"
                        }
                      />
                    ))}
                    {plan.phases.length > 4 && (
                      <Chip
                        label={`+${plan.phases.length - 4} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {plan.durationWeeks} weeks
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Started: {new Date(plan.startDate).toLocaleDateString()}
                </Typography>
                {plan.phases?.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    <FitnessCenter
                      fontSize="inherit"
                      sx={{ verticalAlign: "middle", mr: 0.5 }}
                    />
                    {plan.phases.reduce(
                      (acc: number, p: any) => acc + (p.exercises?.length || 0),
                      0
                    )}{" "}
                    exercises
                  </Typography>
                )}
                {plan.completedSessions > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {plan.completedSessions}/{plan.totalSessions} sessions
                  </Typography>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <AuraButton
                  size="small"
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/treatment-plans/${plan.id}`);
                  }}
                >
                  View Details
                </AuraButton>
                <AuraButton
                  size="small"
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScheduleSession(plan);
                  }}
                >
                  Schedule
                </AuraButton>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      <TreatmentPlanBuilder
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handlePlanCreated}
      />

      <ScheduleAppointmentDialog
        open={scheduleDialogOpen}
        onClose={() => {
          setScheduleDialogOpen(false);
          setSelectedPlan(null);
        }}
        patient={
          selectedPlan?.patient
            ? {
                id: selectedPlan.patient.id,
                firstName: selectedPlan.patient.firstName,
                lastName: selectedPlan.patient.lastName,
                email: selectedPlan.patient.email || "",
                phone: selectedPlan.patient.phone || "",
              }
            : undefined
        }
        patientId={selectedPlan?.patientId}
        treatmentPlanId={selectedPlan?.id}
        appointmentType="treatment"
      />
    </Box>
  );
}
