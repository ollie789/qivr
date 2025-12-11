import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Dialog,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  SwapHoriz as SwapIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, differenceInMinutes, format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams } from 'react-router-dom';
import { AvailableSlot, fetchAvailableSlots, fetchAppointments } from '../services/appointmentsApi';
import { api } from '../services/api';
import {
  SectionLoader,
  auraStepper,
  AuraButton,
  Callout,
  AuraCard,
  auraColors,
} from '@qivr/design-system';

const steps = ['Pick New Date & Time', 'Confirm Reschedule'];

interface RescheduleData {
  startTime?: string;
  durationMinutes: number;
}

export const RescheduleAppointment: React.FC = () => {
  const theme = useTheme();
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
    queryKey: ['appointments', { upcoming: true }],
    queryFn: () => fetchAppointments({ upcoming: true }),
  });

  const appointment = useMemo(() => appointments.find((apt) => apt.id === id), [appointments, id]);

  const dateParam = useMemo(() => {
    const base = selectedDate ?? new Date();
    return format(base, 'yyyy-MM-dd');
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

  const { data: slots = [], isLoading: slotsLoading } = useQuery<AvailableSlot[]>({
    queryKey: ['availableSlots', appointment?.providerId, dateParam],
    queryFn: () =>
      fetchAvailableSlots(appointment!.providerId, dateParam, rescheduleData.durationMinutes),
    enabled: Boolean(appointment?.providerId && selectedDate),
  });

  const rescheduleMutation = useMutation({
    mutationFn: async (payload: { newStartTime: string; newEndTime: string }) => {
      await api.post(`/api/appointments/${id}/reschedule`, {
        NewStartTime: payload.newStartTime,
        NewEndTime: payload.newEndTime,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setConfirmDialogOpen(true);
    },
    onError: (error: unknown) => {
      enqueueSnackbar(error instanceof Error ? error.message : 'Unable to reschedule appointment', {
        variant: 'error',
      });
    },
  });

  const newDateTime = rescheduleData.startTime
    ? format(new Date(rescheduleData.startTime), 'EEEE, MMMM d, yyyy • h:mm a')
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
      enqueueSnackbar('Please select a new time slot before confirming.', {
        variant: 'warning',
      });
      return;
    }

    // Calculate end time based on duration
    const startDate = new Date(rescheduleData.startTime);
    const endDate = new Date(startDate.getTime() + rescheduleData.durationMinutes * 60000);

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
          Appointment not found. It may have been cancelled or already completed.
        </Callout>
        <Box sx={{ mt: 3 }}>
          <AuraButton onClick={() => navigate('/appointments')}>Back to Appointments</AuraButton>
        </Box>
      </Container>
    );
  }

  const renderSlotSelectionStep = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Select New Date & Time
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a new time for your appointment with{' '}
          <Typography component="span" fontWeight={600} color="primary.main">
            {appointment.providerName}
          </Typography>
        </Typography>
      </Box>

      {/* Current Appointment Info */}
      <AuraCard
        variant="flat"
        sx={{
          p: 2,
          mb: 3,
          bgcolor: alpha(theme.palette.warning.main, 0.08),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarIcon sx={{ color: 'warning.main' }} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Current appointment
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {format(new Date(appointment.scheduledStart), 'EEEE, MMMM d, yyyy • h:mm a')}
            </Typography>
          </Box>
        </Box>
      </AuraCard>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AuraCard variant="flat" sx={{ p: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <StaticDatePicker
                displayStaticWrapperAs="desktop"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                minDate={new Date()}
                maxDate={addDays(new Date(), 60)}
                sx={{
                  '& .MuiPickersDay-root.Mui-selected': {
                    bgcolor: 'primary.main',
                  },
                }}
              />
            </LocalizationProvider>
          </AuraCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <AuraCard variant="flat" sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TimeIcon sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Available Times
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {format(selectedDate ?? new Date(), 'EEEE, MMMM d, yyyy')}
            </Typography>

            {slotsLoading ? (
              <SectionLoader minHeight={200} />
            ) : slots.length === 0 ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  bgcolor: alpha(theme.palette.action.hover, 0.3),
                  borderRadius: 2,
                }}
              >
                <TimeIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No available times for this date.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Please try another day.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={1}>
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.startTime === slot.startTime;
                  return (
                    <Grid size={4} key={slot.startTime}>
                      <AuraButton
                        variant={isSelected ? 'contained' : 'outlined'}
                        fullWidth
                        onClick={() => handleSlotSelect(slot)}
                        sx={{
                          py: 1.5,
                          fontWeight: isSelected ? 600 : 400,
                          borderColor: isSelected
                            ? 'primary.main'
                            : alpha(theme.palette.divider, 0.8),
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        {format(new Date(slot.startTime), 'h:mm a')}
                      </AuraButton>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </AuraCard>
        </Grid>
      </Grid>
    </Box>
  );

  const renderConfirmationStep = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Confirm Reschedule
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review the changes to your appointment
        </Typography>
      </Box>

      <AuraCard variant="flat" sx={{ p: 0, overflow: 'hidden', maxWidth: 500 }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${auraColors.purple.main} 0%, ${auraColors.purple.dark || auraColors.purple.main} 100%)`,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <SwapIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
          <Typography variant="h6" fontWeight={600}>
            Reschedule Appointment
          </Typography>
        </Box>

        {/* Details */}
        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Provider */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PersonIcon sx={{ color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Provider
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {appointment.providerName}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Original Time (crossed out) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarIcon sx={{ color: 'error.main' }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Original Time
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: 'line-through',
                    color: 'text.secondary',
                  }}
                >
                  {format(new Date(appointment.scheduledStart), 'EEEE, MMMM d • h:mm a')}
                </Typography>
              </Box>
            </Box>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: alpha(auraColors.green.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SwapIcon
                  sx={{
                    fontSize: 18,
                    color: auraColors.green.main,
                    transform: 'rotate(90deg)',
                  }}
                />
              </Box>
            </Box>

            {/* New Time */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: alpha(auraColors.green.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarIcon sx={{ color: auraColors.green.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  New Time
                </Typography>
                <Typography variant="body1" fontWeight={600} color={auraColors.green.main}>
                  {newDateTime}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Actions */}
        <Box
          sx={{
            p: 3,
            pt: 0,
            display: 'flex',
            gap: 2,
          }}
        >
          <AuraButton onClick={handleBack} sx={{ flex: 1 }}>
            Back
          </AuraButton>
          <AuraButton
            variant="contained"
            onClick={handleRescheduleConfirm}
            disabled={rescheduleMutation.isPending}
            sx={{ flex: 2 }}
          >
            {rescheduleMutation.isPending ? 'Rescheduling...' : 'Confirm Reschedule'}
          </AuraButton>
        </Box>
      </AuraCard>
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
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <AuraButton
          onClick={() => navigate('/appointments')}
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Appointments
        </AuraButton>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Reschedule Appointment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a new date and time for your appointment
        </Typography>
      </Box>

      {/* Stepper */}
      <AuraCard variant="flat" sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} sx={auraStepper}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </AuraCard>

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>{renderStepContent()}</Box>

      {/* Success Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => navigate('/appointments')}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            maxWidth: 400,
          },
        }}
      >
        <Box
          sx={{
            p: 4,
            background: `linear-gradient(135deg, ${auraColors.green.main} 0%, ${auraColors.green.dark || auraColors.green.main} 100%)`,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Rescheduled!
          </Typography>
          <Typography sx={{ opacity: 0.9 }}>Your appointment has been updated</Typography>
        </Box>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            New appointment time:
          </Typography>
          <Typography variant="body1" fontWeight={600} color="primary.main">
            {newDateTime}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
          <AuraButton
            variant="contained"
            fullWidth
            onClick={() => navigate('/appointments')}
            sx={{ py: 1.5 }}
          >
            View My Appointments
          </AuraButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
