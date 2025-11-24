import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Checkbox,
  FormControlLabel,
  Switch,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Send as SendIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { promsApi } from '../../services/proms';
import { patientApi, type Patient as PatientSummary } from '../../services/patientApi';
import { NotificationMethod } from '../../services/promApi';
import type { PromTemplateSummary } from '../../services/promApi';
import { handleApiError } from '../../lib/api-client';
import { DialogSection, FormSection, FormRow, QivrButton } from '@qivr/design-system';

interface SendPromDialogProps {
  open: boolean;
  onClose: () => void;
  templateId?: string;
  templateName?: string;
  preselectedPatients?: string[];
}

export const SendPromDialog: React.FC<SendPromDialogProps> = ({
  open,
  onClose,
  templateId,
  templateName: _templateName,
  preselectedPatients = [],
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<PatientSummary[]>([]);
  const [templates, setTemplates] = useState<PromTemplateSummary[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateId || '');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [includeReminders, setIncludeReminders] = useState(true);
  const [message, setMessage] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const loadPatients = useCallback(async () => {
    try {
      const response = await patientApi.getPatients({ limit: 100 });
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to load patients:', error);
      enqueueSnackbar('Failed to load patients', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const loadTemplates = useCallback(async () => {
    try {
      const templateResults = await promsApi.listTemplates(1, 100);
      setTemplates(templateResults);
      if (templateId) {
        setSelectedTemplate(templateId);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }, [templateId]);

  useEffect(() => {
    loadPatients();
    loadTemplates();
  }, [loadPatients, loadTemplates]);

  useEffect(() => {
    if (preselectedPatients.length > 0) {
      const preselected = patients.filter(p => preselectedPatients.includes(p.id));
      setSelectedPatients(preselected);
    }
  }, [patients, preselectedPatients]);

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
      if (!template) {
        throw new Error('Unable to load template metadata.');
      }

      const schedulePayload = {
        templateKey: template.key,
        version: template.version,
        scheduledFor: scheduledFor ?? new Date().toISOString(),
        dueAt: due.toISOString(),
        notificationMethod,
        tags,
        notes: message || undefined,
      } as const;

      if (selectedPatients.length === 1 && selectedPatients[0]) {
        await promsApi.schedule({
          ...schedulePayload,
          patientId: selectedPatients[0].id,
        });
      } else {
        await Promise.all(
          selectedPatients.map((patient) =>
            promsApi.schedule({
              ...schedulePayload,
              patientId: patient.id,
            }),
          ),
        );
      }

      enqueueSnackbar(
        `PROM "${template?.name ?? selectedTemplate}" sent to ${selectedPatients.length} patient(s)`,
        { variant: 'success' }
      );

      // Reset form and close
      setSelectedPatients([]);
      setMessage('');
      setTags([]);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to send PROMs:', error);
      const message = handleApiError(error, 'Failed to send PROMs');
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <SendIcon />
          Send PROM to Patients
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogSection>
          <FormSection
            title="PROM Selection"
            description="Choose the PROM template to send"
          >
            <FormRow>
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
            </FormRow>
          </FormSection>

          <FormSection
            title="Patient Selection"
            description="Select patients to receive the PROM"
          >
            <FormRow>
              <Autocomplete
                multiple
                options={patients}
                value={selectedPatients}
                onChange={(_, newValue) => setSelectedPatients(newValue)}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search patients..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key: _key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={option.id || index}
                        variant="outlined"
                        label={`${option.firstName} ${option.lastName}`}
                        {...tagProps}
                        icon={<PersonIcon />}
                      />
                    );
                  })
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
                            <Box component="span" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0.5 }}>
                              <EmailIcon fontSize="small" />
                              {option.email}
                            </Box>
                          )}
                          {option.phone && (
                            <Box component="span" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 0.5 }}>
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
                <Typography variant="caption" color="text.secondary">
                  {selectedPatients.length} patient(s) selected
                </Typography>
              )}
            </FormRow>
          </FormSection>

          <FormSection
            title="Scheduling"
            description="Configure when the PROM should be sent"
          >
            <FormRow>
              <FormControlLabel
                control={
                  <Switch
                    checked={sendImmediately}
                    onChange={(e) => setSendImmediately(e.target.checked)}
                  />
                }
                label="Send Immediately"
              />
            </FormRow>

            {!sendImmediately && (
              <>
                <FormRow>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      value={scheduledDate}
                      onChange={(newValue: Date | null) => setScheduledDate(newValue)}
                    />
                  </LocalizationProvider>
                </FormRow>
                <FormRow>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <TimePicker
                      value={scheduledDate}
                      onChange={(newValue: Date | null) => setScheduledDate(newValue)}
                    />
                  </LocalizationProvider>
                </FormRow>
              </>
            )}

            <FormRow>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={dueDate}
                  onChange={(newValue: Date | null) => setDueDate(newValue)}
                />
              </LocalizationProvider>
            </FormRow>
          </FormSection>

          <FormSection
            title="Notifications"
            description="Choose how patients will be notified"
          >
            <FormRow>
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
            </FormRow>
          </FormSection>

          <FormSection
            title="Additional Options"
            description="Add a custom message and tags"
          >
            <FormRow>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personalized message to include with the PROM notification"
              />
            </FormRow>

            <FormRow>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={tags}
                onChange={(_, newValue) => setTags(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Add tags..."
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key: _key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={option || index}
                        variant="outlined"
                        label={option}
                        size="small"
                        {...tagProps}
                      />
                    );
                  })
                }
              />
            </FormRow>
          </FormSection>

          {selectedPatients.length > 0 && selectedTemplate && (
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
          )}
        </DialogSection>
      </DialogContent>
      <DialogActions>
        <QivrButton 
          onClick={onClose} 
          disabled={loading}
          variant="outlined"
          emphasize="subtle"
        >
          Cancel
        </QivrButton>
        <QivrButton
          variant="contained"
          onClick={handleSend}
          disabled={loading || selectedPatients.length === 0 || !selectedTemplate}
          loading={loading}
          startIcon={<SendIcon />}
        >
          Send to {selectedPatients.length} Patient(s)
        </QivrButton>
      </DialogActions>
    </Dialog>
  );
};
