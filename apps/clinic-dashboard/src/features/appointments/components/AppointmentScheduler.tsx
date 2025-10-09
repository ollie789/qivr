import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
} from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { postWithAuth } from '@qivr/http';

// Type for scheduled appointment result
interface ScheduledAppointment {
  id: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  location?: string;
  videoLink?: string;
}

interface AppointmentSchedulerProps {
  open: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  evaluationId?: string;
  onScheduled?: (appointment: ScheduledAppointment) => void;
}

interface Provider {
  id: string;
  name: string;
  speciality: string;
  avatar?: string;
  nextAvailable?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

const appointmentTypes = [
  { value: 'initial', label: 'Initial Consultation', duration: 60 },
  { value: 'follow-up', label: 'Follow-up', duration: 30 },
  { value: 'assessment', label: 'Assessment', duration: 45 },
  { value: 'treatment', label: 'Treatment Session', duration: 45 },
  { value: 'review', label: 'Review', duration: 30 },
];

const steps = ['Select Provider', 'Choose Date & Time', 'Appointment Details', 'Confirm'];

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  open,
  onClose,
  patientId,
  patientName,
  evaluationId,
  onScheduled,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState('initial');
  const [includeVideo, setIncludeVideo] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data - replace with API calls
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  // Type for proposed appointment slots
  interface ProposedSlot {
    date: string;
    time: string;
    providerId: string;
    providerName: string;
    available: boolean;
  }
  
  const [proposedSlots, setProposedSlots] = useState<ProposedSlot[]>([]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockProviders: Provider[] = [
        {
          id: '1',
          name: 'Dr. Emily Chen',
          speciality: 'Physiotherapist',
          avatar: 'EC',
          nextAvailable: '2024-01-15',
        },
        {
          id: '2',
          name: 'Dr. James Williams',
          speciality: 'Chiropractor',
          avatar: 'JW',
          nextAvailable: '2024-01-16',
        },
        {
          id: '3',
          name: 'Dr. Priya Patel',
          speciality: 'Occupational Therapist',
          avatar: 'PP',
          nextAvailable: '2024-01-15',
        },
      ];
      setProviders(mockProviders);
    } catch (err) {
      setError('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // Will use selectedProvider, selectedDate, and appointmentType when API is implemented
      // const params = new URLSearchParams({
      //   providerId: selectedProvider?.id || '',
      //   startDate: format(selectedDate!, 'yyyy-MM-dd'),
      //   endDate: format(selectedDate!, 'yyyy-MM-dd'),
      //   duration: String(appointmentTypes.find(t => t.value === appointmentType)?.duration || 30),
      // });
      // TODO: Use the response from the availability API
      // const response = await getWithAuth<TimeSlot[]>(`/api/calendar/availability?${params}`);
      // For now, using mock data
      
      // Generate time slots for the day
      const slots: TimeSlot[] = [];
      const startHour = 9;
      const endHour = 17;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push({
            start: time,
            end: `${hour.toString().padStart(2, '0')}:${(minute + 30).toString().padStart(2, '0')}`,
            available: Math.random() > 0.3, // Mock availability
          });
        }
      }
      
      setAvailableSlots(slots);
    } catch (err) {
      setError('Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProviders();
    }
  }, [open]);

  useEffect(() => {
    if (selectedProvider && selectedDate) {
      fetchAvailability();
    }
  }, [selectedProvider, selectedDate, fetchAvailability]);

  const proposeAlternativeTimes = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await postWithAuth<{ proposedSlots: ProposedSlot[] }>('/api/calendar/appointments/propose', {
        providerId: selectedProvider?.id,
        duration: appointmentTypes.find(t => t.value === appointmentType)?.duration,
        preferredDates: [
          format(selectedDate!, 'yyyy-MM-dd'),
          format(addDays(selectedDate!, 1), 'yyyy-MM-dd'),
          format(addDays(selectedDate!, 2), 'yyyy-MM-dd'),
        ],
      });
      
      setProposedSlots(response.proposedSlots);
    } catch (err) {
      setError('Failed to find alternative times');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedProvider) {
      setError('Please select a provider');
      return;
    }
    if (activeStep === 1 && (!selectedDate || !selectedTime)) {
      setError('Please select date and time');
      return;
    }
    
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSchedule = async () => {
    try {
      setLoading(true);
      
      const appointmentData = {
        patientId,
        providerId: selectedProvider?.id,
        startTime: `${format(selectedDate!, 'yyyy-MM-dd')}T${selectedTime}:00`,
        endTime: `${format(selectedDate!, 'yyyy-MM-dd')}T${selectedTime}:00`, // Add duration
        type: appointmentType,
        notes,
        includeVideoCall: includeVideo,
        evaluationId,
      };
      
      // TODO: Replace with actual API call
      const response = await postWithAuth<{ appointment?: ScheduledAppointment }>('/api/calendar/appointments', appointmentData);
      
      onScheduled?.(response.appointment || response as ScheduledAppointment);
      onClose();
    } catch (err) {
      setError('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const renderProviderSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select a Healthcare Provider
      </Typography>
      <Grid container spacing={2}>
        {providers.map((provider) => (
          <Grid item xs={12} md={6} key={provider.id}>
            <Card
              sx={{
                border: selectedProvider?.id === provider.id ? 2 : 0,
                borderColor: 'primary.main',
              }}
            >
              <CardActionArea onClick={() => setSelectedProvider(provider)}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 56, height: 56 }}>
                      {provider.avatar}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6">{provider.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {provider.speciality}
                      </Typography>
                      <Chip
                        size="small"
                        label={`Next available: ${provider.nextAvailable}`}
                        color="primary"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    {selectedProvider?.id === provider.id && (
                      <CheckIcon color="primary" />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderDateTimeSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Date and Time
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={new Date()}
              slotProps={{
                textField: {
                  fullWidth: true
                }
              }}
            />
          </LocalizationProvider>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Appointment Type</InputLabel>
            <Select
              value={appointmentType}
              label="Appointment Type"
              onChange={(e) => setAppointmentType(e.target.value)}
            >
              {appointmentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label} ({type.duration} min)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Available Time Slots
          </Typography>
          <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={1}>
                {availableSlots.map((slot) => (
                  <Grid item xs={4} key={slot.start}>
                    <Button
                      variant={selectedTime === slot.start ? 'contained' : 'outlined'}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.start)}
                      fullWidth
                      size="small"
                    >
                      {slot.start}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            )}
            
            {availableSlots.filter(s => s.available).length === 0 && !loading && (
              <Box textAlign="center" py={2}>
                <Typography color="text.secondary">
                  No available slots for this date
                </Typography>
                <Button
                  variant="text"
                  onClick={proposeAlternativeTimes}
                  sx={{ mt: 1 }}
                >
                  Find alternative times
                </Button>
              </Box>
            )}
          </Paper>
          
          {proposedSlots.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Suggested alternatives:</Typography>
              {proposedSlots.slice(0, 3).map((slot, index) => (
                <Chip
                  key={index}
                  label={`${slot.date} ${slot.time}`}
                  onClick={() => {
                    setSelectedDate(new Date(slot.date));
                    setSelectedTime(slot.time);
                  }}
                  sx={{ mr: 1, mt: 1 }}
                />
              ))}
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const renderAppointmentDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Appointment Details
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes for Provider"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific concerns or information for the provider..."
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>
            Appointment Mode
          </Typography>
          <ToggleButtonGroup
            value={includeVideo ? 'video' : 'in-person'}
            exclusive
            onChange={(_, value) => setIncludeVideo(value === 'video')}
            fullWidth
          >
            <ToggleButton value="in-person">
              <LocationIcon sx={{ mr: 1 }} />
              In-Person
            </ToggleButton>
            <ToggleButton value="video">
              <VideoCallIcon sx={{ mr: 1 }} />
              Video Call
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
      </Grid>
    </Box>
  );

  const renderConfirmation = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirm Appointment
      </Typography>
      
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Patient
            </Typography>
            <Typography variant="body1">{patientName || 'Patient'}</Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Provider
            </Typography>
            <Typography variant="body1">
              {selectedProvider?.name} - {selectedProvider?.speciality}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Date & Time
            </Typography>
            <Typography variant="body1">
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Type
            </Typography>
            <Typography variant="body1">
              {appointmentTypes.find(t => t.value === appointmentType)?.label}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Mode
            </Typography>
            <Typography variant="body1">
              {includeVideo ? 'Video Call' : 'In-Person'}
            </Typography>
          </Grid>
          
          {notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Notes
              </Typography>
              <Typography variant="body1">{notes}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <Alert severity="info" sx={{ mt: 2 }}>
        A confirmation will be sent to the patient{"'s"} email and SMS.
      </Alert>
    </Box>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderProviderSelection();
      case 1:
        return renderDateTimeSelection();
      case 2:
        return renderAppointmentDetails();
      case 3:
        return renderConfirmation();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Schedule Appointment</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {getStepContent(activeStep)}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Box flex={1} />
        {activeStep > 0 && (
          <Button onClick={handleBack} startIcon={<BackIcon />}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<NextIcon />}
            disabled={loading}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSchedule}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            Schedule Appointment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AppointmentScheduler;
