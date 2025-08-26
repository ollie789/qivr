import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { enAU } from 'date-fns/locale';
import { useSnackbar } from 'notistack';

export interface ScheduleAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  intakeId?: string;
  prefilledData?: {
    chiefComplaint?: string;
    urgency?: string;
    preferredProvider?: string;
  };
}

const providers = [
  { id: '1', name: 'Dr. Emily Chen', title: 'Physiotherapist', availability: 'Mon-Fri' },
  { id: '2', name: 'Dr. James Williams', title: 'Sports Therapist', availability: 'Tue-Sat' },
  { id: '3', name: 'Dr. Priya Patel', title: 'Pain Specialist', availability: 'Mon-Thu' },
];

const appointmentTypes = [
  { id: 'initial', label: 'Initial Consultation', duration: 60, color: 'primary' },
  { id: 'followup', label: 'Follow-up', duration: 30, color: 'info' },
  { id: 'treatment', label: 'Treatment Session', duration: 45, color: 'success' },
  { id: 'assessment', label: 'Assessment', duration: 90, color: 'warning' },
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '14:00', '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00'
];

export const ScheduleAppointmentDialog: React.FC<ScheduleAppointmentDialogProps> = ({
  open,
  onClose,
  patient,
  intakeId,
  prefilledData,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [appointmentData, setAppointmentData] = useState({
    patientId: patient?.id || '',
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : '',
    patientEmail: patient?.email || '',
    patientPhone: patient?.phone || '',
    providerId: prefilledData?.preferredProvider || '',
    appointmentType: intakeId ? 'initial' : 'followup',
    date: null as Date | null,
    time: null as Date | null,
    duration: 60,
    location: 'clinic',
    notes: prefilledData?.chiefComplaint || '',
    sendReminder: true,
  });

  const steps = patient 
    ? ['Select Provider', 'Choose Date & Time', 'Confirm Details']
    : ['Patient Information', 'Select Provider', 'Choose Date & Time', 'Confirm Details'];

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSchedule = async () => {
    try {
      // TODO: Make API call to schedule appointment
      enqueueSnackbar('Appointment scheduled successfully!', { variant: 'success' });
      
      if (intakeId) {
        // Update intake status to 'scheduled'
        enqueueSnackbar('Intake status updated to scheduled', { variant: 'info' });
      }
      
      onClose();
    } catch (error) {
      enqueueSnackbar('Failed to schedule appointment', { variant: 'error' });
    }
  };

  const isStepValid = () => {
    const currentStepIndex = patient ? activeStep : activeStep;
    
    switch (currentStepIndex) {
      case 0:
        if (!patient) {
          return appointmentData.patientName && appointmentData.patientEmail;
        }
        return appointmentData.providerId !== '';
      case 1:
        if (!patient) {
          return appointmentData.providerId !== '';
        }
        return appointmentData.date && appointmentData.time;
      case 2:
        return appointmentData.date && appointmentData.time;
      default:
        return true;
    }
  };

  const renderPatientStep = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Creating appointment from intake submission
        </Alert>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="First Name"
          value={appointmentData.patientName.split(' ')[0] || ''}
          onChange={(e) => setAppointmentData({
            ...appointmentData,
            patientName: `${e.target.value} ${appointmentData.patientName.split(' ')[1] || ''}`
          })}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Last Name"
          value={appointmentData.patientName.split(' ')[1] || ''}
          onChange={(e) => setAppointmentData({
            ...appointmentData,
            patientName: `${appointmentData.patientName.split(' ')[0] || ''} ${e.target.value}`
          })}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={appointmentData.patientEmail}
          onChange={(e) => setAppointmentData({
            ...appointmentData,
            patientEmail: e.target.value
          })}
          required
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Phone"
          value={appointmentData.patientPhone}
          onChange={(e) => setAppointmentData({
            ...appointmentData,
            patientPhone: e.target.value
          })}
          required
        />
      </Grid>
      {prefilledData?.chiefComplaint && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Chief Complaint (from intake)"
            value={prefilledData.chiefComplaint}
            disabled
            multiline
            rows={2}
          />
        </Grid>
      )}
    </Grid>
  );

  const renderProviderStep = () => (
    <Box>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Select a provider for the appointment
      </Typography>
      <List>
        {providers.map((provider) => (
          <ListItem key={provider.id} disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              selected={appointmentData.providerId === provider.id}
              onClick={() => setAppointmentData({
                ...appointmentData,
                providerId: provider.id
              })}
              sx={{
                border: 1,
                borderColor: appointmentData.providerId === provider.id ? 'primary.main' : 'divider',
                borderRadius: 1,
              }}
            >
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={provider.name}
                secondary={
                  <>
                    {provider.title} • Available {provider.availability}
                  </>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Appointment Type
        </Typography>
        <Grid container spacing={1}>
          {appointmentTypes.map((type) => (
            <Grid item key={type.id}>
              <Chip
                label={`${type.label} (${type.duration} min)`}
                color={appointmentData.appointmentType === type.id ? type.color as any : 'default'}
                onClick={() => setAppointmentData({
                  ...appointmentData,
                  appointmentType: type.id,
                  duration: type.duration
                })}
                variant={appointmentData.appointmentType === type.id ? 'filled' : 'outlined'}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );

  const renderDateTimeStep = () => (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enAU}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DatePicker
            label="Appointment Date"
            value={appointmentData.date}
            onChange={(newValue) => setAppointmentData({
              ...appointmentData,
              date: newValue
            })}
            minDate={new Date()}
            maxDate={addDays(new Date(), 60)}
            slotProps={{
              textField: {
                fullWidth: true,
              }
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Location</InputLabel>
            <Select
              value={appointmentData.location}
              label="Location"
              onChange={(e) => setAppointmentData({
                ...appointmentData,
                location: e.target.value
              })}
            >
              <MenuItem value="clinic">Main Clinic</MenuItem>
              <MenuItem value="satellite">Satellite Office</MenuItem>
              <MenuItem value="telehealth">Telehealth</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        {appointmentData.date && (
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Available Time Slots
            </Typography>
            <Grid container spacing={1}>
              {timeSlots.map((slot) => {
                const [hours, minutes] = slot.split(':').map(Number);
                const slotTime = setMinutes(setHours(new Date(), hours), minutes);
                const isSelected = appointmentData.time && 
                  format(appointmentData.time, 'HH:mm') === slot;
                
                return (
                  <Grid item key={slot}>
                    <Button
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={() => setAppointmentData({
                        ...appointmentData,
                        time: slotTime
                      })}
                      startIcon={<TimeIcon />}
                    >
                      {slot}
                    </Button>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        )}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={3}
            value={appointmentData.notes}
            onChange={(e) => setAppointmentData({
              ...appointmentData,
              notes: e.target.value
            })}
            placeholder="Any additional notes for the appointment..."
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  );

  const renderConfirmStep = () => (
    <Box>
      <Alert severity="success" sx={{ mb: 3 }}>
        Please review the appointment details before confirming
      </Alert>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Appointment Summary
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1">
                  {appointmentData.patientName}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Provider
                </Typography>
                <Typography variant="body1">
                  {providers.find(p => p.id === appointmentData.providerId)?.name}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CalendarIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Date & Time
                </Typography>
                <Typography variant="body1">
                  {appointmentData.date && format(appointmentData.date, 'EEEE, MMMM d, yyyy')}
                  {appointmentData.time && ` at ${format(appointmentData.time, 'h:mm a')}`}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocationIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1">
                  {appointmentData.location === 'clinic' ? 'Main Clinic' :
                   appointmentData.location === 'satellite' ? 'Satellite Office' : 'Telehealth'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <NotesIcon color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Type & Notes
                </Typography>
                <Typography variant="body1">
                  {appointmentTypes.find(t => t.id === appointmentData.appointmentType)?.label}
                  {' '}({appointmentData.duration} minutes)
                </Typography>
                {appointmentData.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {appointmentData.notes}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      {intakeId && (
        <Alert severity="info" sx={{ mt: 2 }}>
          This appointment is linked to intake #{intakeId}. The intake status will be updated to "Scheduled" upon confirmation.
        </Alert>
      )}
    </Box>
  );

  const renderStepContent = () => {
    const currentStep = patient ? activeStep + 1 : activeStep;
    
    switch (currentStep) {
      case 0:
        return renderPatientStep();
      case 1:
        return renderProviderStep();
      case 2:
        return renderDateTimeStep();
      case 3:
        return renderConfirmStep();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Schedule Appointment
        {patient && (
          <Typography variant="body2" color="text.secondary">
            for {patient.firstName} {patient.lastName}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            Next
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleSchedule}
            disabled={!isStepValid()}
          >
            Schedule Appointment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
