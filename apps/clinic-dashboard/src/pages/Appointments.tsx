import React, { useState, useCallback } from 'react';
// MUI Components
import {
  Autocomplete,
  Avatar,
  Box,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '../components/mui';
// Icons
import {
  CalendarMonthIcon,
  ViewWeekIcon,
  ViewDayIcon,
  AddIcon,
  VideoCallIcon,
  LocationOnIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TodayIcon,
  CircleIcon,
  ViewListIcon,
  ViewModuleIcon,
} from '../components/icons';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// Date utilities
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  setHours,
  setMinutes,
  parseISO,
} from '../utils/date';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useAuthGuard } from '../hooks/useAuthGuard';
import apiClient from '../lib/api-client';
import { useAuthStore } from '../stores/authStore';
import { patientApi, type Patient, type PatientListResponse } from '../services/patientApi';
import { providerApi, type Provider } from '../services/providerApi';

interface AppointmentDto {
  id: string;
  patientId: string;
  patientName?: string | null;
  patientEmail?: string | null;
  patientPhone?: string | null;
  providerId: string;
  providerName?: string | null;
  appointmentType: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  location?: string | null;
  notes?: string | null;
}

interface CursorPaginationResponse<T> {
  items: T[];
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
  count: number;
}

const mapAppointmentDto = (dto: AppointmentDto): Appointment => ({
  id: dto.id,
  patientId: dto.patientId,
  patientName: dto.patientName ?? 'Unknown patient',
  patientEmail: dto.patientEmail ?? '',
  patientPhone: dto.patientPhone ?? '',
  providerId: dto.providerId,
  providerName: dto.providerName ?? 'Assigned provider',
  scheduledStart: dto.scheduledStart,
  scheduledEnd: dto.scheduledEnd,
  appointmentType: dto.appointmentType,
  status: (dto.status || '').toLowerCase() as Appointment['status'],
  notes: dto.notes ?? undefined,
  videoLink: undefined,
  location: dto.location ?? undefined,
});
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { AvailabilitySlot, FlexBetween, PageHeader, QivrButton, QivrCard, CalendarGridCell, AppointmentChip, calendar as calendarStyles, StatusBadge } from '@qivr/design-system';

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
  { value: 'initial-consultation', label: 'Initial Consultation', duration: 60, color: 'var(--qivr-palette-primary-main)' },
  { value: 'follow-up', label: 'Follow-up', duration: 30, color: 'var(--qivr-palette-success-main)' },
  { value: 'assessment', label: 'Assessment', duration: 45, color: 'var(--qivr-palette-secondary-main)' },
  { value: 'treatment', label: 'Treatment', duration: 30, color: 'var(--qivr-palette-error-main)' },
  { value: 'review', label: 'Review', duration: 20, color: 'var(--qivr-palette-warning-main)' },
];

const Appointments: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { canMakeApiCalls } = useAuthGuard();
  
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewTab, setViewTab] = useState(0); // 0 = calendar, 1 = list
  const calendarRef = React.useRef<FullCalendar>(null);

  // Form state for new appointment
  const [newAppointment, setNewAppointment] = useState({
    patientId: '',
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
  const [selectedPatientOption, setSelectedPatientOption] = useState<Patient | null>(null);
  const [selectedProviderOption, setSelectedProviderOption] = useState<Provider | null>(null);

  const { user } = useAuthStore();
  const clinicId = user?.clinicId;

  // All hooks must be called before any conditional returns
  const { data: patientsData, isLoading: isPatientsLoading } = useQuery<PatientListResponse>({
    queryKey: ['appointments', 'patients'],
    queryFn: () => patientApi.getPatients({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
    enabled: canMakeApiCalls && Boolean(clinicId),
  });
  const patients = patientsData?.data ?? [];

  const { data: providersData, isLoading: isProvidersLoading } = useQuery<Provider[]>({
    queryKey: ['appointments', 'providers', clinicId],
    queryFn: () => providerApi.getClinicProviders(),
    enabled: canMakeApiCalls && Boolean(clinicId),
    staleTime: 5 * 60 * 1000,
  });
  const providerOptions = providersData ?? [];

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', selectedDate, viewMode, selectedProviderFilter],
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

        const payload = await apiClient.get<CursorPaginationResponse<AppointmentDto> | AppointmentDto[]>(
          '/api/appointments',
          {
            startDate,
            endDate,
            limit: 200,
            sortDescending: false,
            providerId: selectedProviderFilter !== 'all' ? selectedProviderFilter : undefined,
          },
        );

        const items = Array.isArray(payload)
          ? payload
          : payload?.items ?? (payload as any)?.Items ?? [];

        return (items as AppointmentDto[]).map(mapAppointmentDto);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        return [] as Appointment[];
      }
    },
    enabled: canMakeApiCalls && Boolean(clinicId),
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (data: CreateAppointmentData) => {
      if (!data.patientId || !data.providerId) {
        throw new Error('A patient and provider must be selected.');
      }

      const response = await apiClient.post('/api/appointments', {
        patientId: data.patientId,
        providerId: data.providerId,
        appointmentType: data.appointmentType ?? 'consultation',
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        notes: data.notes,
      });

      return response;
    },
    onSuccess: () => {
      enqueueSnackbar('Appointment created successfully', { variant: 'success' });
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setSelectedPatientOption(null);
      setSelectedProviderOption(null);
      setNewAppointment((prev) => ({
        ...prev,
        patientId: '',
        patientName: '',
        patientEmail: '',
        patientPhone: '',
        providerId: '',
        notes: '',
      }));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to create appointment';
      enqueueSnackbar(message, { variant: 'error' });
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
      patientId: newAppointment.patientId,
      providerId: newAppointment.providerId,
      scheduledStart: startDateTime.toISOString(),
      scheduledEnd: endDateTime.toISOString(),
      appointmentType: newAppointment.appointmentType,
      notes: newAppointment.notes,
    });
  }, [newAppointment, createAppointmentMutation]);

  // Don't render if no clinic ID available
  if (!clinicId) {
    return <div>Loading clinic information...</div>;
  }

  // Don't render if no clinic ID available
  if (!clinicId) {
    return <div>Loading clinic information...</div>;
  }

  // Type for appointment creation
  interface CreateAppointmentData {
    patientId: string;
    providerId: string;
    scheduledStart: string;
    scheduledEnd: string;
    appointmentType: string;
    notes?: string;
  }

  const handlePatientSelect = (_: unknown, patient: Patient | null) => {
    setSelectedPatientOption(patient);
    setNewAppointment((prev) => ({
      ...prev,
      patientId: patient?.id ?? '',
      patientName: patient ? `${patient.firstName} ${patient.lastName}`.trim() || patient.email : '',
      patientEmail: patient?.email ?? '',
      patientPhone: patient?.phone ?? '',
    }));
  };

  const handleProviderSelect = (_: unknown, provider: Provider | null) => {
    setSelectedProviderOption(provider);
    setNewAppointment((prev) => ({
      ...prev,
      providerId: provider?.id ?? '',
    }));
  };

  const getAppointmentColor = (type: string) => {
    const appointmentType = appointmentTypes.find(t => t.value === type);
    return appointmentType?.color || 'var(--qivr-palette-primary-main)';
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
      <QivrCard elevated sx={{ p: 2, height: 600, overflowY: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {hours.map((hour) => {
          const hourAppointments = dayAppointments.filter((apt: Appointment) => 
            parseISO(apt.scheduledStart).getHours() === hour
          );
          
          return (
            <FlexBetween key={hour} sx={{ alignItems: 'flex-start', mb: 2 }}>
              <Typography sx={calendarStyles.timeLabel}>
                {format(setHours(new Date(), hour), 'h:mm a')}
              </Typography>
              <Box sx={{ flex: 1 }}>
                {hourAppointments.length > 0 ? (
                  hourAppointments.map((apt: Appointment) => (
                    <QivrCard 
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
                        <FlexBetween>
                          <Box>
                            <Typography variant="subtitle2">
                              {apt.patientName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {appointmentTypes.find(t => t.value === apt.appointmentType)?.label} • {apt.providerName}
                            </Typography>
                          </Box>
                          <StatusBadge status={apt.status} />
                        </FlexBetween>
                      </CardContent>
                    </QivrCard>
                  ))
                ) : (
                  <AvailabilitySlot
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
                  </AvailabilitySlot>
                )}
              </Box>
            </FlexBetween>
          );
        })}
      </QivrCard>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);

    return (
      <QivrCard elevated sx={{ p: 2, overflowX: 'auto' }}>
        <Grid container spacing={1}>
          <Grid size={1}>
            <Box sx={{ height: 40 }} />
            {hours.map((hour) => (
              <FlexBetween key={hour} sx={{ height: 60, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {format(setHours(new Date(), hour), 'ha')}
                </Typography>
              </FlexBetween>
            ))}
          </Grid>
          {days.map((day) => (
            <Grid key={day.toISOString()} size="grow">
              <Box 
                sx={{
                  ...(calendarStyles.dayHeader as any),
                  ...(isToday(day) && { bgcolor: 'primary.light' }),
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
                  <CalendarGridCell
                    key={hour}
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
                      <AppointmentChip
                        key={apt.id}
                        color={getAppointmentColor(apt.appointmentType)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(apt);
                        }}
                      >
                        {apt.patientName.split(' ')[0]}
                      </AppointmentChip>
                    ))}
                  </CalendarGridCell>
                );
              })}
            </Grid>
          ))}
        </Grid>
      </QivrCard>
    );
  };

  const renderMonthView = () => {
    return (
      <QivrCard elevated sx={{ p: 2 }}>
        <DateCalendar
          value={selectedDate}
          onChange={(newDate) => newDate && setSelectedDate(newDate)}
          sx={{ width: '100%', height: 500 }}
          slots={{
            day: (props: { day: Date; outsideCurrentMonth?: boolean }) => {
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
                    <FlexBetween sx={{ gap: 0.25, mt: 0.5 }}>
                      {dayAppointments.slice(0, 3).map((apt, idx) => (
                        <CircleIcon
                          key={idx}
                          sx={{ 
                            fontSize: 6, 
                            color: getAppointmentColor(apt.appointmentType)
                          }}
                        />
                      ))}
                    </FlexBetween>
                  )}
                </Box>
              );
            },
          }}
        />
      </QivrCard>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <PageHeader
          title="Appointments"
          description="Manage clinic appointments and schedules"
          actions={
            <QivrButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              New Appointment
            </QivrButton>
          }
        />

        {/* Controls */}
        <QivrCard sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Provider</InputLabel>
                  <Select
                    value={selectedProviderFilter}
                    label="Provider"
                    onChange={(e) => setSelectedProviderFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Providers</MenuItem>
                    {providerOptions.map((provider) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        {provider.fullName || provider.email || 'Provider'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FlexBetween sx={{ justifyContent: 'center', gap: 1 }}>
                  <IconButton onClick={() => navigateDate('prev')}>
                    <ChevronLeftIcon />
                  </IconButton>
                  <QivrButton
                    startIcon={<TodayIcon />}
                    onClick={() => setSelectedDate(new Date())}
                    emphasize="subtle"
                  >
                    Today
                  </QivrButton>
                  <Typography sx={{ mx: 2, minWidth: 200, textAlign: 'center' }}>
                    {viewMode === 'day' && format(selectedDate, 'MMMM d, yyyy')}
                    {viewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM d')}`}
                    {viewMode === 'month' && format(selectedDate, 'MMMM yyyy')}
                  </Typography>
                  <IconButton onClick={() => navigateDate('next')}>
                    <ChevronRightIcon />
                  </IconButton>
                </FlexBetween>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FlexBetween sx={{ justifyContent: 'flex-end' }}>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_e, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                >
                  <ToggleButton value="day">
                    <ViewDayIcon />
                  </ToggleButton>
                  <ToggleButton value="week">
                    <ViewWeekIcon />
                  </ToggleButton>
                  <ToggleButton value="month">
                    <CalendarMonthIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
                </FlexBetween>
              </Grid>
            </Grid>
          </CardContent>
        </QivrCard>

        {/* View Tabs */}
        <QivrCard sx={{ mb: 3 }}>
          <Tabs value={viewTab} onChange={(_e, v) => setViewTab(v)}>
            <Tab icon={<CalendarMonthIcon />} label="Calendar View" />
            <Tab icon={<ViewModuleIcon />} label="Grid View" />
            <Tab icon={<ViewListIcon />} label="List View" />
          </Tabs>
        </QivrCard>

        {/* Main Content */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: viewTab === 0 ? 12 : 9 }}>
            {isLoading ? (
              <QivrCard elevated sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading appointments...</Typography>
              </QivrCard>
            ) : (
              <>
                {viewTab === 0 ? (
                  // FullCalendar View
                  <QivrCard elevated>
                    <CardContent sx={{ height: 700 }}>
                      <FullCalendar
                        ref={calendarRef}
                        plugins={[
                          dayGridPlugin,
                          timeGridPlugin,
                          interactionPlugin,
                          listPlugin
                        ]}
                        initialView={viewMode === 'day' ? 'timeGridDay' : viewMode === 'week' ? 'timeGridWeek' : 'dayGridMonth'}
                        headerToolbar={{
                          left: 'prev,next today',
                          center: 'title',
                          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                        }}
                        events={appointments.map((apt: Appointment) => ({
                          id: apt.id,
                          title: apt.patientName,
                          start: apt.scheduledStart,
                          end: apt.scheduledEnd,
                          backgroundColor: getAppointmentColor(apt.appointmentType),
                          borderColor: getAppointmentColor(apt.appointmentType),
                          extendedProps: {
                            ...apt
                          }
                        }))}
                        eventClick={(info) => {
                          setSelectedAppointment(info.event.extendedProps as Appointment);
                        }}
                        dateClick={(info) => {
                          const clickedDate = info.date;
                          setNewAppointment({
                            ...newAppointment,
                            date: clickedDate,
                            startTime: clickedDate,
                            endTime: new Date(clickedDate.getTime() + 30 * 60000),
                          });
                          setCreateDialogOpen(true);
                        }}
                        slotMinTime="08:00:00"
                        slotMaxTime="20:00:00"
                        slotDuration="00:30:00"
                        height="100%"
                        businessHours={{
                          daysOfWeek: [1, 2, 3, 4, 5, 6],
                          startTime: '08:00',
                          endTime: '18:00',
                        }}
                        eventTimeFormat={{
                          hour: '2-digit',
                          minute: '2-digit',
                          meridiem: 'short'
                        }}
                        dayMaxEvents={true}
                        weekends={true}
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        select={(info) => {
                          setNewAppointment({
                            ...newAppointment,
                            date: info.start,
                            startTime: info.start,
                            endTime: info.end,
                          });
                          setCreateDialogOpen(true);
                        }}
                        eventDrop={async (info) => {
                          try {
                            // Update appointment time via API
                            await apiClient.put(`/api/appointments/${info.event.id}`, {
                              scheduledStart: info.event.start?.toISOString(),
                              scheduledEnd: info.event.end?.toISOString(),
                            });
                            enqueueSnackbar('Appointment rescheduled', { variant: 'success' });
                          } catch (error) {
                            info.revert();
                            enqueueSnackbar('Failed to reschedule appointment', { variant: 'error' });
                          }
                        }}
                        eventResize={async (info) => {
                          try {
                            await apiClient.put(`/api/appointments/${info.event.id}`, {
                              scheduledEnd: info.event.end?.toISOString(),
                            });
                            enqueueSnackbar('Appointment duration updated', { variant: 'success' });
                          } catch (error) {
                            info.revert();
                            enqueueSnackbar('Failed to update appointment', { variant: 'error' });
                          }
                        }}
                      />
                    </CardContent>
                  </QivrCard>
                ) : viewTab === 1 ? (
                // Grid View
                <>
                    {viewMode === 'day' && renderDayView()}
                    {viewMode === 'week' && renderWeekView()}
                    {viewMode === 'month' && renderMonthView()}
                  </>
                ) : (
                  // List View
                  <QivrCard elevated>
                    <CardContent>
                      <List>
                        {appointments
                          .sort((a: Appointment, b: Appointment) => 
                            new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()
                          )
                          .map((apt: Appointment) => (
                            <React.Fragment key={apt.id}>
                              <ListItem
                                onClick={() => setSelectedAppointment(apt)}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': { bgcolor: 'action.hover' }
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: getAppointmentColor(apt.appointmentType) }}>
                                    {apt.patientName.charAt(0)}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <FlexBetween sx={{ gap: 1 }}>
                                      <Typography>{apt.patientName}</Typography>
                                      <StatusBadge status={apt.status} />
                                    </FlexBetween>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2">
                                        {format(parseISO(apt.scheduledStart), 'MMM d, yyyy • h:mm a')} - 
                                        {format(parseISO(apt.scheduledEnd), 'h:mm a')}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {appointmentTypes.find(t => t.value === apt.appointmentType)?.label} • 
                                        {apt.providerName}
                                      </Typography>
                                      {apt.notes && (
                                        <Typography variant="caption" color="text.secondary">
                                          {apt.notes}
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                />
                                <FlexBetween sx={{ gap: 1 }}>
                                  {apt.videoLink && (
                                    <Tooltip title="Video Call">
                                      <IconButton size="small">
                                        <VideoCallIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {apt.location && (
                                    <Tooltip title={apt.location}>
                                      <IconButton size="small">
                                        <LocationOnIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </FlexBetween>
                              </ListItem>
                              <Divider variant="inset" component="li" />
                            </React.Fragment>
                          ))}
                      </List>
                    </CardContent>
                  </QivrCard>
                )}
              </>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            {/* Today's Summary */}
            <QivrCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Today{"'"}s Summary
                </Typography>
                <Stack spacing={1}>
                  <FlexBetween>
                    <Typography variant="body2" color="text.secondary">Total</Typography>
                    <Typography variant="body2">
                      {appointments.filter((a: Appointment) => isToday(parseISO(a.scheduledStart))).length}
                    </Typography>
                  </FlexBetween>
                  <FlexBetween>
                    <Typography variant="body2" color="text.secondary">Confirmed</Typography>
                    <Typography variant="body2">
                      {appointments.filter((a: Appointment) => 
                        isToday(parseISO(a.scheduledStart)) && a.status === 'confirmed'
                      ).length}
                    </Typography>
                  </FlexBetween>
                  <FlexBetween>
                    <Typography variant="body2" color="text.secondary">Pending</Typography>
                    <Typography variant="body2">
                      {appointments.filter((a: Appointment) => 
                        isToday(parseISO(a.scheduledStart)) && a.status === 'scheduled'
                      ).length}
                    </Typography>
                  </FlexBetween>
                </Stack>
              </CardContent>
            </QivrCard>

            {/* Upcoming Appointments */}
            <QivrCard sx={{ mt: 2 }}>
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
            </QivrCard>
          </Grid>
        </Grid>

        {/* Create Appointment Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={12}>
                <Autocomplete
                  options={patients}
                  value={selectedPatientOption}
                  onChange={handlePatientSelect}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName}`.trim() || option.email || 'Patient'}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={isPatientsLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Patient"
                      placeholder="Search patients"
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Patient Name"
                  value={newAppointment.patientName}
                  onChange={(e) => setNewAppointment({ ...newAppointment, patientName: e.target.value })}
                  placeholder="Patient name"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={newAppointment.patientEmail}
                  onChange={(e) => setNewAppointment({ ...newAppointment, patientEmail: e.target.value })}
                  placeholder="email@example.com"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={newAppointment.patientPhone}
                  onChange={(e) => setNewAppointment({ ...newAppointment, patientPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </Grid>
              <Grid size={12}>
                <Autocomplete
                  options={providerOptions}
                  value={selectedProviderOption}
                  onChange={handleProviderSelect}
                  getOptionLabel={(option) => option.fullName || option.email || 'Provider'}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={isProvidersLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Provider"
                      placeholder="Select provider"
                    />
                  )}
                />
              </Grid>
              <Grid size={12}>
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
              <Grid size={12}>
                <DatePicker
                  label="Date"
                  value={newAppointment.date}
                  onChange={(newValue) => newValue && setNewAppointment({ ...newAppointment, date: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <TimePicker
                  label="End Time"
                  value={newAppointment.endTime}
                  onChange={(newValue) => newValue && setNewAppointment({ ...newAppointment, endTime: newValue })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={12}>
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
            <QivrButton emphasize="subtle" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </QivrButton>
            <QivrButton
              variant="contained"
              onClick={handleCreateAppointment}
              disabled={!newAppointment.patientId || !newAppointment.providerId || createAppointmentMutation.isPending}
            >
              {createAppointmentMutation.isPending ? 'Creating…' : 'Create Appointment'}
            </QivrButton>
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
                  <StatusBadge status={selectedAppointment.status} />
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <QivrButton emphasize="subtle" onClick={() => setSelectedAppointment(null)}>
                Close
              </QivrButton>
              <QivrButton variant="outlined" color="error" emphasize="subtle">
                Cancel Appointment
              </QivrButton>
              <QivrButton variant="contained">
                Edit
              </QivrButton>
            </DialogActions>
          </Dialog>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Appointments;
