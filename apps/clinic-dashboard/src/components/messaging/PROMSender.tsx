import React, { useMemo, useState } from 'react';
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
  Paper,
  Alert,
  Divider,
  Switch,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { FlexBetween } from '@qivr/design-system';
import {
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Preview as PreviewIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotificationIcon,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { promApi, PromTemplateDetail, PromTemplateSummary } from '../../services/promApi';
import { patientApi, type Patient, type PatientListResponse } from '../../services/patientApi';

interface PROMSenderProps {
  onComplete?: () => void;
  preSelectedPatientId?: string;
  preSelectedTemplateId?: string;
}

const steps = ['Select Template', 'Choose Recipients', 'Configure Schedule', 'Set Notifications', 'Review & Send'];

type ScheduleType = 'immediate' | 'scheduled' | 'recurring';

const PROMSender: React.FC<PROMSenderProps> = ({
  onComplete,
  preSelectedPatientId,
  preSelectedTemplateId,
}) => {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    preSelectedTemplateId || ''
  );
  const [selectedPatients, setSelectedPatients] = useState<string[]>(
    preSelectedPatientId ? [preSelectedPatientId] : []
  );
  const [scheduleType, setScheduleType] = useState<ScheduleType>('immediate');
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
  const { data: templates } = useQuery<PromTemplateSummary[]>({
    queryKey: ['prom-templates'],
    queryFn: () => promApi.getTemplates(),
  });

  const { data: selectedTemplate } = useQuery<PromTemplateDetail>({
    queryKey: ['prom-template-detail', selectedTemplateId],
    queryFn: () => promApi.getTemplate(selectedTemplateId),
    enabled: Boolean(selectedTemplateId),
  });

  const templateSummaries = useMemo(() => templates ?? [], [templates]);
  const selectedTemplateSummary = useMemo(
    () => templateSummaries.find((template) => template.id === selectedTemplateId) || null,
    [templateSummaries, selectedTemplateId]
  );

  const activeTemplateName = selectedTemplate?.name ?? selectedTemplateSummary?.name ?? '';
  const activeTemplateDescription =
    selectedTemplate?.description ?? selectedTemplateSummary?.description ?? '';
  const activeTemplateQuestions = selectedTemplate?.questions ?? [];

  // Fetch patients
  const { data: patientsData } = useQuery<PatientListResponse>({
    queryKey: ['patients', patientSearch, patientFilter],
    queryFn: () => patientApi.getPatients({
      search: patientSearch || undefined,
      status: patientFilter !== 'all' ? patientFilter : undefined,
    }),
  });

  const patients = patientsData?.data ?? [];

  const handleScheduleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as ScheduleType;
    setScheduleType(value);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSend = async () => {
    try {
      if (!selectedTemplateSummary) {
        alert('Please select a PROM template');
        return;
      }

      // Send PROM to each selected patient
      const scheduledFor = scheduleType === 'immediate'
        ? new Date().toISOString()
        : scheduledDate?.toISOString() || new Date().toISOString();

      const dueDate = addDays(new Date(scheduledFor), 7); // Default 7 days to complete

      const templateKey = selectedTemplate?.key ?? selectedTemplateSummary.key;
      const templateVersion = selectedTemplate?.version ?? selectedTemplateSummary.version;

      if (!templateKey) {
        alert('Selected template is missing an integration key.');
        return;
      }

      // For each patient, send the PROM
      const promises = selectedPatients.map(patientId =>
        promApi.sendProm({
          templateKey,
          version: templateVersion,
          patientId: patientId,
          scheduledFor: scheduledFor,
          dueAt: dueDate.toISOString(),
        })
      );
      
      await Promise.all(promises);

      console.log('PROM sent successfully to', selectedPatients.length, 'patients');

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['prom-responses'] });

      // Show success message and complete
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to send PROM:', error);
      alert('Failed to send PROM. Please try again.');
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
              {templateSummaries.map((template) => {
                const isSelected = selectedTemplateId === template.id;
                const templateDetail = isSelected ? selectedTemplate : undefined;
                const questionCount = isSelected ? activeTemplateQuestions.length : undefined;
                const categoryLabel = templateDetail?.category;
                const frequencyLabel = templateDetail?.frequency;

                return (
                  <Grid size={{ xs: 12, md: 6 }}key={template.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: isSelected ? 2 : 1,
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6">{template.name}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {template.description || 'No description provided'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Version {template.version} • Created {format(new Date(template.createdAt), 'dd MMM yyyy')}
                        </Typography>
                        {isSelected ? (
                          <FlexBetween sx={{ mt: 2, gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={`${questionCount ?? 0} questions`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {categoryLabel && (
                              <Chip label={categoryLabel} size="small" variant="outlined" />
                            )}
                            {frequencyLabel && (
                              <Chip label={frequencyLabel} size="small" variant="outlined" />
                            )}
                          </FlexBetween>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                            Select to preview questions and metadata
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
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
                <Grid size={{ xs: 12, md: 6 }}>
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
                <Grid size={{ xs: 12, md: 3 }}>
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
                <Grid size={{ xs: 12, md: 3 }}>
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
              {patients.map((patient: Patient) => (
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
              onChange={handleScheduleTypeChange}
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
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Box>
            )}

            {scheduleType === 'recurring' && (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={{ xs: 12, md: 6 }}>
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
                  <Grid size={12}>
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
                    <Grid size={12}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DateTimePicker
                        label="End Date"
                        value={recurringConfig.endDate}
                        onChange={(newValue) => setRecurringConfig({ ...recurringConfig, endDate: newValue })}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                      </LocalizationProvider>
                    </Grid>
                  )}
                  {recurringConfig.endType === 'occurrences' && (
                    <Grid size={12}>
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
                  <FlexBetween sx={{ gap: 1 }}>
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
                  </FlexBetween>
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
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Template
                  </Typography>
                  <Typography variant="h6">
                    {activeTemplateName || 'No template selected'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeTemplateQuestions.length} questions
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
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
              
              <Grid size={{ xs: 12, md: 6 }}>
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
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <NotificationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Notifications
                  </Typography>
                  <FlexBetween sx={{ gap: 1 }}>
                    {notificationSettings.sendEmail && <Chip label="Email" size="small" icon={<EmailIcon />} />}
                    {notificationSettings.sendSMS && <Chip label="SMS" size="small" icon={<SmsIcon />} />}
                    {notificationSettings.sendPushNotification && <Chip label="Push" size="small" icon={<NotificationIcon />} />}
                  </FlexBetween>
                  {notificationSettings.reminderEnabled && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Reminders on days: {notificationSettings.reminderDays.join(', ')}
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {notificationSettings.customMessage && (
                <Grid size={12}>
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
        return Boolean(selectedTemplateId);
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

      <FlexBetween sx={{ mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBackIcon />}
        >
          Back
        </Button>
        
        <FlexBetween sx={{ gap: 2 }}>
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
        </FlexBetween>
      </FlexBetween>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>PROM Preview</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {activeTemplateName || 'PROM Template'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {activeTemplateDescription || 'Select a template to view details.'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Sample Questions:
          </Typography>
          <List>
            {activeTemplateQuestions.slice(0, 3).map((question, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${index + 1}. ${question.text}`}
                  secondary={`Type: ${question.type}`}
                />
              </ListItem>
            ))}
          </List>
          {activeTemplateQuestions.length > 3 && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              ... and {activeTemplateQuestions.length - 3} more questions
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
