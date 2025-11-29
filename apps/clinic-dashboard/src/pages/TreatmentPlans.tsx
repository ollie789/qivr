import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  TextField,
  Typography,
  Chip,
  Stack,
  Paper,
  Autocomplete,
  Grid,
} from "@mui/material";
import {
  Add,
  Description,
  CalendarMonth as ScheduleIcon,
} from "@mui/icons-material";
import {
  FormDialog,
  AuraButton,
  PageHeader,
  AuraEmptyState,
} from "@qivr/design-system";
import { treatmentPlansApi } from "../lib/api";
import { patientsApi } from "../services/patientsApi";
import { useSnackbar } from "notistack";
import { ScheduleAppointmentDialog } from "../components/dialogs/ScheduleAppointmentDialog";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export default function TreatmentPlans() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    diagnosis: "",
    goals: "",
    startDate: new Date().toISOString().split("T")[0],
    durationWeeks: "6",
    notes: "",
  });
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

  const { data: patientsData } = useQuery({
    queryKey: ["patients-list"],
    queryFn: () => patientsApi.list({ pageSize: 100 }),
  });
  const patients: Patient[] = patientsData?.data || [];

  const createMutation = useMutation({
    mutationFn: treatmentPlansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
      setShowCreateDialog(false);
      resetForm();
      enqueueSnackbar("Treatment plan created", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to create treatment plan", { variant: "error" });
    },
  });

  const resetForm = () => {
    setSelectedPatient(null);
    setFormData({
      title: "",
      diagnosis: "",
      goals: "",
      startDate: new Date().toISOString().split("T")[0],
      durationWeeks: "6",
      notes: "",
    });
  };

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

  const handleCreate = () => {
    if (!selectedPatient) return;
    createMutation.mutate({
      patientId: selectedPatient.id,
      title: formData.title,
      diagnosis: formData.diagnosis || undefined,
      goals: formData.goals || undefined,
      startDate: new Date(formData.startDate).toISOString(),
      durationWeeks: parseInt(formData.durationWeeks),
      notes: formData.notes || undefined,
    });
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
          description="Create your first treatment plan to get started"
          actionText="Create Plan"
          onAction={() => setShowCreateDialog(true)}
        />
      ) : (
        <Stack spacing={2}>
          {plans.map((plan: any) => (
            <Paper key={plan.id} sx={{ p: 3, borderRadius: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {plan.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patient: {plan.patient?.firstName} {plan.patient?.lastName}
                  </Typography>
                </Box>
                <Chip
                  label={plan.status}
                  size="small"
                  color={getStatusColor(plan.status)}
                />
              </Box>

              {plan.diagnosis && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Diagnosis:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.diagnosis}
                  </Typography>
                </Box>
              )}

              {plan.goals && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Goals:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {plan.goals}
                  </Typography>
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
                  Duration: {plan.durationWeeks} weeks
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Start: {new Date(plan.startDate).toLocaleDateString()}
                </Typography>
                {plan.exercises?.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {plan.exercises.length} exercises
                  </Typography>
                )}
                {plan.sessions?.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {plan.sessions.length} sessions
                  </Typography>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <AuraButton
                  size="small"
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => handleScheduleSession(plan)}
                >
                  Schedule Session
                </AuraButton>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      <FormDialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          resetForm();
        }}
        onSubmit={handleCreate}
        title="Create Treatment Plan"
        maxWidth="sm"
        formActionsProps={{
          submitLabel: "Create",
          submitLoading: createMutation.isPending,
          submitDisabled:
            !selectedPatient ||
            !formData.title ||
            !formData.startDate ||
            !formData.durationWeeks,
        }}
      >
        <Stack spacing={3} sx={{ pt: 1 }}>
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

          <TextField
            label="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            fullWidth
            placeholder="e.g., Post-Surgery Rehabilitation"
          />

          <TextField
            label="Diagnosis"
            value={formData.diagnosis}
            onChange={(e) =>
              setFormData({ ...formData, diagnosis: e.target.value })
            }
            fullWidth
            multiline
            rows={2}
            placeholder="Primary diagnosis or condition"
          />

          <TextField
            label="Goals"
            value={formData.goals}
            onChange={(e) =>
              setFormData({ ...formData, goals: e.target.value })
            }
            fullWidth
            multiline
            rows={2}
            placeholder="Treatment goals and objectives"
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Duration (weeks)"
                type="number"
                value={formData.durationWeeks}
                onChange={(e) =>
                  setFormData({ ...formData, durationWeeks: e.target.value })
                }
                required
                fullWidth
                inputProps={{ min: 1, max: 52 }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            fullWidth
            multiline
            rows={3}
            placeholder="Additional notes or instructions"
          />
        </Stack>
      </FormDialog>

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
