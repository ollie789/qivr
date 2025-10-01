import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Stack,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Add as AddIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Circle as DotIcon,
  Groups as GroupsIcon,
  LocalHospital as HospitalIcon,
  Assignment as TaskIcon,
  Vaccines as VaccineIcon,
  MedicalServices as MedicalIcon,
  Coffee as BreakIcon,
  Warning as WarningIcon,
  EventBusy as BusyIcon,
} from '@mui/icons-material';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from 'date-fns';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
  color: string;
  status: 'available' | 'busy' | 'break' | 'off';
  location?: string;
}

interface TimeSlot {
  id: string;
  providerId: string;
  startTime: string;
  endTime: string;
  type: 'appointment' | 'break' | 'meeting' | 'blocked';
  patientName?: string;
  appointmentType?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

const ProviderSchedule: React.FC = () => {
  const theme = useTheme();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Mock providers data
  const providers: Provider[] = [
    {
      id: '1',
      name: 'Dr. Sarah Smith',
      specialty: 'General Practice',
      color: theme.palette.primary.main,
      status: 'available',
      location: 'Room 101',
    },
    {
      id: '2',
      name: 'Dr. John Williams',
      specialty: 'Cardiology',
      color: theme.palette.error.main,
      status: 'busy',
      location: 'Room 205',
    },
    {
      id: '3',
      name: 'Dr. Emily Brown',
      specialty: 'Pediatrics',
      color: theme.palette.success.main,
      status: 'available',
      location: 'Room 110',
    },
    {
      id: '4',
      name: 'Dr. Michael Davis',
      specialty: 'Orthopedics',
      color: theme.palette.warning.main,
      status: 'break',
      location: 'Room 302',
    },
    {
      id: '5',
      name: 'Dr. Lisa Johnson',
      specialty: 'Dermatology',
      color: theme.palette.info.main,
      status: 'available',
      location: 'Room 115',
    },
  ];

  // Mock schedule data
  const generateScheduleData = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const weekStart = startOfWeek(currentWeek);
    
    providers.forEach(provider => {
      for (let day = 0; day < 5; day++) { // Monday to Friday
        const currentDate = addDays(weekStart, day + 1);
        
        // Morning appointments
        for (let hour = 9; hour < 12; hour++) {
          if (Math.random() > 0.3) {
            slots.push({
              id: `${provider.id}-${day}-${hour}`,
              providerId: provider.id,
              startTime: `${hour}:00`,
              endTime: `${hour}:30`,
              type: 'appointment',
              patientName: `Patient ${Math.floor(Math.random() * 100)}`,
              appointmentType: ['Check-up', 'Follow-up', 'Consultation'][Math.floor(Math.random() * 3)],
              status: ['scheduled', 'confirmed', 'completed'][Math.floor(Math.random() * 3)] as any,
            });
          }
        }
        
        // Lunch break
        if (day !== 2) { // Not on Wednesday
          slots.push({
            id: `${provider.id}-${day}-break`,
            providerId: provider.id,
            startTime: '12:00',
            endTime: '13:00',
            type: 'break',
            status: 'scheduled',
          });
        }
        
        // Afternoon appointments
        for (let hour = 14; hour < 17; hour++) {
          if (Math.random() > 0.4) {
            slots.push({
              id: `${provider.id}-${day}-${hour}-pm`,
              providerId: provider.id,
              startTime: `${hour}:00`,
              endTime: `${hour}:30`,
              type: 'appointment',
              patientName: `Patient ${Math.floor(Math.random() * 100)}`,
              appointmentType: ['Procedure', 'Check-up', 'Vaccination'][Math.floor(Math.random() * 3)],
              status: ['scheduled', 'confirmed'][Math.floor(Math.random() * 2)] as any,
            });
          }
        }
      }
    });
    
    return slots;
  };

  const [scheduleData] = useState<TimeSlot[]>(generateScheduleData());

  const getProviderSchedule = (providerId: string, day: number) => {
    return scheduleData
      .filter(slot => slot.providerId === providerId)
      .filter(slot => {
        // Simple day filtering (would need proper date handling in production)
        const slotDay = parseInt(slot.id.split('-')[1]);
        return slotDay === day;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return theme.palette.success.main;
      case 'busy': return theme.palette.error.main;
      case 'break': return theme.palette.warning.main;
      case 'off': return theme.palette.grey[500];
      default: return theme.palette.grey[400];
    }
  };

  const getSlotColor = (slot: TimeSlot) => {
    if (slot.type === 'break') return theme.palette.grey[300];
    if (slot.type === 'meeting') return theme.palette.info.light;
    if (slot.type === 'blocked') return theme.palette.error.light;
    
    switch (slot.status) {
      case 'confirmed': return theme.palette.success.light;
      case 'completed': return theme.palette.success.main;
      case 'cancelled': return theme.palette.error.light;
      case 'no-show': return theme.palette.warning.light;
      default: return theme.palette.primary.light;
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = ['9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00'];

  const handleSlotClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  const filteredProviders = selectedProvider === 'all' 
    ? providers 
    : providers.filter(p => p.id === selectedProvider);

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Provider Schedule Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage clinic staff schedules and appointments
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                label="Provider"
              >
                <MenuItem value="all">All Providers</MenuItem>
                {providers.map(provider => (
                  <MenuItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="day">Day</ToggleButton>
              <ToggleButton value="week">Week</ToggleButton>
              <ToggleButton value="month">Month</ToggleButton>
            </ToggleButtonGroup>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add Slot
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Provider Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {filteredProviders.map(provider => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={provider.id}>
            <Card
              sx={{
                border: `2px solid ${alpha(provider.color, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        <DotIcon
                          sx={{
                            fontSize: 12,
                            color: getStatusColor(provider.status),
                          }}
                        />
                      }
                    >
                      <Avatar sx={{ bgcolor: alpha(provider.color, 0.1), color: provider.color }}>
                        {provider.name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    </Badge>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {provider.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {provider.specialty}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={provider.status}
                      size="small"
                      sx={{
                        bgcolor: alpha(getStatusColor(provider.status), 0.1),
                        color: getStatusColor(provider.status),
                        fontSize: '0.7rem',
                        height: 20,
                        textTransform: 'capitalize',
                      }}
                    />
                    {provider.location && (
                      <Chip
                        label={provider.location}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                        icon={<LocationIcon sx={{ fontSize: 14 }} />}
                      />
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Week Navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <IconButton onClick={handlePreviousWeek}>
            <PrevIcon />
          </IconButton>
          
          <Typography variant="h6" fontWeight={600}>
            Week of {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d, yyyy')}
          </Typography>
          
          <IconButton onClick={handleNextWeek}>
            <NextIcon />
          </IconButton>
        </Stack>
      </Paper>

      {/* Schedule Grid */}
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <Grid container spacing={1}>
          {/* Time column */}
          <Grid item xs={1}>
            <Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TimeIcon color="action" />
            </Box>
            {timeSlots.map(time => (
              <Box
                key={time}
                sx={{
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {time}
                </Typography>
              </Box>
            ))}
          </Grid>

          {/* Days columns */}
          {weekDays.map((day, dayIndex) => (
            <Grid item xs={2.2} key={day}>
              <Box
                sx={{
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 1,
                }}
              >
                <Stack alignItems="center">
                  <Typography variant="subtitle2" fontWeight={600}>
                    {day}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), dayIndex + 1), 'MMM d')}
                  </Typography>
                </Stack>
              </Box>
              
              {/* Provider schedules for this day */}
              <Box sx={{ position: 'relative' }}>
                {filteredProviders.map((provider, providerIndex) => (
                  <Box
                    key={provider.id}
                    sx={{
                      position: 'relative',
                      width: `${100 / filteredProviders.length}%`,
                      left: `${(100 / filteredProviders.length) * providerIndex}%`,
                      display: 'inline-block',
                    }}
                  >
                    {timeSlots.map((time, timeIndex) => {
                      const daySchedule = getProviderSchedule(provider.id, dayIndex);
                      const slot = daySchedule.find(s => s.startTime === time);
                      
                      return (
                        <Box
                          key={`${provider.id}-${time}`}
                          sx={{
                            height: 80,
                            p: 0.5,
                            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            borderLeft: providerIndex > 0 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                          }}
                        >
                          {slot && (
                            <Card
                              sx={{
                                height: '100%',
                                bgcolor: alpha(getSlotColor(slot), 0.3),
                                borderLeft: `3px solid ${getSlotColor(slot)}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  bgcolor: alpha(getSlotColor(slot), 0.5),
                                  transform: 'scale(1.02)',
                                },
                              }}
                              onClick={() => handleSlotClick(slot)}
                            >
                              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                <Stack spacing={0.5}>
                                  <Typography variant="caption" fontWeight={600} noWrap>
                                    {slot.type === 'break' ? 'Break' :
                                     slot.type === 'meeting' ? 'Meeting' :
                                     slot.patientName}
                                  </Typography>
                                  {slot.appointmentType && (
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {slot.appointmentType}
                                    </Typography>
                                  )}
                                  <Chip
                                    label={slot.status}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: '0.65rem',
                                      '& .MuiChip-label': {
                                        px: 0.5,
                                      },
                                    }}
                                  />
                                </Stack>
                              </CardContent>
                            </Card>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Slot Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSlot ? 'Appointment Details' : 'Add New Slot'}
        </DialogTitle>
        <DialogContent>
          {selectedSlot && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Patient Name"
                value={selectedSlot.patientName || ''}
                fullWidth
                disabled
              />
              <TextField
                label="Appointment Type"
                value={selectedSlot.appointmentType || selectedSlot.type}
                fullWidth
                disabled
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Start Time"
                  value={selectedSlot.startTime}
                  fullWidth
                  disabled
                />
                <TextField
                  label="End Time"
                  value={selectedSlot.endTime}
                  fullWidth
                  disabled
                />
              </Stack>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={selectedSlot.status} label="Status">
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="no-show">No Show</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Notes"
                value={selectedSlot.notes || ''}
                multiline
                rows={3}
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            {selectedSlot ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProviderSchedule;