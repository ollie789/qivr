import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  Badge,
  Checkbox,
  alpha,
} from "@mui/material";
import {
  Add,
  Description,
  CalendarMonth as ScheduleIcon,
  Visibility,
  AutoAwesome,
  CheckCircle,
  FitnessCenter,
  Event as AppointmentIcon,
  Person as PatientIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import {
  AuraButton,
  PageHeader,
  AuraEmptyState,
  SearchBar,
  AuraGlassStatCard,
  Callout,
  auraColors,
} from "@qivr/design-system";
import { treatmentPlansApi } from "../lib/api";
import { appointmentsApi, type Appointment } from "../services/appointmentsApi";
import { useSnackbar } from "notistack";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, parseISO, isToday, isTomorrow, isPast, addDays } from "date-fns";
import {
  ScheduleAppointmentDialog,
  TreatmentPlanBuilder,
} from "../components/dialogs";

type ViewTab = "plans" | "post-appointment" | "templates";

export default function TreatmentPlans() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as ViewTab) || "plans";

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientForPlan, setSelectedPatientForPlan] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const handleScheduleSession = (plan: any) => {
    setSelectedPlan(plan);
    setScheduleDialogOpen(true);
  };

  const setTab = (tab: ViewTab) => {
    setSearchParams((prev) => {
      prev.set("tab", tab);
      return prev;
    });
  };

  // Fetch treatment plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["treatment-plans"],
    queryFn: () => treatmentPlansApi.list(),
  });

  // Fetch recent/today&apos;s completed appointments for post-appointment workflow
  const { data: recentAppointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["completed-appointments-for-plans"],
    queryFn: async () => {
      const today = new Date();
      const result = await appointmentsApi.getAppointments({
        startDate: addDays(today, -7).toISOString(),
        endDate: addDays(today, 1).toISOString(),
        status: "completed",
        limit: 50,
      });
      return result.items;
    },
  });
  const recentAppointments = recentAppointmentsData || [];

  // Filter appointments that don&apos;t already have treatment plans
  const appointmentsNeedingPlans = useMemo(() => {
    const patientIdsWithPlans = new Set(
      plans.filter((p: any) => p.status === "Active" || p.status === "Draft")
        .map((p: any) => p.patientId)
    );
    return recentAppointments.filter(
      (apt) => !patientIdsWithPlans.has(apt.patientId)
    );
  }, [recentAppointments, plans]);

  // Stats
  const stats = useMemo(() => {
    const active = plans.filter((p: any) => p.status === "Active").length;
    const draft = plans.filter((p: any) => p.status === "Draft").length;
    const completed = plans.filter((p: any) => p.status === "Completed").length;
    const needsPlans = appointmentsNeedingPlans.length;
    return { active, draft, completed, needsPlans, total: plans.length };
  }, [plans, appointmentsNeedingPlans]);

  // Filtered plans for search
  const filteredPlans = useMemo(() => {
    if (!searchQuery) return plans;
    const query = searchQuery.toLowerCase();
    return plans.filter((plan: any) =>
      plan.title?.toLowerCase().includes(query) ||
      plan.patient?.firstName?.toLowerCase().includes(query) ||
      plan.patient?.lastName?.toLowerCase().includes(query) ||
      plan.diagnosis?.toLowerCase().includes(query)
    );
  }, [plans, searchQuery]);

  const approveMutation = useMutation({
    mutationFn: (planId: string) => treatmentPlansApi.approve(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
      enqueueSnackbar("Treatment plan approved and activated", {
        variant: "success",
      });
    },
    onError: () => {
      enqueueSnackbar("Failed to approve treatment plan", { variant: "error" });
    },
  });

  const getStatusColor = (
    status: string
  ): "default" | "success" | "info" | "warning" | "error" => {
    const colors: Record<
      string,
      "default" | "success" | "info" | "warning" | "error"
    > = {
      Draft: "default",
      Active: "success",
      Completed: "info",
      Cancelled: "error",
      OnHold: "warning",
    };
    return colors[status] || "default";
  };

  const handlePlanCreated = (_planId: string) => {
    queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
    setSelectedAppointments(new Set());
    // Optionally navigate to the plan detail page
    // navigate(`/treatment-plans/${_planId}`);
  };

  const handleToggleAppointmentSelect = (id: string) => {
    setSelectedAppointments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllAppointments = () => {
    if (selectedAppointments.size === appointmentsNeedingPlans.length) {
      setSelectedAppointments(new Set());
    } else {
      setSelectedAppointments(new Set(appointmentsNeedingPlans.map((a) => a.id)));
    }
  };

  const handleBulkCreatePlans = () => {
    // Get selected appointments and open bulk dialog
    const selected = appointmentsNeedingPlans.filter((a) =>
      selectedAppointments.has(a.id)
    );
    if (selected.length === 0) {
      enqueueSnackbar("Please select at least one appointment to generate a treatment plan", {
        variant: "warning",
      });
      return;
    }
    setShowBulkCreateDialog(true);
  };

  const getAppointmentDateLabel = (apt: Appointment) => {
    const date = parseISO(apt.scheduledStart);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return format(date, "MMM d");
    return format(date, "MMM d");
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Treatment Plans"
        description="Manage patient treatment plans"
        actions={
          <Stack direction="row" spacing={1}>
            {selectedAppointments.size > 0 && (
              <>
                <Chip
                  label={`${selectedAppointments.size} selected`}
                  onDelete={() => setSelectedAppointments(new Set())}
                  size="small"
                />
                <AuraButton
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  onClick={handleBulkCreatePlans}
                >
                  Create Plans for Selected
                </AuraButton>
              </>
            )}
            <AuraButton
              variant="outlined"
              startIcon={<GroupIcon />}
              onClick={() => setShowBulkCreateDialog(true)}
            >
              Bulk Create
            </AuraButton>
            <AuraButton
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowCreateDialog(true)}
            >
              Create Plan
            </AuraButton>
          </Stack>
        }
      />

      {/* Stats Row */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: "1 1 150px", minWidth: 150 }}>
          <AuraGlassStatCard
            title="Active Plans"
            value={stats.active}
            icon={<FitnessCenter />}
          />
        </Box>
        <Box sx={{ flex: "1 1 150px", minWidth: 150 }}>
          <AuraGlassStatCard
            title="Draft"
            value={stats.draft}
            icon={<Description />}
          />
        </Box>
        <Box sx={{ flex: "1 1 150px", minWidth: 150 }}>
          <AuraGlassStatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle />}
          />
        </Box>
        <Box
          onClick={() => setTab("post-appointment")}
          sx={{ flex: "1 1 150px", minWidth: 150, cursor: "pointer" }}
        >
          <AuraGlassStatCard
            title="Need Plans"
            value={stats.needsPlans}
            icon={<AppointmentIcon />}
          />
        </Box>
      </Box>

      {/* Post-appointment callout */}
      {stats.needsPlans > 0 && activeTab === "plans" && (
        <Box sx={{ mb: 3 }}>
          <Callout variant="info">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AppointmentIcon />
              <span>
                <strong>{stats.needsPlans}</strong> recent appointments don&apos;t have treatment plans yet.
              </span>
              <AuraButton
                size="small"
                variant="text"
                onClick={() => setTab("post-appointment")}
                sx={{ ml: "auto" }}
              >
                Review Appointments
              </AuraButton>
            </Box>
          </Callout>
        </Box>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab
          value="plans"
          label={
            <Badge badgeContent={stats.total} color="primary" max={99}>
              <Box sx={{ pr: 2 }}>All Plans</Box>
            </Badge>
          }
        />
        <Tab
          value="post-appointment"
          label={
            <Badge badgeContent={stats.needsPlans} color="warning" max={99}>
              <Box sx={{ pr: 2 }}>Post-Appointment</Box>
            </Badge>
          }
        />
      </Tabs>

      {/* Search (for plans tab) */}
      {activeTab === "plans" && (
        <Box sx={{ mb: 2, maxWidth: 400 }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search plans by patient, title, diagnosis..."
          />
        </Box>
      )}

      {/* Plans Tab Content */}
      {activeTab === "plans" && (
        <>
          {isLoading ? (
            <Typography color="text.secondary">Loading...</Typography>
          ) : filteredPlans.length === 0 ? (
            <AuraEmptyState
              icon={<Description />}
              title={searchQuery ? "No matching plans" : "No treatment plans yet"}
              description={searchQuery ? "Try a different search term" : "Create your first treatment plan using AI assistance or manual setup"}
              actionText={searchQuery ? undefined : "Create Plan"}
              onAction={searchQuery ? undefined : () => setShowCreateDialog(true)}
            />
          ) : (
            <Stack spacing={2}>
              {filteredPlans.map((plan: any) => (
            <Paper
              key={plan.id}
              sx={{
                p: 3,
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  boxShadow: 4,
                  transform: "translateY(-2px)",
                },
              }}
              onClick={() => navigate(`/treatment-plans/${plan.id}`)}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "start",
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {plan.title}
                    </Typography>
                    {plan.aiGeneratedAt && (
                      <Tooltip title="AI Generated">
                        <AutoAwesome fontSize="small" color="primary" />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {plan.patient?.firstName} {plan.patient?.lastName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={plan.status}
                    size="small"
                    color={getStatusColor(plan.status)}
                  />
                  {plan.status === "Draft" && (
                    <Tooltip title="Approve & Activate">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={(e) => {
                          e.stopPropagation();
                          approveMutation.mutate(plan.id);
                        }}
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Progress bar for active plans */}
              {plan.status === "Active" && plan.progressPercentage > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="caption" color="primary">
                      {Math.round(plan.progressPercentage)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={plan.progressPercentage}
                    sx={{ borderRadius: 1, height: 6 }}
                  />
                </Box>
              )}

              {plan.diagnosis && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Diagnosis:
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {plan.diagnosis}
                  </Typography>
                </Box>
              )}

              {/* Phase summary */}
              {plan.phases?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                    Phases:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {plan.phases.slice(0, 4).map((phase: any, idx: number) => (
                      <Chip
                        key={idx}
                        label={`${phase.name} (${phase.durationWeeks}w)`}
                        size="small"
                        variant={
                          phase.status === "InProgress" ? "filled" : "outlined"
                        }
                        color={
                          phase.status === "Completed"
                            ? "success"
                            : phase.status === "InProgress"
                              ? "primary"
                              : "default"
                        }
                      />
                    ))}
                    {plan.phases.length > 4 && (
                      <Chip
                        label={`+${plan.phases.length - 4} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mt: 2,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {plan.durationWeeks} weeks
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Started: {new Date(plan.startDate).toLocaleDateString()}
                </Typography>
                {plan.phases?.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    <FitnessCenter
                      fontSize="inherit"
                      sx={{ verticalAlign: "middle", mr: 0.5 }}
                    />
                    {plan.phases.reduce(
                      (acc: number, p: any) => acc + (p.exercises?.length || 0),
                      0
                    )}{" "}
                    exercises
                  </Typography>
                )}
                {plan.completedSessions > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {plan.completedSessions}/{plan.totalSessions} sessions
                  </Typography>
                )}
                <Box sx={{ flexGrow: 1 }} />
                <AuraButton
                  size="small"
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/treatment-plans/${plan.id}`);
                  }}
                >
                  View Details
                </AuraButton>
                <AuraButton
                  size="small"
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScheduleSession(plan);
                  }}
                >
                  Schedule
                </AuraButton>
              </Box>
            </Paper>
          ))}
            </Stack>
          )}
        </>
      )}

      {/* Post-Appointment Tab Content */}
      {activeTab === "post-appointment" && (
        <>
          {appointmentsLoading ? (
            <Typography color="text.secondary">Loading appointments...</Typography>
          ) : appointmentsNeedingPlans.length === 0 ? (
            <AuraEmptyState
              icon={<CheckCircle />}
              title="All caught up!"
              description="All recent appointments have treatment plans assigned"
              variant="compact"
            />
          ) : (
            <>
              {/* Select All / Actions Bar */}
              <Paper sx={{ p: 2, mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <Checkbox
                  checked={selectedAppointments.size === appointmentsNeedingPlans.length && appointmentsNeedingPlans.length > 0}
                  indeterminate={selectedAppointments.size > 0 && selectedAppointments.size < appointmentsNeedingPlans.length}
                  onChange={handleSelectAllAppointments}
                  icon={<CheckBoxBlankIcon />}
                  checkedIcon={<CheckBoxIcon />}
                />
                <Typography variant="body2" color="text.secondary">
                  {selectedAppointments.size > 0
                    ? `${selectedAppointments.size} of ${appointmentsNeedingPlans.length} selected`
                    : `${appointmentsNeedingPlans.length} appointments need treatment plans`}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {selectedAppointments.size > 0 && (
                  <AuraButton
                    variant="contained"
                    startIcon={<AutoAwesome />}
                    onClick={handleBulkCreatePlans}
                  >
                    Create {selectedAppointments.size} Plan{selectedAppointments.size !== 1 ? "s" : ""}
                  </AuraButton>
                )}
              </Paper>

              <Stack spacing={1}>
                {appointmentsNeedingPlans.map((apt) => (
                  <Paper
                    key={apt.id}
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      borderRadius: 2,
                      bgcolor: selectedAppointments.has(apt.id)
                        ? alpha(auraColors.blue.main, 0.08)
                        : "background.paper",
                      border: selectedAppointments.has(apt.id)
                        ? `2px solid ${auraColors.blue.main}`
                        : "1px solid transparent",
                      transition: "all 0.15s",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: alpha(auraColors.blue.main, 0.04),
                      },
                    }}
                    onClick={() => handleToggleAppointmentSelect(apt.id)}
                  >
                    <Checkbox
                      checked={selectedAppointments.has(apt.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleToggleAppointmentSelect(apt.id)}
                      icon={<CheckBoxBlankIcon />}
                      checkedIcon={<CheckBoxIcon />}
                    />

                    <Avatar sx={{ bgcolor: auraColors.blue.main }}>
                      <PatientIcon />
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {apt.patientName}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={getAppointmentDateLabel(apt)}
                          variant="outlined"
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {format(parseISO(apt.scheduledStart), "h:mm a")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          •
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {apt.appointmentType}
                        </Typography>
                        {apt.providerName && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {apt.providerName}
                            </Typography>
                          </>
                        )}
                      </Stack>
                      {apt.reasonForVisit && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {apt.reasonForVisit}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Create AI Treatment Plan">
                        <AuraButton
                          size="small"
                          variant="contained"
                          startIcon={<AutoAwesome />}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Set selected patient for single plan creation
                            setSelectedPatientForPlan({
                              id: apt.patientId,
                              firstName: apt.patientName.split(" ")[0] || "",
                              lastName: apt.patientName.split(" ").slice(1).join(" ") || "",
                            });
                            setShowCreateDialog(true);
                          }}
                        >
                          Create Plan
                        </AuraButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
        </>
      )}

      {/* Single Plan Builder Dialog */}
      <TreatmentPlanBuilder
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setSelectedPatientForPlan(null);
        }}
        patient={selectedPatientForPlan || undefined}
        onSuccess={handlePlanCreated}
      />

      {/* Bulk Plan Builder Dialog */}
      <TreatmentPlanBuilder
        open={showBulkCreateDialog}
        onClose={() => {
          setShowBulkCreateDialog(false);
          setSelectedAppointments(new Set());
        }}
        onSuccess={handlePlanCreated}
        bulkPatients={
          Array.from(selectedAppointments)
            .map((id) => appointmentsNeedingPlans.find((a) => a.id === id))
            .filter(Boolean)
            .map((apt) => ({
              id: apt!.patientId,
              firstName: apt!.patientName.split(" ")[0] || "",
              lastName: apt!.patientName.split(" ").slice(1).join(" ") || "",
              appointmentId: apt!.id,
              appointmentType: apt!.appointmentType,
              reasonForVisit: apt!.reasonForVisit,
            }))
        }
      />

      <ScheduleAppointmentDialog
        open={scheduleDialogOpen}
        onClose={() => {
          setScheduleDialogOpen(false);
          setSelectedPlan(null);
        }}
        patient={
          selectedPlan?.patient
            ? {
                id: selectedPlan.patient.id,
                firstName: selectedPlan.patient.firstName,
                lastName: selectedPlan.patient.lastName,
                email: selectedPlan.patient.email || "",
                phone: selectedPlan.patient.phone || "",
              }
            : undefined
        }
        patientId={selectedPlan?.patientId}
        treatmentPlanId={selectedPlan?.id}
        appointmentType="treatment"
      />
    </Box>
  );
}
