import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  Switch,
  DatePicker,
  TimePicker,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { promsApi } from '../services/proms';
import { patientApi } from '../services/patientApi';
import { promInstanceApi, NotificationMethod } from '../services/promInstanceApi';

interface SendPromDialogProps {
  open: boolean;
  onClose: () => void;
  templateId?: string;
  templateName?: string;
  preselectedPatients?: string[];
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  lastVisit?: string;
}

export const SendPromDialog: React.FC<SendPromDialogProps> = ({
  open,
  onClose,
  templateId,
  templateName,
  preselectedPatients = [],
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateId || '');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [includeReminders, setIncludeReminders] = useState(true);
  const [message, setMessage] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    loadPatients();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (preselectedPatients.length > 0) {
      const preselected = patients.filter(p => preselectedPatients.includes(p.id));
      setSelectedPatients(preselected);
    }
  }, [patients, preselectedPatients]);

  const loadPatients = async () => {
    try {
      const response = await patientApi.getPatients({ page: 1, limit: 100 });
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to load patients:', error);
      enqueueSnackbar('Failed to load patients', { variant: 'error' });
    }
  };

  const loadTemplates = async () => {
    try {
      const templates = await promsApi.listTemplates(1, 100);
      setTemplates(templates);
      if (templateId) {
        setSelectedTemplate(templateId);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate) {
      enqueueSnackbar('Please select a PROM template', { variant: 'warning' });
      return;
    }
    if (selectedPatients.length === 0) {
      enqueueSnackbar('Please select at least one patient', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const scheduledFor = sendImmediately ? undefined : scheduledDate?.toISOString();
      const due = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

      // Calculate notification method flags
      let notificationMethod = NotificationMethod.None;
      if (sendEmail) notificationMethod |= NotificationMethod.Email;
      if (sendSms) notificationMethod |= NotificationMethod.Sms;

      // Send PROM using the new API
      if (selectedPatients.length === 1) {
        // Single patient
        await promInstanceApi.sendToPatient({
          templateId: selectedTemplate,
          patientId: selectedPatients[0].id,
          scheduledAt: scheduledFor,
          dueDate: due.toISOString(),
          notificationMethod,
          tags,
          notes: message || undefined,
        });
      } else {
        // Multiple patients
        await promInstanceApi.sendBulk({
          templateId: selectedTemplate,
          patientIds: selectedPatients.map(p => p.id),
          scheduledAt: scheduledFor,
          dueDate: due.toISOString(),
          notificationMethod,
          tags,
          notes: message || undefined,
        });
      }

      enqueueSnackbar(
        `PROM "${template.name}" sent to ${selectedPatients.length} patient(s)`,
        { variant: 'success' }
      );

      // Reset form and close
      setSelectedPatients([]);
      setMessage('');
      setTags([]);
      onClose();
    } catch (error: any) {
      console.error('Failed to send PROMs:', error);
      enqueueSnackbar(error?.message || 'Failed to send PROMs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SendIcon />
          Send PROM to Patients
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Template Selection */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>PROM Template</InputLabel>
              <Select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                label="PROM Template"
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} (v{template.version})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Patient Selection */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={patients}
              value={selectedPatients}
              onChange={(_, newValue) => setSelectedPatients(newValue)}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Patients"
                  placeholder="Search patients..."
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={`${option.firstName} ${option.lastName}`}
                    {...getTagProps({ index })}
                    icon={<PersonIcon />}
                  />
                ))
              }
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${option.firstName} ${option.lastName}`}
                    secondary={
                      <Box>
                        {option.email && (
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EmailIcon fontSize="small" />
                            {option.email}
                          </Box>
                        )}
                        {option.phone && (
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize="small" />
                            {option.phone}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </Box>
              )}
            />
            {selectedPatients.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {selectedPatients.length} patient(s) selected
              </Typography>
            )}
          </Grid>

          {/* Scheduling Options */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={sendImmediately}
                  onChange={(e) => setSendImmediately(e.target.checked)}
                />
              }
              label="Send Immediately"
            />
          </Grid>

          {!sendImmediately && (
            <>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Scheduled Date"
                    value={scheduledDate}
                    onChange={(newValue) => setScheduledDate(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Scheduled Time"
                    value={scheduledDate}
                    onChange={(newValue) => setScheduledDate(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    helperText="When should the patient complete this PROM by?"
                  />
                )}
              />
            </LocalizationProvider>
          </Grid>

          {/* Notification Options */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Notification Options
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                }
                label="Send Email Notification"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                  />
                }
                label="Send SMS Notification"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeReminders}
                    onChange={(e) => setIncludeReminders(e.target.checked)}
                  />
                }
                label="Send Automatic Reminders"
              />
            </Box>
          </Grid>

          {/* Custom Message */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Custom Message (Optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              helperText="Add a personalized message to include with the PROM notification"
            />
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={tags}
              onChange={(_, newValue) => setTags(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags (Optional)"
                  placeholder="Add tags..."
                  helperText="Press Enter to add tags for organizing PROMs"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
            />
          </Grid>

          {/* Summary */}
          {selectedPatients.length > 0 && selectedTemplate && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="subtitle2" gutterBottom>
                  Summary
                </Typography>
                <Typography variant="body2">
                  • Sending to {selectedPatients.length} patient(s)
                </Typography>
                <Typography variant="body2">
                  • Template: {templates.find(t => t.id === selectedTemplate)?.name}
                </Typography>
                <Typography variant="body2">
                  • Schedule: {sendImmediately ? 'Immediately' : `${scheduledDate?.toLocaleDateString()} at ${scheduledDate?.toLocaleTimeString()}`}
                </Typography>
                <Typography variant="body2">
                  • Due: {dueDate ? dueDate.toLocaleDateString() : '7 days from scheduled date'}
                </Typography>
                {(sendEmail || sendSms) && (
                  <Typography variant="body2">
                    • Notifications: {[sendEmail && 'Email', sendSms && 'SMS'].filter(Boolean).join(', ')}
                  </Typography>
                )}
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={loading || selectedPatients.length === 0 || !selectedTemplate}
          startIcon={<SendIcon />}
        >
          {loading ? 'Sending...' : `Send to ${selectedPatients.length} Patient(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
