import React, { useState } from 'react';
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
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  VideoCall as VideoCallIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, addDays, setHours, setMinutes, isSameDay, isAfter } from 'date-fns';
import { api } from '../services/api';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  bio?: string;
  photoUrl?: string;
  nextAvailable?: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number;
  description?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingData {
  providerId?: string;
  serviceId?: string;
  date?: Date;
  time?: string;
  isVirtual?: boolean;
  notes?: string;
}

const steps = ['Select Provider', 'Choose Service', 'Pick Date & Time', 'Confirm Details'];

export const BookAppointment: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Fetch providers
  const { data: providers, isLoading: providersLoading } = useQuery<Provider[]>({
    queryKey: ['providers'],
    queryFn: () => api.get('/providers').then(res => res.data),
  });

  // Fetch services
  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['services', bookingData.providerId],
    queryFn: () => api.get(`/services?providerId=${bookingData.providerId}`).then(res => res.data),
    enabled: !!bookingData.providerId,
  });

  // Fetch available time slots
  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery<TimeSlot[]>({
    queryKey: ['timeSlots', bookingData.providerId, selectedDate],
    queryFn: () => {
      const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
      return api.get(`/appointments/availability?providerId=${bookingData.providerId}&date=${dateStr}`).then(res => res.data);
    },
    enabled: !!bookingData.providerId && !!selectedDate,
  });

  // Book appointment mutation
  const bookMutation = useMutation({
    mutationFn: (data: BookingData) => {
      const appointmentData = {
        providerId: data.providerId,
        serviceId: data.serviceId,
        scheduledStart: `${format(data.date!, 'yyyy-MM-dd')}T${data.time}:00`,
        isVirtual: data.isVirtual || false,
        notes: data.notes || '',
      };
      return api.post('/appointments', appointmentData);
    },
    onSuccess: () => {
      setConfirmDialogOpen(true);
    },
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleProviderSelect = (providerId: string) => {
    setBookingData({ ...bookingData, providerId });
    handleNext();
  };

  const handleServiceSelect = (serviceId: string) => {
    setBookingData({ ...bookingData, serviceId });
    handleNext();
  };

  const handleTimeSelect = (time: string) => {
    setBookingData({ ...bookingData, date: selectedDate!, time });
    handleNext();
  };

  const handleBookingConfirm = () => {
    bookMutation.mutate(bookingData);
  };

  const getSelectedProvider = () => providers?.find(p => p.id === bookingData.providerId);
  const getSelectedService = () => services?.find(s => s.id === bookingData.serviceId);

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Your Healthcare Provider
            </Typography>
            {providersLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 2 }} />
              ))
            ) : (
              <Grid container spacing={2}>
                {providers?.map((provider) => (
                  <Grid item xs={12} md={6} key={provider.id}>
                    <Card 
                      sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                      onClick={() => handleProviderSelect(provider.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar sx={{ width: 60, height: 60 }}>
                            {provider.photoUrl ? (
                              <img src={provider.photoUrl} alt={provider.name} />
                            ) : (
                              <PersonIcon />
                            )}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6">{provider.name}</Typography>
                            <Typography color="text.secondary">
                              {provider.specialty}
                            </Typography>
                            {provider.bio && (
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {provider.bio}
                              </Typography>
                            )}
                            {provider.nextAvailable && (
                              <Chip
                                label={`Next available: ${provider.nextAvailable}`}
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

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Appointment Type
            </Typography>
            {servicesLoading ? (
              <CircularProgress />
            ) : (
              <RadioGroup
                value={bookingData.serviceId || ''}
                onChange={(e) => handleServiceSelect(e.target.value)}
              >
                <Grid container spacing={2}>
                  {services?.map((service) => (
                    <Grid item xs={12} key={service.id}>
                      <Paper sx={{ p: 2 }}>
                        <FormControlLabel
                          value={service.id}
                          control={<Radio />}
                          label={
                            <Box>
                              <Typography variant="subtitle1">
                                {service.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Duration: {service.duration} minutes
                                {service.price && ` • $${service.price}`}
                              </Typography>
                              {service.description && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {service.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            )}
            {bookingData.serviceId && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={handleNext}>
                  Continue
                </Button>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Date and Time
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Times for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                </Typography>
                {timeSlotsLoading ? (
                  <CircularProgress />
                ) : (
                  <Grid container spacing={1}>
                    {timeSlots?.map((slot) => (
                      <Grid item xs={4} key={slot.time}>
                        <Button
                          variant={bookingData.time === slot.time ? 'contained' : 'outlined'}
                          disabled={!slot.available}
                          fullWidth
                          onClick={() => handleTimeSelect(slot.time)}
                        >
                          {slot.time}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                )}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Appointment Location
                  </Typography>
                  <RadioGroup
                    value={bookingData.isVirtual ? 'virtual' : 'in-person'}
                    onChange={(e) => setBookingData({ ...bookingData, isVirtual: e.target.value === 'virtual' })}
                  >
                    <FormControlLabel
                      value="in-person"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon /> In-Person Visit
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="virtual"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VideoCallIcon /> Virtual Consultation
                        </Box>
                      }
                    />
                  </RadioGroup>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        const provider = getSelectedProvider();
        const service = getSelectedService();
        
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirm Your Appointment
            </Typography>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Provider
                  </Typography>
                  <Typography variant="body1">
                    {provider?.name} - {provider?.specialty}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Service
                  </Typography>
                  <Typography variant="body1">
                    {service?.name} ({service?.duration} minutes)
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography variant="body1">
                    {bookingData.date && format(bookingData.date, 'EEEE, MMMM d, yyyy')}
                    {' at '}
                    {bookingData.time}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {bookingData.isVirtual ? 'Virtual Consultation' : 'In-Person Visit'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Additional Notes (Optional)"
                    value={bookingData.notes || ''}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={handleBack}>
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleBookingConfirm}
                  disabled={bookMutation.isPending}
                >
                  {bookMutation.isPending ? <CircularProgress size={24} /> : 'Confirm Booking'}
                </Button>
              </Box>
            </Paper>
          </Box>
        );

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

      <Box>
        {renderStepContent(activeStep)}
      </Box>

      {activeStep > 0 && activeStep < 3 && (
        <Box sx={{ mt: 3 }}>
          <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
            Back
          </Button>
        </Box>
      )}

      {/* Success Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => navigate('/appointments')}>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Appointment Booked!
          </Typography>
          <Typography color="text.secondary">
            Your appointment has been successfully scheduled.
            You will receive a confirmation email shortly.
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
