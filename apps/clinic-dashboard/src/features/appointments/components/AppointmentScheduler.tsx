import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  List,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { postWithAuth } from '@qivr/http';
import { StepperDialog, FormSection, FormRow, TimeSlotPicker, ProviderCard, EmptyState } from '@qivr/design-system';

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

const appointmentTypes = [
  { value: 'initial', label: 'Initial Consultation', duration: 60 },
  { value: 'follow-up', label: 'Follow-up', duration: 30 },
  { value: 'assessment', label: 'Assessment', duration: 45 },
  { value: 'treatment', label: 'Treatment Session', duration: 45 },
  { value: 'review', label: 'Review', duration: 30 },
];

const mockProviders: Provider[] = [
  { id: '1', name: 'Dr. Emily Chen', speciality: 'Physiotherapist', nextAvailable: '2024-01-15' },
  { id: '2', name: 'Dr. James Williams', speciality: 'Chiropractor', nextAvailable: '2024-01-16' },
  { id: '3', name: 'Dr. Priya Patel', speciality: 'Occupational Therapist', nextAvailable: '2024-01-15' },
];

const mockTimeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

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

  const handleSchedule = async () => {
    if (!selectedProvider || !selectedDate || !selectedTime) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await postWithAuth<ScheduledAppointment>('/api/appointments', {
        patientId,
        providerId: selectedProvider.id,
        startTime: `${selectedDate.toISOString().split('T')[0]}T${selectedTime}`,
        type: appointmentType,
        includeVideo,
        notes,
        evaluationId,
      });
      
      onScheduled?.(result);
      onClose();
    } catch (err) {
      setError('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0: return selectedProvider !== null;
      case 1: return selectedDate !== null && selectedTime !== null;
      case 2: return appointmentType !== '';
      default: return true;
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <FormSection title="Select Provider" description="Choose a healthcare provider">
            <List>
              {mockProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  id={provider.id}
                  name={provider.name}
                  title={provider.speciality}
                  subtitle={`Next available: ${provider.nextAvailable}`}
                  selected={selectedProvider?.id === provider.id}
                  onSelect={() => setSelectedProvider(provider)}
                />
              ))}
            </List>
          </FormSection>
        );

      case 1:
        return (
          <FormSection title="Date & Time" description="Choose appointment date and time">
            <FormRow label="Date" required>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </FormRow>
            {selectedDate && (
              <FormRow label="Time" required>
                <TimeSlotPicker
                  slots={mockTimeSlots}
                  selectedSlot={selectedTime}
                  onSelectSlot={setSelectedTime}
                />
              </FormRow>
            )}
          </FormSection>
        );

      case 2:
        return (
          <FormSection title="Appointment Details" description="Configure appointment settings">
            <FormRow label="Appointment Type" required>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)} label="Type">
                  {appointmentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label} ({type.duration} min)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </FormRow>
            <FormRow label="Location">
              <ToggleButtonGroup
                value={includeVideo ? 'video' : 'clinic'}
                exclusive
                onChange={(_, val) => setIncludeVideo(val === 'video')}
                fullWidth
              >
                <ToggleButton value="clinic">
                  <LocationIcon sx={{ mr: 1 }} />
                  In Clinic
                </ToggleButton>
                <ToggleButton value="video">
                  <VideoCallIcon sx={{ mr: 1 }} />
                  Video Call
                </ToggleButton>
              </ToggleButtonGroup>
            </FormRow>
            <FormRow label="Notes">
              <TextField
                fullWidth
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or special requirements"
              />
            </FormRow>
          </FormSection>
        );

      case 3:
        return (
          <FormSection title="Confirm Appointment" description="Review appointment details">
            {error && <Alert severity="error">{error}</Alert>}
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>Appointment Summary</Typography>
              <Typography variant="body2">Patient: {patientName || 'Not specified'}</Typography>
              <Typography variant="body2">Provider: {selectedProvider?.name}</Typography>
              <Typography variant="body2">Date: {selectedDate?.toLocaleDateString()}</Typography>
              <Typography variant="body2">Time: {selectedTime}</Typography>
              <Typography variant="body2">Type: {appointmentTypes.find(t => t.value === appointmentType)?.label}</Typography>
              <Typography variant="body2">Location: {includeVideo ? 'Video Call' : 'In Clinic'}</Typography>
            </Alert>
          </FormSection>
        );

      default:
        return null;
    }
  };

  return (
    <StepperDialog
      open={open}
      onClose={onClose}
      title="Schedule Appointment"
      steps={['Provider', 'Date & Time', 'Details', 'Confirm']}
      activeStep={activeStep}
      onNext={() => setActiveStep(prev => prev + 1)}
      onBack={() => setActiveStep(prev => prev - 1)}
      onComplete={handleSchedule}
      isStepValid={isStepValid()}
      loading={loading}
      completeLabel="Schedule Appointment"
    >
      {renderStep()}
    </StepperDialog>
  );
};
