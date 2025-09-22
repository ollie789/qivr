import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  Stack,
  Tooltip,
  Badge,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  QuestionAnswer as QuestionIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { promApi, PromTemplateSummary, PromResponse } from '../services/promApi';
import { patientApi } from '../services/patientApi';
import PROMSender from '../components/PROMSender';
import { PromBuilder } from '../features/proms/components/PromBuilder';
import { PromPreview } from '../components/PromPreview';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';

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
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendTemplateId, setSendTemplateId] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<PromResponse | null>(null);
  const [responseDetailOpen, setResponseDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: null as Date | null,
    end: null as Date | null,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery<PromTemplateSummary[]>({
    queryKey: ['prom-templates'],
    queryFn: () => promApi.getTemplates({ isActive: true }),
  });

  const templates: PromTemplateSummary[] = templatesData || [];

  // Fetch responses
  const { data: responsesData, isLoading: responsesLoading, refetch: refetchResponses } = useQuery({
    queryKey: ['prom-responses', filterStatus, dateRange, page, rowsPerPage],
    queryFn: () => promApi.getResponses({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      startDate: dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : undefined,
      endDate: dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : undefined,
      page: page + 1,
      limit: rowsPerPage,
    }),
  });

  const responses = responsesData?.data || [];
  const totalResponses = responsesData?.total || 0;

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

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: ({ id, answers }: { id: string; answers: Record<string, any> }) =>
      promApi.submitResponse(id, answers),
    onSuccess: () => {
      enqueueSnackbar('Response submitted successfully', { variant: 'success' });
      refetchResponses();
      setResponseDetailOpen(false);
    },
    onError: () => {
      enqueueSnackbar('Failed to submit response', { variant: 'error' });
    },
  });

  // Calculate statistics
  const statistics = {
    total: responses.length,
    completed: responses.filter((r: PromResponse) => r.status === 'completed').length,
    pending: responses.filter((r: PromResponse) => r.status === 'pending').length,
    inProgress: responses.filter((r: PromResponse) => r.status === 'in-progress').length,
    expired: responses.filter((r: PromResponse) => r.status === 'expired').length,
  };

  const completionRate = statistics.total > 0
    ? Math.round((statistics.completed / statistics.total) * 100)
    : 0;

  // Chart data
  const statusChartData = [
    { name: 'Completed', value: statistics.completed, color: '#4caf50' },
    { name: 'Pending', value: statistics.pending, color: '#ff9800' },
    { name: 'In Progress', value: statistics.inProgress, color: '#2196f3' },
    { name: 'Expired', value: statistics.expired, color: '#f44336' },
  ];

  const trendsData = responses.reduce((acc: any[], response: PromResponse) => {
    if (response.completedAt) {
      const date = format(parseISO(response.completedAt), 'MMM dd');
      const existing = acc.find(item => item.date === date);
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
  }, []).map(item => ({
    ...item,
    avgScore: item.scoreCount > 0 ? Math.round(item.totalScore / item.scoreCount) : 0,
  }));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleDeleteTemplate = (template: PromTemplateSummary) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  const handleViewResponse = (response: PromResponse) => {
    setSelectedResponse(response);
    setResponseDetailOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'in-progress': return 'info';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'pending': return <PendingIcon />;
      case 'in-progress': return <ScheduleIcon />;
      case 'expired': return <CancelIcon />;
      default: return <AssignmentIcon />;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Patient Reported Outcome Measures (PROM)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage questionnaires and track patient-reported outcomes
          </Typography>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Responses
                    </Typography>
                    <Typography variant="h4">{statistics.total}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <AssignmentIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Completion Rate
                    </Typography>
                    <Typography variant="h4">{completionRate}%</Typography>
                  </Box>
                  <CircularProgress
                    variant="determinate"
                    value={completionRate}
                    size={50}
                    thickness={4}
                    sx={{ color: 'success.main' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Pending
                    </Typography>
                    <Typography variant="h4">{statistics.pending}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <PendingIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Active Templates
                    </Typography>
                    <Typography variant="h4">{templates.length}</Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <QuestionIcon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Tabs */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Templates" icon={<AssignmentIcon />} iconPosition="start" />
            <Tab label="Responses" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="Analytics" icon={<ChartIcon />} iconPosition="start" />
            <Tab label="Builder" icon={<AddIcon />} iconPosition="start" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            {/* Templates Tab */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">PROM Templates</Typography>
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={() => setSendDialogOpen(true)}
                >
                  Send PROM
                </Button>
              </Box>

              {templatesLoading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {templates.map((template) => (
                    <Grid item xs={12} md={6} lg={4} key={template.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {template.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {template.description}
                          </Typography>

                          <Typography variant="body2" color="text.secondary">
                            Version {template.version}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            Created {format(new Date(template.createdAt), 'dd MMM yyyy')}
                          </Typography>
                        </CardContent>

                        <CardActions>
                          <Button
                            size="small"
                            startIcon={<PreviewIcon />}
                            onClick={() => {
                              setPreviewTemplateId(template.id);
                              setPreviewOpen(true);
                            }}
                          >
                            Preview
                          </Button>
                          <Button
                            size="small"
                            startIcon={<SendIcon />}
                            onClick={() => {
                              setSendTemplateId(template.id);
                              setSendDialogOpen(true);
                            }}
                          >
                            Send
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTemplate(template)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            {/* Responses Tab */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" gap={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="expired">Expired</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <DatePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(newValue) => setDateRange(prev => ({ ...prev, start: newValue }))}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  
                  <DatePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(newValue) => setDateRange(prev => ({ ...prev, end: newValue }))}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </Box>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => refetchResponses()}
                >
                  Refresh
                </Button>
              </Box>

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
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : responses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No responses found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      responses.map((response: PromResponse) => (
                        <TableRow key={response.id}>
                          <TableCell>{response.patientName}</TableCell>
                          <TableCell>{response.templateId}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(response.status)}
                              label={response.status}
                              color={getStatusColor(response.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {response.startedAt
                              ? format(parseISO(response.startedAt), 'MMM dd, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {response.completedAt
                              ? format(parseISO(response.completedAt), 'MMM dd, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {response.score !== undefined ? (
                              <Chip
                                label={`${response.score}%`}
                                color={response.score >= 70 ? 'success' : 'warning'}
                                size="small"
                              />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleViewResponse(response)}
                            >
                              <PreviewIcon />
                            </IconButton>
                            {response.status === 'pending' && (
                              <IconButton size="small">
                                <EmailIcon />
                              </IconButton>
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
                  onPageChange={(e, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                />
              </TableContainer>
            </Box>
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            {/* Analytics Tab */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Response Status Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Completion Trends
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="count"
                        stroke="#8884d8"
                        name="Responses"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgScore"
                        stroke="#82ca9d"
                        name="Avg Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Template Performance
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Detailed analytics for individual templates and questions will be displayed here
                  </Alert>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            {/* Builder Tab */}
            <PromBuilder />
          </TabPanel>
        </Paper>

        {/* Send PROM Dialog */}
        <Dialog
          open={sendDialogOpen}
          onClose={() => {
            setSendDialogOpen(false);
            setSendTemplateId(null);
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Send PROM Questionnaire</DialogTitle>
          <DialogContent>
            <PROMSender
              preSelectedTemplateId={sendTemplateId || undefined}
              onComplete={() => {
                setSendDialogOpen(false);
                setSendTemplateId(null);
                refetchResponses();
                enqueueSnackbar('PROM sent successfully', { variant: 'success' });
              }}
            />
          </DialogContent>
        </Dialog>

        <PromPreview
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewTemplateId(null);
          }}
          templateId={previewTemplateId || undefined}
        />

        {/* Response Detail Dialog */}
        <Dialog
          open={responseDetailOpen}
          onClose={() => setResponseDetailOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Response Details
            {selectedResponse && (
              <Chip
                label={selectedResponse.status}
                color={getStatusColor(selectedResponse.status) as any}
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </DialogTitle>
          <DialogContent>
            {selectedResponse && (
              <Box>
                <Stack spacing={2}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Patient:</strong> {selectedResponse.patientName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Template ID:</strong> {selectedResponse.templateId}
                    </Typography>
                    {selectedResponse.startedAt && (
                      <Typography variant="body2">
                        <strong>Started:</strong> {format(parseISO(selectedResponse.startedAt), 'PPP')}
                      </Typography>
                    )}
                    {selectedResponse.completedAt && (
                      <Typography variant="body2">
                        <strong>Completed:</strong> {format(parseISO(selectedResponse.completedAt), 'PPP')}
                      </Typography>
                    )}
                  </Alert>

                  <Divider />

                  <Typography variant="h6">Responses</Typography>
                  {Object.entries(selectedResponse.responses).map(([question, answer]) => (
                    <Paper key={question} sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {question}
                      </Typography>
                      <Typography variant="body1">
                        {typeof answer === 'object' ? JSON.stringify(answer) : answer}
                      </Typography>
                    </Paper>
                  ))}

                  {selectedResponse.notes && (
                    <>
                      <Divider />
                      <Typography variant="h6">Notes</Typography>
                      <Typography variant="body2">{selectedResponse.notes}</Typography>
                    </>
                  )}
                </Stack>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResponseDetailOpen(false)}>Close</Button>
            {selectedResponse?.status === 'pending' && (
              <Button variant="contained" startIcon={<EmailIcon />}>
                Send Reminder
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default PROM;