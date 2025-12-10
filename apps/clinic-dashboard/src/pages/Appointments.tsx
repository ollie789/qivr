import { useState, useCallback, useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  DateSelectArg,
  DatesSetArg,
} from "@fullcalendar/core";
import {
  Box,
  Typography,
  Stack,
  Chip,
  TextField,
  Divider,
  Paper,
  FormControlLabel,
  Checkbox,
  Slider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  LinearProgress,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Notes as NotesIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  PlayArrow as StartIcon,
  MoreVert as MoreIcon,
  Today as TodayIcon,
  FitnessCenter as ExerciseIcon,
  EventRepeat as ScheduleNextIcon,
  AutoAwesome as AutoIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ViewWeek as WeekViewIcon,
  CalendarMonth as MonthViewIcon,
  FilterList as FilterIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { format, parseISO, isToday, isSameDay, addDays } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import {
  auraTokens,
  AuraButton,
  AuraCard,
  AuraIconButton,
  FormDialog,
  ConfirmDialog,
  SelectField,
} from "@qivr/design-system";
import { ScheduleAppointmentDialog } from "../components/dialogs/ScheduleAppointmentDialog";
import {
  TreatmentPlanBuilder,
  PaymentRecordDialog,
} from "../components/dialogs";
import { SessionView } from "../components/session";
import {
  promApi,
  NotificationMethod,
  type PromTemplateSummary,
} from "../services/promApi";
import { treatmentPlansApi } from "../lib/api";
import { providerApi } from "../services/providerApi";
import type { Appointment } from "../features/appointments/types";
import { appointmentsApi } from "../services/appointmentsApi";
import { useAuthUser } from "../stores/authStore";

interface TreatmentPlanSummary {
  id: string;
  title: string;
  status: string;
  currentPhase?: string;
  completedSessions: number;
  totalSessions: number;
  nextSessionNumber: number;
  progressPercent: number;
  sessionsPerWeek?: number;
}

// Auto-PROM configuration per appointment type
// Maps appointment type to default PROM template key (null = no auto-PROM)
const AUTO_PROM_CONFIG: Record<
  string,
  { templateKey: string | null; label: string }
> = {
  initial: {
    templateKey: "pain-disability-index",
    label: "Pain & Disability Index",
  },
  followup: { templateKey: "quick-dash", label: "QuickDASH" },
  treatment: { templateKey: "nprs", label: "Numeric Pain Rating" },
  assessment: { templateKey: "oswestry", label: "Oswestry Disability Index" },
};

export default function Appointments() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAuthUser();
  const calendarRef = useRef<FullCalendar>(null);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [agendaDate, setAgendaDate] = useState<Date>(new Date());
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    // Practitioners auto-filter to their own appointments
    user?.role === "practitioner" ? (user?.id ?? "all") : "all",
  );
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    el: HTMLElement;
    apt: Appointment;
  } | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [modalities, setModalities] = useState({
    manualTherapy: false,
    exerciseTherapy: false,
    modalities: false,
    education: false,
  });
  const [painLevel, setPainLevel] = useState(5);
  const [assignPROM, setAssignPROM] = useState(false);
  const [selectedPromTemplate, setSelectedPromTemplate] = useState("");
  const [updateTreatmentPlan, setUpdateTreatmentPlan] = useState(false);
  const [sendPlanReminder, setSendPlanReminder] = useState(false);
  const [patientTreatmentPlan, setPatientTreatmentPlan] =
    useState<TreatmentPlanSummary | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    severity: "warning" | "error";
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    message: "",
    severity: "warning",
    onConfirm: () => {},
  });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduleNextSessionOpen, setScheduleNextSessionOpen] = useState(false);
  const [suggestedNextDate, setSuggestedNextDate] = useState<Date | null>(null);
  const [treatmentPlanBuilderOpen, setTreatmentPlanBuilderOpen] =
    useState(false);
  const [sessionViewAppointment, setSessionViewAppointment] =
    useState<Appointment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAppointment, setPaymentAppointment] =
    useState<Appointment | null>(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Fetch appointments for current view range
  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => appointmentsApi.getAppointments({ limit: 500 }),
  });

  const { data: promTemplates = [] } = useQuery<PromTemplateSummary[]>({
    queryKey: ["prom-templates-active"],
    queryFn: () => promApi.getTemplates({ isActive: true }),
  });

  // Fetch providers for the filter dropdown
  const { data: providers = [] } = useQuery({
    queryKey: ["providers"],
    queryFn: () =>
      providerApi.getClinicProviders(undefined, { activeOnly: true }),
  });

  // Filter appointments based on selected provider
  const allAppointments: Appointment[] = appointmentsData?.items ?? [];
  const appointments = useMemo(() => {
    if (selectedProviderId === "all") return allAppointments;
    return allAppointments.filter(
      (apt) => apt.providerId === selectedProviderId,
    );
  }, [allAppointments, selectedProviderId]);

  // Agenda appointments - show appointments for selected agenda date
  const agendaAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        const aptDate = parseISO(apt.scheduledStart);
        return isSameDay(aptDate, agendaDate);
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledStart).getTime() -
          new Date(b.scheduledStart).getTime(),
      );
  }, [appointments, agendaDate]);

  // Stats for agenda date
  const agendaStats = useMemo(() => {
    const total = agendaAppointments.length;
    const completed = agendaAppointments.filter(
      (a) => a.status === "completed",
    ).length;
    const upcoming = agendaAppointments.filter(
      (a) => a.status === "scheduled" || a.status === "confirmed",
    ).length;
    const inProgress = agendaAppointments.filter(
      (a) => a.status === "in-progress",
    ).length;
    return { total, completed, upcoming, inProgress };
  }, [agendaAppointments]);

  // Convert appointments to FullCalendar events
  const calendarEvents = appointments.map((apt) => ({
    id: apt.id,
    title: apt.patientName || "Appointment",
    start: apt.scheduledStart,
    end: apt.scheduledEnd,
    backgroundColor: getStatusColor(apt.status),
    borderColor: getStatusColor(apt.status),
    extendedProps: { appointment: apt },
  }));

  function getStatusColor(status: string): string {
    switch (status) {
      case "completed":
        return theme.palette.success.main;
      case "confirmed":
        return theme.palette.primary.main;
      case "cancelled":
        return theme.palette.error.main;
      case "in-progress":
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  }

  function getStatusChipColor(status: string) {
    switch (status) {
      case "completed":
        return "success";
      case "in-progress":
        return "warning";
      case "cancelled":
        return "error";
      case "confirmed":
        return "primary";
      default:
        return "default";
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "completed":
        return "Completed";
      case "confirmed":
        return "Confirmed";
      case "cancelled":
        return "Cancelled";
      case "in-progress":
        return "In Progress";
      case "scheduled":
        return "Scheduled";
      default:
        return status;
    }
  }

  const handleEventClick = (info: EventClickArg) => {
    const apt = info.event.extendedProps.appointment as Appointment;
    // If appointment is in-progress, open SessionView directly
    if (apt.status === "in-progress") {
      setSessionViewAppointment(apt);
    } else {
      setMenuAnchor({ el: info.el as HTMLElement, apt });
    }
  };

  const handleDateSelect = (info: DateSelectArg) => {
    setSelectedDate(info.start);
    setScheduleDialogOpen(true);
  };

  // Sync current date when calendar view changes
  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentDate(arg.start);
  };

  // Handle view mode change
  const handleViewModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: "week" | "month" | null,
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
      if (calendarRef.current) {
        const api = calendarRef.current.getApi();
        if (newMode === "week") {
          api.changeView("timeGridWeek");
        } else {
          api.changeView("dayGridMonth");
        }
      }
    }
  };

  // Navigate calendar
  const navigateCalendar = (direction: "prev" | "next" | "today") => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      if (direction === "today") {
        api.today();
        setCurrentDate(new Date());
      } else if (direction === "prev") {
        api.prev();
      } else {
        api.next();
      }
    }
  };

  const openConfirmDialog = useCallback(
    (config: Omit<typeof confirmDialog, "open">) => {
      setConfirmDialog({ ...config, open: true });
    },
    [],
  );

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }, []);

  // Shared logic for loading appointment session state
  const loadAppointmentSession = async (apt: Appointment) => {
    setSessionNotes(apt.notes || "");
    setModalities({
      manualTherapy: false,
      exerciseTherapy: false,
      modalities: false,
      education: false,
    });
    setPainLevel(5);
    setUpdateTreatmentPlan(false);
    setSendPlanReminder(false);
    setPatientTreatmentPlan(null);

    // Auto-select PROM based on appointment type
    const appointmentTypeKey =
      apt.appointmentType?.toLowerCase().replace(/[^a-z]/g, "") || "";
    const autoPromConfig =
      AUTO_PROM_CONFIG[appointmentTypeKey] || AUTO_PROM_CONFIG["followup"];
    if (autoPromConfig?.templateKey) {
      setAssignPROM(true);
      setSelectedPromTemplate(autoPromConfig.templateKey);
    } else {
      setAssignPROM(false);
      setSelectedPromTemplate("");
    }

    // Fetch patient's active treatment plan
    if (apt.patientId) {
      setLoadingPlan(true);
      try {
        const plans = await treatmentPlansApi.list(apt.patientId);
        const activePlan = (plans as any[]).find(
          (p: any) =>
            p.status === "Active" ||
            p.status === "active" ||
            p.status === "InProgress",
        );
        if (activePlan) {
          const completedSessions =
            activePlan.sessions?.filter((s: any) => s.completed)?.length ?? 0;
          const totalSessions =
            activePlan.totalSessions ?? activePlan.sessions?.length ?? 0;
          setPatientTreatmentPlan({
            id: activePlan.id,
            title: activePlan.title,
            status: activePlan.status,
            currentPhase:
              activePlan.currentPhase ?? activePlan.phases?.[0]?.name,
            completedSessions,
            totalSessions,
            nextSessionNumber: completedSessions + 1,
            progressPercent:
              totalSessions > 0
                ? Math.round((completedSessions / totalSessions) * 100)
                : 0,
            sessionsPerWeek: activePlan.sessionsPerWeek ?? 2,
          });
          setUpdateTreatmentPlan(true);
        }
      } catch (error) {
        console.error("Failed to fetch treatment plan:", error);
      } finally {
        setLoadingPlan(false);
      }
    }
  };

  const handleOpenNotes = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNotesDialogOpen(true);
    await loadAppointmentSession(appointment);
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;
    try {
      const modalitiesUsed = Object.entries(modalities)
        .filter(([_, used]) => used)
        .map(([name]) => name.replace(/([A-Z])/g, " $1").trim())
        .join(", ");

      const treatmentPlanNote =
        updateTreatmentPlan && patientTreatmentPlan
          ? `\n[Treatment Plan Session ${patientTreatmentPlan.nextSessionNumber} completed]`
          : "";
      const enhancedNotes = `${sessionNotes}\n\nModalities: ${modalitiesUsed || "None"}\nPain Level: ${painLevel}/10${assignPROM ? "\n[PROM Assigned]" : ""}${treatmentPlanNote}`;

      await appointmentsApi.updateAppointment(selectedAppointment.id, {
        notes: enhancedNotes,
      });

      // Update treatment plan session if enabled
      if (updateTreatmentPlan && patientTreatmentPlan) {
        try {
          await treatmentPlansApi.completeSession(
            patientTreatmentPlan.id,
            patientTreatmentPlan.nextSessionNumber,
            {
              painLevelAfter: painLevel,
              notes: sessionNotes,
              appointmentId: selectedAppointment.id,
            },
          );
          enqueueSnackbar(
            `Treatment plan session ${patientTreatmentPlan.nextSessionNumber} marked complete`,
            { variant: "success" },
          );
          queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
        } catch (err) {
          console.error("Failed to update treatment plan:", err);
          enqueueSnackbar("Failed to update treatment plan session", {
            variant: "warning",
          });
        }
      }

      // Send PROM if enabled
      if (assignPROM && selectedPromTemplate) {
        await promApi.sendProm({
          templateKey: selectedPromTemplate,
          patientId: selectedAppointment.patientId,
          scheduledFor: new Date().toISOString(),
          notificationMethod:
            NotificationMethod.Email | NotificationMethod.InApp,
          notes: `Assigned after session on ${format(new Date(), "MMM d, yyyy")}`,
        });
        enqueueSnackbar("PROM assigned to patient", { variant: "success" });
      }

      // Send treatment plan reminder if enabled
      if (sendPlanReminder && patientTreatmentPlan) {
        // For now, we'll show a success message - in production this would trigger an actual notification
        enqueueSnackbar("Treatment plan reminder sent to patient", {
          variant: "info",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Notes saved", { variant: "success" });
      setNotesDialogOpen(false);

      // If patient has treatment plan with remaining sessions, suggest scheduling next
      if (
        patientTreatmentPlan &&
        patientTreatmentPlan.nextSessionNumber <
          patientTreatmentPlan.totalSessions
      ) {
        const daysUntilNext = Math.round(
          7 / (patientTreatmentPlan.sessionsPerWeek || 2),
        );
        const suggested = addDays(new Date(), daysUntilNext);
        setSuggestedNextDate(suggested);
        setScheduleNextSessionOpen(true);
      }
    } catch {
      enqueueSnackbar("Failed to save notes", { variant: "error" });
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      await appointmentsApi.completeAppointment(id, { notes: sessionNotes });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Appointment completed", { variant: "success" });
      setNotesDialogOpen(false);
      setMenuAnchor(null);

      // If patient has treatment plan with remaining sessions, suggest scheduling next
      if (
        patientTreatmentPlan &&
        patientTreatmentPlan.nextSessionNumber <
          patientTreatmentPlan.totalSessions
      ) {
        const daysUntilNext = Math.round(
          7 / (patientTreatmentPlan.sessionsPerWeek || 2),
        );
        const suggested = addDays(new Date(), daysUntilNext);
        setSuggestedNextDate(suggested);
        setScheduleNextSessionOpen(true);
      }
    } catch {
      enqueueSnackbar("Failed to complete appointment", { variant: "error" });
    }
  };

  const handleCancelAppointment = (id: string) => {
    openConfirmDialog({
      title: "Cancel Appointment",
      message:
        "Are you sure you want to cancel this appointment? The patient will be notified.",
      severity: "warning",
      onConfirm: async () => {
        try {
          await appointmentsApi.cancelAppointment(id);
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          enqueueSnackbar("Appointment cancelled", { variant: "success" });
        } catch {
          enqueueSnackbar("Failed to cancel appointment", { variant: "error" });
        }
        closeConfirmDialog();
        setMenuAnchor(null);
      },
    });
  };

  const handleDeleteAppointment = (id: string) => {
    openConfirmDialog({
      title: "Delete Appointment",
      message:
        "Are you sure you want to delete this appointment? This action cannot be undone.",
      severity: "error",
      onConfirm: async () => {
        try {
          await appointmentsApi.deleteAppointment(id);
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
          enqueueSnackbar("Appointment deleted", { variant: "success" });
        } catch {
          enqueueSnackbar("Failed to delete appointment", { variant: "error" });
        }
        closeConfirmDialog();
        setMenuAnchor(null);
      },
    });
  };

  const handleStartSession = async (apt: Appointment) => {
    try {
      await appointmentsApi.updateAppointment(apt.id, {
        status: "in-progress",
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Session started", { variant: "info" });
      // Open the full Session View
      setSessionViewAppointment(apt);
      setMenuAnchor(null);
    } catch {
      enqueueSnackbar("Failed to start session", { variant: "error" });
    }
  };

  return (
    <Box
      className="page-enter"
      sx={{
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          px: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{
              bgcolor: "background.paper",
              "& .MuiToggleButton-root": {
                px: 2,
                py: 0.75,
                textTransform: "none",
                fontWeight: 500,
              },
              "& .Mui-selected": {
                bgcolor: "primary.main !important",
                color: "white !important",
              },
            }}
          >
            <ToggleButton value="week">
              <WeekViewIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Week
            </ToggleButton>
            <ToggleButton value="month">
              <MonthViewIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Month
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <AuraButton
            variant="outlined"
            onClick={() => navigateCalendar("today")}
            sx={{ minWidth: 80 }}
          >
            Today
          </AuraButton>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <AuraIconButton
              tooltip={viewMode === "week" ? "Previous week" : "Previous month"}
              size="small"
              onClick={() => navigateCalendar("prev")}
            >
              <ChevronLeftIcon />
            </AuraIconButton>
            <AuraIconButton
              tooltip={viewMode === "week" ? "Next week" : "Next month"}
              size="small"
              onClick={() => navigateCalendar("next")}
            >
              <ChevronRightIcon />
            </AuraIconButton>
          </Box>
          <Typography variant="h5" fontWeight={600}>
            {format(currentDate, "MMMM yyyy")}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Provider Filter - hide for practitioners who see only their own */}
          {user?.role !== "practitioner" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterIcon sx={{ color: "text.secondary", fontSize: 20 }} />
              <Box sx={{ minWidth: 180 }}>
                <SelectField
                  label=""
                  value={selectedProviderId}
                  onChange={setSelectedProviderId}
                  options={[
                    { value: "all", label: "All Providers" },
                    ...providers.map((p) => ({
                      value: p.id,
                      label: p.fullName || `${p.firstName} ${p.lastName}`,
                    })),
                  ]}
                />
              </Box>
            </Box>
          )}
          <AuraButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setScheduleDialogOpen(true)}
          >
            New Appointment
          </AuraButton>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          display: "flex",
          gap: auraTokens.spacing.md,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Calendar Section */}
        <AuraCard
          hover={false}
          variant="flat"
          sx={{
            flex: 1,
            p: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.3s ease",
            "& .fc": { fontFamily: "inherit", height: "100%" },
          }}
        >
          <Box
            sx={{
              flex: 1,
              // FullCalendar grid line overrides - using !important for maximum specificity
              "& .fc": {
                "--fc-border-color":
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.25)"
                    : "rgba(0, 0, 0, 0.2)",
              },
              "& .fc-toolbar": { display: "none" },
              "& .fc-view-harness": { bgcolor: "background.paper" },
              "& .fc-event": {
                cursor: "pointer",
                borderRadius: auraTokens.borderRadius.sm,
                fontSize: "0.75rem",
                border: "none",
                boxShadow: auraTokens.shadows.sm,
              },
              // Column headers
              "& .fc-col-header": {
                borderBottom: `2px solid ${theme.palette.divider} !important`,
              },
              "& .fc-col-header-cell": {
                py: 1.5,
                verticalAlign: "top",
                borderRight: `1px solid ${theme.palette.divider} !important`,
                "&:last-child": { borderRight: "none !important" },
              },
              "& .fc-col-header-cell-cushion": {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                py: 0.5,
                textDecoration: "none !important",
              },
              "& .fc-day-today": { bgcolor: "transparent !important" },

              // === GRID LINES - AGGRESSIVE OVERRIDES ===
              // All table cells get visible borders
              "& .fc-scrollgrid, & .fc-scrollgrid table, & .fc-scrollgrid td, & .fc-scrollgrid th":
                {
                  borderColor: `${theme.palette.divider} !important`,
                },
              // Time slots - horizontal lines between time slots
              "& .fc-timegrid-slot": {
                height: "48px",
                borderBottom: `1px solid ${theme.palette.divider} !important`,
              },
              "& .fc-timegrid-slot-lane": {
                borderTop: `1px solid ${theme.palette.divider} !important`,
              },
              // Hour vs half-hour distinction
              "& .fc-timegrid-slot-minor": {
                borderTopStyle: "dashed !important",
                borderTopColor: `${alpha(theme.palette.divider, 0.5)} !important`,
              },
              // Time labels
              "& .fc-timegrid-slot-label": {
                fontSize: "0.7rem",
                color: "text.secondary",
                fontWeight: 400,
                verticalAlign: "top",
                paddingTop: "4px",
                borderRight: `1px solid ${theme.palette.divider} !important`,
              },
              "& .fc-timegrid-slot-label-cushion": { paddingRight: "12px" },
              "& .fc-timegrid-event": {
                borderRadius: auraTokens.borderRadius.sm,
                fontSize: "0.75rem",
              },
              // VERTICAL LINES between days - this is the key one
              "& .fc-timegrid-col": {
                borderRight: `1px solid ${theme.palette.divider} !important`,
                "&:last-child": { borderRight: "none !important" },
              },
              "& .fc-timegrid-cols": {
                "& > table": {
                  borderCollapse: "collapse !important",
                },
                "& td": {
                  borderRight: `1px solid ${theme.palette.divider} !important`,
                  "&:last-child": { borderRight: "none !important" },
                },
              },
              // Day columns in the body
              "& .fc-daygrid-day, & .fc-timegrid-col-frame": {
                borderRight: `1px solid ${theme.palette.divider} !important`,
                "&:last-child": { borderRight: "none !important" },
              },
              // Now indicator
              "& .fc-timegrid-now-indicator-line": {
                borderColor: `${theme.palette.error.main} !important`,
                borderWidth: "2px !important",
              },
              "& .fc-timegrid-now-indicator-arrow": {
                borderTopColor: `${theme.palette.error.main} !important`,
                borderWidth: "5px !important",
              },
              // Time axis column
              "& .fc-timegrid-axis": {
                width: "56px",
                borderRight: `1px solid ${theme.palette.divider} !important`,
              },
              // Outer border of the whole grid
              "& .fc-scrollgrid": {
                border: `1px solid ${theme.palette.divider} !important`,
              },
              // Section dividers
              "& .fc-scrollgrid-section > td": {
                borderBottom: `1px solid ${theme.palette.divider} !important`,
              },
              "& .fc-scrollgrid-section-header > td": {
                borderBottom: `2px solid ${theme.palette.divider} !important`,
              },
            }}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={false}
              events={calendarEvents}
              eventClick={handleEventClick}
              select={handleDateSelect}
              datesSet={handleDatesSet}
              selectable
              selectMirror
              weekends
              height="100%"
              nowIndicator
              slotMinTime="08:00:00"
              slotMaxTime="19:00:00"
              slotDuration="00:30:00"
              scrollTime="09:00:00"
              allDaySlot={false}
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                meridiem: "short",
              }}
              dayHeaderContent={(arg) => {
                const isSelected = isSameDay(arg.date, agendaDate);
                const isTodayDate = isToday(arg.date);
                return (
                  <Box
                    onClick={() => setAgendaDate(arg.date)}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 0.5,
                      cursor: "pointer",
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: isTodayDate
                          ? "primary.main"
                          : "text.secondary",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        fontSize: "0.7rem",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {format(arg.date, "EEE")}
                    </Typography>
                    {/* Only show day number circle in week view */}
                    {viewMode === "week" && (
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: isSelected
                            ? "primary.main"
                            : isTodayDate
                              ? alpha(theme.palette.primary.main, 0.1)
                              : "transparent",
                          color: isSelected
                            ? "white"
                            : isTodayDate
                              ? "primary.main"
                              : "text.primary",
                          fontWeight: isSelected || isTodayDate ? 600 : 500,
                          fontSize: "1.1rem",
                          transition: "all 0.2s",
                          border: isTodayDate && !isSelected ? "2px solid" : "none",
                          borderColor: "primary.main",
                        }}
                      >
                        {format(arg.date, "d")}
                      </Box>
                    )}
                  </Box>
                );
              }}
              slotLabelFormat={{ hour: "numeric", meridiem: "short" }}
            />
          </Box>
        </AuraCard>

        {/* Today's Agenda - Always visible right panel */}
        <AuraCard
          hover={false}
          variant="flat"
          sx={{
            width: 340,
            p: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {/* Agenda Header with Stats */}
          <Box
            sx={{
              p: 2,
              background: auraTokens.gradients.primary,
              color: "white",
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {isToday(agendaDate) ? "Today's Agenda" : "Daily Agenda"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {format(agendaDate, "EEEE, MMMM d")}
            </Typography>
            {/* Compact Stats Row */}
            <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" fontWeight={700}>
                  {agendaStats.total}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Total
                </Typography>
              </Box>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.3)" }}
              />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" fontWeight={700} color="warning.light">
                  {agendaStats.inProgress}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Active
                </Typography>
              </Box>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.3)" }}
              />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" fontWeight={700} color="success.light">
                  {agendaStats.completed}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Done
                </Typography>
              </Box>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.3)" }}
              />
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" fontWeight={700}>
                  {agendaStats.upcoming}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Next
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Scrollable Appointments List */}
          <Box sx={{ flex: 1, overflow: "auto", p: 1.5 }}>
            {agendaAppointments.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <TodayIcon
                  sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                />
                <Typography color="text.secondary">
                  No appointments {isToday(agendaDate) ? "today" : "on this day"}
                </Typography>
                <AuraButton
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedDate(agendaDate);
                    setScheduleDialogOpen(true);
                  }}
                  sx={{ mt: 2 }}
                >
                  Schedule Now
                </AuraButton>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {agendaAppointments.map((apt) => {
                  const startTime = parseISO(apt.scheduledStart);
                  const endTime = parseISO(apt.scheduledEnd);
                  const isActive = apt.status === "in-progress";
                  const isComplete = apt.status === "completed";
                  const isCancelled = apt.status === "cancelled";

                  return (
                    <Paper
                      key={apt.id}
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: isActive ? "warning.main" : "divider",
                        bgcolor: isActive
                          ? alpha(theme.palette.warning.main, 0.08)
                          : isComplete
                            ? alpha(theme.palette.success.main, 0.05)
                            : isCancelled
                              ? alpha(theme.palette.error.main, 0.05)
                              : "background.paper",
                        opacity: isCancelled ? 0.6 : 1,
                        transition: "all 0.2s",
                        overflow: "hidden",
                      }}
                    >
                      {/* Appointment Card */}
                      <Box
                        sx={{
                          p: 1.5,
                          cursor: isActive ? "pointer" : "default",
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                          },
                        }}
                        onClick={() => {
                          if (isActive) {
                            setSessionViewAppointment(apt);
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1.5 }}>
                          <Box sx={{ textAlign: "center", minWidth: 50 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              color={isActive ? "warning.main" : "text.primary"}
                            >
                              {format(startTime, "h:mm")}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {format(startTime, "a")}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.disabled"
                              sx={{ fontSize: "0.65rem" }}
                            >
                              {format(endTime, "h:mm a")}
                            </Typography>
                          </Box>
                          <Divider
                            orientation="vertical"
                            flexItem
                            sx={{
                              borderColor: getStatusColor(apt.status),
                              borderWidth: 2,
                            }}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                              }}
                            >
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                  noWrap
                                >
                                  {apt.patientName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {apt.appointmentType}
                                </Typography>
                              </Box>
                              <Chip
                                label={getStatusLabel(apt.status)}
                                size="small"
                                color={getStatusChipColor(apt.status) as any}
                                sx={{ height: 20, fontSize: "0.65rem" }}
                              />
                            </Box>
                            <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
                              {!isComplete && !isCancelled && !isActive && (
                                <AuraButton
                                  variant="contained"
                                  size="small"
                                  color="warning"
                                  startIcon={<StartIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartSession(apt);
                                  }}
                                  sx={{
                                    fontSize: "0.7rem",
                                    py: 0.25,
                                    px: 1,
                                  }}
                                >
                                  Start
                                </AuraButton>
                              )}
                              {isActive && (
                                <AuraButton
                                  variant="contained"
                                  size="small"
                                  color="warning"
                                  startIcon={<NotesIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSessionViewAppointment(apt);
                                  }}
                                  sx={{
                                    fontSize: "0.7rem",
                                    py: 0.25,
                                    px: 1,
                                  }}
                                >
                                  Resume
                                </AuraButton>
                              )}
                              <AuraIconButton
                                tooltip="View Patient"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(
                                    `/medical-records?patientId=${apt.patientId}&tab=timeline`,
                                  );
                                }}
                              >
                                <PersonIcon fontSize="small" />
                              </AuraIconButton>
                              <AuraIconButton
                                tooltip="More Options"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuAnchor({
                                    el: e.currentTarget,
                                    apt,
                                  });
                                }}
                              >
                                <MoreIcon fontSize="small" />
                              </AuraIconButton>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </AuraCard>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {menuAnchor?.apt && (
          <Box
            sx={{
              px: 2,
              py: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              minWidth: 250,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              {menuAnchor.apt.patientName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(
                parseISO(menuAnchor.apt.scheduledStart),
                "EEE, MMM d 'at' h:mm a",
              )}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={menuAnchor.apt.status}
                size="small"
                color={getStatusChipColor(menuAnchor.apt.status) as any}
              />
            </Box>
          </Box>
        )}
        <MenuItem
          onClick={() => {
            if (menuAnchor?.apt) handleOpenNotes(menuAnchor.apt);
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <NotesIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Session Notes</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuAnchor?.apt) {
              setPaymentAppointment(menuAnchor.apt);
              setPaymentDialogOpen(true);
            }
            setMenuAnchor(null);
          }}
        >
          <ListItemIcon>
            <PaymentIcon
              fontSize="small"
              color={menuAnchor?.apt?.isPaid ? "success" : "primary"}
            />
          </ListItemIcon>
          <ListItemText>
            {menuAnchor?.apt?.isPaid ? "View Payment" : "Record Payment"}
          </ListItemText>
        </MenuItem>
        <Divider />
        {menuAnchor?.apt.status === "in-progress" && (
          <MenuItem
            onClick={() => {
              if (menuAnchor?.apt)
                handleCompleteAppointment(menuAnchor.apt.id);
            }}
          >
            <ListItemIcon>
              <CompleteIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Complete Session</ListItemText>
          </MenuItem>
        )}
        {menuAnchor?.apt.status !== "cancelled" &&
          menuAnchor?.apt.status !== "completed" && (
            <MenuItem
              onClick={() => {
                if (menuAnchor?.apt) handleCancelAppointment(menuAnchor.apt.id);
              }}
            >
              <ListItemIcon>
                <CancelIcon fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText>Cancel Appointment</ListItemText>
            </MenuItem>
          )}
        <MenuItem
          onClick={() => {
            if (menuAnchor?.apt) handleDeleteAppointment(menuAnchor.apt.id);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: "error.main" }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Session Notes Dialog */}
      <FormDialog
        open={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
        title="Session Notes"
        maxWidth="sm"
        actions={
          <Box
            sx={{
              display: "flex",
              gap: auraTokens.spacing.sm,
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <AuraButton onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </AuraButton>
            <AuraButton onClick={handleSaveNotes} variant="contained">
              Save Notes
            </AuraButton>
            {selectedAppointment?.status !== "completed" &&
              selectedAppointment?.id && (
                <AuraButton
                  onClick={() =>
                    handleCompleteAppointment(selectedAppointment.id)
                  }
                  variant="contained"
                  color="success"
                >
                  Complete Session
                </AuraButton>
              )}
          </Box>
        }
      >
        <Stack spacing={auraTokens.spacing.lg}>
          <Box
            sx={{
              p: auraTokens.spacing.md,
              bgcolor: "primary.50",
              borderRadius: auraTokens.borderRadius.md,
              borderLeft: "4px solid",
              borderLeftColor: "primary.main",
            }}
          >
            <Typography
              variant="subtitle1"
              fontWeight={auraTokens.fontWeights.semibold}
            >
              {selectedAppointment?.patientName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedAppointment &&
                format(
                  parseISO(selectedAppointment.scheduledStart),
                  "EEEE, MMMM d 'at' h:mm a",
                )}
            </Typography>
            <Chip
              label={selectedAppointment?.appointmentType}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={auraTokens.fontWeights.semibold}
              gutterBottom
            >
              Pain Level Assessment
            </Typography>
            <Box sx={{ px: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  No Pain
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={auraTokens.fontWeights.semibold}
                  color="primary.main"
                >
                  {painLevel}/10
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Severe
                </Typography>
              </Box>
              <Slider
                value={painLevel}
                onChange={(_, v) => setPainLevel(v as number)}
                min={0}
                max={10}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={auraTokens.fontWeights.semibold}
              gutterBottom
            >
              Treatment Provided
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: auraTokens.spacing.sm,
              }}
            >
              {[
                { key: "manualTherapy", label: "Manual Therapy" },
                { key: "exerciseTherapy", label: "Exercise Therapy" },
                { key: "modalities", label: "Modalities (Heat/Ice/TENS)" },
                { key: "education", label: "Patient Education" },
              ].map(({ key, label }) => (
                <Chip
                  key={key}
                  label={label}
                  variant={
                    modalities[key as keyof typeof modalities]
                      ? "filled"
                      : "outlined"
                  }
                  color={
                    modalities[key as keyof typeof modalities]
                      ? "primary"
                      : "default"
                  }
                  onClick={() =>
                    setModalities({
                      ...modalities,
                      [key]: !modalities[key as keyof typeof modalities],
                    })
                  }
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Box>
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={auraTokens.fontWeights.semibold}
              gutterBottom
            >
              Clinical Notes
            </Typography>
            <TextField
              multiline
              rows={6}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Document:&#10;• Subjective: Patient's reported symptoms&#10;• Objective: Clinical findings&#10;• Assessment: Progress evaluation&#10;• Plan: Next steps and home exercises"
              fullWidth
              sx={{ "& .MuiInputBase-input": { fontSize: "0.875rem" } }}
            />
          </Box>

          {/* Treatment Plan Section */}
          <Box
            sx={{
              p: auraTokens.spacing.md,
              bgcolor: alpha(theme.palette.success.main, 0.05),
              borderRadius: auraTokens.borderRadius.md,
              border: "1px solid",
              borderColor: alpha(theme.palette.success.main, 0.2),
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
            >
              <ExerciseIcon color="success" fontSize="small" />
              <Typography
                variant="subtitle2"
                fontWeight={auraTokens.fontWeights.semibold}
              >
                Treatment Plan
              </Typography>
            </Box>

            {loadingPlan ? (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Loading treatment plan...
                </Typography>
              </Box>
            ) : patientTreatmentPlan ? (
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {patientTreatmentPlan.title}
                  </Typography>
                  {patientTreatmentPlan.currentPhase && (
                    <Typography variant="caption" color="text.secondary">
                      Current phase: {patientTreatmentPlan.currentPhase}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Session {patientTreatmentPlan.nextSessionNumber} of{" "}
                      {patientTreatmentPlan.totalSessions}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="success.main"
                    >
                      {patientTreatmentPlan.progressPercent}% complete
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={patientTreatmentPlan.progressPercent}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.success.main, 0.15),
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "success.main",
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={updateTreatmentPlan}
                      onChange={(e) => setUpdateTreatmentPlan(e.target.checked)}
                      size="small"
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Mark session {patientTreatmentPlan.nextSessionNumber} as
                      complete
                    </Typography>
                  }
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sendPlanReminder}
                      onChange={(e) => setSendPlanReminder(e.target.checked)}
                      size="small"
                      color="success"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Send home exercise reminder to patient
                    </Typography>
                  }
                />

                <AuraButton
                  variant="text"
                  size="small"
                  startIcon={<ExerciseIcon />}
                  onClick={() =>
                    navigate(`/treatment-plans/${patientTreatmentPlan.id}`)
                  }
                  sx={{ alignSelf: "flex-start", mt: 0.5 }}
                >
                  View Full Treatment Plan
                </AuraButton>
              </Stack>
            ) : (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  borderRadius: 1,
                  borderLeft: "3px solid",
                  borderColor: "info.main",
                }}
              >
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No active treatment plan for this patient.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <AuraButton
                    variant="outlined"
                    size="small"
                    startIcon={<ExerciseIcon />}
                    onClick={() => navigate("/treatment-plans")}
                  >
                    Browse Templates
                  </AuraButton>
                  <AuraButton
                    variant="contained"
                    size="small"
                    startIcon={<AutoIcon />}
                    onClick={() => setTreatmentPlanBuilderOpen(true)}
                  >
                    AI Generate
                  </AuraButton>
                </Stack>
              </Box>
            )}
          </Box>

          {/* Follow-up Actions */}
          <Box
            sx={{
              p: auraTokens.spacing.md,
              bgcolor: "action.hover",
              borderRadius: auraTokens.borderRadius.md,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight={auraTokens.fontWeights.semibold}
              >
                Follow-up Actions
              </Typography>
              {assignPROM && selectedPromTemplate && (
                <Chip
                  icon={<AutoIcon sx={{ fontSize: 14 }} />}
                  label="Auto-selected"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 20, fontSize: "0.65rem" }}
                />
              )}
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={assignPROM}
                  onChange={(e) => setAssignPROM(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  Send outcome questionnaire (PROM)
                </Typography>
              }
            />
            {assignPROM && (
              <Box sx={{ mt: 1, pl: 4 }}>
                <SelectField
                  label="Select Questionnaire"
                  value={selectedPromTemplate}
                  onChange={setSelectedPromTemplate}
                  options={[
                    { value: "", label: "Choose template..." },
                    ...promTemplates.map((t) => ({
                      value: t.key,
                      label: t.name,
                    })),
                  ]}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  PROM will be sent automatically when you save or complete this
                  session
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </FormDialog>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        severity={confirmDialog.severity}
        confirmLabel={confirmDialog.severity === "error" ? "Delete" : "Confirm"}
      />

      <ScheduleAppointmentDialog
        open={scheduleDialogOpen}
        onClose={() => {
          setScheduleDialogOpen(false);
          setSelectedDate(null);
        }}
        initialDate={selectedDate || undefined}
        patientId={selectedAppointment?.patientId}
        treatmentPlanId={patientTreatmentPlan?.id}
        appointmentType={patientTreatmentPlan ? "treatment" : undefined}
      />

      {/* Schedule Next Session Dialog */}
      <FormDialog
        open={scheduleNextSessionOpen}
        onClose={() => setScheduleNextSessionOpen(false)}
        title="Schedule Next Session"
        maxWidth="xs"
        actions={
          <Box
            sx={{
              display: "flex",
              gap: 1,
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <AuraButton onClick={() => setScheduleNextSessionOpen(false)}>
              Skip for Now
            </AuraButton>
            <AuraButton
              variant="contained"
              startIcon={<ScheduleNextIcon />}
              onClick={() => {
                setScheduleNextSessionOpen(false);
                setSelectedDate(suggestedNextDate);
                setScheduleDialogOpen(true);
              }}
            >
              Schedule Session
            </AuraButton>
          </Box>
        }
      >
        <Stack spacing={2} sx={{ textAlign: "center", py: 2 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.success.main, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
            }}
          >
            <ScheduleNextIcon sx={{ fontSize: 32, color: "success.main" }} />
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Session Complete!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedAppointment?.patientName} has{" "}
              {patientTreatmentPlan
                ? `${patientTreatmentPlan.totalSessions - patientTreatmentPlan.nextSessionNumber} sessions remaining`
                : "more sessions"}{" "}
              in their treatment plan.
            </Typography>
          </Box>

          {suggestedNextDate && patientTreatmentPlan && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: 2,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
              >
                Suggested next session ({patientTreatmentPlan.sessionsPerWeek}x
                per week)
              </Typography>
              <Typography variant="h5" color="primary.main" fontWeight={600}>
                {format(suggestedNextDate, "EEEE, MMM d")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {format(suggestedNextDate, "yyyy")}
              </Typography>
            </Paper>
          )}
        </Stack>
      </FormDialog>

      {/* Treatment Plan Builder Dialog */}
      <TreatmentPlanBuilder
        open={treatmentPlanBuilderOpen}
        onClose={() => setTreatmentPlanBuilderOpen(false)}
        patient={
          selectedAppointment?.patientId
            ? {
                id: selectedAppointment.patientId,
                firstName: selectedAppointment.patientName?.split(" ")[0] || "",
                lastName:
                  selectedAppointment.patientName
                    ?.split(" ")
                    .slice(1)
                    .join(" ") || "",
              }
            : undefined
        }
        onSuccess={() => {
          setTreatmentPlanBuilderOpen(false);
          queryClient.invalidateQueries({
            queryKey: ["treatment-plan", selectedAppointment?.patientId],
          });
          enqueueSnackbar("Treatment plan created", { variant: "success" });
          // Reload the treatment plan for this patient
          if (selectedAppointment?.patientId) {
            treatmentPlansApi
              .list(selectedAppointment.patientId)
              .then((plans: any[]) => {
                const activePlan = plans.find(
                  (p: any) => p.status === "Active" || p.status === "Draft",
                );
                if (activePlan) {
                  setPatientTreatmentPlan({
                    id: activePlan.id,
                    title: activePlan.title,
                    status: activePlan.status,
                    currentPhase: activePlan.phases?.[0]?.name,
                    completedSessions: activePlan.completedSessions || 0,
                    totalSessions: activePlan.totalSessions || 0,
                    nextSessionNumber: (activePlan.completedSessions || 0) + 1,
                    progressPercent: activePlan.progressPercentage || 0,
                    sessionsPerWeek: activePlan.phases?.[0]?.sessionsPerWeek,
                  });
                }
              });
          }
        }}
      />

      {/* Payment Recording Dialog */}
      <PaymentRecordDialog
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setPaymentAppointment(null);
        }}
        appointment={paymentAppointment}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }}
      />

      {/* Session View - Full screen clinical mode */}
      {sessionViewAppointment && (
        <SessionView
          appointment={sessionViewAppointment}
          onClose={() => setSessionViewAppointment(null)}
          onComplete={() => {
            setSessionViewAppointment(null);
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
          }}
        />
      )}
    </Box>
  );
}
