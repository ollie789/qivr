import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import type {
  MessageTemplate,
  MessageTemplateChannel,
  UpsertMessageTemplateInput,
} from '../services/messageTemplatesApi';
import { EmptyState } from '@qivr/design-system';

interface MessageTemplateManagerProps {
  open: boolean;
  onClose: () => void;
  templates: MessageTemplate[];
  initialDraft: UpsertMessageTemplateInput | null;
  onCreate: (input: UpsertMessageTemplateInput) => Promise<void>;
  onUpdate: (id: string, input: UpsertMessageTemplateInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  saving: boolean;
  updating: boolean;
  removing: boolean;
  loading: boolean;
}

interface FormState {
  id: string;
  name: string;
  description: string;
  subject: string;
  content: string;
  channel: MessageTemplateChannel;
}

const DEFAULT_FORM: FormState = {
  id: '',
  name: '',
  description: '',
  subject: '',
  content: '',
  channel: 'sms',
};

const extractVariables = (content: string): string[] => {
  const matches = content.match(/{{\s*([a-zA-Z0-9_.]+)\s*}}/g) ?? [];
  return Array.from(new Set(matches.map(match => match.replace(/{{\s*|\s*}}/g, '').trim())));
};

const MessageTemplateManager: React.FC<MessageTemplateManagerProps> = ({
  open,
  onClose,
  templates,
  initialDraft,
  onCreate,
  onUpdate,
  onDelete,
  saving,
  updating,
  removing,
  loading,
}) => {
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      setForm(DEFAULT_FORM);
      return;
    }

    if (initialDraft) {
      setSelectedId('new');
      setForm({
        id: '',
        name: initialDraft.name,
        description: initialDraft.description ?? '',
        subject: initialDraft.subject ?? '',
        content: initialDraft.content,
        channel: initialDraft.channel,
      });
      return;
    }

    if (!selectedId && templates.length > 0) {
      const first = templates[0];
      if (first) {
        setSelectedId(first.id);
        setForm({
          id: first.id,
          name: first.name,
          description: first.description ?? '',
          subject: first.subject ?? '',
          content: first.content,
          channel: first.channel,
        });
      }
      return;
    }

    if (templates.length === 0) {
      setSelectedId('new');
      setForm(DEFAULT_FORM);
    }
  }, [open, initialDraft, templates, selectedId]);

  const handleSelectTemplate = (template: MessageTemplate) => {
    setSelectedId(template.id);
    setForm({
      id: template.id,
      name: template.name,
      description: template.description ?? '',
      subject: template.subject ?? '',
      content: template.content,
      channel: template.channel,
    });
  };

  const handleCreateNew = () => {
    setSelectedId('new');
    setForm(DEFAULT_FORM);
  };

  const handleFieldChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const derivedVariables = useMemo(() => extractVariables(form.content), [form.content]);
  const requiresSubject = form.channel === 'email' || form.channel === 'both';
  const canSubmit = form.name.trim().length > 0
    && form.content.trim().length > 0
    && (!requiresSubject || form.subject.trim().length > 0);
  const isExisting = Boolean(form.id);
  const isBusy = isExisting ? updating : saving;

  const handleSubmit = async () => {
    if (!canSubmit || isBusy) {
      return;
    }

    const payload: UpsertMessageTemplateInput = {
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      subject: requiresSubject ? form.subject.trim() : null,
      content: form.content,
      channel: form.channel,
    };

    try {
      if (isExisting) {
        await onUpdate(form.id, payload);
      } else {
        await onCreate(payload);
      }
    } catch {
      // Errors surfaced via notifier in parent
    }
  };

  const handleDelete = async (template: MessageTemplate) => {
    if (removing) {
      return;
    }

    if (!window.confirm(`Delete the template "${template.name}"?`)) {
      return;
    }

    try {
      await onDelete(template.id);
      if (selectedId === template.id) {
        setSelectedId(null);
        setForm(DEFAULT_FORM);
      }
    } catch {
      // Parent shows toast
    }
  };

  const channelLabel = (channel: MessageTemplateChannel) => {
    switch (channel) {
      case 'sms':
        return 'SMS';
      case 'email':
        return 'Email';
      default:
        return 'SMS + Email';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Message Templates</DialogTitle>
      <DialogContent dividers>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          <Box sx={{ width: { xs: '100%', md: 280 } }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                fullWidth
                disabled={loading}
              >
                New Template
              </Button>
            </Stack>
            <List dense sx={{ maxHeight: 320, overflowY: 'auto', border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
              {templates.length === 0 ? (
                <EmptyState
                  title="No templates"
                  description="Create one to get started."
                />
              ) : (
                templates.map(template => (
                  <ListItemButton
                    key={template.id}
                    selected={selectedId === template.id}
                    onClick={() => handleSelectTemplate(template)}
                    disabled={loading}
                  >
                    <ListItemText
                      primary={template.name}
                      secondary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" label={channelLabel(template.channel)} />
                          {template.subject ? (
                            <Typography variant="caption" color="text.secondary">
                              {template.subject}
                            </Typography>
                          ) : null}
                        </Stack>
                      }
                    />
                    <Box sx={{ ml: 1 }}>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(template);
                        }}
                        disabled={removing || loading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemButton>
                ))
              )}
            </List>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Box sx={{ flex: 1 }}>
            <Stack spacing={2}>
              <TextField
                label="Template Name"
                value={form.name}
                onChange={(event) => handleFieldChange('name', event.target.value)}
                required
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="message-template-channel-label">Channel</InputLabel>
                <Select
                  labelId="message-template-channel-label"
                  label="Channel"
                  value={form.channel}
                  onChange={(event) => handleFieldChange('channel', event.target.value as MessageTemplateChannel)}
                >
                  <MenuItem value="sms">SMS</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="both">SMS + Email</MenuItem>
                </Select>
              </FormControl>
              {(form.channel === 'email' || form.channel === 'both') && (
                <TextField
                  label="Subject"
                  value={form.subject}
                  onChange={(event) => handleFieldChange('subject', event.target.value)}
                  required
                  fullWidth
                />
              )}
              <TextField
                label="Description"
                value={form.description}
                onChange={(event) => handleFieldChange('description', event.target.value)}
                fullWidth
              />
              <TextField
                label="Content"
                value={form.content}
                onChange={(event) => handleFieldChange('content', event.target.value)}
                multiline
                minRows={6}
                fullWidth
                helperText="Use {{variable}} syntax for placeholders (for example, {{name}} or {{date}})."
              />
              {derivedVariables.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {derivedVariables.map(variable => (
                    <Chip key={variable} label={variable} size="small" />
                  ))}
                </Stack>
              )}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || isBusy}
        >
          {isExisting ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageTemplateManager;
