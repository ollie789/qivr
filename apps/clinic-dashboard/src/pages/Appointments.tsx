import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  ViewWeek as WeekIcon,
  ViewDay as DayIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  VideoCall as VideoIcon,
  LocationOn as LocationIcon,
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  Circle,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isToday, addWeeks, subWeeks, addMonths, subMonths, setHours, setMinutes, parseISO, isSameMonth } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('clinic-auth-storage');
  if (authStorage) {
    const { state } = JSON.parse(authStorage);
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  providerId: string;
  providerName: string;
  scheduledStart: string;
  scheduledEnd: string;
  appointmentType: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  videoLink?: string;
  location?: string;
}

const appointmentTypes = [
  { value: 'initial-consultation', label: 'Initial Consultation', duration: 60, color: '#1976d2' },
  { value: 'follow-up', label: 'Follow-up', duration: 30, color: '#388e3c' },
  { value: 'assessment', label: 'Assessment', duration: 45, color: '#7b1fa2' },
  { value: 'treatment', label: 'Treatment', duration: 30, color: '#d32f2f' },
  { value: 'review', label: 'Review', duration: 20, color: '#f57c00' },
];

const providers = [
  { id: '1', name: 'Dr. Sarah Smith', specialty: 'Physiotherapy' },
  { id: '2', name: 'Dr. John Brown', specialty: 'Chiropractic' },
  { id: '3', name: 'Dr. Emily Chen', specialty: 'Massage Therapy' },
];

const Appointments: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Form state for new appointment
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    providerId: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    appointmentType: 'initial-consultation',
    notes: '',
  });

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', selectedDate, viewMode, selectedProvider],
    queryFn: async () => {
      try {
        // Calculate date range based on view mode
        let startDate, endDate;
        if (viewMode === 'day') {
          startDate = format(selectedDate, 'yyyy-MM-dd');
          endDate = format(selectedDate, 'yyyy-MM-dd');
        } else if (viewMode === 'week') {
          startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
          endDate = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
        } else {
          startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
          endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
        }

        const response = await apiClient.get('/api/appointments', {
          params: {
            startDate,
            endDate,
            providerId: selectedProvider !== 'all' ? selectedProvider : undefined,
          },
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching appointments:', error);
        // Return mock data for development
        return [
          {
            id: '1',
            patientId: '1',
            patientName: 'John Doe',
            patientEmail: 'john.doe@email.com',
            patientPhone: '+61 400 123 456',
            providerId: '1',
            providerName: 'Dr. Sarah Smith',
            scheduledStart: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 9, 0).toISOString(),
            scheduledEnd: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 10, 0).toISOString(),
            appointmentType: 'initial-consultation',
            status: 'confirmed',
            notes: 'First visit for lower back pain',
            location: 'Room 1',
          },
          {
            id: '2',
            patientId: '2',
            patientName: 'Jane Smith',
            patientEmail: 'jane.smith@email.com',
            patientPhone: '+61 400 234 567',
            providerId: '1',
            providerName: 'Dr. Sarah Smith',
            scheduledStart: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 10, 30).toISOString(),
            scheduledEnd: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 11, 0).toISOString(),
            appointmentType: 'follow-up',
            status: 'scheduled',
            notes: 'Follow-up for neck pain treatment',
            location: 'Room 1',
          },
        ];
      }
    },
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/api/appointments', data);
      return response.data;
    },
    onSuccess: () => {
      enqueueSnackbar('Appointment created successfully', { variant: 'success' });
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: () => {
      enqueueSnackbar('Failed to create appointment', { variant: 'error' });
    },
  });

  const handleCreateAppointment = useCallback(() => {
    const startDateTime = new Date(newAppointment.date);
    startDateTime.setHours(newAppointment.startTime.getHours());
    startDateTime.setMinutes(newAppointment.startTime.getMinutes());
    
    const endDateTime = new Date(newAppointment.date);
    endDateTime.setHours(newAppointment.endTime.getHours());
    endDateTime.setMinutes(newAppointment.endTime.getMinutes());

    createAppointmentMutation.mutate({
      patientName: newAppointment.patientName,
      patientEmail: newAppointment.patientEmail,
      patientPhone: newAppointment.patientPhone,
      providerId: newAppointment.providerId,
      scheduledStart: startDateTime.toISOString(),
      scheduledEnd: endDateTime.toISOString(),
      appointmentType: newAppointment.appointmentType,
      notes: newAppointment.notes,
      status: 'scheduled',
    });
  }, [newAppointment, createAppointmentMutation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'cancelled': return 'error';
      case 'completed': return 'primary';
      case 'in-progress': return 'warning';
      case 'no-show': return 'error';
      default: return 'default';
    }
  };

  const getAppointmentColor = (type: string) => {
    const appointmentType = appointmentTypes.find(t => t.value === type);
    return appointmentType?.color || '#1976d2';
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setSelectedDate(direction === 'next' ? addDays(selectedDate, 1) : addDays(selectedDate, -1));
    } else if (viewMode === 'week') {
      setSelectedDate(direction === 'next' ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
    } else {
      setSelectedDate(direction === 'next' ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1));
    }
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
    const dayAppointments = appointments.filter((apt: Appointment) => 
      isSameDay(parseISO(apt.scheduledStart), selectedDate)
    );

    return (
      <Paper sx={{ p: 2, height: 600, overflowY: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {hours.map((hour) => {
          const hourAppointments = dayAppointments.filter((apt: Appointment) => 
            parseISO(apt.scheduledStart).getHours() === hour
          );
          
          return (
            <Box key={hour} sx={{ display: 'flex', mb: 2 }}>
              <Typography sx={{ width: 80, flexShrink: 0, color: 'text.secondary' }}>
                {format(setHours(new Date(), hour), 'h:mm a')}
              </Typography>
              <Box sx={{ flex: 1 }}>
                {hourAppointments.length > 0 ? (
                  hourAppointments.map((apt: Appointment) => (
                    <Card 
                      key={apt.id} 
                      sx={{ 
                        mb: 1, 
                        borderLeft: 4, 
                        borderColor: getAppointmentColor(apt.appointmentType),
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 2 }
                      }}
                      onClick={() => setSelectedAppointment(apt)}
                    >
                      <CardContent sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2">
                              {apt.patientName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appointmentTypes.find(t => t.value === apt.appointmentType)?.label} • {apt.providerName}
                            </Typography>
                          </Box>
                          <Chip 
                            label={apt.status} 
                            size="small" 
                            color={getStatusColor(apt.status) as any}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Box 
                    sx={{ 
                      height: 60, 
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setHours(hour, 0, 0, 0);
                      setNewAppointment({
                        ...newAppointment,
                        date: selectedDate,
                        startTime: newDate,
                        endTime: setMinutes(setHours(newDate, hour), 30),
                      });
                      setCreateDialogOpen(true);
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Paper>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);

    return (
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <Grid container spacing={1}>
          <Grid item xs={1}>
            <Box sx={{ height: 40 }} />
            {hours.map((hour) => (
              <Box key={hour} sx={{ height: 60, display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {format(setHours(new Date(), hour), 'ha')}
                </Typography>
              </Box>
            ))}
          </Grid>
          {days.map((day) => (
            <Grid item key={day.toISOString()} xs>
              <Box 
                sx={{ 
                  height: 40, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: isToday(day) ? 'primary.light' : 'transparent',
                  borderRadius: 1,
                  p: 0.5,
                }}
              >
                <Typography variant="caption">{format(day, 'EEE')}</Typography>
                <Typography variant="subtitle2">{format(day, 'd')}</Typography>
              </Box>
              {hours.map((hour) => {
                const hourAppointments = appointments.filter((apt: Appointment) => 
                  isSameDay(parseISO(apt.scheduledStart), day) && 
                  parseISO(apt.scheduledStart).getHours() === hour
                );
                
                return (
                  <Box 
                    key={hour} 
                    sx={{ 
                      height: 60, 
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 0.5,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => {
                      const newDate = new Date(day);
                      newDate.setHours(hour, 0, 0, 0);
                      setNewAppointment({
                        ...newAppointment,
                        date: day,
                        startTime: newDate,
                        endTime: setMinutes(setHours(newDate, hour), 30),
                      });
                      setCreateDialogOpen(true);
                    }}
                  >
                    {hourAppointments.map((apt: Appointment) => (
                      <Box
                        key={apt.id}
                        sx={{
                          bgcolor: getAppointmentColor(apt.appointmentType),
                          color: 'white',
                          borderRadius: 0.5,
                          p: 0.25,
                          mb: 0.25,
                          fontSize: '10px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(apt);
                        }}
                      >
                        {apt.patientName.split(' ')[0]}
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  const renderMonthView = () => {
    return (
      <Paper sx={{ p: 2 }}>
        <DateCalendar
          value={selectedDate}
          onChange={(newDate) => newDate && setSelectedDate(newDate)}
          sx={{ width: '100%', height: 500 }}
          slots={{
            day: (props: any) => {
              const dayAppointments = appointments.filter((apt: Appointment) => 
                isSameDay(parseISO(apt.scheduledStart), props.day)
              );
              const isSelected = isSameDay(props.day, selectedDate);
              
              return (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'primary.light' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => {
                    setSelectedDate(props.day);
                    setViewMode('day');
                  }}
                >
                  <Typography>{format(props.day, 'd')}</Typography>
                  {dayAppointments.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.25, mt: 0.5 }}>
                      {dayAppointments.slice(0, 3).map((apt, idx) => (
                        <Circle
                          key={idx}
                          sx={{ 
                            fontSize: 6, 
                            color: getAppointmentColor(apt.appointmentType)
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            },
          }}
        />
      </Paper>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Appointments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage clinic appointments and schedules
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              New Appointment
            </Button>
          </Grid>
        </Grid>

        {/* Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={selectedProvider}
                    label="Provider"
                    onChange={(e) => setSelectedProvider(e.target.value)}
                  >
                    <MenuItem value="all">All Providers</MenuItem>
                    {providers.map((provider) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
                <IconButton onClick={() => navigateDate('prev')}>
                  <ChevronLeft />
                </IconButton>
                <Button
                  startIcon={<TodayIcon />}
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Typography sx={{ mx: 2, minWidth: 200, textAlign: 'center' }}>
                  {viewMode === 'day' && format(selectedDate, 'MMMM d, yyyy')}
                  {viewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM d')}`}
                  {viewMode === 'month' && format(selectedDate, 'MMMM yyyy')}
                </Typography>
                <IconButton onClick={() => navigateDate('next')}>
                  <ChevronRight />
                </IconButton>
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="day">
                    <DayIcon />
                  </ToggleButton>
                  <ToggleButton value="week">
                    <WeekIcon />
                  </ToggleButton>
                  <ToggleButton value="month">
                    <CalendarIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={9}>
            {isLoading ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading appointments...</Typography>
              </Paper>
            ) : (
              <>
                {viewMode === 'day' && renderDayView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}
              </>
            )}
          </Grid>
          <Grid item xs={12} md={3}>
            {/* Today's Summary */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Today's Summary
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Total</Typography>
                    <Typography variant="body2">
                      {appointments.filter((a: Appointment) => isToday(parseISO(a.scheduledStart))).length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Confirmed</Typography>
                    <Typography variant="body2">
                      {appointments.filter((a: Appointment) => 
                        isToday(parseISO(a.scheduledStart)) && a.status === 'confirmed'
                      ).length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Pending</Typography>
                    <Typography variant="body2">
                      {appointments.filter((a: Appointment) => 
                        isToday(parseISO(a.scheduledStart)) && a.status === 'scheduled'
                      ).length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Upcoming Today
                </Typography>
                <List dense>
                  {appointments
                    .filter((apt: Appointment) => 
                      isToday(parseISO(apt.scheduledStart)) &&
                      parseISO(apt.scheduledStart) > new Date()
                    )
                    .slice(0, 3)
                    .map((apt: Appointment) => (
                      <ListItem key={apt.id}>
                        <ListItemAvatar>
                          <Avatar>{apt.patientName.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={apt.patientName}
                          secondary={`${format(parseISO(apt.scheduledStart), 'h:mm a')} - ${appointmentTypes.find(t => t.value === apt.appointmentType)?.label}`}
                        />
                      </ListItem>
                    ))}
                  {appointments.filter((apt: Appointment) => 
                    isToday(parseISO(apt.scheduledStart)) &&
                    parseISO(apt.scheduledStart) > new Date()
                  ).length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      No upcoming appointments today
                    </Typography>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Create Appointment Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Patient Name"
                  value={newAppointment.patientName}
                  onChange={(e) => setNewAppointment({ ...newAppointment, patientName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newAppointment.patientEmail}
                  onChange={(e) => setNewAppointment({ ...newAppointment, patientEmail: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={newAppointment.patientPhone}
                  onChange={(e) => setNewAppointment({ ...newAppointment, patientPhone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={newAppointment.providerId}
                    label="Provider"
                    onChange={(e) => setNewAppointment({ ...newAppointment, providerId: e.target.value })}
                    required
                  >
                    {providers.map((provider) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        {provider.name} - {provider.specialty}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Appointment Type</InputLabel>
                  <Select
                    value={newAppointment.appointmentType}
                    label="Appointment Type"
                    onChange={(e) => {
                      const type = e.target.value;
                      const appointmentType = appointmentTypes.find(t => t.value === type);
                      if (appointmentType) {
                        const endTime = new Date(newAppointment.startTime);
                        endTime.setMinutes(endTime.getMinutes() + appointmentType.duration);
                        setNewAppointment({ 
                          ...newAppointment, 
                          appointmentType: type,
                          endTime
                        });
                      }
                    }}
                  >
                    {appointmentTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label} ({type.duration} min)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="Date"
                  value={newAppointment.date}
                  onChange={(newValue) => newValue && setNewAppointment({ ...newAppointment, date: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="Start Time"
                  value={newAppointment.startTime}
                  onChange={(newValue) => {
                    if (newValue) {
                      const appointmentType = appointmentTypes.find(t => t.value === newAppointment.appointmentType);
                      const endTime = new Date(newValue);
                      endTime.setMinutes(endTime.getMinutes() + (appointmentType?.duration || 30));
                      setNewAppointment({ ...newAppointment, startTime: newValue, endTime });
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TimePicker
                  label="End Time"
                  value={newAppointment.endTime}
                  onChange={(newValue) => newValue && setNewAppointment({ ...newAppointment, endTime: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleCreateAppointment}
              disabled={!newAppointment.patientName || !newAppointment.providerId}
            >
              Create Appointment
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Appointment Dialog */}
        {selectedAppointment && (
          <Dialog open={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Patient</Typography>
                  <Typography>{selectedAppointment.patientName}</Typography>
                  <Typography variant="body2">{selectedAppointment.patientEmail}</Typography>
                  <Typography variant="body2">{selectedAppointment.patientPhone}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Appointment</Typography>
                  <Typography>
                    {format(parseISO(selectedAppointment.scheduledStart), 'MMMM d, yyyy')}
                  </Typography>
                  <Typography>
                    {format(parseISO(selectedAppointment.scheduledStart), 'h:mm a')} - 
                    {format(parseISO(selectedAppointment.scheduledEnd), 'h:mm a')}
                  </Typography>
                  <Typography variant="body2">
                    {appointmentTypes.find(t => t.value === selectedAppointment.appointmentType)?.label}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Provider</Typography>
                  <Typography>{selectedAppointment.providerName}</Typography>
                </Box>
                {selectedAppointment.notes && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                      <Typography>{selectedAppointment.notes}</Typography>
                    </Box>
                  </>
                )}
                <Box>
                  <Chip 
                    label={selectedAppointment.status} 
                    color={getStatusColor(selectedAppointment.status) as any}
                  />
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAppointment(null)}>Close</Button>
              <Button variant="outlined" color="error">
                Cancel Appointment
              </Button>
              <Button variant="contained">
                Edit
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Appointments;
