import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { LoadingSpinner } from "@qivr/design-system";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  Close as CloseIcon,
  Email as EmailIcon,
  ManageHistory as ManageHistoryIcon,
  Save as SaveIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Sms as SmsIcon,
} from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { messagesApi } from "../../services/messagesApi";
import type { MessageDetail } from "../../services/messagesApi";
import {
  messageTemplatesApi,
  defaultMessageTemplates,
  type MessageTemplate,
  type MessageTemplateListResult,
  type UpsertMessageTemplateInput,
} from "../../services/messageTemplatesApi";
import MessageTemplateManager from "./MessageTemplateManager";

// Type for message send result
interface MessageComposerProps {
  open: boolean;
  onClose: () => void;
  recipients?: Recipient[];
  defaultType?: "sms" | "email";
  onSent?: (result: MessageDetail) => void;
  relatedAppointmentId?: string;
  category?:
    | "General"
    | "Appointment"
    | "Medical"
    | "Billing"
    | "Administrative";
  allowPatientSelection?: boolean;
}

interface Recipient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: "patient" | "staff";
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

const renderTemplateContent = (
  content: string,
  variables: Record<string, string>,
) =>
  Object.entries(variables).reduce(
    (accumulator, [key, value]) =>
      accumulator.replace(
        new RegExp(`{{\\s*${escapeRegExp(key)}\\s*}}`, "g"),
        value,
      ),
    content,
  );

const buildInitialVariables = (
  template: MessageTemplate,
  recipients: Recipient[],
): Record<string, string> => {
  if (!template.variables?.length) {
    return {};
  }

  const recipient = recipients.length === 1 ? recipients[0] : undefined;
  return template.variables.reduce<Record<string, string>>(
    (accumulator, key) => {
      if (key === "name" && recipient) {
        accumulator[key] = recipient.name;
      } else if (key === "email" && recipient?.email) {
        accumulator[key] = recipient.email;
      } else if (key === "phone" && recipient?.phone) {
        accumulator[key] = recipient.phone;
      } else {
        accumulator[key] = "";
      }
      return accumulator;
    },
    {},
  );
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: string;
      problem?: { detail?: string; title?: string };
      response?: { data?: { message?: string; detail?: string } };
    };
    const responseMessage =
      maybeError.response?.data?.message ?? maybeError.response?.data?.detail;
    if (responseMessage) {
      return responseMessage;
    }
    const problemMessage =
      maybeError.problem?.detail ?? maybeError.problem?.title;
    if (problemMessage) {
      return problemMessage;
    }
    if (maybeError.message) {
      return maybeError.message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const MessageComposer: React.FC<MessageComposerProps> = ({
  open,
  onClose,
  recipients = [],
  defaultType = "sms",
  onSent,
  relatedAppointmentId,
  category = "General",
  allowPatientSelection = false,
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [messageType, setMessageType] = useState<"sms" | "email">(defaultType);
  const [messageCategory, setMessageCategory] = useState<
    "General" | "Appointment" | "Medical" | "Billing" | "Administrative"
  >(category);
  const [selectedRecipients, setSelectedRecipients] =
    useState<Recipient[]>(recipients);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<MessageTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<
    Record<string, string>
  >({});
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [templateDraft, setTemplateDraft] =
    useState<UpsertMessageTemplateInput | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<Date | null>(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // Fetch patients for selection
  const { data: patientsData } = useQuery({
    queryKey: ["patients-for-messaging"],
    queryFn: async () => {
      const response = await fetch("/api/patients?limit=200");
      if (!response.ok) throw new Error("Failed to fetch patients");
      return response.json();
    },
    enabled: allowPatientSelection && open,
  });

  const patients = useMemo(() => {
    if (!patientsData?.items) return [];
    return patientsData.items.map((p: any) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      phone: p.phone,
      type: "patient" as const,
    }));
  }, [patientsData]);

  const { data: templateResult, isLoading: templatesLoading } =
    useQuery<MessageTemplateListResult>({
      queryKey: ["message-templates"],
      queryFn: () => messageTemplatesApi.list(),
      staleTime: 5 * 60 * 1000,
    });

  const templates = useMemo(
    () => templateResult?.templates ?? defaultMessageTemplates,
    [templateResult],
  );
  const canManageTemplates = templateResult?.source === "api";
  const filteredTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          template.channel === "both" || template.channel === messageType,
      ),
    [templates, messageType],
  );

  useEffect(() => {
    if (open) {
      setMessageType(defaultType);
    }
  }, [defaultType, open]);

  useEffect(() => {
    if (!open) {
      setSelectedTemplate(null);
      setTemplateVariables({});
      setMessage("");
      setSubject("");
      setMessageCategory(category);
      setError(null);
      setSuccess(false);
      setTemplateManagerOpen(false);
      setTemplateDraft(null);
    }
  }, [open, category]);

  useEffect(() => {
    if (
      selectedTemplate &&
      !(
        selectedTemplate.channel === "both" ||
        selectedTemplate.channel === messageType
      )
    ) {
      setSelectedTemplate(null);
      setTemplateVariables({});
    }
  }, [messageType, selectedTemplate]);

  useEffect(() => {
    if (selectedTemplate && recipients.length) {
      const initialVars = buildInitialVariables(selectedTemplate, recipients);
      setTemplateVariables(initialVars);
      setMessage(renderTemplateContent(selectedTemplate.content, initialVars));
    }
  }, [recipients, selectedTemplate]);

  const handleTemplateSelect = (template: MessageTemplate | null) => {
    setSelectedTemplate(template);
    if (!template) {
      setTemplateVariables({});
      return;
    }

    const initialVars = buildInitialVariables(template, recipients);
    setTemplateVariables(initialVars);
    setMessage(renderTemplateContent(template.content, initialVars));
    if (template.subject && messageType === "email") {
      setSubject(template.subject);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    const next = { ...templateVariables, [variable]: value };
    setTemplateVariables(next);
    if (selectedTemplate) {
      setMessage(renderTemplateContent(selectedTemplate.content, next));
    }
  };

  const handleTemplateManagerClose = () => {
    setTemplateManagerOpen(false);
    setTemplateDraft(null);
  };

  const handleManageTemplates = () => {
    if (!canManageTemplates) {
      enqueueSnackbar(
        "Templates are read-only until the backend exposes message template endpoints.",
        {
          variant: "info",
        },
      );
      return;
    }
    setTemplateDraft(null);
    setTemplateManagerOpen(true);
  };

  const handleSaveTemplateRequested = () => {
    if (!canManageTemplates) {
      enqueueSnackbar(
        "Templates are read-only until the backend exposes message template endpoints.",
        {
          variant: "info",
        },
      );
      return;
    }

    if (!message.trim()) {
      enqueueSnackbar("Compose your message before saving it as a template.", {
        variant: "warning",
      });
      return;
    }

    setTemplateDraft({
      name: subject || "New template",
      content: message,
      subject: messageType === "email" ? subject : null,
      channel: messageType,
    });
    setTemplateManagerOpen(true);
  };

  const createTemplateMutation = useMutation({
    mutationFn: (input: UpsertMessageTemplateInput) =>
      messageTemplatesApi.create(input),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      enqueueSnackbar("Template saved", { variant: "success" });
      setSelectedTemplate(template);
      const initialVars = buildInitialVariables(template, recipients);
      setTemplateVariables(initialVars);
      setMessage(renderTemplateContent(template.content, initialVars));
      handleTemplateManagerClose();
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err, "Failed to save template"), {
        variant: "error",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpsertMessageTemplateInput;
    }) => messageTemplatesApi.update(id, input),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      enqueueSnackbar("Template updated", { variant: "success" });
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(template);
        const mergedVariables = buildInitialVariables(template, recipients);
        const values = template.variables.reduce<Record<string, string>>(
          (accumulator, key) => {
            accumulator[key] =
              templateVariables[key] ?? mergedVariables[key] ?? "";
            return accumulator;
          },
          {},
        );
        setTemplateVariables(values);
        setMessage(renderTemplateContent(template.content, values));
        if (template.subject && messageType === "email") {
          setSubject(template.subject);
        }
      }
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err, "Failed to update template"), {
        variant: "error",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => messageTemplatesApi.remove(id),
    onSuccess: (_, templateId) => {
      queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      enqueueSnackbar("Template deleted", { variant: "success" });
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setTemplateVariables({});
      }
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err, "Failed to delete template"), {
        variant: "error",
      });
    },
  });

  const handleCreateTemplate = async (input: UpsertMessageTemplateInput) => {
    await createTemplateMutation.mutateAsync(input);
  };

  const handleUpdateTemplate = async (
    id: string,
    input: UpsertMessageTemplateInput,
  ) => {
    await updateTemplateMutation.mutateAsync({ id, input });
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplateMutation.mutateAsync(id);
  };

  const ensureRecipient = (): Recipient | null => {
    const recipientList = allowPatientSelection
      ? selectedRecipients
      : recipients;

    if (!recipientList.length) {
      setError("Please select at least one recipient");
      return null;
    }

    const primary = recipientList[0];
    if (!primary?.id) {
      setError("Recipient is missing an identifier.");
      return null;
    }

    return primary as Recipient;
  };

  const handleSend = async () => {
    setError(null);
    setSending(true);

    try {
      const primaryRecipient = ensureRecipient();
      if (!primaryRecipient) {
        setSending(false);
        return;
      }

      const response = await messagesApi.send({
        recipientId: primaryRecipient.id,
        content: message,
        subject: messageType === "email" ? subject : undefined,
        messageType: messageCategory,
        priority: "Normal",
        relatedAppointmentId: relatedAppointmentId,
        scheduledFor: scheduleFor?.toISOString(),
      });

      setSuccess(true);
      if (onSent) {
        onSent(response);
      }

      setTimeout(() => {
        onClose();
        // Reset form
        setMessage("");
        setSubject("");
        setMessageCategory(category);
        setSelectedTemplate(null);
        setTemplateVariables({});
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send message"));
    } finally {
      setSending(false);
    }
  };

  const canSend = () => {
    if (messageType === "email" && !subject) return false;
    if (!message) return false;
    if (recipients.length === 0) return false;
    if (!recipients[0]?.id) return false;
    return true;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          {allowPatientSelection && recipients.length === 0 ? (
            <Autocomplete
              multiple
              options={patients}
              getOptionLabel={(option) => option.name}
              value={selectedRecipients}
              onChange={(_, newValue) => setSelectedRecipients(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Patients"
                  placeholder="Search patients..."
                  margin="normal"
                  required
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      {...tagProps}
                      avatar={<Avatar>{option.name[0]}</Avatar>}
                      label={option.name}
                      size="small"
                      color="primary"
                    />
                  );
                })
              }
            />
          ) : (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Recipients ({recipients.length})
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {recipients.map((recipient) => (
                  <Chip
                    key={recipient.id}
                    avatar={<Avatar>{recipient.name[0]}</Avatar>}
                    label={recipient.name}
                    size="small"
                    color={
                      recipient.type === "patient" ? "primary" : "secondary"
                    }
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Message Category */}
          <TextField
            select
            label="Category"
            value={messageCategory}
            onChange={(e) => setMessageCategory(e.target.value as any)}
            fullWidth
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="General">General</option>
            <option value="Appointment">Appointment</option>
            <option value="Medical">Medical</option>
            <option value="Billing">Billing</option>
            <option value="Administrative">Administrative</option>
          </TextField>

          {/* Appointment Context Indicator */}
          {relatedAppointmentId && (
            <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
              This message will be linked to appointment #
              {relatedAppointmentId.slice(0, 8)}
            </Alert>
          )}

          {/* Template Selector */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: 2 }}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Autocomplete
              options={filteredTemplates}
              loading={templatesLoading}
              getOptionLabel={(option) => option.name}
              value={selectedTemplate}
              onChange={(_, value) => handleTemplateSelect(value)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Message Template (Optional)"
                  margin="normal"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {templatesLoading ? (
                          <LoadingSpinner size={18} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ flex: 1 }}
            />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Tooltip
                title={
                  canManageTemplates
                    ? "Manage saved templates"
                    : "Templates are read-only until the message template API is available."
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<ManageHistoryIcon />}
                    onClick={handleManageTemplates}
                    disabled={!canManageTemplates || templatesLoading}
                    fullWidth
                  >
                    Manage
                  </Button>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  canManageTemplates
                    ? "Save the current message as a reusable template"
                    : "Templates are read-only until the message template API is available."
                }
              >
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveTemplateRequested}
                    disabled={!canManageTemplates || !message.trim()}
                    fullWidth
                  >
                    Save as template
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Template Variables */}
          {selectedTemplate && Object.keys(templateVariables).length > 0 && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                bgcolor: "background.default",
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Template Variables
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {(selectedTemplate.variables?.length
                  ? selectedTemplate.variables
                  : Object.keys(templateVariables)
                ).map((variable) => (
                  <TextField
                    key={variable}
                    label={variable}
                    value={templateVariables[variable] || ""}
                    onChange={(e) =>
                      handleVariableChange(variable, e.target.value)
                    }
                    size="small"
                    sx={{ flex: 1, minWidth: 150 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Subject (Email only) */}
          {messageType === "email" && (
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
            rows={messageType === "email" ? 8 : 4}
            fullWidth
            margin="normal"
            required
            helperText={
              messageType === "sms"
                ? `${message.length}/160 characters (${Math.ceil(message.length / 160)} SMS)`
                : null
            }
          />

          {/* Schedule Option */}
          <Box sx={{ mt: 2 }}>
            <Button
              startIcon={<ScheduleIcon />}
              variant={scheduleFor ? "contained" : "outlined"}
              size="small"
              onClick={() => setShowSchedulePicker(!showSchedulePicker)}
            >
              {scheduleFor 
                ? `Scheduled for ${scheduleFor.toLocaleString()}`
                : "Schedule for later"}
            </Button>
            {scheduleFor && (
              <Button
                size="small"
                onClick={() => setScheduleFor(null)}
                sx={{ ml: 1 }}
              >
                Clear
              </Button>
            )}
          </Box>

          {showSchedulePicker && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box sx={{ mt: 2 }}>
                <DateTimePicker
                  label="Schedule send time"
                  value={scheduleFor}
                  onChange={(newValue) => {
                    setScheduleFor(newValue);
                    setShowSchedulePicker(false);
                  }}
                  minDateTime={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </Box>
            </LocalizationProvider>
          )}

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
            startIcon={sending ? <LoadingSpinner size={20} /> : <SendIcon />}
          >
            {sending ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      <MessageTemplateManager
        open={templateManagerOpen}
        onClose={handleTemplateManagerClose}
        templates={templates}
        initialDraft={templateDraft}
        onCreate={handleCreateTemplate}
        onUpdate={handleUpdateTemplate}
        onDelete={handleDeleteTemplate}
        saving={createTemplateMutation.isPending}
        updating={updateTemplateMutation.isPending}
        removing={deleteTemplateMutation.isPending}
        loading={templatesLoading}
      />
    </>
  );
};

export default MessageComposer;
