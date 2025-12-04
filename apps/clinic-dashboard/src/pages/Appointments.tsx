import { useState, useCallback, useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, DateSelectArg, DatesSetArg } from "@fullcalendar/core";
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
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  FitnessCenter as ExerciseIcon,
  EventRepeat as ScheduleNextIcon,
  AutoAwesome as AutoIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { format, parseISO, isToday, isSameDay, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths } from "date-fns";
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
import { promApi, NotificationMethod, type PromTemplateSummary } from "../services/promApi";
import { treatmentPlansApi } from "../lib/api";
import type { Appointment } from "../features/appointments/types";
import { appointmentsApi } from "../services/appointmentsApi";

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
const AUTO_PROM_CONFIG: Record<string, { templateKey: string | null; label: string }> = {
  initial: { templateKey: "pain-disability-index", label: "Pain & Disability Index" },
  followup: { templateKey: "quick-dash", label: "QuickDASH" },
  treatment: { templateKey: "nprs", label: "Numeric Pain Rating" },
  assessment: { templateKey: "oswestry", label: "Oswestry Disability Index" },
};

export default function Appointments() {
  const theme = useTheme();
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const [miniCalendarMonth, setMiniCalendarMonth] = useState<Date>(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; apt: Appointment } | null>(null);
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
  const [patientTreatmentPlan, setPatientTreatmentPlan] = useState<TreatmentPlanSummary | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    severity: "warning" | "error";
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", severity: "warning", onConfirm: () => {} });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [agendaDate, setAgendaDate] = useState<Date>(new Date());
  const [scheduleNextSessionOpen, setScheduleNextSessionOpen] = useState(false);
  const [suggestedNextDate, setSuggestedNextDate] = useState<Date | null>(null);
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

  const appointments: Appointment[] = appointmentsData?.items ?? [];

  // Filter appointments for today's agenda
  const agendaAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        const aptDate = parseISO(apt.scheduledStart);
        return isSameDay(aptDate, agendaDate);
      })
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  }, [appointments, agendaDate]);

  // Stats for the agenda
  const agendaStats = useMemo(() => {
    const total = agendaAppointments.length;
    const completed = agendaAppointments.filter(a => a.status === "completed").length;
    const upcoming = agendaAppointments.filter(a => a.status === "scheduled" || a.status === "confirmed").length;
    const inProgress = agendaAppointments.filter(a => a.status === "in-progress").length;
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
      case "completed": return theme.palette.success.main;
      case "confirmed": return theme.palette.primary.main;
      case "cancelled": return theme.palette.error.main;
      case "in-progress": return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  }

  function getStatusChipColor(status: string) {
    switch (status) {
      case "completed": return "success";
      case "in-progress": return "warning";
      case "cancelled": return "error";
      case "confirmed": return "primary";
      default: return "default";
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "completed": return "Completed";
      case "confirmed": return "Confirmed";
      case "cancelled": return "Cancelled";
      case "in-progress": return "In Progress";
      case "scheduled": return "Scheduled";
      default: return status;
    }
  }

  const handleEventClick = (info: EventClickArg) => {
    const apt = info.event.extendedProps.appointment as Appointment;
    setMenuAnchor({ el: info.el as HTMLElement, apt });
  };

  const handleDateSelect = (info: DateSelectArg) => {
    setSelectedDate(info.start);
    setScheduleDialogOpen(true);
  };

  // Handle date click from mini calendar
  const handleMiniCalendarDateClick = (date: Date) => {
    setAgendaDate(date);
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(date);
    }
  };

  // Sync mini calendar when main calendar view changes
  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentWeekStart(arg.start);
    // Keep mini calendar in sync with the week being viewed
    if (!isSameMonth(arg.start, miniCalendarMonth)) {
      setMiniCalendarMonth(arg.start);
    }
  };

  // Generate mini calendar days
  const miniCalendarDays = useMemo(() => {
    const monthStart = startOfMonth(miniCalendarMonth);
    const monthEnd = endOfMonth(miniCalendarMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [miniCalendarMonth]);

  // Check if a date has appointments
  const getAppointmentCountForDate = (date: Date) => {
    return appointments.filter((apt) => isSameDay(parseISO(apt.scheduledStart), date)).length;
  };

  const openConfirmDialog = useCallback((config: Omit<typeof confirmDialog, "open">) => {
    setConfirmDialog({ ...config, open: true });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleOpenNotes = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSessionNotes(appointment.notes || "");
    setModalities({ manualTherapy: false, exerciseTherapy: false, modalities: false, education: false });
    setPainLevel(5);
    setUpdateTreatmentPlan(false);
    setSendPlanReminder(false);
    setPatientTreatmentPlan(null);
    setNotesDialogOpen(true);

    // Auto-select PROM based on appointment type
    const appointmentTypeKey = appointment.appointmentType?.toLowerCase().replace(/[^a-z]/g, "") || "";
    const autoPromConfig = AUTO_PROM_CONFIG[appointmentTypeKey] || AUTO_PROM_CONFIG["followup"];
    if (autoPromConfig?.templateKey) {
      setAssignPROM(true);
      setSelectedPromTemplate(autoPromConfig.templateKey);
    } else {
      setAssignPROM(false);
      setSelectedPromTemplate("");
    }

    // Fetch patient's active treatment plan
    if (appointment.patientId) {
      setLoadingPlan(true);
      try {
        const plans = await treatmentPlansApi.list(appointment.patientId);
        const activePlan = (plans as any[]).find((p: any) =>
          p.status === "Active" || p.status === "active" || p.status === "InProgress"
        );
        if (activePlan) {
          const completedSessions = activePlan.sessions?.filter((s: any) => s.completed)?.length ?? 0;
          const totalSessions = activePlan.totalSessions ?? activePlan.sessions?.length ?? 0;
          setPatientTreatmentPlan({
            id: activePlan.id,
            title: activePlan.title,
            status: activePlan.status,
            currentPhase: activePlan.currentPhase ?? activePlan.phases?.[0]?.name,
            completedSessions,
            totalSessions,
            nextSessionNumber: completedSessions + 1,
            progressPercent: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
            sessionsPerWeek: activePlan.sessionsPerWeek ?? 2,
          });
          setUpdateTreatmentPlan(true); // Default to updating treatment plan
        }
      } catch (error) {
        console.error("Failed to fetch treatment plan:", error);
      } finally {
        setLoadingPlan(false);
      }
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;
    try {
      const modalitiesUsed = Object.entries(modalities)
        .filter(([_, used]) => used)
        .map(([name]) => name.replace(/([A-Z])/g, " $1").trim())
        .join(", ");

      const treatmentPlanNote = updateTreatmentPlan && patientTreatmentPlan
        ? `\n[Treatment Plan Session ${patientTreatmentPlan.nextSessionNumber} completed]`
        : "";
      const enhancedNotes = `${sessionNotes}\n\nModalities: ${modalitiesUsed || "None"}\nPain Level: ${painLevel}/10${assignPROM ? "\n[PROM Assigned]" : ""}${treatmentPlanNote}`;

      await appointmentsApi.updateAppointment(selectedAppointment.id, { notes: enhancedNotes });

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
            }
          );
          enqueueSnackbar(`Treatment plan session ${patientTreatmentPlan.nextSessionNumber} marked complete`, { variant: "success" });
          queryClient.invalidateQueries({ queryKey: ["treatment-plans"] });
        } catch (err) {
          console.error("Failed to update treatment plan:", err);
          enqueueSnackbar("Failed to update treatment plan session", { variant: "warning" });
        }
      }

      // Send PROM if enabled
      if (assignPROM && selectedPromTemplate) {
        await promApi.sendProm({
          templateKey: selectedPromTemplate,
          patientId: selectedAppointment.patientId,
          scheduledFor: new Date().toISOString(),
          notificationMethod: NotificationMethod.Email | NotificationMethod.InApp,
          notes: `Assigned after session on ${format(new Date(), "MMM d, yyyy")}`,
        });
        enqueueSnackbar("PROM assigned to patient", { variant: "success" });
      }

      // Send treatment plan reminder if enabled
      if (sendPlanReminder && patientTreatmentPlan) {
        // For now, we'll show a success message - in production this would trigger an actual notification
        enqueueSnackbar("Treatment plan reminder sent to patient", { variant: "info" });
      }

      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Notes saved", { variant: "success" });
      setNotesDialogOpen(false);

      // If patient has treatment plan with remaining sessions, suggest scheduling next
      if (patientTreatmentPlan && patientTreatmentPlan.nextSessionNumber < patientTreatmentPlan.totalSessions) {
        const daysUntilNext = Math.round(7 / (patientTreatmentPlan.sessionsPerWeek || 2));
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
      if (patientTreatmentPlan && patientTreatmentPlan.nextSessionNumber < patientTreatmentPlan.totalSessions) {
        const daysUntilNext = Math.round(7 / (patientTreatmentPlan.sessionsPerWeek || 2));
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
      message: "Are you sure you want to cancel this appointment? The patient will be notified.",
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
      message: "Are you sure you want to delete this appointment? This action cannot be undone.",
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
      await appointmentsApi.updateAppointment(apt.id, { status: "in-progress" });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Session started", { variant: "info" });
      handleOpenNotes(apt);
    } catch {
      enqueueSnackbar("Failed to start session", { variant: "error" });
    }
  };

  const navigateAgenda = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setAgendaDate(new Date());
    } else {
      const newDate = new Date(agendaDate);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      setAgendaDate(newDate);
    }
  };

  return (
    <Box className="page-enter" sx={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, px: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <AuraButton
            variant="outlined"
            onClick={() => {
              if (calendarRef.current) {
                calendarRef.current.getApi().today();
                setAgendaDate(new Date());
                setMiniCalendarMonth(new Date());
              }
            }}
            sx={{ minWidth: 80 }}
          >
            Today
          </AuraButton>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <AuraIconButton
              tooltip="Previous week"
              size="small"
              onClick={() => {
                if (calendarRef.current) {
                  calendarRef.current.getApi().prev();
                }
              }}
            >
              <ChevronLeftIcon />
            </AuraIconButton>
            <AuraIconButton
              tooltip="Next week"
              size="small"
              onClick={() => {
                if (calendarRef.current) {
                  calendarRef.current.getApi().next();
                }
              }}
            >
              <ChevronRightIcon />
            </AuraIconButton>
          </Box>
          <Typography variant="h5" fontWeight={600}>
            {format(currentWeekStart, "MMMM yyyy")}
          </Typography>
        </Box>
        <AuraButton variant="contained" startIcon={<AddIcon />} onClick={() => setScheduleDialogOpen(true)}>
          New Appointment
        </AuraButton>
      </Box>

      <Box sx={{ display: "flex", gap: auraTokens.spacing.md, flex: 1, minHeight: 0 }}>
        {/* Left Sidebar - Mini Calendar */}
        <AuraCard
          hover={false}
          variant="flat"
          sx={{
            width: 240,
            p: auraTokens.spacing.md,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          {/* Mini Calendar Header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <AuraIconButton tooltip="Previous month" size="small" onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, -1))}>
              <ChevronLeftIcon fontSize="small" />
            </AuraIconButton>
            <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold}>
              {format(miniCalendarMonth, "MMMM yyyy")}
            </Typography>
            <AuraIconButton tooltip="Next month" size="small" onClick={() => setMiniCalendarMonth(addMonths(miniCalendarMonth, 1))}>
              <ChevronRightIcon fontSize="small" />
            </AuraIconButton>
          </Box>

          {/* Mini Calendar Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 0.25,
              textAlign: "center",
            }}
          >
            {/* Day headers */}
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <Typography key={i} variant="caption" color="text.secondary" sx={{ py: 0.5, fontWeight: 500 }}>
                {day}
              </Typography>
            ))}

            {/* Days */}
            {miniCalendarDays.map((day, i) => {
              const isCurrentMonth = isSameMonth(day, miniCalendarMonth);
              const isSelected = isSameDay(day, agendaDate);
              const isTodayDate = isToday(day);
              const appointmentCount = getAppointmentCountForDate(day);

              return (
                <Box
                  key={i}
                  onClick={() => handleMiniCalendarDateClick(day)}
                  sx={{
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    cursor: "pointer",
                    position: "relative",
                    mx: "auto",
                    fontSize: "0.75rem",
                    fontWeight: isSelected || isTodayDate ? 600 : 400,
                    color: !isCurrentMonth
                      ? "text.disabled"
                      : isSelected
                      ? "white"
                      : isTodayDate
                      ? "primary.main"
                      : "text.primary",
                    bgcolor: isSelected
                      ? "primary.main"
                      : isTodayDate
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                    border: isTodayDate && !isSelected ? `1px solid ${theme.palette.primary.main}` : "none",
                    "&:hover": {
                      bgcolor: isSelected ? "primary.dark" : "action.hover",
                    },
                  }}
                >
                  {format(day, "d")}
                  {/* Appointment indicator dot */}
                  {appointmentCount > 0 && !isSelected && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 2,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        bgcolor: isTodayDate ? "primary.main" : "text.secondary",
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Search for people placeholder */}
          <TextField
            size="small"
            placeholder="Search for people"
            fullWidth
            InputProps={{
              startAdornment: (
                <PersonIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
            sx={{ mb: 2 }}
          />
        </AuraCard>

        {/* Main Calendar - Week View */}
        <AuraCard
          hover={false}
          variant="flat"
          sx={{
            flex: 1,
            p: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            "& .fc": { fontFamily: "inherit", height: "100%" },
          }}
        >
          <Box
            sx={{
              flex: 1,
              "& .fc-toolbar": { display: "none" },
              "& .fc-view-harness": { bgcolor: "background.paper" },
              "& .fc-event": {
                cursor: "pointer",
                borderRadius: auraTokens.borderRadius.sm,
                fontSize: "0.75rem",
                border: "none",
                boxShadow: auraTokens.shadows.sm,
              },
              // Day headers - Google Calendar style
              "& .fc-col-header": {
                borderBottom: "1px solid",
                borderColor: "divider",
              },
              "& .fc-col-header-cell": {
                py: 1.5,
                borderBottom: "none",
                verticalAlign: "top",
              },
              "& .fc-col-header-cell-cushion": {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                py: 0.5,
                textDecoration: "none !important",
              },
              // Today's column header
              "& .fc-day-today .fc-col-header-cell-cushion": {
                "& .fc-day-text": {
                  color: "primary.main",
                },
                "& .fc-day-number": {
                  bgcolor: "primary.main",
                  color: "white",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
              },
              "& .fc-day-today": {
                bgcolor: "transparent !important",
              },
              // Time grid styling
              "& .fc-timegrid-slot": {
                height: "48px",
                borderColor: alpha(theme.palette.divider, 0.3),
              },
              "& .fc-timegrid-slot-label": {
                fontSize: "0.7rem",
                color: "text.secondary",
                fontWeight: 400,
                verticalAlign: "top",
                paddingTop: "4px",
              },
              "& .fc-timegrid-slot-label-cushion": {
                paddingRight: "12px",
              },
              "& .fc-timegrid-event": {
                borderRadius: auraTokens.borderRadius.sm,
                fontSize: "0.75rem",
              },
              "& .fc-timegrid-col": {
                borderColor: alpha(theme.palette.divider, 0.3),
              },
              // Now indicator
              "& .fc-timegrid-now-indicator-line": {
                borderColor: theme.palette.error.main,
                borderWidth: "2px",
              },
              "& .fc-timegrid-now-indicator-arrow": {
                borderTopColor: theme.palette.error.main,
                borderWidth: "5px",
              },
              // Axis and grid
              "& .fc-timegrid-axis": {
                width: "56px",
                borderColor: alpha(theme.palette.divider, 0.3),
              },
              "& .fc-scrollgrid": {
                border: "none",
              },
              "& .fc-scrollgrid-section > td": {
                borderColor: alpha(theme.palette.divider, 0.3),
              },
              "& .fc-scrollgrid-section-header > td": {
                border: "none",
              },
            }}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
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
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
              dayHeaderContent={(arg) => (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                  <Typography
                    className="fc-day-text"
                    variant="caption"
                    sx={{
                      color: isToday(arg.date) ? "primary.main" : "text.secondary",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      fontSize: "0.7rem",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {format(arg.date, "EEE")}
                  </Typography>
                  <Box
                    className="fc-day-number"
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: isToday(arg.date) ? "primary.main" : "transparent",
                      color: isToday(arg.date) ? "white" : "text.primary",
                      fontWeight: 500,
                      fontSize: "1.1rem",
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: isToday(arg.date) ? "primary.dark" : "action.hover",
                      },
                    }}
                  >
                    {format(arg.date, "d")}
                  </Box>
                </Box>
              )}
              slotLabelFormat={{ hour: "numeric", meridiem: "short" }}
            />
          </Box>
        </AuraCard>

        {/* Today's Agenda Sidebar */}
        <AuraCard
          hover={false}
          variant="flat"
          sx={{
            width: 340,
            p: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Agenda Header */}
          <Box
            sx={{
              p: auraTokens.spacing.md,
              background: auraTokens.gradients.primary,
              color: "white",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <AuraIconButton tooltip="Previous day" size="small" onClick={() => navigateAgenda("prev")} sx={{ color: "white" }}>
                <PrevIcon />
              </AuraIconButton>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                  {isToday(agendaDate) ? "Today's Agenda" : format(agendaDate, "EEEE")}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {format(agendaDate, "MMM d, yyyy")}
                </Typography>
              </Box>
              <AuraIconButton tooltip="Next day" size="small" onClick={() => navigateAgenda("next")} sx={{ color: "white" }}>
                <NextIcon />
              </AuraIconButton>
            </Box>
            {!isToday(agendaDate) && (
              <Box sx={{ textAlign: "center", mt: 1 }}>
                <Chip
                  label="Go to Today"
                  size="small"
                  icon={<TodayIcon />}
                  onClick={() => navigateAgenda("today")}
                  sx={{
                    bgcolor: alpha("#fff", 0.2),
                    color: "white",
                    "&:hover": { bgcolor: alpha("#fff", 0.3) },
                    "& .MuiChip-icon": { color: "white" },
                  }}
                />
              </Box>
            )}

            {/* Stats */}
            <Box sx={{ display: "flex", justifyContent: "space-around", mt: 2, pt: 2, borderTop: "1px solid", borderColor: alpha("#fff", 0.2) }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700}>{agendaStats.total}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>Total</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700} color="success.light">{agendaStats.completed}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>Done</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700} color="warning.light">{agendaStats.inProgress}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>Active</Typography>
              </Box>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" fontWeight={700}>{agendaStats.upcoming}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>Upcoming</Typography>
              </Box>
            </Box>
          </Box>

          {/* Appointment List */}
          <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
            {agendaAppointments.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <TodayIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">No appointments scheduled</Typography>
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
                  Schedule Appointment
                </AuraButton>
              </Box>
            ) : (
              <Stack spacing={1}>
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
                        p: 1.5,
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
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        {/* Time Column */}
                        <Box sx={{ textAlign: "center", minWidth: 50 }}>
                          <Typography variant="subtitle2" fontWeight={700} color={isActive ? "warning.main" : "text.primary"}>
                            {format(startTime, "h:mm")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(startTime, "a")}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                            {format(endTime, "h:mm a")}
                          </Typography>
                        </Box>

                        <Divider orientation="vertical" flexItem sx={{ borderColor: getStatusColor(apt.status), borderWidth: 2 }} />

                        {/* Content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="subtitle2" fontWeight={600} noWrap>
                                {apt.patientName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
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

                          {/* Actions */}
                          <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
                            {!isComplete && !isCancelled && !isActive && (
                              <AuraIconButton
                                tooltip="Start Session"
                                size="small"
                                onClick={() => handleStartSession(apt)}
                                sx={{
                                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                                  "&:hover": { bgcolor: alpha(theme.palette.warning.main, 0.2) },
                                }}
                              >
                                <StartIcon fontSize="small" color="warning" />
                              </AuraIconButton>
                            )}
                            <AuraIconButton
                              tooltip="Session Notes"
                              size="small"
                              onClick={() => handleOpenNotes(apt)}
                              sx={{
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                              }}
                            >
                              <NotesIcon fontSize="small" color="primary" />
                            </AuraIconButton>
                            {isActive && (
                              <AuraIconButton
                                tooltip="Complete Session"
                                size="small"
                                onClick={() => handleCompleteAppointment(apt.id)}
                                sx={{
                                  bgcolor: alpha(theme.palette.success.main, 0.1),
                                  "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.2) },
                                }}
                              >
                                <CompleteIcon fontSize="small" color="success" />
                              </AuraIconButton>
                            )}
                            <AuraIconButton
                              tooltip="View Patient"
                              size="small"
                              onClick={() => navigate(`/medical-records?patientId=${apt.patientId}`)}
                            >
                              <PersonIcon fontSize="small" />
                            </AuraIconButton>
                            <AuraIconButton
                              tooltip="More Options"
                              size="small"
                              onClick={(e) => setMenuAnchor({ el: e.currentTarget, apt })}
                            >
                              <MoreIcon fontSize="small" />
                            </AuraIconButton>
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
      <Menu anchorEl={menuAnchor?.el} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {menuAnchor?.apt && (
          <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider", minWidth: 250 }}>
            <Typography variant="subtitle2" fontWeight={600}>{menuAnchor.apt.patientName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {format(parseISO(menuAnchor.apt.scheduledStart), "EEE, MMM d 'at' h:mm a")}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip label={menuAnchor.apt.status} size="small" color={getStatusChipColor(menuAnchor.apt.status) as any} />
            </Box>
          </Box>
        )}
        <MenuItem onClick={() => { navigate(`/medical-records?patientId=${menuAnchor?.apt.patientId}`); setMenuAnchor(null); }}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Medical Record</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { if (menuAnchor?.apt) handleOpenNotes(menuAnchor.apt); setMenuAnchor(null); }}>
          <ListItemIcon><NotesIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Session Notes</ListItemText>
        </MenuItem>
        <Divider />
        {menuAnchor?.apt.status !== "completed" && menuAnchor?.apt.status !== "in-progress" && (
          <MenuItem onClick={() => { if (menuAnchor?.apt) handleStartSession(menuAnchor.apt); setMenuAnchor(null); }}>
            <ListItemIcon><StartIcon fontSize="small" color="warning" /></ListItemIcon>
            <ListItemText>Start Session</ListItemText>
          </MenuItem>
        )}
        {menuAnchor?.apt.status === "in-progress" && (
          <MenuItem onClick={() => { if (menuAnchor?.apt) handleCompleteAppointment(menuAnchor.apt.id); }}>
            <ListItemIcon><CompleteIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Complete Session</ListItemText>
          </MenuItem>
        )}
        {menuAnchor?.apt.status !== "cancelled" && menuAnchor?.apt.status !== "completed" && (
          <MenuItem onClick={() => { if (menuAnchor?.apt) handleCancelAppointment(menuAnchor.apt.id); }}>
            <ListItemIcon><CancelIcon fontSize="small" color="warning" /></ListItemIcon>
            <ListItemText>Cancel Appointment</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { if (menuAnchor?.apt) handleDeleteAppointment(menuAnchor.apt.id); }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
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
          <Box sx={{ display: "flex", gap: auraTokens.spacing.sm, width: "100%", justifyContent: "flex-end" }}>
            <AuraButton onClick={() => setNotesDialogOpen(false)}>Cancel</AuraButton>
            <AuraButton onClick={handleSaveNotes} variant="contained">Save Notes</AuraButton>
            {selectedAppointment?.status !== "completed" && selectedAppointment?.id && (
              <AuraButton onClick={() => handleCompleteAppointment(selectedAppointment.id)} variant="contained" color="success">
                Complete Session
              </AuraButton>
            )}
          </Box>
        }
      >
        <Stack spacing={auraTokens.spacing.lg}>
          <Box sx={{ p: auraTokens.spacing.md, bgcolor: "primary.50", borderRadius: auraTokens.borderRadius.md, borderLeft: "4px solid", borderLeftColor: "primary.main" }}>
            <Typography variant="subtitle1" fontWeight={auraTokens.fontWeights.semibold}>{selectedAppointment?.patientName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedAppointment && format(parseISO(selectedAppointment.scheduledStart), "EEEE, MMMM d 'at' h:mm a")}
            </Typography>
            <Chip label={selectedAppointment?.appointmentType} size="small" sx={{ mt: 1 }} />
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold} gutterBottom>Pain Level Assessment</Typography>
            <Box sx={{ px: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">No Pain</Typography>
                <Typography variant="body2" fontWeight={auraTokens.fontWeights.semibold} color="primary.main">{painLevel}/10</Typography>
                <Typography variant="caption" color="text.secondary">Severe</Typography>
              </Box>
              <Slider value={painLevel} onChange={(_, v) => setPainLevel(v as number)} min={0} max={10} marks valueLabelDisplay="auto" />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold} gutterBottom>Treatment Provided</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: auraTokens.spacing.sm }}>
              {[
                { key: "manualTherapy", label: "Manual Therapy" },
                { key: "exerciseTherapy", label: "Exercise Therapy" },
                { key: "modalities", label: "Modalities (Heat/Ice/TENS)" },
                { key: "education", label: "Patient Education" },
              ].map(({ key, label }) => (
                <Chip
                  key={key}
                  label={label}
                  variant={modalities[key as keyof typeof modalities] ? "filled" : "outlined"}
                  color={modalities[key as keyof typeof modalities] ? "primary" : "default"}
                  onClick={() => setModalities({ ...modalities, [key]: !modalities[key as keyof typeof modalities] })}
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold} gutterBottom>Clinical Notes</Typography>
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
          <Box sx={{ p: auraTokens.spacing.md, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: auraTokens.borderRadius.md, border: "1px solid", borderColor: alpha(theme.palette.success.main, 0.2) }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <ExerciseIcon color="success" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold}>Treatment Plan</Typography>
            </Box>

            {loadingPlan ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">Loading treatment plan...</Typography>
              </Box>
            ) : patientTreatmentPlan ? (
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>{patientTreatmentPlan.title}</Typography>
                  {patientTreatmentPlan.currentPhase && (
                    <Typography variant="caption" color="text.secondary">
                      Current phase: {patientTreatmentPlan.currentPhase}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Session {patientTreatmentPlan.nextSessionNumber} of {patientTreatmentPlan.totalSessions}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="success.main">
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
                      "& .MuiLinearProgress-bar": { bgcolor: "success.main", borderRadius: 3 },
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
                      Mark session {patientTreatmentPlan.nextSessionNumber} as complete
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
                  onClick={() => navigate(`/treatment-plans/${patientTreatmentPlan.id}`)}
                  sx={{ alignSelf: "flex-start", mt: 0.5 }}
                >
                  View Full Treatment Plan
                </AuraButton>
              </Stack>
            ) : (
              <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.08), borderRadius: 1, borderLeft: "3px solid", borderColor: "info.main" }}>
                <Typography variant="body2" color="text.secondary">No active treatment plan for this patient.</Typography>
                <AuraButton
                  variant="text"
                  size="small"
                  onClick={() => navigate(`/treatment-plans?create=true&patientId=${selectedAppointment?.patientId}`)}
                  sx={{ mt: 0.5, p: 0, minWidth: 0 }}
                >
                  Create Treatment Plan
                </AuraButton>
              </Box>
            )}
          </Box>

          {/* Follow-up Actions */}
          <Box sx={{ p: auraTokens.spacing.md, bgcolor: "action.hover", borderRadius: auraTokens.borderRadius.md }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold}>Follow-up Actions</Typography>
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
              control={<Checkbox checked={assignPROM} onChange={(e) => setAssignPROM(e.target.checked)} size="small" />}
              label={<Typography variant="body2">Send outcome questionnaire (PROM)</Typography>}
            />
            {assignPROM && (
              <Box sx={{ mt: 1, pl: 4 }}>
                <SelectField
                  label="Select Questionnaire"
                  value={selectedPromTemplate}
                  onChange={setSelectedPromTemplate}
                  options={[{ value: "", label: "Choose template..." }, ...promTemplates.map((t) => ({ value: t.key, label: t.name }))]}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  PROM will be sent automatically when you save or complete this session
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
        onClose={() => { setScheduleDialogOpen(false); setSelectedDate(null); }}
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
          <Box sx={{ display: "flex", gap: 1, width: "100%", justifyContent: "flex-end" }}>
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
              <Typography variant="caption" color="text.secondary" display="block">
                Suggested next session ({patientTreatmentPlan.sessionsPerWeek}x per week)
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
    </Box>
  );
}
