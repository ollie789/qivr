import { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  Typography,
  Box,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Autocomplete,
  Stack,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  LocalHospital as ServiceIcon,
} from '@mui/icons-material';
import { patientApi, type Patient } from '../../services/patientApi';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { enAU } from 'date-fns/locale';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  StepperDialog,
  FormSection,
  FormRow,
  TimeSlotPicker,
  Callout,
  AuraCard,
  auraColors,
} from '@qivr/design-system';
import { appointmentsApi } from '../../services/appointmentsApi';
import api from '../../lib/api-client';

export interface ScheduleAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  onScheduled?: () => void;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  patientId?: string;
  intakeId?: string;
  treatmentPlanId?: string;
  appointmentType?: string;
  initialDate?: Date;
  prefilledData?: {
    chiefComplaint?: string;
    urgency?: string;
    preferredProvider?: string;
  };
}

interface Provider {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  availableSlotCount: number;
  isAvailable: boolean;
}

interface AvailableSlot {
  id: string;
  start: string;
  end: string;
  providerId: string;
  providerProfileId: string;
  providerName: string;
}

interface ServiceType {
  id: string;
  name: string;
  description?: string;
  specialty?: string;
  durationMinutes: number;
  price: number;
  billingCode?: string;
  isActive: boolean;
}

// Fallback types if no service types configured
const defaultAppointmentTypes: ServiceType[] = [
  {
    id: 'initial',
    name: 'Initial Consultation',
    durationMinutes: 60,
    price: 0,
    isActive: true,
  },
  {
    id: 'followup',
    name: 'Follow-up',
    durationMinutes: 30,
    price: 0,
    isActive: true,
  },
  {
    id: 'treatment',
    name: 'Treatment Session',
    durationMinutes: 45,
    price: 0,
    isActive: true,
  },
];

export const ScheduleAppointmentDialog: React.FC<ScheduleAppointmentDialogProps> = ({
  open,
  onClose,
  onScheduled,
  patient,
  patientId,
  intakeId,
  treatmentPlanId,
  appointmentType: defaultAppointmentType,
  initialDate,
  prefilledData,
}) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [appointmentData, setAppointmentData] = useState({
    patientId: patient?.id || patientId || '',
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
    patientEmail: patient?.email || '',
    patientPhone: patient?.phone || '',
    providerId: prefilledData?.preferredProvider || '',
    providerProfileId: '',
    providerName: '',
    appointmentType: defaultAppointmentType || (intakeId ? 'initial' : 'followup'),
    serviceTypeId: null as string | null,
    serviceTypePrice: 0,
    date: initialDate || (null as Date | null),
    timeSlot: null as string | null,
    selectedSlot: null as AvailableSlot | null,
    duration: 60,
    notes: prefilledData?.chiefComplaint || '',
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setPatientSearchQuery('');
      setSelectedPatient(null);
      setAppointmentData({
        patientId: patient?.id || patientId || '',
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
        patientEmail: patient?.email || '',
        patientPhone: patient?.phone || '',
        providerId: prefilledData?.preferredProvider || '',
        providerProfileId: '',
        providerName: '',
        appointmentType: defaultAppointmentType || (intakeId ? 'initial' : 'followup'),
        serviceTypeId: null,
        serviceTypePrice: 0,
        date: initialDate || null,
        timeSlot: null,
        selectedSlot: null,
        duration: 60,
        notes: prefilledData?.chiefComplaint || '',
      });
    }
  }, [open, patient, patientId, prefilledData, defaultAppointmentType, intakeId, initialDate]);

  // Patient search state
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Fetch patients for search
  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients-search', patientSearchQuery],
    queryFn: async () => {
      const response = await patientApi.getPatients({
        search: patientSearchQuery || undefined,
        limit: 20,
      });
      return response;
    },
    enabled: open && !patient && patientSearchQuery.length >= 2,
  });

  const patients = patientsData?.data || [];

  // Fetch providers from the API
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ['available-providers'],
    queryFn: async () => {
      const response = await api.get('/api/provider-schedule/providers');
      return response as Provider[];
    },
    enabled: open,
  });

  // Fetch service types for appointment pricing
  const { data: serviceTypesData = [] } = useQuery({
    queryKey: ['service-types'],
    queryFn: async () => {
      const response = await api.get('/api/servicetypes');
      return response as ServiceType[];
    },
    enabled: open,
  });

  // Use service types or fallback to defaults
  const appointmentTypes =
    serviceTypesData.length > 0
      ? serviceTypesData.filter((st) => st.isActive)
      : defaultAppointmentTypes;

  // Fetch available slots when provider and date are selected
  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: [
      'available-slots',
      appointmentData.providerProfileId,
      appointmentData.date?.toISOString(),
      appointmentData.duration,
    ],
    queryFn: async () => {
      if (!appointmentData.providerProfileId || !appointmentData.date) {
        return [];
      }
      const dateStr = appointmentData.date.toISOString().split('T')[0];
      const response = await api.get(
        `/api/provider-schedule/${appointmentData.providerProfileId}/available-slots`,
        {
          date: dateStr,
          durationMinutes: appointmentData.duration,
        }
      );
      return response as Array<{
        start: string;
        end: string;
        isAvailable: boolean;
      }>;
    },
    enabled: open && !!appointmentData.providerProfileId && !!appointmentData.date,
  });

  // Convert slots to time strings for the TimeSlotPicker
  const timeSlots = useMemo(() => {
    return availableSlots.map((slot) => {
      const date = new Date(slot.start);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    });
  }, [availableSlots]);

  const steps = patient
    ? ['Select Provider', 'Choose Date & Time', 'Confirm']
    : ['Patient Info', 'Select Provider', 'Date & Time', 'Confirm'];

  const createAppointmentMutation = useMutation({
    mutationFn: (data: {
      patientId: string;
      providerId: string;
      scheduledStart: string;
      scheduledEnd: string;
      appointmentType: string;
      serviceTypeId?: string;
      reasonForVisit?: string;
      notes?: string;
      treatmentPlanId?: string;
    }) => appointmentsApi.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      enqueueSnackbar('Appointment scheduled successfully!', {
        variant: 'success',
      });
      if (intakeId) {
        enqueueSnackbar('Intake status updated', { variant: 'info' });
      }
      onClose();
      onScheduled?.();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to schedule appointment';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const handleSchedule = async () => {
    if (!appointmentData.date || !appointmentData.timeSlot || !appointmentData.duration) return;

    // Find the selected slot to get exact start/end times
    const selectedSlotData = availableSlots.find((slot) => {
      const slotTime = new Date(slot.start).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return slotTime === appointmentData.timeSlot;
    });

    if (selectedSlotData) {
      createAppointmentMutation.mutate({
        patientId: appointmentData.patientId,
        providerId: appointmentData.providerId,
        scheduledStart: selectedSlotData.start,
        scheduledEnd: selectedSlotData.end,
        appointmentType: appointmentData.appointmentType,
        serviceTypeId: appointmentData.serviceTypeId || undefined,
        reasonForVisit: prefilledData?.chiefComplaint,
        notes: appointmentData.notes,
        treatmentPlanId,
      });
    } else {
      // Fallback: calculate times manually
      const timeParts = appointmentData.timeSlot.split(':');
      const hours = parseInt(timeParts[0] || '0', 10);
      const minutes = parseInt(timeParts[1] || '0', 10);

      const scheduledStart = new Date(appointmentData.date);
      scheduledStart.setHours(hours, minutes, 0, 0);

      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + appointmentData.duration);

      createAppointmentMutation.mutate({
        patientId: appointmentData.patientId,
        providerId: appointmentData.providerId,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
        appointmentType: appointmentData.appointmentType,
        serviceTypeId: appointmentData.serviceTypeId || undefined,
        reasonForVisit: prefilledData?.chiefComplaint,
        notes: appointmentData.notes,
        treatmentPlanId,
      });
    }
  };

  const isStepValid = () => {
    const idx = patient ? activeStep : activeStep;
    if (!patient && idx === 0) return appointmentData.patientId; // Require a selected patient with ID
    if ((patient && idx === 0) || (!patient && idx === 1)) return appointmentData.providerId;
    if ((patient && idx === 1) || (!patient && idx === 2))
      return appointmentData.date && appointmentData.timeSlot;
    return true;
  };

  const renderStep = () => {
    const idx = patient ? activeStep : activeStep;

    // Patient Info Step
    if (!patient && idx === 0) {
      return (
        <FormSection title="Select Patient" description="Search for an existing patient">
          {intakeId && (
            <Callout variant="info">Creating appointment from intake submission</Callout>
          )}
          <FormRow>
            <Autocomplete
              fullWidth
              options={patients}
              loading={patientsLoading}
              value={selectedPatient}
              onChange={(_, newValue) => {
                setSelectedPatient(newValue);
                if (newValue) {
                  setAppointmentData({
                    ...appointmentData,
                    patientId: newValue.id,
                    patientName: `${newValue.firstName} ${newValue.lastName}`,
                    patientEmail: newValue.email || '',
                    patientPhone: newValue.phone || '',
                  });
                } else {
                  setAppointmentData({
                    ...appointmentData,
                    patientId: '',
                    patientName: '',
                    patientEmail: '',
                    patientPhone: '',
                  });
                }
              }}
              onInputChange={(_, newInputValue) => {
                setPatientSearchQuery(newInputValue);
              }}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body1">
                      {option.firstName} {option.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Patient"
                  placeholder="Type at least 2 characters to search..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {patientsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              noOptionsText={
                patientSearchQuery.length < 2
                  ? 'Type at least 2 characters to search'
                  : 'No patients found'
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </FormRow>
          {selectedPatient && (
            <>
              <FormRow>
                <TextField fullWidth label="Email" value={appointmentData.patientEmail} disabled />
              </FormRow>
              <FormRow>
                <TextField fullWidth label="Phone" value={appointmentData.patientPhone} disabled />
              </FormRow>
            </>
          )}
        </FormSection>
      );
    }

    // Provider Step
    if ((patient && idx === 0) || (!patient && idx === 1)) {
      return (
        <FormSection title="Select Provider" description="Choose a provider for the appointment">
          {providersLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : providers.length === 0 ? (
            <Alert severity="warning">
              No providers available. Please configure provider schedules in Settings.
            </Alert>
          ) : (
            <Stack spacing={1.5}>
              {providers.map((provider) => {
                const isSelected = appointmentData.providerProfileId === provider.id;
                return (
                  <AuraCard
                    key={provider.id}
                    hover
                    onClick={() =>
                      setAppointmentData({
                        ...appointmentData,
                        providerId: provider.userId,
                        providerProfileId: provider.id,
                        providerName: provider.name,
                        timeSlot: null,
                      })
                    }
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: isSelected ? 'primary.main' : 'transparent',
                      bgcolor: isSelected
                        ? alpha(theme.palette.primary.main, 0.04)
                        : 'background.paper',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: isSelected
                            ? 'primary.main'
                            : alpha(theme.palette.primary.main, 0.1),
                          color: isSelected ? 'white' : 'primary.main',
                        }}
                      >
                        <PersonIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {provider.name}
                          </Typography>
                          {isSelected && <CheckIcon sx={{ fontSize: 18, color: 'primary.main' }} />}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {provider.specialization}
                        </Typography>
                      </Box>
                      {provider.isAvailable && (
                        <Chip
                          label="Available Today"
                          size="small"
                          sx={{
                            bgcolor: alpha(auraColors.green.main, 0.1),
                            color: auraColors.green.main,
                            fontWeight: 500,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>
                  </AuraCard>
                );
              })}
            </Stack>
          )}

          {/* Service Type Selection */}
          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ServiceIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Service Type
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {appointmentTypes.map((type) => {
                const isServiceType =
                  serviceTypesData.length > 0 && serviceTypesData.some((st) => st.id === type.id);
                const isSelected = isServiceType
                  ? appointmentData.serviceTypeId === type.id
                  : appointmentData.appointmentType === type.id;

                return (
                  <Chip
                    key={type.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>{type.name}</span>
                        <Typography component="span" variant="caption" sx={{ opacity: 0.7 }}>
                          ({type.durationMinutes} min)
                        </Typography>
                        {type.price > 0 && (
                          <Typography component="span" variant="caption" fontWeight={600}>
                            ${type.price.toFixed(0)}
                          </Typography>
                        )}
                      </Box>
                    }
                    color={isSelected ? 'primary' : 'default'}
                    onClick={() =>
                      setAppointmentData({
                        ...appointmentData,
                        appointmentType: type.name,
                        serviceTypeId: isServiceType ? type.id : null,
                        serviceTypePrice: type.price,
                        duration: type.durationMinutes,
                        timeSlot: null,
                      })
                    }
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      height: 36,
                      '& .MuiChip-label': { px: 1.5 },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </FormSection>
      );
    }

    // Date & Time Step
    if ((patient && idx === 1) || (!patient && idx === 2)) {
      return (
        <FormSection title="Date & Time" description="Choose appointment date and time">
          <FormRow>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
              <DatePicker
                label="Appointment Date"
                value={appointmentData.date}
                onChange={(newDate) =>
                  setAppointmentData({
                    ...appointmentData,
                    date: newDate,
                    timeSlot: null, // Reset time when date changes
                  })
                }
                minDate={new Date()}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </LocalizationProvider>
          </FormRow>
          {appointmentData.date && (
            <FormRow>
              {slotsLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    Loading available times...
                  </Typography>
                </Box>
              ) : timeSlots.length === 0 ? (
                <Alert severity="info">
                  No available time slots for this date. The provider may be fully booked or not
                  working on this day.
                </Alert>
              ) : (
                <TimeSlotPicker
                  slots={timeSlots}
                  selectedSlot={appointmentData.timeSlot}
                  onSelectSlot={(slot) =>
                    setAppointmentData({ ...appointmentData, timeSlot: slot })
                  }
                />
              )}
            </FormRow>
          )}
          <FormRow>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={appointmentData.notes}
              onChange={(e) =>
                setAppointmentData({
                  ...appointmentData,
                  notes: e.target.value,
                })
              }
              placeholder="Add any notes or special requirements"
            />
          </FormRow>
        </FormSection>
      );
    }

    // Confirm Step
    const selectedServiceType = appointmentTypes.find(
      (t) => t.id === appointmentData.serviceTypeId || t.name === appointmentData.appointmentType
    );

    const formattedDate = appointmentData.date
      ? format(appointmentData.date, 'EEEE, MMMM d, yyyy')
      : '';

    return (
      <FormSection title="Confirm Details" description="Review your appointment before scheduling">
        <AuraCard variant="flat" sx={{ p: 0, overflow: 'hidden' }}>
          {/* Header */}
          <Box
            sx={{
              p: 2.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
            }}
          >
            <Typography variant="overline" sx={{ opacity: 0.8 }}>
              Appointment Confirmation
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {appointmentData.patientName}
            </Typography>
          </Box>

          {/* Details Grid */}
          <Box sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              {/* Provider */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
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
                    {appointmentData.providerName}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Date & Time */}
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
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
                      {formattedDate}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
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
                      {appointmentData.timeSlot} ({appointmentData.duration} min)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Service Type */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    bgcolor: alpha(auraColors.green.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ServiceIcon sx={{ color: auraColors.green.main }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Service Type
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {appointmentData.appointmentType}
                  </Typography>
                </Box>
                {appointmentData.serviceTypePrice > 0 && (
                  <Chip
                    label={`$${appointmentData.serviceTypePrice.toFixed(2)}`}
                    color="success"
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>

              {/* Notes if present */}
              {appointmentData.notes && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {appointmentData.notes}
                    </Typography>
                  </Box>
                </>
              )}
            </Stack>
          </Box>

          {/* Billing Code Footer */}
          {selectedServiceType?.billingCode && (
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                bgcolor: alpha(theme.palette.action.hover, 0.5),
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Billing Code: {selectedServiceType.billingCode}
              </Typography>
            </Box>
          )}
        </AuraCard>
      </FormSection>
    );
  };

  return (
    <StepperDialog
      open={open}
      onClose={onClose}
      title="Schedule Appointment"
      steps={steps}
      activeStep={activeStep}
      onNext={() => setActiveStep((prev) => prev + 1)}
      onBack={() => setActiveStep((prev) => prev - 1)}
      onComplete={handleSchedule}
      isStepValid={Boolean(isStepValid())}
      loading={createAppointmentMutation.isPending}
      completeLabel="Schedule Appointment"
    >
      {renderStep()}
    </StepperDialog>
  );
};
