// Production Component - Appointment Scheduler with Enhanced Medical UI Styling
import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Avatar,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
  AlertTitle,
  Tooltip,
  Badge,
  alpha,
  useTheme,
  Fade,
  Zoom,
  Collapse,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  LocalHospital as HospitalIcon,
  MedicalServices as MedicalIcon,
  VideoCall as VideoIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Today as TodayIcon,
  EventAvailable as AvailableIcon,
  EventBusy as BusyIcon,
  Repeat as RepeatIcon,
  NotificationsActive as ReminderIcon,
  Description as NotesIcon,
  AttachMoney as PaymentIcon,
  HealthAndSafety as InsuranceIcon,
  Star as StarIcon,
  FavoriteBorder as HeartIcon,
  Psychology as MentalHealthIcon,
  Healing as TreatmentIcon,
  Science as LabIcon,
  Vaccines as VaccineIcon,
  MonitorHeart as CheckupIcon,
  RemoveRedEye as EyeIcon,
  CleanHands as DermatologyIcon,
} from '@mui/icons-material';
import { format, addDays, startOfWeek, isSameDay, setHours, setMinutes, addMinutes, isAfter, isBefore, parseISO } from 'date-fns';
import { customStyles } from '../../theme/theme';

// Types
interface Provider {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  rating: number;
  nextAvailable: Date;
  consultationFee: number;
  acceptsInsurance: boolean;
}

interface TimeSlot {
  id: string;
  time: Date;
  available: boolean;
  type: 'in-person' | 'video' | 'phone';
}

interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  description: string;
  icon: React.ReactNode;
  color: string;
  price?: number;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  date: Date;
  time: Date;
  duration: number;
  type: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  videoLink?: string;
}

const AppointmentScheduler: React.FC = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedType, setSelectedType] = useState<AppointmentType | null>(null);
  const [appointmentMode, setAppointmentMode] = useState<'in-person' | 'video' | 'phone'>('in-person');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [sendReminder, setSendReminder] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Mock data
  const providers: Provider[] = [
    {
      id: '1',
      name: 'Dr. Emily Williams',
      specialty: 'Primary Care',
      rating: 4.8,
      nextAvailable: new Date(),
      consultationFee: 150,
      acceptsInsurance: true,
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Cardiology',
      rating: 4.9,
      nextAvailable: addDays(new Date(), 1),
      consultationFee: 250,
      acceptsInsurance: true,
    },
    {
      id: '3',
      name: 'Dr. Sarah Johnson',
      specialty: 'Dermatology',
      rating: 4.7,
      nextAvailable: addDays(new Date(), 2),
      consultationFee: 200,
      acceptsInsurance: false,
    },
  ];

  const appointmentTypes: AppointmentType[] = [
    {
      id: '1',
      name: 'General Consultation',
      duration: 30,
      description: 'Regular check-up and consultation',
      icon: <MedicalIcon />,
      color: theme.palette.primary.main,
      price: 150,
    },
    {
      id: '2',
      name: 'Follow-up Visit',
      duration: 15,
      description: 'Follow-up on previous treatment',
      icon: <CheckupIcon />,
      color: theme.palette.info.main,
      price: 100,
    },
    {
      id: '3',
      name: 'Specialist Consultation',
      duration: 45,
      description: 'Detailed specialist examination',
      icon: <TreatmentIcon />,
      color: theme.palette.secondary.main,
      price: 250,
    },
    {
      id: '4',
      name: 'Vaccination',
      duration: 15,
      description: 'Immunization and vaccination services',
      icon: <VaccineIcon />,
      color: theme.palette.success.main,
      price: 80,
    },
    {
      id: '5',
      name: 'Lab Test Review',
      duration: 20,
      description: 'Review and discuss lab results',
      icon: <LabIcon />,
      color: theme.palette.warning.main,
      price: 120,
    },
    {
      id: '6',
      name: 'Mental Health',
      duration: 60,
      description: 'Mental health counseling session',
      icon: <MentalHealthIcon />,
      color: theme.palette.error.main,
      price: 200,
    },
  ];

  const upcomingAppointments: Appointment[] = [
    {
      id: '1',
      patientId: 'p1',
      patientName: 'John Doe',
      providerId: '1',
      providerName: 'Dr. Emily Williams',
      date: addDays(new Date(), 3),
      time: setHours(setMinutes(new Date(), 30), 10),
      duration: 30,
      type: 'General Consultation',
      status: 'confirmed',
      location: 'Room 203',
    },
    {
      id: '2',
      patientId: 'p2',
      patientName: 'Jane Smith',
      providerId: '2',
      providerName: 'Dr. Michael Chen',
      date: addDays(new Date(), 7),
      time: setHours(setMinutes(new Date(), 0), 14),
      duration: 45,
      type: 'Specialist Consultation',
      status: 'scheduled',
      videoLink: 'https://meet.qivr.health/abc123',
    },
  ];

  // Generate time slots
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startTime = setHours(setMinutes(new Date(), 0), 9);
    const endTime = setHours(setMinutes(new Date(), 0), 17);
    let currentTime = startTime;

    while (isBefore(currentTime, endTime)) {
      slots.push({
        id: currentTime.toISOString(),
        time: currentTime,
        available: Math.random() > 0.3,
        type: appointmentMode,
      });
      currentTime = addMinutes(currentTime, 30);
    }

    return slots;
  };

  const timeSlots = useMemo(() => generateTimeSlots(), [selectedDate, appointmentMode]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleConfirmAppointment = () => {
    setShowConfirmDialog(true);
  };

  const handleBookAppointment = () => {
    // Handle appointment booking
    console.log('Booking appointment:', {
      date: selectedDate,
      time: selectedTime,
      provider: selectedProvider,
      type: selectedType,
      mode: appointmentMode,
      notes,
    });
    setShowConfirmDialog(false);
    // Reset form
    setActiveStep(0);
    setSelectedTime(null);
    setNotes('');
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Select Appointment Type
            </Typography>
            <Grid container spacing={2}>
              {appointmentTypes.map((type) => (
                <Grid item xs={12} sm={6} md={4} key={type.id}>
                  <Zoom in timeout={200}>
                    <Card
                      onClick={() => setSelectedType(type)}
                      sx={{
                        cursor: 'pointer',
                        ...customStyles.glassmorphism,
                        border: `2px solid ${
                          selectedType?.id === type.id 
                            ? type.color 
                            : alpha(theme.palette.divider, 0.1)
                        }`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                          borderColor: type.color,
                        },
                      }}
                    >
                      <CardContent>
                        <Stack spacing={2} alignItems="center" textAlign="center">
                          <Avatar
                            sx={{
                              width: 60,
                              height: 60,
                              bgcolor: alpha(type.color, 0.1),
                              color: type.color,
                            }}
                          >
                            {type.icon}
                          </Avatar>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {type.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {type.description}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Chip
                              icon={<TimeIcon />}
                              label={`${type.duration} min`}
                              size="small"
                            />
                            <Chip
                              icon={<PaymentIcon />}
                              label={`$${type.price}`}
                              size="small"
                              color="primary"
                            />
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Choose Your Provider
            </Typography>
            <Grid container spacing={2}>
              {providers.map((provider) => (
                <Grid item xs={12} key={provider.id}>
                  <Card
                    onClick={() => setSelectedProvider(provider)}
                    sx={{
                      cursor: 'pointer',
                      ...customStyles.glassmorphism,
                      border: `2px solid ${
                        selectedProvider?.id === provider.id 
                          ? theme.palette.primary.main 
                          : alpha(theme.palette.divider, 0.1)
                      }`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Avatar
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontSize: '1.5rem',
                          }}
                        >
                          {provider.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6" fontWeight={600}>
                            {provider.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {provider.specialty}
                          </Typography>
                          <Stack direction="row" spacing={2} mt={1}>
                            <Chip
                              icon={<StarIcon />}
                              label={provider.rating}
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.dark,
                              }}
                            />
                            <Chip
                              icon={<CalendarIcon />}
                              label={`Next: ${format(provider.nextAvailable, 'MMM d')}`}
                              size="small"
                            />
                            {provider.acceptsInsurance && (
                              <Chip
                                icon={<InsuranceIcon />}
                                label="Insurance"
                                size="small"
                                color="success"
                              />
                            )}
                          </Stack>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h5" fontWeight={600} color="primary">
                            ${provider.consultationFee}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            per consultation
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Select Date & Time
            </Typography>
            
            {/* Appointment Mode Selection */}
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Appointment Mode
              </Typography>
              <ToggleButtonGroup
                value={appointmentMode}
                exclusive
                onChange={(e, mode) => mode && setAppointmentMode(mode)}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="in-person">
                  <LocationIcon sx={{ mr: 1 }} />
                  In-Person
                </ToggleButton>
                <ToggleButton value="video">
                  <VideoIcon sx={{ mr: 1 }} />
                  Video Call
                </ToggleButton>
                <ToggleButton value="phone">
                  <PhoneIcon sx={{ mr: 1 }} />
                  Phone Call
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Grid container spacing={3}>
              {/* Date Picker */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    ...customStyles.glassmorphism,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <StaticDatePicker
                      displayStaticWrapperAs="desktop"
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      minDate={new Date()}
                      maxDate={addDays(new Date(), 60)}
                    />
                  </LocalizationProvider>
                </Paper>
              </Grid>

              {/* Time Slots */}
              <Grid item xs={12} md={6}>
                <Paper
                  sx={{
                    p: 2,
                    height: '100%',
                    maxHeight: 400,
                    overflow: 'auto',
                    ...customStyles.glassmorphism,
                    ...customStyles.scrollbar,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>
                    Available Time Slots
                  </Typography>
                  <Grid container spacing={1}>
                    {timeSlots.map((slot) => (
                      <Grid item xs={6} key={slot.id}>
                        <Button
                          fullWidth
                          variant={selectedTime?.id === slot.id ? "contained" : "outlined"}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot)}
                          sx={{
                            py: 1.5,
                            borderRadius: 2,
                            position: 'relative',
                            '&:disabled': {
                              bgcolor: alpha(theme.palette.action.disabled, 0.05),
                            },
                          }}
                        >
                          {format(slot.time, 'h:mm a')}
                          {!slot.available && (
                            <Chip
                              label="Booked"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                height: 18,
                                fontSize: '0.65rem',
                                bgcolor: theme.palette.error.main,
                                color: 'white',
                              }}
                            />
                          )}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" fontWeight={600} mb={3}>
              Additional Information
            </Typography>
            
            <Stack spacing={3}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Reason for Visit / Notes"
                placeholder="Please describe your symptoms or reason for visit..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendReminder}
                    onChange={(e) => setSendReminder(e.target.checked)}
                  />
                }
                label="Send me appointment reminders via SMS and Email"
              />

              <Alert severity="info">
                <AlertTitle>Insurance Information</AlertTitle>
                We'll verify your insurance coverage before the appointment. 
                Please bring your insurance card to the visit.
              </Alert>

              {/* Appointment Summary */}
              <Paper
                sx={{
                  p: 3,
                  ...customStyles.glassmorphism,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
                }}
              >
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Appointment Summary
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Type:</Typography>
                    <Typography fontWeight={500}>{selectedType?.name}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Provider:</Typography>
                    <Typography fontWeight={500}>{selectedProvider?.name}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Date:</Typography>
                    <Typography fontWeight={500}>
                      {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Time:</Typography>
                    <Typography fontWeight={500}>
                      {selectedTime && format(selectedTime.time, 'h:mm a')}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Mode:</Typography>
                    <Chip
                      icon={
                        appointmentMode === 'video' ? <VideoIcon /> :
                        appointmentMode === 'phone' ? <PhoneIcon /> :
                        <LocationIcon />
                      }
                      label={appointmentMode}
                      size="small"
                    />
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6">Total Cost:</Typography>
                    <Typography variant="h6" color="primary" fontWeight={600}>
                      ${selectedType?.price || 0}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  const steps = ['Appointment Type', 'Choose Provider', 'Date & Time', 'Confirmation'];

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight={600}>
              Schedule Appointment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Book your next appointment with our healthcare providers
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<CalendarIcon />}
              onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            >
              View {viewMode === 'calendar' ? 'List' : 'Calendar'}
            </Button>
            <Button
              variant="contained"
              startIcon={<EventIcon />}
            >
              My Appointments
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Appointment Wizard */}
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              p: 3,
              ...customStyles.glassmorphism,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 4, mb: 2 }}>
              {getStepContent(activeStep)}
            </Box>

            <Stack direction="row" justifyContent="space-between" mt={4}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<PrevIcon />}
              >
                Back
              </Button>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleConfirmAppointment}
                  startIcon={<CheckIcon />}
                  disabled={!selectedType || !selectedProvider || !selectedDate || !selectedTime}
                >
                  Confirm Appointment
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<NextIcon />}
                  disabled={
                    (activeStep === 0 && !selectedType) ||
                    (activeStep === 1 && !selectedProvider) ||
                    (activeStep === 2 && (!selectedDate || !selectedTime))
                  }
                >
                  Next
                </Button>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Upcoming Appointments */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{
              p: 3,
              ...customStyles.glassmorphism,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={2}>
              Your Upcoming Appointments
            </Typography>
            
            <List>
              {upcomingAppointments.map((appointment, index) => (
                <React.Fragment key={appointment.id}>
                  {index > 0 && <Divider sx={{ my: 1 }} />}
                  <ListItem
                    sx={{
                      px: 0,
                      py: 2,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      >
                        <CalendarIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={600}>
                          {appointment.type}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.5} mt={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            <PersonIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {appointment.providerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {format(appointment.date, 'MMM d, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <TimeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {format(appointment.time, 'h:mm a')}
                          </Typography>
                          {appointment.location && (
                            <Typography variant="caption" color="text.secondary">
                              <LocationIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {appointment.location}
                            </Typography>
                          )}
                          {appointment.videoLink && (
                            <Typography variant="caption" color="text.secondary">
                              <VideoIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              Video Consultation
                            </Typography>
                          )}
                        </Stack>
                      }
                    />
                    <Chip
                      label={appointment.status}
                      size="small"
                      color={
                        appointment.status === 'confirmed' ? 'success' :
                        appointment.status === 'scheduled' ? 'primary' :
                        appointment.status === 'cancelled' ? 'error' :
                        'default'
                      }
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2, borderRadius: 2 }}
            >
              View All Appointments
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: theme.palette.success.main,
              }}
            >
              <CheckIcon />
            </Avatar>
            <Typography variant="h6">Confirm Your Appointment</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Your appointment is ready to be booked!
          </Alert>
          
          <Stack spacing={2}>
            <Typography variant="body1">
              Please review the details below and confirm your appointment.
            </Typography>
            
            <Paper
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.grey[100], 0.5),
              }}
            >
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  {selectedType?.name} with {selectedProvider?.name}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {selectedTime && format(selectedTime.time, 'h:mm a')}
                </Typography>
                <Divider />
                <Typography variant="h6" color="primary">
                  Total: ${selectedType?.price || 0}
                </Typography>
              </Stack>
            </Paper>
            
            <Typography variant="caption" color="text.secondary">
              You will receive a confirmation email and SMS with appointment details.
              You can cancel or reschedule up to 24 hours before the appointment.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleBookAppointment}
            startIcon={<CheckIcon />}
          >
            Book Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Export as both named and default
export { AppointmentScheduler };
export default AppointmentScheduler;