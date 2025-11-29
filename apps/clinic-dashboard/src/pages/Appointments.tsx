import { useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, DateSelectArg } from "@fullcalendar/core";
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
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Notes as NotesIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  ViewDay as DayIcon,
  ViewWeek as WeekIcon,
  CalendarMonth as MonthIcon,
  ViewList as ListIcon,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import {
  auraTokens,
  PageHeader,
  AuraButton,
  FormDialog,
  ConfirmDialog,
  SelectField,
} from "@qivr/design-system";
import { ScheduleAppointmentDialog } from "../components/dialogs/ScheduleAppointmentDialog";
import { promApi, NotificationMethod, type PromTemplateSummary } from "../services/promApi";
import type { Appointment } from "../features/appointments/types";
import { appointmentsApi } from "../services/appointmentsApi";

export default function Appointments() {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const [currentView, setCurrentView] = useState<string>("dayGridMonth");
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
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    severity: "warning" | "error";
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", severity: "warning", onConfirm: () => {} });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
      case "completed": return "#22c55e";
      case "confirmed": return "#3b82f6";
      case "cancelled": return "#ef4444";
      case "in-progress": return "#f59e0b";
      default: return "#6b7280";
    }
  }

  function getStatusChipColor(status: string) {
    switch (status) {
      case "completed": return "success";
      case "in-progress": return "info";
      case "cancelled": return "error";
      case "confirmed": return "primary";
      default: return "default";
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

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
    if (newView && calendarRef.current) {
      calendarRef.current.getApi().changeView(newView);
      setCurrentView(newView);
    }
  };

  const openConfirmDialog = useCallback((config: Omit<typeof confirmDialog, "open">) => {
    setConfirmDialog({ ...config, open: true });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const handleOpenNotes = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSessionNotes(appointment.notes || "");
    setModalities({ manualTherapy: false, exerciseTherapy: false, modalities: false, education: false });
    setPainLevel(5);
    setAssignPROM(false);
    setSelectedPromTemplate("");
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;
    try {
      const modalitiesUsed = Object.entries(modalities)
        .filter(([_, used]) => used)
        .map(([name]) => name.replace(/([A-Z])/g, " $1").trim())
        .join(", ");

      const enhancedNotes = `${sessionNotes}\n\nModalities: ${modalitiesUsed || "None"}\nPain Level: ${painLevel}/10${assignPROM ? "\n[PROM Assigned]" : ""}`;

      await appointmentsApi.updateAppointment(selectedAppointment.id, { notes: enhancedNotes });

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

      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Notes saved", { variant: "success" });
      setNotesDialogOpen(false);
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

  return (
    <Box className="page-enter">
      <PageHeader
        title="Appointments"
        description="Manage your clinic appointments"
        actions={
          <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup value={currentView} exclusive onChange={handleViewChange} size="small">
              <ToggleButton value="dayGridMonth"><MonthIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="timeGridWeek"><WeekIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="timeGridDay"><DayIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="listWeek"><ListIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
            <AuraButton variant="contained" startIcon={<AddIcon />} onClick={() => setScheduleDialogOpen(true)}>
              New Appointment
            </AuraButton>
          </Stack>
        }
      />

      <Paper sx={{ p: 2, borderRadius: auraTokens.borderRadius.lg, "& .fc": { fontFamily: "inherit" } }}>
        <Box
          sx={{
            "& .fc-toolbar-title": { fontSize: "1.25rem", fontWeight: 600 },
            "& .fc-button": {
              bgcolor: "transparent",
              border: "1px solid",
              borderColor: "divider",
              color: "text.primary",
              textTransform: "capitalize",
              "&:hover": { bgcolor: "action.hover" },
              "&.fc-button-active": { bgcolor: "primary.main", color: "white", borderColor: "primary.main" },
            },
            "& .fc-event": {
              cursor: "pointer",
              borderRadius: "6px",
              fontSize: "0.75rem",
              px: 0.5,
            },
            "& .fc-daygrid-day": {
              "&:hover": { bgcolor: "action.hover" },
            },
            "& .fc-day-today": {
              bgcolor: "primary.50 !important",
            },
            "& .fc-col-header-cell": {
              py: 1.5,
              fontWeight: 600,
            },
            "& .fc-timegrid-slot": {
              height: "48px",
            },
            "& .fc-list-event": {
              cursor: "pointer",
            },
          }}
        >
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            select={handleDateSelect}
            selectable
            selectMirror
            dayMaxEvents={3}
            weekends
            height="auto"
            contentHeight={650}
            eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
          />
        </Box>
      </Paper>

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
        {menuAnchor?.apt.status !== "completed" && (
          <MenuItem onClick={() => { if (menuAnchor?.apt) handleCompleteAppointment(menuAnchor.apt.id); }}>
            <ListItemIcon><CompleteIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Mark Complete</ListItemText>
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

          <Box sx={{ p: auraTokens.spacing.md, bgcolor: "action.hover", borderRadius: auraTokens.borderRadius.md }}>
            <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold} gutterBottom>Follow-up Actions</Typography>
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
      />
    </Box>
  );
}
