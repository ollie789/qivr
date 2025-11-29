import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Stack,
  Divider,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import {
  Send as SendIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  MoreVert as MoreIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Print as PrintIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as TimeIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useSnackbar } from "notistack";
import {
  PageHeader,
  AuraEmptyState,
  AuraGlassStatCard,
  SearchBar,
  FormDialog,
  SelectField,
  AuraButton,
  SectionLoader,
} from "@qivr/design-system";
import {
  referralApi,
  type Referral,
  type ReferralStatus,
  type ReferralPriority,
  type ReferralType,
  type CreateReferralRequest,
  REFERRAL_TYPES,
  REFERRAL_PRIORITIES,
  REFERRAL_STATUSES,
  COMMON_SPECIALTIES,
} from "../services/referralApi";
import { patientApi } from "../services/patientApi";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Imaging":
    case "Laboratory":
      return <ScienceIcon />;
    case "Specialist":
    case "Hospital":
      return <HospitalIcon />;
    default:
      return <SendIcon />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Scheduled":
      return <ScheduleIcon fontSize="small" />;
    case "Completed":
    case "ResultsReceived":
    case "Closed":
      return <CheckIcon fontSize="small" />;
    case "Cancelled":
    case "Expired":
      return <WarningIcon fontSize="small" />;
    default:
      return null;
  }
};

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export default function Referrals() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReferralStatus | "all">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState<ReferralType | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<
    ReferralPriority | "all"
  >("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(
    null,
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuReferral, setMenuReferral] = useState<Referral | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // New referral form state
  const [newReferral, setNewReferral] = useState<
    Partial<CreateReferralRequest>
  >({
    type: "Specialist",
    priority: "Routine",
  });
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Queries
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: () => referralApi.getAll(),
  });

  const { data: stats } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: () => referralApi.getStats(),
  });

  const { data: patientsData } = useQuery({
    queryKey: ["patients-for-referral"],
    queryFn: () => patientApi.getPatients({ limit: 500 }),
  });

  const patients = patientsData?.data ?? [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (request: CreateReferralRequest) => referralApi.create(request),
    onSuccess: () => {
      enqueueSnackbar("Referral created successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
      setCreateDialogOpen(false);
      setNewReferral({ type: "Specialist", priority: "Routine" });
      setSelectedPatient(null);
    },
    onError: () => {
      enqueueSnackbar("Failed to create referral", { variant: "error" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => referralApi.send(id),
    onSuccess: () => {
      enqueueSnackbar("Referral sent successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
    },
    onError: () => {
      enqueueSnackbar("Failed to send referral", { variant: "error" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      referralApi.cancel(id, reason),
    onSuccess: () => {
      enqueueSnackbar("Referral cancelled", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
      setCancelDialogOpen(false);
      setCancelReason("");
      setMenuReferral(null);
    },
    onError: () => {
      enqueueSnackbar("Failed to cancel referral", { variant: "error" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReferralStatus }) =>
      referralApi.updateStatus(id, status),
    onSuccess: () => {
      enqueueSnackbar("Status updated", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
    },
    onError: () => {
      enqueueSnackbar("Failed to update status", { variant: "error" });
    },
  });

  // Filtered referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          r.patientName?.toLowerCase().includes(query) ||
          r.specialty.toLowerCase().includes(query) ||
          r.externalProviderName?.toLowerCase().includes(query) ||
          r.reasonForReferral?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all" && r.status !== statusFilter) return false;

      // Type filter
      if (typeFilter !== "all" && r.type !== typeFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && r.priority !== priorityFilter)
        return false;

      return true;
    });
  }, [referrals, searchQuery, statusFilter, typeFilter, priorityFilter]);

  // Handlers
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    referral: Referral,
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuReferral(referral);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuReferral(null);
  };

  const handleViewDetails = (referral: Referral) => {
    setSelectedReferral(referral);
    setDetailDialogOpen(true);
    handleMenuClose();
  };

  const handleCreateReferral = () => {
    if (!selectedPatient) {
      enqueueSnackbar("Please select a patient", { variant: "warning" });
      return;
    }
    if (!newReferral.specialty) {
      enqueueSnackbar("Please select a specialty", { variant: "warning" });
      return;
    }

    createMutation.mutate({
      patientId: selectedPatient.id,
      type: newReferral.type as ReferralType,
      specialty: newReferral.specialty,
      specificService: newReferral.specificService,
      priority: newReferral.priority as ReferralPriority,
      externalProviderName: newReferral.externalProviderName,
      externalProviderPhone: newReferral.externalProviderPhone,
      externalProviderEmail: newReferral.externalProviderEmail,
      externalProviderAddress: newReferral.externalProviderAddress,
      reasonForReferral: newReferral.reasonForReferral,
      clinicalHistory: newReferral.clinicalHistory,
      currentMedications: newReferral.currentMedications,
      allergies: newReferral.allergies,
      relevantTestResults: newReferral.relevantTestResults,
      specificQuestions: newReferral.specificQuestions,
    });
  };

  const getStatusColor = (status: ReferralStatus) => {
    const statusObj = REFERRAL_STATUSES.find((s) => s.value === status);
    return (statusObj?.color || "default") as
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning";
  };

  const getPriorityColor = (priority: ReferralPriority) => {
    const priorityObj = REFERRAL_PRIORITIES.find((p) => p.value === priority);
    return (priorityObj?.color || "default") as
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning";
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box className="page-enter" sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
        <PageHeader
          title="Referrals"
          description="Manage and track patient referrals"
          actions={
            <AuraButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              New Referral
            </AuraButton>
          }
        />

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <AuraGlassStatCard
              title="Total Referrals"
              value={stats?.totalReferrals ?? referrals.length}
              icon={<SendIcon />}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <AuraGlassStatCard
              title="Pending"
              value={stats?.pendingReferrals ?? 0}
              icon={<TimeIcon />}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <AuraGlassStatCard
              title="In Progress"
              value={stats?.sentReferrals ?? 0}
              icon={<TrendingUpIcon />}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <AuraGlassStatCard
              title="Completed"
              value={stats?.completedReferrals ?? 0}
              icon={<CheckIcon />}
            />
          </Grid>
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by patient, specialty, provider..."
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <SelectField
                label="Status"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as ReferralStatus | "all")}
                options={[
                  { value: "all", label: "All Statuses" },
                  ...REFERRAL_STATUSES.map((s) => ({
                    value: s.value,
                    label: s.label,
                  })),
                ]}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <SelectField
                label="Type"
                value={typeFilter}
                onChange={(v) => setTypeFilter(v as ReferralType | "all")}
                options={[
                  { value: "all", label: "All Types" },
                  ...REFERRAL_TYPES.map((t) => ({
                    value: t.value,
                    label: t.label,
                  })),
                ]}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <SelectField
                label="Priority"
                value={priorityFilter}
                onChange={(v) =>
                  setPriorityFilter(v as ReferralPriority | "all")
                }
                options={[
                  { value: "all", label: "All Priorities" },
                  ...REFERRAL_PRIORITIES.map((p) => ({
                    value: p.value,
                    label: p.label,
                  })),
                ]}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {filteredReferrals.length} referral
                {filteredReferrals.length !== 1 ? "s" : ""}
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Referrals Table */}
        {isLoading ? (
          <SectionLoader minHeight={400} />
        ) : filteredReferrals.length === 0 ? (
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <AuraEmptyState
              title="No referrals found"
              description={
                searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first referral to get started"
              }
              actionText="New Referral"
              onAction={() => setCreateDialogOpen(true)}
            />
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell>Patient</TableCell>
                  <TableCell>Specialty</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReferrals.map((referral) => (
                  <TableRow
                    key={referral.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleViewDetails(referral)}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: "primary.50",
                            color: "primary.main",
                            display: "flex",
                          }}
                        >
                          {getTypeIcon(referral.type)}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {referral.patientName || "Unknown Patient"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {referral.typeName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {referral.specialty}
                      </Typography>
                      {referral.specificService && (
                        <Typography variant="caption" color="text.secondary">
                          {referral.specificService}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {referral.externalProviderName ? (
                        <Typography variant="body2">
                          {referral.externalProviderName}
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          fontStyle="italic"
                        >
                          Not specified
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={referral.priorityName}
                        size="small"
                        color={getPriorityColor(referral.priority)}
                        icon={
                          referral.priority === "Emergency" ? (
                            <WarningIcon fontSize="small" />
                          ) : undefined
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={referral.statusName}
                        size="small"
                        color={getStatusColor(referral.status)}
                        icon={getStatusIcon(referral.status) || undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(parseISO(referral.createdAt), "MMM d, yyyy")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(parseISO(referral.createdAt), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="flex-end"
                      >
                        {referral.status === "Draft" && (
                          <Tooltip title="Send Referral">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => sendMutation.mutate(referral.id)}
                            >
                              <SendIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, referral)}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem
            onClick={() => menuReferral && handleViewDetails(menuReferral)}
          >
            <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Details
          </MenuItem>
          {menuReferral?.status === "Draft" && (
            <MenuItem
              onClick={() =>
                menuReferral && sendMutation.mutate(menuReferral.id)
              }
            >
              <SendIcon fontSize="small" sx={{ mr: 1 }} /> Send Referral
            </MenuItem>
          )}
          {menuReferral?.status === "Sent" && (
            <MenuItem
              onClick={() => {
                if (menuReferral) {
                  updateStatusMutation.mutate({
                    id: menuReferral.id,
                    status: "Acknowledged",
                  });
                }
                handleMenuClose();
              }}
            >
              <CheckIcon fontSize="small" sx={{ mr: 1 }} /> Mark Acknowledged
            </MenuItem>
          )}
          {menuReferral?.status === "Acknowledged" && (
            <MenuItem
              onClick={() => {
                if (menuReferral) {
                  updateStatusMutation.mutate({
                    id: menuReferral.id,
                    status: "Scheduled",
                  });
                }
                handleMenuClose();
              }}
            >
              <ScheduleIcon fontSize="small" sx={{ mr: 1 }} /> Mark Scheduled
            </MenuItem>
          )}
          {menuReferral?.status === "Scheduled" && (
            <MenuItem
              onClick={() => {
                if (menuReferral) {
                  updateStatusMutation.mutate({
                    id: menuReferral.id,
                    status: "Completed",
                  });
                }
                handleMenuClose();
              }}
            >
              <CheckIcon fontSize="small" sx={{ mr: 1 }} /> Mark Completed
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            onClick={() =>
              enqueueSnackbar("Print feature coming soon", { variant: "info" })
            }
          >
            <PrintIcon fontSize="small" sx={{ mr: 1 }} /> Print Referral
          </MenuItem>
          {!["Cancelled", "Closed", "Expired"].includes(
            menuReferral?.status || "",
          ) && (
            <MenuItem
              onClick={() => {
                setCancelDialogOpen(true);
                setAnchorEl(null);
              }}
              sx={{ color: "error.main" }}
            >
              <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancel Referral
            </MenuItem>
          )}
        </Menu>

        {/* Create Referral Dialog */}
        <FormDialog
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
            setNewReferral({ type: "Specialist", priority: "Routine" });
            setSelectedPatient(null);
          }}
          title="Create New Referral"
          onSubmit={handleCreateReferral}
          submitLabel="Create Referral"
          loading={createMutation.isPending}
          maxWidth="md"
        >
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Patient Selection */}
            <Grid size={12}>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) =>
                  `${option.firstName} ${option.lastName}`
                }
                value={selectedPatient}
                onChange={(_, value) => setSelectedPatient(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Patient *"
                    placeholder="Select patient"
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Box>
                        <Typography variant="body2">
                          {option.firstName} {option.lastName}
                        </Typography>
                        {option.email && (
                          <Typography variant="caption" color="text.secondary">
                            {option.email}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
              />
            </Grid>

            {/* Type & Priority */}
            <Grid size={6}>
              <SelectField
                label="Referral Type *"
                value={newReferral.type || "Specialist"}
                onChange={(v) =>
                  setNewReferral({ ...newReferral, type: v as ReferralType })
                }
                options={REFERRAL_TYPES}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <SelectField
                label="Priority *"
                value={newReferral.priority || "Routine"}
                onChange={(v) =>
                  setNewReferral({
                    ...newReferral,
                    priority: v as ReferralPriority,
                  })
                }
                options={REFERRAL_PRIORITIES.map((p) => ({
                  value: p.value,
                  label: p.label,
                }))}
                fullWidth
              />
            </Grid>

            {/* Specialty */}
            <Grid size={6}>
              <Autocomplete
                freeSolo
                options={COMMON_SPECIALTIES}
                value={newReferral.specialty || ""}
                onChange={(_, value) =>
                  setNewReferral({ ...newReferral, specialty: value || "" })
                }
                onInputChange={(_, value) =>
                  setNewReferral({ ...newReferral, specialty: value })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Specialty *"
                    placeholder="e.g., Orthopedics"
                  />
                )}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Specific Service"
                value={newReferral.specificService || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    specificService: e.target.value,
                  })
                }
                fullWidth
                placeholder="e.g., MRI Lumbar Spine"
              />
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  External Provider (Optional)
                </Typography>
              </Divider>
            </Grid>

            {/* External Provider */}
            <Grid size={6}>
              <TextField
                label="Provider Name"
                value={newReferral.externalProviderName || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    externalProviderName: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Provider Phone"
                value={newReferral.externalProviderPhone || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    externalProviderPhone: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Provider Email"
                value={newReferral.externalProviderEmail || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    externalProviderEmail: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Provider Address"
                value={newReferral.externalProviderAddress || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    externalProviderAddress: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Clinical Information
                </Typography>
              </Divider>
            </Grid>

            {/* Clinical Info */}
            <Grid size={12}>
              <TextField
                label="Reason for Referral *"
                value={newReferral.reasonForReferral || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    reasonForReferral: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the clinical reason for this referral..."
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Clinical History"
                value={newReferral.clinicalHistory || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    clinicalHistory: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Current Medications"
                value={newReferral.currentMedications || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    currentMedications: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Allergies"
                value={newReferral.allergies || ""}
                onChange={(e) =>
                  setNewReferral({ ...newReferral, allergies: e.target.value })
                }
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Relevant Test Results"
                value={newReferral.relevantTestResults || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    relevantTestResults: e.target.value,
                  })
                }
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Specific Questions for Specialist"
                value={newReferral.specificQuestions || ""}
                onChange={(e) =>
                  setNewReferral({
                    ...newReferral,
                    specificQuestions: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={2}
                placeholder="Any specific questions you'd like the specialist to address..."
              />
            </Grid>
          </Grid>
        </FormDialog>

        {/* Referral Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedReferral && (
            <>
              <DialogTitle>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "primary.50",
                      color: "primary.main",
                    }}
                  >
                    {getTypeIcon(selectedReferral.type)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">
                      {selectedReferral.specialty}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedReferral.patientName} -{" "}
                      {selectedReferral.typeName}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={selectedReferral.priorityName}
                      size="small"
                      color={getPriorityColor(selectedReferral.priority)}
                    />
                    <Chip
                      label={selectedReferral.statusName}
                      size="small"
                      color={getStatusColor(selectedReferral.status)}
                    />
                  </Stack>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  {/* Reason */}
                  {selectedReferral.reasonForReferral && (
                    <Grid size={12}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Reason for Referral
                      </Typography>
                      <Typography variant="body1">
                        {selectedReferral.reasonForReferral}
                      </Typography>
                    </Grid>
                  )}

                  {/* External Provider */}
                  {selectedReferral.externalProviderName && (
                    <Grid size={12}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          External Provider
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {selectedReferral.externalProviderName}
                        </Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {selectedReferral.externalProviderAddress && (
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <LocationIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {selectedReferral.externalProviderAddress}
                              </Typography>
                            </Stack>
                          )}
                          {selectedReferral.externalProviderPhone && (
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {selectedReferral.externalProviderPhone}
                              </Typography>
                            </Stack>
                          )}
                          {selectedReferral.externalProviderEmail && (
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {selectedReferral.externalProviderEmail}
                              </Typography>
                            </Stack>
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}

                  {/* Clinical Info */}
                  {(selectedReferral.clinicalHistory ||
                    selectedReferral.currentMedications ||
                    selectedReferral.allergies) && (
                    <Grid size={12}>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        Clinical Information
                      </Typography>
                      <Grid container spacing={2}>
                        {selectedReferral.clinicalHistory && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper
                              variant="outlined"
                              sx={{ p: 2, borderRadius: 2, height: "100%" }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Clinical History
                              </Typography>
                              <Typography variant="body2">
                                {selectedReferral.clinicalHistory}
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                        {selectedReferral.currentMedications && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper
                              variant="outlined"
                              sx={{ p: 2, borderRadius: 2, height: "100%" }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Current Medications
                              </Typography>
                              <Typography variant="body2">
                                {selectedReferral.currentMedications}
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                        {selectedReferral.allergies && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper
                              variant="outlined"
                              sx={{ p: 2, borderRadius: 2, height: "100%" }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Allergies
                              </Typography>
                              <Typography variant="body2">
                                {selectedReferral.allergies}
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                      </Grid>
                    </Grid>
                  )}

                  {/* Appointment Info */}
                  {selectedReferral.appointmentDate && (
                    <Grid size={12}>
                      <Paper
                        sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}
                        elevation={0}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ScheduleIcon color="success" />
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="success.main"
                            >
                              Appointment Scheduled
                            </Typography>
                            <Typography variant="body2">
                              {format(
                                parseISO(selectedReferral.appointmentDate),
                                "EEEE, MMMM d, yyyy 'at' h:mm a",
                              )}
                            </Typography>
                            {selectedReferral.appointmentLocation && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {selectedReferral.appointmentLocation}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  )}

                  {/* Dates */}
                  <Grid size={12}>
                    <Divider />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mt: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Created:{" "}
                        {format(
                          parseISO(selectedReferral.createdAt),
                          "MMM d, yyyy 'at' h:mm a",
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Referring Provider:{" "}
                        {selectedReferral.referringProviderName || "N/A"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
                {selectedReferral.status === "Draft" && (
                  <AuraButton
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={() => {
                      sendMutation.mutate(selectedReferral.id);
                      setDetailDialogOpen(false);
                    }}
                  >
                    Send Referral
                  </AuraButton>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={() => {
            setCancelDialogOpen(false);
            setCancelReason("");
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cancel Referral</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please provide a reason for cancelling this referral.
            </Typography>
            <TextField
              label="Cancellation Reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason("");
              }}
            >
              Keep Referral
            </Button>
            <Button
              color="error"
              variant="contained"
              disabled={!cancelReason.trim() || cancelMutation.isPending}
              onClick={() => {
                if (menuReferral) {
                  cancelMutation.mutate({
                    id: menuReferral.id,
                    reason: cancelReason,
                  });
                }
              }}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Referral"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
