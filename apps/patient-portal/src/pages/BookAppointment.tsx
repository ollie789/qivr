import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Paper,
  Dialog,
  DialogContent,
  DialogActions,
  Skeleton,
} from '@mui/material';
import {
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
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
import { SectionLoader } from '@qivr/design-system';

const steps = ['Select Provider', 'Pick Date & Time', 'Confirm Details'];

interface BookingData {
  providerId?: string;
  startTime?: string;
  durationMinutes: number;
  appointmentType: string;
}

export const BookAppointment: React.FC = () => {
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
    queryFn: () => fetchAvailableSlots(bookingData.providerId!, dateParam, bookingData.durationMinutes),
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
    [providers, bookingData.providerId],
  );

  const appointmentDateTime = bookingData.startTime
    ? format(new Date(bookingData.startTime), 'EEEE, MMMM d, yyyy • h:mm a')
    : null;

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
      enqueueSnackbar('Please select a provider and time slot before confirming.', { variant: 'warning' });
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
      <Typography variant="h6" gutterBottom>
        Choose Your Healthcare Provider
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing providers with availability on {format(selectedDate ?? new Date(), 'MMMM d, yyyy')}
      </Typography>
      {providersLoading ? (
        [...Array(3)].map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={100} sx={{ mb: 2 }} />
        ))
      ) : providers.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">
            No providers have availability for this date. Please try another date.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {providers.map((provider) => (
            <Grid size={{ xs: 12, md: 6 }}key={provider.id}>
              <Card
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                onClick={() => handleProviderSelect(provider.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar sx={{ width: 60, height: 60 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{provider.name}</Typography>
                      {provider.specialty && (
                        <Typography color="text.secondary">{provider.specialty}</Typography>
                      )}
                      {provider.title && (
                        <Chip
                          label={provider.title}
                          size="small"
                          color="primary"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const renderSlotSelectionStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Date and Time
      </Typography>
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
            Available times for {format(selectedDate ?? new Date(), 'MMMM d, yyyy')}
          </Typography>
          {slotsLoading ? (
            <SectionLoader minHeight={200} />
          ) : slots.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No slots available for this provider on the selected date. Try another day.
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {slots.map((slot) => (
                <Grid size={4}key={slot.startTime}>
                  <Button
                    variant={selectedSlot?.startTime === slot.startTime ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleSlotSelect(slot)}
                  >
                    {format(new Date(slot.startTime), 'h:mm a')}
                  </Button>
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
        Confirm Your Appointment
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Provider
            </Typography>
            <Typography variant="body1">
              {selectedProvider?.name}
              {selectedProvider?.specialty ? ` • ${selectedProvider.specialty}` : ''}
            </Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Date & Time
            </Typography>
            <Typography variant="body1">{appointmentDateTime}</Typography>
          </Grid>
          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Duration
            </Typography>
            <Typography variant="body1">{bookingData.durationMinutes} minutes</Typography>
          </Grid>
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleBack}>Back</Button>
          <Button
            variant="contained"
            onClick={handleBookingConfirm}
            disabled={bookMutation.isPending}
          >
            {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </Box>
      </Paper>
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Book an Appointment
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Schedule your next healthcare appointment in just a few steps
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}

      {activeStep > 0 && activeStep < steps.length - 1 && (
        <Box sx={{ mt: 3 }}>
          <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
            Back
          </Button>
        </Box>
      )}

      <Dialog open={confirmDialogOpen} onClose={() => navigate('/appointments')}>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Appointment Booked!
          </Typography>
          <Typography color="text.secondary">
            Your appointment has been successfully scheduled.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button variant="contained" onClick={() => navigate('/appointments')}>
            View My Appointments
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
