import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tooltip,
  Tab,
  Tabs,
  Badge,
  LinearProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Menu,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import type { ChipProps } from "@mui/material/Chip";
import {
  Visibility as ViewIcon,
  Assignment as AssignIcon,
  Schedule as ScheduleIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  Queue as QueueIcon,
  Assessment as AssessmentIcon,
  ViewKanban as KanbanIcon,
  ViewList as ListIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { format } from "date-fns";
import { useSnackbar } from "notistack";
import { PatientInviteDialog } from "../components/dialogs/PatientInviteDialog";
import { intakeApi, type IntakeSubmission } from "../services/intakeApi";
import { ScheduleAppointmentDialog } from "../components/dialogs/ScheduleAppointmentDialog";
import { IntakeDetailsDialog } from "../components/dialogs";
import { IntakeKanban } from "../components/intake/IntakeKanban";
import {
  downloadCSV,
  downloadExcel,
  prepareIntakeExportData,
  intakeQueueColumns,
} from "../utils/exportUtils";
import { handleApiError } from "../lib/api-client";
import {
  PageHeader,
  TabPanel as DesignTabPanel,
  SearchBar,
  StatusBadge,
  AuraStatCard,
  StatCardSkeleton,
  AuraEmptyState,
  FilterChips,
} from "@qivr/design-system";

const IntakeManagement: React.FC = () => {
  const { canMakeApiCalls } = useAuthGuard();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // State Management
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedIntake, setSelectedIntake] = useState<IntakeSubmission | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  // Fetch intake submissions
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["intakeManagement"],
    queryFn: async () => {
      try {
        const result = await intakeApi.getIntakes();
        return result;
      } catch (err) {
        console.error("Error fetching intakes:", err);
        throw err;
      }
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    enabled: canMakeApiCalls,
  });

  const intakes = data?.data || [];

  // Statistics (use unfiltered data)
  const stats = {
    total: intakes.length,
    pending: intakes.filter((i) => i.status === "pending").length,
    reviewing: intakes.filter((i) => i.status === "reviewing").length,
    processed: intakes.filter((i) =>
      ["approved", "rejected", "scheduled"].includes(i.status),
    ).length,
    critical: intakes.filter((i) => i.severity === "critical").length,
    todayIntakes: intakes.filter((i) => {
      const today = new Date().toDateString();
      return new Date(i.submittedAt).toDateString() === today;
    }).length,
  };

  // Filter intakes based on search and filters
  const filteredIntakes = intakes.filter((intake) => {
    const matchesSearch =
      searchQuery === "" ||
      intake.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intake.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intake.conditionType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || intake.status === filterStatus;
    const matchesUrgency =
      filterUrgency === "all" || intake.severity === filterUrgency;

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Separate intakes by status for different tabs
  const pendingIntakes = filteredIntakes.filter((i) => i.status === "pending");
  const reviewingIntakes = filteredIntakes.filter(
    (i) => i.status === "reviewing",
  );
  const processedIntakes = filteredIntakes.filter((i) =>
    ["approved", "rejected", "scheduled"].includes(i.status),
  );

  // Show error alert if fetch failed
  React.useEffect(() => {
    if (error) {
      enqueueSnackbar("Failed to load intake data", { variant: "error" });
    }
  }, [error, enqueueSnackbar]);

  const getSeverityColor = (
    severity: IntakeSubmission["severity"],
  ): ChipProps["color"] => {
    switch (severity) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "default";
    }
  };

  const handleViewDetails = (intake: IntakeSubmission) => {
    setSelectedIntake(intake);
    setDetailsOpen(true);
  };

  const handleSchedule = (intake: IntakeSubmission) => {
    setSelectedIntake(intake);
    setScheduleOpen(true);
  };

  const handleReject = async (intakeId: string) => {
    try {
      await intakeApi.updateIntakeStatus(intakeId, "Archived");
      enqueueSnackbar("Intake archived", { variant: "info" });
      await refetch();
    } catch (error: unknown) {
      const errorMessage = handleApiError(error, "Failed to archive intake");
      enqueueSnackbar(errorMessage, { variant: "error" });
    }
  };

  const handleStartReview = async (intakeId: string) => {
    try {
      await intakeApi.updateIntakeStatus(intakeId, "Reviewed");
      enqueueSnackbar("Started reviewing intake", { variant: "info" });
      await refetch();
    } catch (error: unknown) {
      const errorMessage = handleApiError(
        error,
        "Failed to update intake status",
      );
      enqueueSnackbar(errorMessage, { variant: "error" });
    }
  };

  const handleExportCSV = () => {
    const exportData = prepareIntakeExportData(filteredIntakes);
    downloadCSV(exportData, "intake_management", intakeQueueColumns);
    enqueueSnackbar("Data exported as CSV", { variant: "success" });
    setExportMenuAnchor(null);
  };

  const handleExportExcel = () => {
    const exportData = prepareIntakeExportData(filteredIntakes);
    downloadExcel(exportData, "intake_management", intakeQueueColumns);
    enqueueSnackbar("Data exported as Excel", { variant: "success" });
    setExportMenuAnchor(null);
  };

  const handleInvitePatient = async (
    email: string,
    firstName: string,
    lastName: string,
  ) => {
    const response = await fetch("/api/patientinvitations/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, firstName, lastName }),
    });

    if (!response.ok) {
      throw new Error("Failed to send invitation");
    }

    const result = await response.json();
    enqueueSnackbar(`Invitation sent! Link: ${result.invitationUrl}`, {
      variant: "success",
    });
  };

  const renderIntakeRow = (intake: IntakeSubmission) => (
    <TableRow key={intake.id} hover>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {intake.patientName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {intake.patientName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {intake.email}
            </Typography>
            {intake.phone && (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                {intake.phone}
              </Typography>
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant="body2">{intake.conditionType}</Typography>
          {intake.symptoms && intake.symptoms.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {intake.symptoms.slice(0, 2).join(", ")}
              {intake.symptoms.length > 2 && ` +${intake.symptoms.length - 2}`}
            </Typography>
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            label={intake.severity}
            color={getSeverityColor(intake.severity)}
            size="small"
          />
          {intake.aiSummary && (
            <Tooltip title={intake.aiSummary} arrow>
              <AssessmentIcon
                fontSize="small"
                color="primary"
                sx={{ cursor: "help" }}
              />
            </Tooltip>
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="body2">{intake.painLevel}/10</Typography>
          {intake.painLevel >= 7 && (
            <WarningIcon color="warning" fontSize="small" />
          )}
        </Box>
      </TableCell>
      <TableCell>
        {format(new Date(intake.submittedAt), "MMM dd, yyyy HH:mm")}
      </TableCell>
      <TableCell>
        <StatusBadge status={intake.status} />
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleViewDetails(intake)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {intake.status === "pending" && (
            <>
              <Tooltip title="Start Review">
                <IconButton
                  size="small"
                  color="info"
                  onClick={() => handleStartReview(intake.id)}
                >
                  <AssignIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          {intake.status === "reviewing" && (
            <>
              <Tooltip title="Approve & Schedule">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleSchedule(intake)}
                >
                  <ScheduleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleReject(intake.id)}
                >
                  <RejectIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          {intake.status === "approved" &&
            !intake.status.includes("scheduled") && (
              <Tooltip title="Schedule Appointment">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleSchedule(intake)}
                >
                  <ScheduleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
        </Stack>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Intake Management"
        description="Process and manage patient intake submissions"
        actions={
          <Stack direction="row" spacing={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="kanban">
                <KanbanIcon sx={{ mr: 1 }} />
                Kanban
              </ToggleButton>
              <ToggleButton value="table">
                <ListIcon sx={{ mr: 1 }} />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </Stack>
        }
      />

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 2 }}>
              <StatCardSkeleton />
            </Grid>
          ))
        ) : (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <AuraStatCard
                title="Total Intakes"
                value={stats.total.toString()}
                icon={<QueueIcon />}
                iconColor="primary.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <AuraStatCard
                title="Pending Review"
                value={stats.pending.toString()}
                icon={<AssessmentIcon />}
                iconColor="warning.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <AuraStatCard
                title="Under Review"
                value={stats.reviewing.toString()}
                icon={<AssessmentIcon />}
                iconColor="info.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <AuraStatCard
                title="Processed"
                value={stats.processed.toString()}
                icon={<AssessmentIcon />}
                iconColor="success.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <AuraStatCard
                title="Critical Cases"
                value={stats.critical.toString()}
                icon={<WarningIcon />}
                iconColor="error.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <AuraStatCard
                title="Today's Intakes"
                value={stats.todayIntakes.toString()}
                icon={<QueueIcon />}
                iconColor="primary.main"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, or condition..."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="reviewing">Reviewing</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Urgency</InputLabel>
              <Select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                label="Urgency"
              >
                <MenuItem value="all">All Urgency</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Button
              startIcon={<PersonAddIcon />}
              onClick={() => setInviteDialogOpen(true)}
              variant="contained"
              color="primary"
            >
              Invite Patient
            </Button>
            <Button
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              variant="outlined"
            >
              Refresh
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              variant="outlined"
            >
              Export
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={() => setExportMenuAnchor(null)}
            >
              <MenuItem onClick={handleExportCSV}>Export as CSV</MenuItem>
              <MenuItem onClick={handleExportExcel}>Export as Excel</MenuItem>
            </Menu>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {(searchQuery || filterStatus !== "all" || filterUrgency !== "all") && (
          <Box sx={{ mt: 2 }}>
            <FilterChips
              filters={[
                ...(searchQuery
                  ? [{ key: "search", label: `Search: ${searchQuery}` }]
                  : []),
                ...(filterStatus !== "all"
                  ? [{ key: "status", label: `Status: ${filterStatus}` }]
                  : []),
                ...(filterUrgency !== "all"
                  ? [{ key: "urgency", label: `Urgency: ${filterUrgency}` }]
                  : []),
              ]}
              onRemove={(key) => {
                if (key === "search") setSearchQuery("");
                if (key === "status") setFilterStatus("all");
                if (key === "urgency") setFilterUrgency("all");
              }}
              onClearAll={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterUrgency("all");
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Kanban or Table View */}
      {viewMode === "kanban" ? (
        <Box sx={{ mt: 3 }}>
          {isLoading ? (
            <LinearProgress />
          ) : (
            <IntakeKanban
              intakes={filteredIntakes}
              onViewDetails={handleViewDetails}
              onSchedule={handleSchedule}
              onStatusChange={async (id, status) => {
                try {
                  await intakeApi.updateIntakeStatus(id, status);
                  refetch();
                  enqueueSnackbar("Status updated", { variant: "success" });
                } catch (err) {
                  enqueueSnackbar("Failed to update status", {
                    variant: "error",
                  });
                }
              }}
            />
          )}
        </Box>
      ) : (
        <Paper sx={{ width: "100%", mt: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label={
                <Badge badgeContent={pendingIntakes.length} color="warning">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <QueueIcon />
                    Pending
                  </Box>
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={reviewingIntakes.length} color="info">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AssignIcon />
                    Under Review
                  </Box>
                </Badge>
              }
            />
            <Tab
              label={
                <Badge badgeContent={processedIntakes.length} color="success">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AssessmentIcon />
                    Processed
                  </Box>
                </Badge>
              }
            />
          </Tabs>

          {/* Tab Panels */}
          <DesignTabPanel value={currentTab} index={0}>
            {isLoading ? (
              <LinearProgress />
            ) : pendingIntakes.length === 0 ? (
              <Alert severity="info">No pending intakes to review</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Condition</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Pain Level</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingIntakes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ border: 0, p: 0 }}>
                          <AuraEmptyState
                            title="No pending intakes"
                            description="All intakes have been reviewed"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingIntakes.map(renderIntakeRow)
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DesignTabPanel>

          <DesignTabPanel value={currentTab} index={1}>
            {isLoading ? (
              <LinearProgress />
            ) : reviewingIntakes.length === 0 ? (
              <Alert severity="info">No intakes currently under review</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Condition</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Pain Level</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reviewingIntakes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ border: 0, p: 0 }}>
                          <AuraEmptyState
                            title="No intakes under review"
                            description="Move intakes here to start reviewing"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      reviewingIntakes.map(renderIntakeRow)
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DesignTabPanel>

          <DesignTabPanel value={currentTab} index={2}>
            {isLoading ? (
              <LinearProgress />
            ) : processedIntakes.length === 0 ? (
              <Alert severity="info">No processed intakes</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Patient</TableCell>
                      <TableCell>Condition</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Pain Level</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedIntakes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ border: 0, p: 0 }}>
                          <AuraEmptyState
                            title="No processed intakes"
                            description="Completed intakes will appear here"
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      processedIntakes.map(renderIntakeRow)
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DesignTabPanel>
        </Paper>
      )}

      {/* Dialogs */}
      {selectedIntake && (
        <>
          <IntakeDetailsDialog
            intake={{
              ...selectedIntake,
              chiefComplaint: selectedIntake.conditionType || "Not specified",
            }}
            open={detailsOpen}
            onClose={() => {
              setDetailsOpen(false);
              setSelectedIntake(null);
            }}
          />
          <ScheduleAppointmentDialog
            intakeId={selectedIntake.id}
            open={scheduleOpen}
            onClose={() => {
              setScheduleOpen(false);
              setSelectedIntake(null);
              refetch();
            }}
          />
        </>
      )}

      <PatientInviteDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onInvite={handleInvitePatient}
      />
    </Box>
  );
};

export default IntakeManagement;
