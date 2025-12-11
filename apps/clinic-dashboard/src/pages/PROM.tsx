import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Stack,
  Divider,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  QuestionAnswer as QuestionIcon,
  BarChart as ChartIcon,
  VerifiedUser as VerifiedIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  promApi,
  PromTemplateSummary,
  PromResponse,
  PromResponsesResult,
  PromAnswerValue,
} from '../services/promApi';
import { PROMSender } from '../components/messaging';
import { PromBuilder } from '../features/proms/components/PromBuilder';
import { PromPreview } from '../components/messaging/PromPreview';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  PageHeader,
  SectionLoader,
  StatusBadge,
  AuraGlassStatCard,
  InfoCard,
  StatCardSkeleton,
  AuraEmptyState,
  TableLabelDisplayedRows,
  Callout,
  AuraButton,
  AuraCard,
  auraColors,
  glassTokens,
  FormDialog,
  FilterToolbar,
  ConfirmDialog,
  AuraGlassChartCard,
} from '@qivr/design-system';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`prom-tabpanel-${index}`}
      aria-labelledby={`prom-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const PROM: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();

  const [currentTab, setCurrentTab] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendTemplateId, setSendTemplateId] = useState<string | null>(null);
  const [initialPatientId, setInitialPatientId] = useState<string | null>(null);

  // Handle action=send&patientId query params
  useEffect(() => {
    const action = searchParams.get('action');
    const patientId = searchParams.get('patientId');
    if (action === 'send' && patientId) {
      setInitialPatientId(patientId);
      setSendDialogOpen(true);
      // Clear the params from URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [selectedResponse, setSelectedResponse] = useState<PromResponse | null>(null);
  const [responseDetailOpen, setResponseDetailOpen] = useState(false);
  const [responseDetailLoading, setResponseDetailLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: null as Date | null,
    end: null as Date | null,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [builderDialogOpen, setBuilderDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    template: PromTemplateSummary | null;
  }>({ open: false, template: null });

  // Fetch templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
    refetch: refetchTemplates,
  } = useQuery<PromTemplateSummary[]>({
    queryKey: ['prom-templates'],
    queryFn: () => promApi.getTemplates({ isActive: true }),
  });

  const templates: PromTemplateSummary[] = templatesData || [];

  // Split templates into validated (has instrumentId) vs custom
  const validatedTemplates = templates.filter((t) => t.instrumentId || t.instrumentKey);
  const customTemplates = templates.filter((t) => !t.instrumentId && !t.instrumentKey);

  // Fetch responses
  const {
    data: responsesData,
    isLoading: responsesLoading,
    refetch: refetchResponses,
  } = useQuery<PromResponsesResult>({
    queryKey: ['prom-responses', filterStatus, dateRange, page, rowsPerPage],
    queryFn: () =>
      promApi.getResponses({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        startDate: dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : undefined,
        endDate: dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : undefined,
        page: page + 1,
        limit: rowsPerPage,
      }),
  });

  const responses = responsesData?.data ?? [];
  const totalResponses = responsesData?.total ?? 0;
  const aggregateStats = responsesData?.stats;

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => promApi.deleteTemplate(templateId),
    onSuccess: () => {
      enqueueSnackbar('Template deleted successfully', { variant: 'success' });
      refetchTemplates();
    },
    onError: () => {
      enqueueSnackbar('Failed to delete template', { variant: 'error' });
    },
  });

  // Calculate statistics
  const statistics = {
    total: aggregateStats?.total ?? responses.length,
    completed:
      aggregateStats?.completedCount ?? responses.filter((r) => r.status === 'completed').length,
    pending: aggregateStats?.pendingCount ?? responses.filter((r) => r.status === 'pending').length,
    inProgress:
      aggregateStats?.inProgressCount ?? responses.filter((r) => r.status === 'in-progress').length,
    expired: aggregateStats?.expiredCount ?? responses.filter((r) => r.status === 'expired').length,
    cancelled:
      aggregateStats?.cancelledCount ?? responses.filter((r) => r.status === 'cancelled').length,
  };

  const fallbackAverageScore = () => {
    const scored = responses.filter((item) => typeof item.score === 'number');
    if (!scored.length) return 0;
    const totalScore = scored.reduce((total, item) => total + (item.score ?? 0), 0);
    return Math.round((totalScore / scored.length) * 100) / 100;
  };

  const averageScore = aggregateStats?.averageScore ?? fallbackAverageScore();

  const completionRate =
    aggregateStats?.completionRate ??
    (statistics.total > 0 ? Math.round((statistics.completed / statistics.total) * 1000) / 10 : 0);

  const nextDueDate = aggregateStats?.nextDue;
  const lastCompletedDate = aggregateStats?.lastCompleted;
  const streak = aggregateStats?.streak ?? 0;

  const formatDate = (value?: string) => {
    if (!value) return '—';
    try {
      return format(parseISO(value), 'MMM dd, yyyy');
    } catch {
      return '—';
    }
  };

  // Chart data - using design system colors
  const statusChartData = [
    {
      name: 'Completed',
      value: statistics.completed,
      color: auraColors.green.main,
    },
    {
      name: 'Pending',
      value: statistics.pending,
      color: auraColors.orange.main,
    },
    {
      name: 'In Progress',
      value: statistics.inProgress,
      color: auraColors.blue.main,
    },
    { name: 'Expired', value: statistics.expired, color: auraColors.red.main },
    {
      name: 'Cancelled',
      value: statistics.cancelled,
      color: auraColors.grey[500],
    },
  ];

  // Type for trends data accumulator
  interface TrendsDataItem {
    date: string;
    count: number;
    totalScore: number;
    scoreCount: number;
    avgScore?: number;
  }

  const trendsData = responses
    .reduce((acc: TrendsDataItem[], response: PromResponse) => {
      if (response.completedAt) {
        const date = format(parseISO(response.completedAt), 'MMM dd');
        const existing = acc.find((item) => item.date === date);
        if (existing) {
          existing.count += 1;
          if (response.score) {
            existing.totalScore += response.score;
            existing.scoreCount += 1;
          }
        } else {
          acc.push({
            date,
            count: 1,
            totalScore: response.score || 0,
            scoreCount: response.score ? 1 : 0,
          });
        }
      }
      return acc;
    }, [])
    .map((item) => ({
      ...item,
      avgScore: item.scoreCount > 0 ? Math.round(item.totalScore / item.scoreCount) : 0,
    }));

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleDeleteTemplateClick = (template: PromTemplateSummary) => {
    setDeleteConfirm({ open: true, template });
  };

  const handleDeleteTemplateConfirm = () => {
    if (deleteConfirm.template) {
      deleteTemplateMutation.mutate(deleteConfirm.template.id);
    }
    setDeleteConfirm({ open: false, template: null });
  };

  const handleViewResponse = async (response: PromResponse) => {
    setResponseDetailLoading(true);
    setResponseDetailOpen(true);
    setSelectedResponse(null);

    try {
      const detailed = await promApi.getResponse(response.id);
      setSelectedResponse(detailed);
    } catch (error) {
      console.error('Failed to load response details', error);
      setSelectedResponse(response);
      enqueueSnackbar('Unable to load full response details; showing cached data.', {
        variant: 'warning',
      });
    } finally {
      setResponseDetailLoading(false);
    }
  };

  const handleCloseResponseDetail = () => {
    setResponseDetailOpen(false);
    setSelectedResponse(null);
    setResponseDetailLoading(false);
  };

  const renderAnswerValue = (answer: PromAnswerValue): React.ReactNode => {
    if (answer === null || answer === undefined) {
      return '—';
    }

    if (Array.isArray(answer)) {
      return answer.length ? answer.join(', ') : '—';
    }

    if (answer instanceof Date) {
      return format(answer, 'PPP');
    }

    if (typeof answer === 'object') {
      return (
        <Box component="pre" sx={{ m: 0, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(answer, null, 2)}
        </Box>
      );
    }

    if (typeof answer === 'boolean') {
      return answer ? 'Yes' : 'No';
    }

    return answer;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="page-enter" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <PageHeader
          title="Patient Reported Outcome Measures (PROM)"
          description="Manage questionnaires and track patient-reported outcomes"
        />

        {/* Statistics Cards */}
        {responsesLoading ? (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraGlassStatCard
                title="Total Responses"
                value={statistics.total}
                icon={<AssignmentIcon />}
                color="primary.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraGlassStatCard
                title="Completion Rate"
                value={`${completionRate.toFixed(1)}%`}
                icon={<ChartIcon />}
                color="success.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraGlassStatCard
                title="Pending"
                value={statistics.pending}
                icon={<PendingIcon />}
                color="warning.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraGlassStatCard
                title="Active Templates"
                value={templates.length}
                icon={<QuestionIcon />}
                color="info.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraGlassStatCard
                title="In Progress"
                value={statistics.inProgress}
                icon={<ScheduleIcon />}
                color="secondary.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraGlassStatCard
                title="Cancelled"
                value={statistics.cancelled}
                icon={<CancelIcon />}
                color="grey.600"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraGlassStatCard
                title="Average Score"
                value={averageScore.toFixed(1)}
                icon={<AssessmentIcon />}
                color="info.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <InfoCard title="Upcoming & Streak">
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Next Due:</strong> {formatDate(nextDueDate)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Last Completed:</strong> {formatDate(lastCompletedDate)}
                  </Typography>
                  <Chip
                    label={`Streak: ${streak} day${streak === 1 ? '' : 's'}`}
                    color={streak > 0 ? 'success' : 'default'}
                    size="small"
                  />
                </Stack>
              </InfoCard>
            </Grid>
          </Grid>
        )}

        {/* Main Content Tabs */}
        <Paper
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Validated PROMs" icon={<VerifiedIcon />} iconPosition="start" />
            <Tab label="Custom Templates" icon={<BuildIcon />} iconPosition="start" />
            <Tab label="Responses" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="Analytics" icon={<ChartIcon />} iconPosition="start" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            {/* Validated PROMs Tab */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Box>
                  <Typography variant="h6">Clinically Validated PROMs</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Standardized, internationally validated questionnaires
                  </Typography>
                </Box>
                <AuraButton
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => setSendDialogOpen(true)}
                >
                  Send PROM
                </AuraButton>
              </Box>

              {templatesLoading ? (
                <SectionLoader minHeight={200} />
              ) : validatedTemplates.length === 0 ? (
                <AuraEmptyState
                  title="No validated PROMs available"
                  description="Contact your administrator to add clinically validated instruments"
                />
              ) : (
                <Grid container spacing={3}>
                  {validatedTemplates.map((template) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={template.id}>
                      <AuraCard
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="h6">{template.name}</Typography>
                            <Chip
                              label="Validated"
                              size="small"
                              color="success"
                              icon={<VerifiedIcon sx={{ fontSize: 14 }} />}
                            />
                          </Stack>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {template.description}
                          </Typography>
                          {template.instrumentKey && (
                            <Chip
                              label={template.instrumentKey}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                          )}
                          {template.category && (
                            <Chip label={template.category} size="small" variant="outlined" />
                          )}
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <AuraButton
                            size="small"
                            startIcon={<PreviewIcon />}
                            onClick={() => {
                              setPreviewTemplateId(template.id);
                              setPreviewOpen(true);
                            }}
                          >
                            Preview
                          </AuraButton>
                          <AuraButton
                            size="small"
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={() => {
                              setSendTemplateId(template.id);
                              setSendDialogOpen(true);
                            }}
                          >
                            Send
                          </AuraButton>
                        </Stack>
                      </AuraCard>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            {/* Custom Templates Tab */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 3,
                }}
              >
                <Box>
                  <Typography variant="h6">Custom Templates</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your own questionnaires for specific needs
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                  <AuraButton
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setBuilderDialogOpen(true)}
                  >
                    Create Template
                  </AuraButton>
                  <AuraButton
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => setSendDialogOpen(true)}
                  >
                    Send PROM
                  </AuraButton>
                </Stack>
              </Box>

              {templatesLoading ? (
                <SectionLoader minHeight={200} />
              ) : customTemplates.length === 0 ? (
                <AuraEmptyState
                  title="No custom templates yet"
                  description="Create your first custom PROM template to get started"
                  actionText="Create Template"
                  onAction={() => setBuilderDialogOpen(true)}
                />
              ) : (
                <Grid container spacing={3}>
                  {customTemplates.map((template) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={template.id}>
                      <AuraCard
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {template.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {template.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Version {template.version}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ mt: 1 }}
                          >
                            Created {format(new Date(template.createdAt), 'dd MMM yyyy')}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <AuraButton
                            size="small"
                            startIcon={<PreviewIcon />}
                            onClick={() => {
                              setPreviewTemplateId(template.id);
                              setPreviewOpen(true);
                            }}
                          >
                            Preview
                          </AuraButton>
                          <AuraButton
                            size="small"
                            startIcon={<SendIcon />}
                            onClick={() => {
                              setSendTemplateId(template.id);
                              setSendDialogOpen(true);
                            }}
                          >
                            Send
                          </AuraButton>
                          <Tooltip title="Delete Template" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteTemplateClick(template)}
                              aria-label="Delete template"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </AuraCard>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            {/* Responses Tab */}
            <Box>
              <FilterToolbar
                filters={[
                  {
                    key: 'status',
                    label: 'Status',
                    value: filterStatus,
                    options: [
                      { value: 'all', label: 'All' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'in-progress', label: 'In Progress' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'expired', label: 'Expired' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ],
                  },
                ]}
                onFilterChange={(key, value) => {
                  if (key === 'status') setFilterStatus(value);
                }}
                onClearAll={() => {
                  setFilterStatus('all');
                  setDateRange({ start: null, end: null });
                }}
                actions={
                  <>
                    <DatePicker
                      label="Start Date"
                      value={dateRange.start}
                      onChange={(newValue) =>
                        setDateRange((prev) => ({ ...prev, start: newValue }))
                      }
                      slotProps={{ textField: { size: 'small' } }}
                    />
                    <DatePicker
                      label="End Date"
                      value={dateRange.end}
                      onChange={(newValue) => setDateRange((prev) => ({ ...prev, end: newValue }))}
                      slotProps={{ textField: { size: 'small' } }}
                    />
                    <AuraButton
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => refetchResponses()}
                    >
                      Refresh
                    </AuraButton>
                  </>
                }
                showFilterChips={filterStatus !== 'all' || !!dateRange.start || !!dateRange.end}
              />

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Template</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Started</TableCell>
                      <TableCell>Completed</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {responsesLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <SectionLoader minHeight={100} />
                        </TableCell>
                      </TableRow>
                    ) : responses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ border: 0, p: 0 }}>
                          <AuraEmptyState
                            title="No responses found"
                            description="Send PROMs to patients to start collecting responses"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      responses.map((response: PromResponse) => (
                        <TableRow key={response.id}>
                          <TableCell>{response.patientName}</TableCell>
                          <TableCell>
                            {response.templateName || response.templateId || '—'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={response.status} />
                          </TableCell>
                          <TableCell>
                            {response.assignedAt
                              ? format(parseISO(response.assignedAt), 'MMM dd, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {response.completedAt
                              ? format(parseISO(response.completedAt), 'MMM dd, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {response.score !== undefined ? (
                              <Tooltip
                                title={
                                  response.rawScore !== undefined && response.maxScore !== undefined
                                    ? `Raw score: ${response.rawScore} / ${response.maxScore}`
                                    : 'Percentage score'
                                }
                              >
                                <Chip
                                  label={`${response.score.toFixed(1)}%`}
                                  color={response.score >= 70 ? 'success' : 'warning'}
                                  size="small"
                                />
                              </Tooltip>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Response" arrow>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  void handleViewResponse(response);
                                }}
                                aria-label="View response details"
                              >
                                <PreviewIcon />
                              </IconButton>
                            </Tooltip>
                            {response.status === 'pending' && (
                              <Tooltip title="Send Reminder" arrow>
                                <IconButton size="small" aria-label="Send reminder email">
                                  <EmailIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={totalResponses}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(_e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  labelDisplayedRows={({ from, to, count }) => (
                    <TableLabelDisplayedRows from={from} to={to} count={count} />
                  )}
                />
              </TableContainer>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            {/* Analytics Tab */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <AuraGlassChartCard title="Response Status Distribution">
                  <Box sx={{ position: 'relative' }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          animationDuration={500}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 12,
                            boxShadow: glassTokens.shadow.standard,
                          }}
                          formatter={(value: number) => [
                            `${value} (${statistics.total > 0 ? Math.round((value / statistics.total) * 100) : 0}%)`,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="h4" fontWeight={700} color="text.primary">
                        {completionRate.toFixed(0)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Complete
                      </Typography>
                    </Box>
                  </Box>
                  <Stack
                    direction="row"
                    flexWrap="wrap"
                    justifyContent="center"
                    gap={2}
                    sx={{ mt: 2 }}
                  >
                    {statusChartData
                      .filter((item) => item.value > 0)
                      .map((item) => (
                        <Stack key={item.name} direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              bgcolor: item.color,
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {item.name}: {item.value}
                          </Typography>
                        </Stack>
                      ))}
                  </Stack>
                </AuraGlassChartCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <AuraGlassChartCard title="Completion Trends">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendsData}>
                      <defs>
                        <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={auraColors.blue.main} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={auraColors.blue.main} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={auraColors.green.main} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={auraColors.green.main} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={theme.palette.divider}
                      />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                      />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 12,
                          boxShadow: glassTokens.shadow.standard,
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="count"
                        stroke={auraColors.blue.main}
                        strokeWidth={2}
                        name="Responses"
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgScore"
                        stroke={auraColors.green.main}
                        strokeWidth={2}
                        name="Avg Score"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </AuraGlassChartCard>
              </Grid>

              <Grid size={12}>
                <AuraGlassChartCard title="Template Performance">
                  <Callout variant="info">
                    Detailed analytics for individual templates and questions will be displayed here
                  </Callout>
                </AuraGlassChartCard>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>

        {/* Send PROM Dialog */}
        <FormDialog
          open={sendDialogOpen}
          onClose={() => {
            setSendDialogOpen(false);
            setSendTemplateId(null);
          }}
          title="Send PROM Questionnaire"
          maxWidth="md"
        >
          <PROMSender
            preSelectedTemplateId={sendTemplateId || undefined}
            preSelectedPatientId={initialPatientId || undefined}
            onComplete={() => {
              setSendDialogOpen(false);
              setSendTemplateId(null);
              setInitialPatientId(null);
              refetchResponses();
              enqueueSnackbar('PROM sent successfully', {
                variant: 'success',
              });
            }}
          />
        </FormDialog>

        <PromPreview
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewTemplateId(null);
          }}
          templateId={previewTemplateId || undefined}
        />

        {/* Response Detail Dialog */}
        <FormDialog
          open={responseDetailOpen}
          onClose={handleCloseResponseDetail}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              Response Details
              {selectedResponse && <StatusBadge status={selectedResponse.status} />}
            </Box>
          }
          maxWidth="md"
          onSubmit={
            !responseDetailLoading && selectedResponse?.status === 'pending'
              ? () => {
                  // TODO: Implement send reminder
                }
              : undefined
          }
          submitLabel={
            !responseDetailLoading && selectedResponse?.status === 'pending'
              ? 'Send Reminder'
              : undefined
          }
          formActionsProps={{
            cancelLabel: 'Close',
          }}
        >
          {responseDetailLoading ? (
            <SectionLoader minHeight={200} />
          ) : selectedResponse ? (
            <Box>
              <Stack spacing={2}>
                <Callout variant="info" title="Response Details">
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      <strong>Patient:</strong> {selectedResponse.patientName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Template:</strong>{' '}
                      {selectedResponse.templateName || selectedResponse.templateId}
                    </Typography>
                    {selectedResponse.assignedAt && (
                      <Typography variant="body2">
                        <strong>Assigned:</strong>{' '}
                        {format(parseISO(selectedResponse.assignedAt), 'PPP')}
                      </Typography>
                    )}
                    {selectedResponse.scheduledAt && (
                      <Typography variant="body2">
                        <strong>Scheduled:</strong>{' '}
                        {format(parseISO(selectedResponse.scheduledAt), 'PPP')}
                      </Typography>
                    )}
                    {selectedResponse.completedAt && (
                      <Typography variant="body2">
                        <strong>Completed:</strong>{' '}
                        {format(parseISO(selectedResponse.completedAt), 'PPP')}
                      </Typography>
                    )}
                    {selectedResponse.score !== undefined && (
                      <Typography variant="body2">
                        <strong>Score:</strong> {Math.round(selectedResponse.score)}%
                      </Typography>
                    )}
                    {selectedResponse.rawScore !== undefined &&
                      selectedResponse.maxScore !== undefined && (
                        <Typography variant="body2">
                          <strong>Raw Score:</strong> {selectedResponse.rawScore} /{' '}
                          {selectedResponse.maxScore}
                        </Typography>
                      )}
                  </Stack>
                </Callout>

                <Divider />

                <Typography variant="h6">Responses</Typography>
                {Object.keys(selectedResponse.responses).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No answers recorded.
                  </Typography>
                ) : (
                  Object.entries(selectedResponse.responses).map(([question, answer]) => (
                    <Paper key={question} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {question}
                      </Typography>
                      <Typography variant="body1">{renderAnswerValue(answer)}</Typography>
                    </Paper>
                  ))
                )}

                {selectedResponse.notes && (
                  <>
                    <Divider />
                    <Typography variant="h6">Notes</Typography>
                    <Typography variant="body2">{selectedResponse.notes}</Typography>
                  </>
                )}
              </Stack>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a response to view details.
            </Typography>
          )}
        </FormDialog>

        {/* Builder Dialog */}
        <FormDialog
          open={builderDialogOpen}
          onClose={() => setBuilderDialogOpen(false)}
          title="Create Custom Template"
          maxWidth="lg"
          fullWidth
        >
          <PromBuilder
            onComplete={() => {
              setBuilderDialogOpen(false);
              refetchTemplates();
              enqueueSnackbar('Template created successfully', { variant: 'success' });
            }}
          />
        </FormDialog>

        <ConfirmDialog
          open={deleteConfirm.open}
          title="Delete Template"
          message={`Are you sure you want to delete the template "${deleteConfirm.template?.name}"?`}
          severity="error"
          confirmText="Delete"
          onConfirm={handleDeleteTemplateConfirm}
          onClose={() => setDeleteConfirm({ open: false, template: null })}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default PROM;
