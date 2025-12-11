import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Avatar,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  Skeleton,
  Stack,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, differenceInMinutes, format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import {
  AvailableProvider,
  AvailableSlot,
  BookAppointmentPayload,
  bookAppointment,
  fetchAvailableProviders,
  fetchAvailableSlots,
} from '../services/appointmentsApi';
import { SectionLoader, auraStepper, AuraButton, AuraCard, auraColors } from '@qivr/design-system';

const steps = ['Select Provider', 'Pick Date & Time', 'Confirm Details'];

interface BookingData {
  providerId?: string;
  startTime?: string;
  durationMinutes: number;
  appointmentType: string;
}

export const BookAppointment: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({
    durationMinutes: 30,
    appointmentType: 'consultation',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const dateParam = useMemo(() => {
    const base = selectedDate ?? new Date();
    return format(base, 'yyyy-MM-dd');
  }, [selectedDate]);

  useEffect(() => {
    setSelectedSlot(null);
    setBookingData((prev) => ({ ...prev, startTime: undefined }));
  }, [dateParam]);

  const { data: providers = [], isLoading: providersLoading } = useQuery<AvailableProvider[]>({
    queryKey: ['availableProviders', dateParam],
    queryFn: () => fetchAvailableProviders(dateParam),
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery<AvailableSlot[]>({
    queryKey: ['availableSlots', bookingData.providerId, dateParam],
    queryFn: () =>
      fetchAvailableSlots(bookingData.providerId!, dateParam, bookingData.durationMinutes),
    enabled: Boolean(bookingData.providerId && selectedDate),
  });

  const bookMutation = useMutation({
    mutationFn: (payload: BookAppointmentPayload) => bookAppointment(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setConfirmDialogOpen(true);
    },
    onError: (error: unknown) => {
      enqueueSnackbar(error instanceof Error ? error.message : 'Unable to book appointment', {
        variant: 'error',
      });
    },
  });

  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === bookingData.providerId),
    [providers, bookingData.providerId]
  );

  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const handleProviderSelect = (providerId: string) => {
    setBookingData((prev) => ({ ...prev, providerId, startTime: undefined }));
    setSelectedSlot(null);
    setActiveStep(1);
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    const duration = differenceInMinutes(new Date(slot.endTime), new Date(slot.startTime)) || 30;
    setSelectedSlot(slot);
    setBookingData((prev) => ({
      ...prev,
      startTime: slot.startTime,
      durationMinutes: duration,
    }));
    setActiveStep(2);
  };

  const handleBookingConfirm = () => {
    if (!bookingData.providerId || !bookingData.startTime) {
      enqueueSnackbar('Please select a provider and time slot before confirming.', {
        variant: 'warning',
      });
      return;
    }

    bookMutation.mutate({
      providerId: bookingData.providerId,
      startTime: bookingData.startTime,
      durationMinutes: bookingData.durationMinutes,
      appointmentType: bookingData.appointmentType,
    });
  };

  const renderProviderStep = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Choose Your Provider
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a healthcare provider for your appointment on{' '}
          <Typography component="span" fontWeight={600} color="primary.main">
            {format(selectedDate ?? new Date(), 'MMMM d, yyyy')}
          </Typography>
        </Typography>
      </Box>

      {providersLoading ? (
        <Stack spacing={2}>
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : providers.length === 0 ? (
        <AuraCard variant="flat" sx={{ p: 4, textAlign: 'center' }}>
          <CalendarIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No providers available on this date
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please select a different date to see available providers.
          </Typography>
        </AuraCard>
      ) : (
        <Grid container spacing={2}>
          {providers.map((provider) => {
            const isSelected = bookingData.providerId === provider.id;
            return (
              <Grid size={{ xs: 12, md: 6 }} key={provider.id}>
                <AuraCard
                  hover
                  onClick={() => handleProviderSelect(provider.id)}
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    height: '100%',
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    bgcolor: isSelected
                      ? alpha(theme.palette.primary.main, 0.04)
                      : 'background.paper',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: isSelected
                          ? 'primary.main'
                          : alpha(theme.palette.primary.main, 0.1),
                        color: isSelected ? 'white' : 'primary.main',
                        fontSize: '1.25rem',
                      }}
                    >
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {provider.name}
                        </Typography>
                        {isSelected && (
                          <CheckCircleIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        )}
                      </Box>
                      {provider.specialty && (
                        <Typography variant="body2" color="text.secondary">
                          {provider.specialty}
                        </Typography>
                      )}
                      {provider.title && (
                        <Chip
                          label={provider.title}
                          size="small"
                          sx={{
                            mt: 1,
                            bgcolor: alpha(auraColors.purple.main, 0.1),
                            color: auraColors.purple.main,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </AuraCard>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );

  const renderSlotSelectionStep = () => (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Pick Date & Time
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select your preferred appointment time with{' '}
          <Typography component="span" fontWeight={600} color="primary.main">
            {selectedProvider?.name}
          </Typography>
        </Typography>
      </Box>

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
          Confirm Your Appointment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review your appointment details before confirming
        </Typography>
      </Box>

      <AuraCard variant="flat" sx={{ p: 0, overflow: 'hidden', maxWidth: 500 }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
          <Typography variant="h6" fontWeight={600}>
            Ready to Book
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
                  {selectedProvider?.name}
                </Typography>
                {selectedProvider?.specialty && (
                  <Typography variant="caption" color="text.secondary">
                    {selectedProvider.specialty}
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Date */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: alpha(auraColors.purple.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarIcon sx={{ color: auraColors.purple.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {bookingData.startTime
                    ? format(new Date(bookingData.startTime), 'EEEE, MMMM d, yyyy')
                    : ''}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Time */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: alpha(auraColors.cyan.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TimeIcon sx={{ color: auraColors.cyan.main }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {bookingData.startTime ? format(new Date(bookingData.startTime), 'h:mm a') : ''}{' '}
                  <Typography component="span" variant="body2" color="text.secondary">
                    ({bookingData.durationMinutes} minutes)
                  </Typography>
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
            onClick={handleBookingConfirm}
            disabled={bookMutation.isPending}
            sx={{ flex: 2 }}
          >
            {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
          </AuraButton>
        </Box>
      </AuraCard>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderProviderStep();
      case 1:
        return renderSlotSelectionStep();
      case 2:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Book an Appointment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedule your next healthcare appointment in just a few steps
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

      {/* Back Button (shown on middle steps) */}
      {activeStep > 0 && activeStep < steps.length - 1 && (
        <Box sx={{ mt: 3 }}>
          <AuraButton onClick={handleBack} startIcon={<ArrowBackIcon />}>
            Back
          </AuraButton>
        </Box>
      )}

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
            Appointment Booked!
          </Typography>
          <Typography sx={{ opacity: 0.9 }}>Your appointment has been confirmed</Typography>
        </Box>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="text.secondary">
            You will receive a confirmation email shortly with all the details.
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
