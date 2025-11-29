import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Paper,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, differenceInMinutes, format } from "date-fns";
import { useSnackbar } from "notistack";
import { useNavigate, useParams } from "react-router-dom";
import {
  AvailableSlot,
  fetchAvailableSlots,
  fetchAppointments,
} from "../services/appointmentsApi";
import { api } from "../services/api";
import {
  SectionLoader,
  auraStepper,
  AuraButton,
  DialogSection,
  Callout,
} from "@qivr/design-system";

const steps = ["Pick New Date & Time", "Confirm Reschedule"];

interface RescheduleData {
  startTime?: string;
  durationMinutes: number;
}

export const RescheduleAppointment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [rescheduleData, setRescheduleData] = useState<RescheduleData>({
    durationMinutes: 30,
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch the existing appointment
  const { data: appointments = [], isLoading: appointmentLoading } = useQuery({
    queryKey: ["appointments", { upcoming: true }],
    queryFn: () => fetchAppointments({ upcoming: true }),
  });

  const appointment = useMemo(
    () => appointments.find((apt) => apt.id === id),
    [appointments, id],
  );

  const dateParam = useMemo(() => {
    const base = selectedDate ?? new Date();
    return format(base, "yyyy-MM-dd");
  }, [selectedDate]);

  useEffect(() => {
    setSelectedSlot(null);
    setRescheduleData((prev) => ({ ...prev, startTime: undefined }));
  }, [dateParam]);

  // Use the original appointment's duration if available
  useEffect(() => {
    if (appointment?.duration) {
      setRescheduleData((prev) => ({
        ...prev,
        durationMinutes: appointment.duration,
      }));
    }
  }, [appointment]);

  const { data: slots = [], isLoading: slotsLoading } = useQuery<
    AvailableSlot[]
  >({
    queryKey: ["availableSlots", appointment?.providerId, dateParam],
    queryFn: () =>
      fetchAvailableSlots(
        appointment!.providerId,
        dateParam,
        rescheduleData.durationMinutes,
      ),
    enabled: Boolean(appointment?.providerId && selectedDate),
  });

  const rescheduleMutation = useMutation({
    mutationFn: async (payload: {
      newStartTime: string;
      newEndTime: string;
    }) => {
      await api.post(`/api/appointments/${id}/reschedule`, {
        NewStartTime: payload.newStartTime,
        NewEndTime: payload.newEndTime,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setConfirmDialogOpen(true);
    },
    onError: (error: unknown) => {
      enqueueSnackbar(
        error instanceof Error
          ? error.message
          : "Unable to reschedule appointment",
        { variant: "error" },
      );
    },
  });

  const newDateTime = rescheduleData.startTime
    ? format(new Date(rescheduleData.startTime), "EEEE, MMMM d, yyyy • h:mm a")
    : null;

  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const handleSlotSelect = (slot: AvailableSlot) => {
    const duration =
      differenceInMinutes(new Date(slot.endTime), new Date(slot.startTime)) ||
      rescheduleData.durationMinutes;
    setSelectedSlot(slot);
    setRescheduleData((prev) => ({
      ...prev,
      startTime: slot.startTime,
      durationMinutes: duration,
    }));
    setActiveStep(1);
  };

  const handleRescheduleConfirm = () => {
    if (!rescheduleData.startTime) {
      enqueueSnackbar("Please select a new time slot before confirming.", {
        variant: "warning",
      });
      return;
    }

    // Calculate end time based on duration
    const startDate = new Date(rescheduleData.startTime);
    const endDate = new Date(
      startDate.getTime() + rescheduleData.durationMinutes * 60000,
    );

    rescheduleMutation.mutate({
      newStartTime: startDate.toISOString(),
      newEndTime: endDate.toISOString(),
    });
  };

  if (appointmentLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <SectionLoader minHeight={400} />
      </Container>
    );
  }

  if (!appointment) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Callout variant="error">
          Appointment not found. It may have been cancelled or already
          completed.
        </Callout>
        <Box sx={{ mt: 3 }}>
          <AuraButton onClick={() => navigate("/appointments")}>
            Back to Appointments
          </AuraButton>
        </Box>
      </Container>
    );
  }

  const renderSlotSelectionStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select New Date and Time
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Callout variant="info">
          Current appointment:{" "}
          {format(
            new Date(appointment.scheduledStart),
            "EEEE, MMMM d, yyyy • h:mm a",
          )}
          {" with "}
          {appointment.providerName}
        </Callout>
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <StaticDatePicker
              displayStaticWrapperAs="desktop"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              minDate={new Date()}
              maxDate={addDays(new Date(), 60)}
            />
          </LocalizationProvider>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle1" gutterBottom>
            Available times for{" "}
            {format(selectedDate ?? new Date(), "MMMM d, yyyy")}
          </Typography>
          {slotsLoading ? (
            <SectionLoader minHeight={200} />
          ) : slots.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No slots available for this provider on the selected date. Try
              another day.
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {slots.map((slot) => (
                <Grid size={4} key={slot.startTime}>
                  <AuraButton
                    variant={
                      selectedSlot?.startTime === slot.startTime
                        ? "contained"
                        : "outlined"
                    }
                    fullWidth
                    onClick={() => handleSlotSelect(slot)}
                  >
                    {format(new Date(slot.startTime), "h:mm a")}
                  </AuraButton>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderConfirmationStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirm Reschedule
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Provider
            </Typography>
            <Typography variant="body1">
              {appointment.providerName}
              {appointment.providerSpecialty
                ? ` • ${appointment.providerSpecialty}`
                : ""}
            </Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Original Date & Time
            </Typography>
            <Typography
              variant="body1"
              sx={{ textDecoration: "line-through", color: "text.secondary" }}
            >
              {format(
                new Date(appointment.scheduledStart),
                "EEEE, MMMM d, yyyy • h:mm a",
              )}
            </Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary">
              New Date & Time
            </Typography>
            <Typography variant="body1" color="primary.main" fontWeight={600}>
              {newDateTime}
            </Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="body1">
              {rescheduleData.durationMinutes} minutes
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
          <AuraButton onClick={handleBack}>Back</AuraButton>
          <AuraButton
            variant="contained"
            onClick={handleRescheduleConfirm}
            disabled={rescheduleMutation.isPending}
          >
            {rescheduleMutation.isPending
              ? "Rescheduling..."
              : "Confirm Reschedule"}
          </AuraButton>
        </Box>
      </Paper>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderSlotSelectionStep();
      case 1:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <AuraButton
          onClick={() => navigate("/appointments")}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Appointments
        </AuraButton>
        <Typography variant="h4" gutterBottom>
          Reschedule Appointment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a new date and time for your appointment
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={auraStepper}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>{renderStepContent()}</Box>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => navigate("/appointments")}
      >
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <DialogSection>
            <CheckCircleIcon
              sx={{ fontSize: 60, color: "success.main", mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              Appointment Rescheduled!
            </Typography>
            <Typography color="text.secondary">
              Your appointment has been successfully rescheduled to{" "}
              {newDateTime}.
            </Typography>
          </DialogSection>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
          <AuraButton
            variant="contained"
            onClick={() => navigate("/appointments")}
          >
            View My Appointments
          </AuraButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
