import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  Stack,
  Divider,
  Tooltip,
} from "@mui/material";
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
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parseISO } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  promApi,
  PromTemplateSummary,
  PromResponse,
  PromResponsesResult,
  PromAnswerValue,
} from "../services/promApi";
import { PROMSender } from "../components/messaging";
import { PromBuilder } from "../features/proms/components/PromBuilder";
import { PromPreview } from "../components/messaging/PromPreview";
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
} from "recharts";
import {
  PageHeader,
  SectionLoader,
  StatusBadge,
  AuraStatCard,
  InfoCard,
  StatCardSkeleton,
  AuraEmptyState,
} from "@qivr/design-system";

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

  const [currentTab, setCurrentTab] = useState(0);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendTemplateId, setSendTemplateId] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<PromResponse | null>(
    null,
  );
  const [responseDetailOpen, setResponseDetailOpen] = useState(false);
  const [responseDetailLoading, setResponseDetailLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: null as Date | null,
    end: null as Date | null,
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(
    null,
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch templates
  const {
    data: templatesData,
    isLoading: templatesLoading,
    refetch: refetchTemplates,
  } = useQuery<PromTemplateSummary[]>({
    queryKey: ["prom-templates"],
    queryFn: () => promApi.getTemplates({ isActive: true }),
  });

  const templates: PromTemplateSummary[] = templatesData || [];

  // Fetch responses
  const {
    data: responsesData,
    isLoading: responsesLoading,
    refetch: refetchResponses,
  } = useQuery<PromResponsesResult>({
    queryKey: ["prom-responses", filterStatus, dateRange, page, rowsPerPage],
    queryFn: () =>
      promApi.getResponses({
        status: filterStatus !== "all" ? filterStatus : undefined,
        startDate: dateRange.start
          ? format(dateRange.start, "yyyy-MM-dd")
          : undefined,
        endDate: dateRange.end
          ? format(dateRange.end, "yyyy-MM-dd")
          : undefined,
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
      enqueueSnackbar("Template deleted successfully", { variant: "success" });
      refetchTemplates();
    },
    onError: () => {
      enqueueSnackbar("Failed to delete template", { variant: "error" });
    },
  });

  // Calculate statistics
  const statistics = {
    total: aggregateStats?.total ?? responses.length,
    completed:
      aggregateStats?.completedCount ??
      responses.filter((r) => r.status === "completed").length,
    pending:
      aggregateStats?.pendingCount ??
      responses.filter((r) => r.status === "pending").length,
    inProgress:
      aggregateStats?.inProgressCount ??
      responses.filter((r) => r.status === "in-progress").length,
    expired:
      aggregateStats?.expiredCount ??
      responses.filter((r) => r.status === "expired").length,
    cancelled:
      aggregateStats?.cancelledCount ??
      responses.filter((r) => r.status === "cancelled").length,
  };

  const fallbackAverageScore = () => {
    const scored = responses.filter((item) => typeof item.score === "number");
    if (!scored.length) return 0;
    const totalScore = scored.reduce(
      (total, item) => total + (item.score ?? 0),
      0,
    );
    return Math.round((totalScore / scored.length) * 100) / 100;
  };

  const averageScore = aggregateStats?.averageScore ?? fallbackAverageScore();

  const completionRate =
    aggregateStats?.completionRate ??
    (statistics.total > 0
      ? Math.round((statistics.completed / statistics.total) * 1000) / 10
      : 0);

  const nextDueDate = aggregateStats?.nextDue;
  const lastCompletedDate = aggregateStats?.lastCompleted;
  const streak = aggregateStats?.streak ?? 0;

  const formatDate = (value?: string) => {
    if (!value) return "—";
    try {
      return format(parseISO(value), "MMM dd, yyyy");
    } catch (error) {
      return "—";
    }
  };

  // Chart data
  const statusChartData = [
    { name: "Completed", value: statistics.completed, color: "#4caf50" },
    { name: "Pending", value: statistics.pending, color: "#ff9800" },
    { name: "In Progress", value: statistics.inProgress, color: "#2196f3" },
    { name: "Expired", value: statistics.expired, color: "#f44336" },
    { name: "Cancelled", value: statistics.cancelled, color: "#9e9e9e" },
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
        const date = format(parseISO(response.completedAt), "MMM dd");
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
      avgScore:
        item.scoreCount > 0 ? Math.round(item.totalScore / item.scoreCount) : 0,
    }));

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleDeleteTemplate = (template: PromTemplateSummary) => {
    if (
      window.confirm(
        `Are you sure you want to delete the template "${template.name}"?`,
      )
    ) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  const handleViewResponse = async (response: PromResponse) => {
    setResponseDetailLoading(true);
    setResponseDetailOpen(true);
    setSelectedResponse(null);

    try {
      const detailed = await promApi.getResponse(response.id);
      setSelectedResponse(detailed);
    } catch (error) {
      console.error("Failed to load response details", error);
      setSelectedResponse(response);
      enqueueSnackbar(
        "Unable to load full response details; showing cached data.",
        { variant: "warning" },
      );
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
      return "—";
    }

    if (Array.isArray(answer)) {
      return answer.length ? answer.join(", ") : "—";
    }

    if (answer instanceof Date) {
      return format(answer, "PPP");
    }

    if (typeof answer === "object") {
      return (
        <Box
          component="pre"
          sx={{ m: 0, fontFamily: "monospace", whiteSpace: "pre-wrap" }}
        >
          {JSON.stringify(answer, null, 2)}
        </Box>
      );
    }

    if (typeof answer === "boolean") {
      return answer ? "Yes" : "No";
    }

    return answer;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
              <AuraStatCard
                title="Total Responses"
                value={statistics.total.toString()}
                icon={<AssignmentIcon />}
                iconColor="primary.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Completion Rate"
                value={`${completionRate.toFixed(1)}%`}
                icon={<ChartIcon />}
                iconColor="success.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Pending"
                value={statistics.pending.toString()}
                icon={<PendingIcon />}
                iconColor="warning.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Active Templates"
                value={templates.length.toString()}
                icon={<QuestionIcon />}
                iconColor="info.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="In Progress"
                value={statistics.inProgress.toString()}
                icon={<ScheduleIcon />}
                iconColor="secondary.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Cancelled"
                value={statistics.cancelled.toString()}
                icon={<CancelIcon />}
                iconColor="grey.600"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Average Score"
                value={averageScore.toFixed(1)}
                icon={<AssessmentIcon />}
                iconColor="info.main"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <InfoCard title="Upcoming & Streak">
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>Next Due:</strong> {formatDate(nextDueDate)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Last Completed:</strong>{" "}
                    {formatDate(lastCompletedDate)}
                  </Typography>
                  <Chip
                    label={`Streak: ${streak} day${streak === 1 ? "" : "s"}`}
                    color={streak > 0 ? "success" : "default"}
                    size="small"
                  />
                </Stack>
              </InfoCard>
            </Grid>
          </Grid>
        )}

        {/* Main Content Tabs */}
        <Paper sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label="Templates"
              icon={<AssignmentIcon />}
              iconPosition="start"
            />
            <Tab
              label="Responses"
              icon={<AssessmentIcon />}
              iconPosition="start"
            />
            <Tab label="Analytics" icon={<ChartIcon />} iconPosition="start" />
            <Tab label="Builder" icon={<AddIcon />} iconPosition="start" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            {/* Templates Tab */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
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
                <SectionLoader minHeight={200} />
              ) : (
                <Grid container spacing={3}>
                  {templates.map((template) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={template.id}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {template.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            paragraph
                          >
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
                            Created{" "}
                            {format(
                              new Date(template.createdAt),
                              "dd MMM yyyy",
                            )}
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
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
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
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                  </FormControl>

                  <DatePicker
                    label="Start Date"
                    value={dateRange.start}
                    onChange={(newValue) =>
                      setDateRange((prev) => ({ ...prev, start: newValue }))
                    }
                    slotProps={{ textField: { size: "small" } }}
                  />

                  <DatePicker
                    label="End Date"
                    value={dateRange.end}
                    onChange={(newValue) =>
                      setDateRange((prev) => ({ ...prev, end: newValue }))
                    }
                    slotProps={{ textField: { size: "small" } }}
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
                            {response.templateName ||
                              response.templateId ||
                              "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={response.status} />
                          </TableCell>
                          <TableCell>
                            {response.assignedAt
                              ? format(
                                  parseISO(response.assignedAt),
                                  "MMM dd, yyyy",
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {response.completedAt
                              ? format(
                                  parseISO(response.completedAt),
                                  "MMM dd, yyyy",
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {response.score !== undefined ? (
                              <Tooltip
                                title={
                                  response.rawScore !== undefined &&
                                  response.maxScore !== undefined
                                    ? `Raw score: ${response.rawScore} / ${response.maxScore}`
                                    : "Percentage score"
                                }
                              >
                                <Chip
                                  label={`${response.score.toFixed(1)}%`}
                                  color={
                                    response.score >= 70 ? "success" : "warning"
                                  }
                                  size="small"
                                />
                              </Tooltip>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                void handleViewResponse(response);
                              }}
                            >
                              <PreviewIcon />
                            </IconButton>
                            {response.status === "pending" && (
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
                  onPageChange={(_e, newPage) => setPage(newPage)}
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
              <Grid size={{ xs: 12, md: 6 }}>
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

              <Grid size={{ xs: 12, md: 6 }}>
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

              <Grid size={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Template Performance
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Detailed analytics for individual templates and questions
                    will be displayed here
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
                enqueueSnackbar("PROM sent successfully", {
                  variant: "success",
                });
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
          onClose={handleCloseResponseDetail}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Response Details
            {selectedResponse && (
              <Box sx={{ ml: 2 }}>
                <StatusBadge status={selectedResponse.status} />
              </Box>
            )}
          </DialogTitle>
          <DialogContent>
            {responseDetailLoading ? (
              <SectionLoader minHeight={200} />
            ) : selectedResponse ? (
              <Box>
                <Stack spacing={2}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Patient:</strong> {selectedResponse.patientName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Template:</strong>{" "}
                      {selectedResponse.templateName ||
                        selectedResponse.templateId}
                    </Typography>
                    {selectedResponse.assignedAt && (
                      <Typography variant="body2">
                        <strong>Assigned:</strong>{" "}
                        {format(parseISO(selectedResponse.assignedAt), "PPP")}
                      </Typography>
                    )}
                    {selectedResponse.scheduledAt && (
                      <Typography variant="body2">
                        <strong>Scheduled:</strong>{" "}
                        {format(parseISO(selectedResponse.scheduledAt), "PPP")}
                      </Typography>
                    )}
                    {selectedResponse.completedAt && (
                      <Typography variant="body2">
                        <strong>Completed:</strong>{" "}
                        {format(parseISO(selectedResponse.completedAt), "PPP")}
                      </Typography>
                    )}
                    {selectedResponse.score !== undefined && (
                      <Typography variant="body2">
                        <strong>Score:</strong>{" "}
                        {Math.round(selectedResponse.score)}%
                      </Typography>
                    )}
                    {selectedResponse.rawScore !== undefined &&
                      selectedResponse.maxScore !== undefined && (
                        <Typography variant="body2">
                          <strong>Raw Score:</strong>{" "}
                          {selectedResponse.rawScore} /{" "}
                          {selectedResponse.maxScore}
                        </Typography>
                      )}
                  </Alert>

                  <Divider />

                  <Typography variant="h6">Responses</Typography>
                  {Object.keys(selectedResponse.responses).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No answers recorded.
                    </Typography>
                  ) : (
                    Object.entries(selectedResponse.responses).map(
                      ([question, answer]) => (
                        <Paper key={question} sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {question}
                          </Typography>
                          <Typography variant="body1">
                            {renderAnswerValue(answer)}
                          </Typography>
                        </Paper>
                      ),
                    )
                  )}

                  {selectedResponse.notes && (
                    <>
                      <Divider />
                      <Typography variant="h6">Notes</Typography>
                      <Typography variant="body2">
                        {selectedResponse.notes}
                      </Typography>
                    </>
                  )}
                </Stack>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Select a response to view details.
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseResponseDetail}>Close</Button>
            {!responseDetailLoading &&
              selectedResponse?.status === "pending" && (
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
