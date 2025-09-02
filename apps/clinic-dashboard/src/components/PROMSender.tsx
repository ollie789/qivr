import React, { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  RadioGroup,
  Radio,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Alert,
  Divider,
  Switch,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Preview as PreviewIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Repeat as RepeatIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { promApi } from '../services/promApi';
import { patientApi } from '../services/patientApi';

interface PROMSenderProps {
  onComplete?: () => void;
  preSelectedPatientId?: string;
  preSelectedTemplateId?: string;
}

const steps = ['Select Template', 'Choose Recipients', 'Configure Schedule', 'Set Notifications', 'Review & Send'];

const PROMSender: React.FC<PROMSenderProps> = ({
  onComplete,
  preSelectedPatientId,
  preSelectedTemplateId,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedPatients, setSelectedPatients] = useState<string[]>(
    preSelectedPatientId ? [preSelectedPatientId] : []
  );
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled' | 'recurring'>('immediate');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [recurringConfig, setRecurringConfig] = useState({
    frequency: 'weekly',
    interval: 1,
    endType: 'never',
    endDate: null as Date | null,
    endAfterOccurrences: 10,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    sendEmail: true,
    sendSMS: false,
    sendPushNotification: true,
    reminderEnabled: true,
    reminderDays: [1, 3, 7],
    customMessage: '',
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [patientFilter, setPatientFilter] = useState('all');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['prom-templates'],
    queryFn: () => promApi.getTemplates(),
  });

  // Fetch patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients', patientSearch, patientFilter],
    queryFn: () => patientApi.getPatients({
      search: patientSearch || undefined,
      status: patientFilter !== 'all' ? patientFilter : undefined,
    }),
  });

  const patients = patientsData?.data || [];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedTemplate(null);
    setSelectedPatients([]);
    setScheduleType('immediate');
    setNotificationSettings({
      sendEmail: true,
      sendSMS: false,
      sendPushNotification: true,
      reminderEnabled: true,
      reminderDays: [1, 3, 7],
      customMessage: '',
    });
  };

  const handleSend = async () => {
    // Here you would call the API to send the PROM
    console.log('Sending PROM:', {
      template: selectedTemplate,
      patients: selectedPatients,
      schedule: {
        type: scheduleType,
        date: scheduledDate,
        recurring: recurringConfig,
      },
      notifications: notificationSettings,
    });

    // Show success message and complete
    if (onComplete) {
      onComplete();
    }
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        // Template Selection
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select PROM Template
            </Typography>
            <Grid container spacing={2}>
              {templates?.map((template: any) => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedTemplate?.id === template.id ? 2 : 1,
                      borderColor: selectedTemplate?.id === template.id ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">{template.name}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {template.description}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {template.questions?.length || 0} questions • 
                          Estimated time: {template.estimatedTime || '5-10'} minutes
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {template.tags?.map((tag: string) => (
                          <Chip key={tag} label={tag} size="small" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 1:
        // Patient Selection
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Recipients
            </Typography>
            
            {/* Search and Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Filter</InputLabel>
                    <Select
                      value={patientFilter}
                      label="Filter"
                      onChange={(e) => setPatientFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Patients</MenuItem>
                      <MenuItem value="active">Active Only</MenuItem>
                      <MenuItem value="recent">Recent Visits</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{ height: '56px' }}
                    onClick={() => setSelectedPatients(patients.map(p => p.id))}
                  >
                    Select All ({patients.length})
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Selected Count */}
            <Alert severity="info" sx={{ mb: 2 }}>
              {selectedPatients.length} patient(s) selected
            </Alert>

            {/* Patient List */}
            <List>
              {patients.map((patient: any) => (
                <ListItem key={patient.id}>
                  <ListItemAvatar>
                    <Avatar>
                      {patient.firstName[0]}{patient.lastName[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${patient.firstName} ${patient.lastName}`}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {patient.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last visit: {patient.lastVisit ? format(new Date(patient.lastVisit), 'MMM d, yyyy') : 'Never'}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Checkbox
                      edge="end"
                      checked={selectedPatients.includes(patient.id)}
                      onChange={() => togglePatientSelection(patient.id)}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Box>
        );

      case 2:
        // Schedule Configuration
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configure Schedule
            </Typography>
            
            <RadioGroup
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as any)}
            >
              <FormControlLabel
                value="immediate"
                control={<Radio />}
                label={
                  <Box>
                    <Typography>Send Immediately</Typography>
                    <Typography variant="caption" color="text.secondary">
                      PROM will be sent as soon as you click send
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="scheduled"
                control={<Radio />}
                label={
                  <Box>
                    <Typography>Schedule for Later</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Send PROM at a specific date and time
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="recurring"
                control={<Radio />}
                label={
                  <Box>
                    <Typography>Recurring Schedule</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Send PROM on a regular schedule
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>

            {scheduleType === 'scheduled' && (
              <Box sx={{ mt: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Send Date & Time"
                    value={scheduledDate}
                    onChange={(newValue) => setScheduledDate(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Box>
            )}

            {scheduleType === 'recurring' && (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Frequency</InputLabel>
                      <Select
                        value={recurringConfig.frequency}
                        label="Frequency"
                        onChange={(e) => setRecurringConfig({ ...recurringConfig, frequency: e.target.value })}
                      >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="biweekly">Bi-weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="quarterly">Quarterly</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Interval"
                      value={recurringConfig.interval}
                      onChange={(e) => setRecurringConfig({ ...recurringConfig, interval: parseInt(e.target.value) })}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">time(s)</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl>
                      <RadioGroup
                        value={recurringConfig.endType}
                        onChange={(e) => setRecurringConfig({ ...recurringConfig, endType: e.target.value })}
                      >
                        <FormControlLabel value="never" control={<Radio />} label="Never ends" />
                        <FormControlLabel value="date" control={<Radio />} label="End on specific date" />
                        <FormControlLabel value="occurrences" control={<Radio />} label="End after occurrences" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  {recurringConfig.endType === 'date' && (
                    <Grid item xs={12}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DateTimePicker
                          label="End Date"
                          value={recurringConfig.endDate}
                          onChange={(newValue) => setRecurringConfig({ ...recurringConfig, endDate: newValue })}
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </LocalizationProvider>
                    </Grid>
                  )}
                  {recurringConfig.endType === 'occurrences' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Number of Occurrences"
                        value={recurringConfig.endAfterOccurrences}
                        onChange={(e) => setRecurringConfig({ ...recurringConfig, endAfterOccurrences: parseInt(e.target.value) })}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Box>
        );

      case 3:
        // Notification Settings
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Delivery Methods
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.sendEmail}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, sendEmail: e.target.checked })}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1 }} />
                      Email Notification
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.sendSMS}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, sendSMS: e.target.checked })}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SmsIcon sx={{ mr: 1 }} />
                      SMS Notification
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.sendPushNotification}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, sendPushNotification: e.target.checked })}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotificationIcon sx={{ mr: 1 }} />
                      Push Notification
                    </Box>
                  }
                />
              </FormGroup>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Reminder Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.reminderEnabled}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, reminderEnabled: e.target.checked })}
                  />
                }
                label="Send reminders for incomplete PROMs"
              />
              {notificationSettings.reminderEnabled && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Send reminders after (days):
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {[1, 3, 5, 7, 14].map((day) => (
                      <Chip
                        key={day}
                        label={`${day} day${day > 1 ? 's' : ''}`}
                        onClick={() => {
                          const days = notificationSettings.reminderDays.includes(day)
                            ? notificationSettings.reminderDays.filter(d => d !== day)
                            : [...notificationSettings.reminderDays, day];
                          setNotificationSettings({ ...notificationSettings, reminderDays: days });
                        }}
                        color={notificationSettings.reminderDays.includes(day) ? 'primary' : 'default'}
                        variant={notificationSettings.reminderDays.includes(day) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Custom Message (Optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Add a personalized message to include with the PROM invitation..."
                value={notificationSettings.customMessage}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, customMessage: e.target.value })}
              />
            </Paper>
          </Box>
        );

      case 4:
        // Review & Send
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Send
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Template
                  </Typography>
                  <Typography variant="h6">{selectedTemplate?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTemplate?.questions?.length || 0} questions
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Recipients
                  </Typography>
                  <Typography variant="h6">{selectedPatients.length} patients</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPatients.slice(0, 3).map(id => {
                      const patient = patients.find(p => p.id === id);
                      return patient ? `${patient.firstName} ${patient.lastName}` : '';
                    }).join(', ')}
                    {selectedPatients.length > 3 && ` and ${selectedPatients.length - 3} more`}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Schedule
                  </Typography>
                  <Typography variant="h6">
                    {scheduleType === 'immediate' && 'Send Immediately'}
                    {scheduleType === 'scheduled' && `Scheduled: ${format(scheduledDate!, 'MMM d, yyyy h:mm a')}`}
                    {scheduleType === 'recurring' && `Recurring ${recurringConfig.frequency}`}
                  </Typography>
                  {scheduleType === 'recurring' && (
                    <Typography variant="body2" color="text.secondary">
                      Every {recurringConfig.interval} {recurringConfig.frequency}
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <NotificationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Notifications
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {notificationSettings.sendEmail && <Chip label="Email" size="small" icon={<EmailIcon />} />}
                    {notificationSettings.sendSMS && <Chip label="SMS" size="small" icon={<SmsIcon />} />}
                    {notificationSettings.sendPushNotification && <Chip label="Push" size="small" icon={<NotificationIcon />} />}
                  </Box>
                  {notificationSettings.reminderEnabled && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Reminders on days: {notificationSettings.reminderDays.join(', ')}
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {notificationSettings.customMessage && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Custom Message
                    </Typography>
                    <Typography variant="body2">
                      {notificationSettings.customMessage}
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              Please review all details before sending. Once sent, PROMs cannot be recalled.
            </Alert>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return selectedTemplate !== null;
      case 1:
        return selectedPatients.length > 0;
      case 2:
        return true; // Schedule is always valid
      case 3:
        return notificationSettings.sendEmail || notificationSettings.sendSMS || notificationSettings.sendPushNotification;
      case 4:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 400 }}>
        {getStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {activeStep === steps.length - 1 && (
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
          )}
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!isStepValid()}
              startIcon={<SendIcon />}
            >
              Send PROM
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid()}
              endIcon={<ArrowForwardIcon />}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>PROM Preview</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {selectedTemplate?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {selectedTemplate?.description}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Sample Questions:
          </Typography>
          <List>
            {selectedTemplate?.questions?.slice(0, 3).map((question: any, index: number) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${index + 1}. ${question.text}`}
                  secondary={`Type: ${question.type}`}
                />
              </ListItem>
            ))}
          </List>
          {selectedTemplate?.questions?.length > 3 && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              ... and {selectedTemplate.questions.length - 3} more questions
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PROMSender;
