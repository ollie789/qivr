import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Chip,
  Avatar,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Email as EmailIcon,
  Sms as SmsIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import apiClient from '../lib/api-client';

// Type for message send result
interface MessageSendResult {
  id: string;
  recipients: string[];
  messageType: 'sms' | 'email';
  status: 'sent' | 'scheduled' | 'failed';
  scheduledTime?: string;
  sentAt?: string;
}

interface MessageComposerProps {
  open: boolean;
  onClose: () => void;
  recipients?: Recipient[];
  defaultType?: 'sms' | 'email';
  onSent?: (result: MessageSendResult) => void;
}

interface Recipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'patient' | 'staff';
}

interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  type: 'sms' | 'email' | 'both';
}

const MESSAGE_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Appointment Reminder',
    content: 'Hi {{name}}, this is a reminder for your appointment on {{date}} at {{time}}. Reply CONFIRM to confirm or CANCEL to cancel.',
    variables: ['name', 'date', 'time'],
    type: 'both',
  },
  {
    id: '2',
    name: 'PROM Request',
    content: 'Hi {{name}}, please complete your health questionnaire: {{link}}',
    variables: ['name', 'link'],
    type: 'both',
  },
  {
    id: '3',
    name: 'Test Results Ready',
    content: 'Hi {{name}}, your test results are ready. Please log in to your patient portal to view them.',
    variables: ['name'],
    type: 'both',
  },
  {
    id: '4',
    name: 'Welcome Message',
    content: 'Welcome to our clinic, {{name}}! We look forward to providing you with excellent care.',
    variables: ['name'],
    type: 'both',
  },
];

const MessageComposer: React.FC<MessageComposerProps> = ({
  open,
  onClose,
  recipients = [],
  defaultType = 'sms',
  onSent,
}) => {
  const [messageType, setMessageType] = useState<'sms' | 'email'>(defaultType);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [scheduleTime] = useState<Date | null>(null);

  const handleTemplateSelect = (template: Template | null) => {
    setSelectedTemplate(template);
    if (template) {
      setMessage(template.content);
      // Initialize template variables
      const vars: Record<string, string> = {};
      template.variables.forEach(v => {
        if (v === 'name' && recipients.length === 1) {
          vars[v] = recipients[0].name;
        } else {
          vars[v] = '';
        }
      });
      setTemplateVariables(vars);
    } else {
      setMessage('');
      setTemplateVariables({});
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({ ...prev, [variable]: value }));
    
    // Update message with variable values
    let updatedMessage = selectedTemplate?.content || message;
    Object.entries({ ...templateVariables, [variable]: value }).forEach(([key, val]) => {
      updatedMessage = updatedMessage.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });
    setMessage(updatedMessage);
  };

  const handleSend = async () => {
    setError(null);
    setSending(true);

    try {
      const endpoint = '/api/Messages';

      const payload = {
        recipients: recipients.map(r => ({
          id: r.id,
          name: r.name,
          contact: messageType === 'sms' ? r.phone : r.email,
        })),
        message,
        subject: messageType === 'email' ? subject : undefined,
        templateId: selectedTemplate?.id,
        variables: templateVariables,
        scheduleTime: scheduleTime?.toISOString(),
      };

      const response = await apiClient.post(endpoint, payload);
      
      setSuccess(true);
      if (onSent) {
        onSent(response.data);
      }
      
      setTimeout(() => {
        onClose();
        // Reset form
        setMessage('');
        setSubject('');
        setSelectedTemplate(null);
        setTemplateVariables({});
        setSuccess(false);
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send message';
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const canSend = () => {
    if (messageType === 'email' && !subject) return false;
    if (!message) return false;
    if (recipients.length === 0) return false;
    if (messageType === 'sms' && !recipients.every(r => r.phone)) return false;
    if (messageType === 'email' && !recipients.every(r => r.email)) return false;
    return true;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Send Message</Typography>
          <ToggleButtonGroup
            value={messageType}
            exclusive
            onChange={(_, value) => value && setMessageType(value)}
            size="small"
          >
            <ToggleButton value="sms">
              <SmsIcon sx={{ mr: 1 }} />
              SMS
            </ToggleButton>
            <ToggleButton value="email">
              <EmailIcon sx={{ mr: 1 }} />
              Email
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {/* Recipients */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recipients ({recipients.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {recipients.map(recipient => (
              <Chip
                key={recipient.id}
                avatar={<Avatar>{recipient.name[0]}</Avatar>}
                label={recipient.name}
                size="small"
                color={recipient.type === 'patient' ? 'primary' : 'secondary'}
              />
            ))}
          </Box>
        </Box>

        {/* Template Selector */}
        <Autocomplete
          options={MESSAGE_TEMPLATES.filter(t => 
            t.type === 'both' || t.type === messageType
          )}
          getOptionLabel={(option) => option.name}
          value={selectedTemplate}
          onChange={(e, value) => handleTemplateSelect(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Message Template (Optional)"
              variant="outlined"
              margin="normal"
              fullWidth
            />
          )}
        />

        {/* Template Variables */}
        {selectedTemplate && selectedTemplate.variables.length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Template Variables
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {selectedTemplate.variables.map(variable => (
                <TextField
                  key={variable}
                  label={variable}
                  value={templateVariables[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  size="small"
                  sx={{ flex: 1, minWidth: 150 }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Subject (Email only) */}
        {messageType === 'email' && (
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
        )}

        {/* Message */}
        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          multiline
          rows={messageType === 'email' ? 8 : 4}
          fullWidth
          margin="normal"
          required
          helperText={
            messageType === 'sms'
              ? `${message.length}/160 characters (${Math.ceil(message.length / 160)} SMS)`
              : null
          }
        />

        {/* Schedule Option */}
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<ScheduleIcon />}
            variant="outlined"
            size="small"
            onClick={() => {/* TODO: Add date/time picker */}}
          >
            Schedule for later
          </Button>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Message sent successfully!
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={!canSend() || sending}
          startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageComposer;
