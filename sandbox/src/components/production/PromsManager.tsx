import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Stack,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Send as SendIcon,
  Preview as PreviewIcon,
  ContentCopy as CopyIcon,
  Archive as ArchiveIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notes as NotesIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { addDays, format, parseISO, isAfter, isBefore } from 'date-fns';
import {
  promTemplates,
  promResponseSummaries,
  promPatients,
  buildStatusChartData,
  buildTrendData,
  summarizePromResponses,
  findTemplateById,
  findResponseById,
  PromTemplateDetail,
  PromResponseDetail,
  PromResponseSummary,
  StatusChartDatum,
  TrendChartDatum,
} from '../../data/promMockData';
import PROMBuilder from './PROMBuilder';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { usePromAnalytics } from '../../context/PromAnalyticsContext';
import { useSnackbar } from 'notistack';

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  if (value !== index) {
    return null;
  }

  return (
    <Box sx={{ pt: 3 }}>
      {children}
    </Box>
  );
};

const statusChipColor = (status: PromResponseSummary['status']): 'success' | 'default' | 'warning' | 'info' | 'error' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'in-progress':
      return 'info';
    case 'expired':
      return 'error';
    default:
      return 'default';
  }
};

const channelIcon = (channel: PromResponseSummary['channel']) => {
  switch (channel) {
    case 'email':
      return <EmailIcon fontSize="small" />;
    case 'sms':
      return <SmsIcon fontSize="small" />;
    default:
      return <AssignmentIcon fontSize="small" />;
  }
};

const formatDate = (isoDate?: string) => {
  if (!isoDate) {
    return '—';
  }
  try {
    return format(parseISO(isoDate), 'MMM d, yyyy');
  } catch (error) {
    return '—';
  }
};

const PromPreviewDialog: React.FC<{
  templateId: string | null;
  open: boolean;
  onClose: () => void;
}> = ({ templateId, open, onClose }) => {
  const template: PromTemplateDetail | undefined = templateId ? findTemplateById(templateId) : undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>PROM Preview</DialogTitle>
      <DialogContent dividers>
        {template ? (
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6">{template.name}</Typography>
              <Typography variant="body2" color="text.secondary">{template.description}</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip label={`Version ${template.version}`} size="small" />
              <Chip label={template.frequency.toUpperCase()} size="small" color="primary" />
              {template.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>
            <Divider />
            <Stack spacing={2}>
              {template.questions.map((question) => (
                <Paper key={question.id} sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Chip label={question.type.toUpperCase()} size="small" color="info" />
                    <Box>
                      <Typography variant="subtitle1">{question.label}</Typography>
                      {question.description && (
                        <Typography variant="body2" color="text.secondary">{question.description}</Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {question.required ? 'Required' : 'Optional'}
                      </Typography>
                      {question.type === 'scale' && (
                        <Typography variant="body2" color="text.secondary">
                          Scale {question.min} – {question.max} ({question.scaleLabels?.min} to {question.scaleLabels?.max})
                        </Typography>
                      )}
                      {(question.type === 'radio' || question.type === 'checkbox') && question.options && (
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                          {question.options.map((option) => (
                            <Chip key={option} label={option} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a template to preview
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<SendIcon />}>Send to Patient</Button>
      </DialogActions>
    </Dialog>
  );
};

interface ResponseDialogProps {
  responseId: string | null;
  open: boolean;
  onClose: () => void;
}

const PromResponseDialog: React.FC<ResponseDialogProps> = ({ responseId, open, onClose }) => {
  const response: PromResponseDetail | undefined = responseId ? findResponseById(responseId) : undefined;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Response Details
        {response && (
          <Chip
            label={response.status}
            color={statusChipColor(response.status)}
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </DialogTitle>
      <DialogContent dividers>
        {response ? (
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2">Patient</Typography>
                <Typography variant="body2">{response.patientName}</Typography>
                <Typography variant="body2">Template: {response.templateName}</Typography>
                <Typography variant="body2">Assigned: {formatDate(response.assignedAt)}</Typography>
                {response.completedAt && (
                  <Typography variant="body2">Completed: {formatDate(response.completedAt)}</Typography>
                )}
                {typeof response.score === 'number' && (
                  <Typography variant="body2">Score: {response.score}%</Typography>
                )}
              </Stack>
            </Paper>

            <Typography variant="h6">Responses</Typography>
            {response.responses.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No answers recorded yet.</Typography>
            ) : (
              <Stack spacing={1}>
                {response.responses.map((entry) => (
                  <Paper key={entry.question} sx={{ p: 2 }}>
                    <Typography variant="subtitle2">{entry.question}</Typography>
                    <Typography variant="body1">
                      {Array.isArray(entry.answer) ? entry.answer.join(', ') : String(entry.answer)}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}

            {response.notes && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                <Typography variant="body2">{response.notes}</Typography>
              </Paper>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Select a response to view the detailed answers.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {response?.status === 'pending' && (
          <Button variant="contained" startIcon={<EmailIcon />}>Send Reminder</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

interface SendDialogProps {
  open: boolean;
  templateId: string | null;
  onClose: () => void;
}

const PromSendDialog: React.FC<SendDialogProps> = ({ open, templateId, onClose }) => {
  const template = templateId ? findTemplateById(templateId) : undefined;
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<'immediate' | 'scheduled' | 'recurring'>('immediate');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const { assignProm } = usePromAnalytics();
  const { enqueueSnackbar } = useSnackbar();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelectedPatients([]);
      setSchedule('immediate');
      setScheduledDate(new Date());
      setSending(false);
    }
  }, [open]);

  const togglePatient = (id: string) => {
    setSelectedPatients((prev) =>
      prev.includes(id) ? prev.filter((patientId) => patientId !== id) : [...prev, id]
    );
  };

  const handleSend = () => {
    if (!template || selectedPatients.length === 0) {
      return;
    }

    setSending(true);
    const now = new Date();
    const scheduledFor = schedule === 'immediate' ? now : scheduledDate ?? now;
    const dueDate = addDays(scheduledFor, 7);

    selectedPatients.forEach((patientId) => {
      const patient = promPatients.find((item) => item.id === patientId);
      assignProm({
        templateId: template.id,
        patientId,
        scheduleType: schedule,
        scheduledFor,
        dueDate,
        notes: undefined,
      });
      if (patient) {
        enqueueSnackbar(`Scheduled ${template.name} for ${patient.name}`, { variant: 'success' });
      }
    });

    setSending(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Send PROM Questionnaire</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2">Template</Typography>
            <Typography variant="body1">{template?.name ?? 'Select a template from the list to send'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {template?.description ?? 'Choose a template to see additional details.'}
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>Select patients</Typography>
            <Stack spacing={1}>
              {promPatients.map((patient) => {
                const isSelected = selectedPatients.includes(patient.id);
                return (
                  <Paper
                    key={patient.id}
                    sx={{
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: isSelected ? 2 : 1,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                    }}
                    onClick={() => togglePatient(patient.id)}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: patient.avatarColor }}>{patient.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle1">{patient.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{patient.email}</Typography>
                      </Box>
                    </Stack>
                    <Chip
                      label={`${patient.lastPromStatus} · ${patient.lastPromDate}`}
                      size="small"
                      color={statusChipColor(patient.lastPromStatus)}
                    />
                  </Paper>
                );
              })}
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom>Schedule</Typography>
            <Stack direction="row" spacing={1}>
              {(['immediate', 'scheduled', 'recurring'] as const).map((option) => (
                <Chip
                  key={option}
                  label={option.toUpperCase()}
                  color={schedule === option ? 'primary' : 'default'}
                  onClick={() => setSchedule(option)}
                  clickable
                />
              ))}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {schedule === 'immediate' && 'Sends immediately and reminds patients via their preferred channel.'}
              {schedule === 'scheduled' && 'Choose a date in the future when the PROM will be released to the selected patients.'}
              {schedule === 'recurring' && 'Configure recurring cadence in the production app. In this sandbox we show the layout only.'}
            </Typography>
            {schedule === 'scheduled' && (
              <Box sx={{ mt: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Send date & time"
                    value={scheduledDate}
                    onChange={(value) => setScheduledDate(value)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Box>
            )}
            {schedule === 'recurring' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Recurring delivery cadence is simulated in the sandbox. Use scheduled sends to preview booking behaviour.
              </Alert>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          disabled={!template || selectedPatients.length === 0 || sending}
          onClick={handleSend}
        >
          Send PROM
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PromsManager: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | PromResponseSummary['status']>('all');
  const [startDate, setStartDate] = useState<Date | null>(parseISO(promResponseSummaries[0]?.assignedAt ?? new Date().toISOString()));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendTemplateId, setSendTemplateId] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);

  const { bookings } = usePromAnalytics();
  const statusChart: StatusChartDatum[] = useMemo(() => buildStatusChartData(promResponseSummaries), []);
  const trendData: TrendChartDatum[] = useMemo(() => buildTrendData(promResponseSummaries), []);
  const summary = useMemo(() => summarizePromResponses(promResponseSummaries), []);

  const filteredResponses = useMemo(() => {
    return promResponseSummaries.filter((response) => {
      const matchesStatus = statusFilter === 'all' || response.status === statusFilter;
      const assignedAt = response.assignedAt ? parseISO(response.assignedAt) : null;

      const afterStart = !startDate || (assignedAt && !isBefore(assignedAt, startDate));
      const beforeEnd = !endDate || (assignedAt && !isAfter(assignedAt, endDate));

      return matchesStatus && afterStart && beforeEnd;
    });
  }, [statusFilter, startDate, endDate]);

  const paginatedResponses = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredResponses.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredResponses, page, rowsPerPage]);

  const handleViewResponse = (responseId: string) => {
    setSelectedResponseId(responseId);
    setResponseDialogOpen(true);
  };

  const handleTabChange = (_event: React.SyntheticEvent, value: number) => {
    setCurrentTab(value);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Patient Reported Outcome Measures
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review template library, monitor response status, and preview the builder layout used in production.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Responses</Typography>
                    <Typography variant="h4">{summary.total}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AssignmentIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">Completion Rate</Typography>
                    <Typography variant="h4">{summary.completionRate.toFixed(1)}%</Typography>
                  </Box>
                  <CircularProgress
                    variant="determinate"
                    value={summary.completionRate}
                    size={52}
                    thickness={4}
                    sx={{ color: 'success.main' }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">Pending</Typography>
                    <Typography variant="h4">{summary.pending}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <PendingIcon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">Upcoming &amp; Streak</Typography>
                  <Typography variant="body2">Next Due: {summary.nextDue ?? '—'}</Typography>
                  <Typography variant="body2">Last Completed: {summary.lastCompleted ?? '—'}</Typography>
                  <Chip label={`Streak: ${summary.streak} days`} size="small" color={summary.streak > 0 ? 'success' : 'default'} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper>
          <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Templates" icon={<AssignmentIcon />} iconPosition="start" />
            <Tab label="Responses" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="Analytics" icon={<CheckCircleIcon />} iconPosition="start" />
            <Tab label="Builder" icon={<NotesIcon />} iconPosition="start" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
              <Typography variant="h6">PROM Templates</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => {
                    setSendTemplateId(promTemplates[0]?.id ?? null);
                    setSendDialogOpen(true);
                  }}
                >
                  Send PROM
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />}>Refresh</Button>
              </Stack>
            </Stack>

            <Grid container spacing={3}>
              {promTemplates.map((template) => (
                <Grid item xs={12} md={6} lg={4} key={template.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>{template.name.charAt(0)}</Avatar>
                          <Box>
                            <Typography variant="h6">{template.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {template.description}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip label={`${template.questionCount} questions`} size="small" variant="outlined" />
                          <Chip label={template.frequency.toUpperCase()} size="small" color="primary" />
                          <Chip label={`v${template.version}`} size="small" />
                          <Chip
                            label={template.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            color={template.isActive ? 'success' : 'default'}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Last distributed {formatDate(template.lastDistributed)}
                        </Typography>
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" startIcon={<PreviewIcon />} onClick={() => setPreviewTemplateId(template.id)}>
                          Preview
                        </Button>
                        <Button size="small" startIcon={<SendIcon />} onClick={() => {
                          setSendTemplateId(template.id);
                          setSendDialogOpen(true);
                        }}>
                          Send
                        </Button>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Duplicate">
                          <IconButton size="small">
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={template.isActive ? 'Archive' : 'Activate'}>
                          <IconButton size="small">
                            <ArchiveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Paper sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                <Box>
                  <Typography variant="subtitle1">Upcoming bookings</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Automatically created when a PROM is scheduled
                  </Typography>
                </Box>
                <Chip label={`${bookings.length} booked`} color="primary" />
              </Stack>

              {bookings.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No bookings created yet. Use “Send PROM” to schedule outreach.
                </Typography>
              ) : (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {bookings.slice(0, 4).map((booking) => (
                    <Paper key={booking.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="subtitle2">{booking.patientName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {booking.templateName}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" label={booking.scheduleType.toUpperCase()} />
                          <Chip
                            size="small"
                            color={booking.status === 'completed' ? 'success' : booking.status === 'sent' ? 'info' : 'warning'}
                            label={booking.status === 'completed' ? 'Completed' : booking.status === 'sent' ? 'Sent' : 'Scheduled'}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {format(parseISO(booking.scheduledFor), 'MMM d, yyyy h:mm a')}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }}>
                <Typography variant="h6">Responses</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Status Filter</InputLabel>
                    <Select
                      label="Status Filter"
                      value={statusFilter}
                      onChange={(event) => {
                        setStatusFilter(event.target.value as typeof statusFilter);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="all">All statuses</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="expired">Expired</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                  <DatePicker
                    label="From"
                    value={startDate}
                    onChange={(value) => setStartDate(value)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DatePicker
                    label="To"
                    value={endDate}
                    onChange={(value) => setEndDate(value)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Stack>
              </Stack>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Template</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Assigned</TableCell>
                      <TableCell>Due</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedResponses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Box sx={{ py: 4 }} textAlign="center">
                            <Typography variant="body2" color="text.secondary">
                              No responses match the selected filters.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                    {paginatedResponses.map((response) => (
                      <TableRow key={response.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Avatar sx={{ bgcolor: response.avatarColor }}>{response.patientName.charAt(0)}</Avatar>
                            <Box>
                              <Typography variant="body2">{response.patientName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {channelIcon(response.channel)} via {response.channel}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>{response.templateName}</TableCell>
                        <TableCell>
                          <Chip label={response.status} color={statusChipColor(response.status)} size="small" />
                        </TableCell>
                        <TableCell>{typeof response.score === 'number' ? `${response.score}%` : '—'}</TableCell>
                        <TableCell>{formatDate(response.assignedAt)}</TableCell>
                        <TableCell>{formatDate(response.dueAt)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="View details">
                            <IconButton size="small" onClick={() => handleViewResponse(response.id)}>
                              <PreviewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {response.status === 'pending' && (
                            <Tooltip title="Send reminder">
                              <IconButton size="small">
                                <EmailIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={filteredResponses.length}
                  page={page}
                  onPageChange={(_event, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </TableContainer>
            </Stack>
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Response distribution</Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={statusChart} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90}>
                        {statusChart.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Completion trends</Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="responses" stroke="#1976d2" name="Responses" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#2e7d32" name="Avg Score" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>Template performance highlights</Typography>
                  <Stack spacing={1}>
                    {promTemplates.map((template) => (
                      <Stack key={template.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                        <Box>
                          <Typography variant="subtitle2">{template.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Last distributed {formatDate(template.lastDistributed)} • {template.questionCount} questions
                          </Typography>
                        </Box>
                        <Chip label={`${template.estimatedTime} min`} size="small" />
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            <PROMBuilder />
          </TabPanel>
        </Paper>
      </Stack>

      <PromPreviewDialog
        open={Boolean(previewTemplateId)}
        templateId={previewTemplateId}
        onClose={() => setPreviewTemplateId(null)}
      />

      <PromSendDialog
        open={sendDialogOpen}
        templateId={sendTemplateId}
        onClose={() => {
          setSendDialogOpen(false);
          setSendTemplateId(null);
        }}
      />

      <PromResponseDialog
        open={responseDialogOpen}
        responseId={selectedResponseId}
        onClose={() => {
          setResponseDialogOpen(false);
          setSelectedResponseId(null);
        }}
      />
    </LocalizationProvider>
  );
};

export default PromsManager;
