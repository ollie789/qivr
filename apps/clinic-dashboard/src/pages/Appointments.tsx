import {
  auraTokens,
  PageHeader,
  AuraButton,
  FormDialog,
  ConfirmDialog,
  SelectField,
} from "@qivr/design-system";
import { useState, useCallback } from "react";
import { ScheduleAppointmentDialog } from "../components/dialogs/ScheduleAppointmentDialog";
import {
  promApi,
  NotificationMethod,
  type PromTemplateSummary,
} from "../services/promApi";
import type { Appointment } from "../features/appointments/types";
import {
  Box,
  Typography,
  Stack,
  Chip,
  TextField,
  Divider,
  Avatar,
  Paper,
  FormControlLabel,
  Checkbox,
  Slider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Notes as NotesIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
  parseISO,
} from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { appointmentsApi } from "../services/appointmentsApi";

export default function Appointments() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
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
  }>({
    open: false,
    title: "",
    message: "",
    severity: "warning",
    onConfirm: () => {},
  });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const openConfirmDialog = useCallback(
    (config: Omit<typeof confirmDialog, "open">) => {
      setConfirmDialog({ ...config, open: true });
    },
    [],
  );

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch appointments
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: [
      "appointments",
      format(monthStart, "yyyy-MM-dd"),
      format(monthEnd, "yyyy-MM-dd"),
    ],
    queryFn: () =>
      appointmentsApi.getAppointments({
        startDate: format(monthStart, "yyyy-MM-dd"),
        endDate: format(monthEnd, "yyyy-MM-dd"),
      }),
  });

  // Fetch active PROM templates
  const { data: promTemplates = [] } = useQuery<PromTemplateSummary[]>({
    queryKey: ["prom-templates-active"],
    queryFn: () => promApi.getTemplates({ isActive: true }),
  });

  const rawAppointments = appointmentsData?.items ?? appointmentsData ?? [];
  const appointments: Appointment[] = Array.isArray(rawAppointments)
    ? rawAppointments
    : [];

  const appointmentsForDate = (date: Date): Appointment[] => {
    return appointments.filter((apt) =>
      isSameDay(parseISO(apt.scheduledStart), date),
    );
  };

  const handleOpenNotes = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSessionNotes(appointment.notes || "");
    setModalities({
      manualTherapy: false,
      exerciseTherapy: false,
      modalities: false,
      education: false,
    });
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

      await appointmentsApi.updateAppointment(selectedAppointment.id, {
        notes: enhancedNotes,
      });

      // Assign PROM if checkbox is checked and a template is selected
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

      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Notes saved", { variant: "success" });
      setNotesDialogOpen(false);
    } catch (err) {
      enqueueSnackbar("Failed to save notes", { variant: "error" });
    }
  };

  const handleCompleteAppointment = async (id: string) => {
    try {
      await appointmentsApi.completeAppointment(id, {
        notes: sessionNotes,
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Appointment completed", { variant: "success" });
      setNotesDialogOpen(false);
    } catch (err) {
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
        } catch (err) {
          enqueueSnackbar("Failed to cancel appointment", { variant: "error" });
        }
        closeConfirmDialog();
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
        } catch (err) {
          enqueueSnackbar("Failed to delete appointment", { variant: "error" });
        }
        closeConfirmDialog();
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in-progress":
        return "info";
      case "cancelled":
        return "error";
      case "confirmed":
        return "primary";
      default:
        return "default";
    }
  };

  return (
    <Box className="page-enter">
      <PageHeader
        title="Appointments"
        description="Manage your clinic appointments"
        actions={
          <AuraButton variant="contained" startIcon={<AddIcon />} onClick={() => setScheduleDialogOpen(true)}>
            New Appointment
          </AuraButton>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 400px" }, gap: auraTokens.spacing.lg }}>
        {/* Calendar */}
        <Paper sx={{ p: auraTokens.spacing.lg, borderRadius: auraTokens.borderRadius.lg }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: auraTokens.spacing.lg }}>
            <AuraButton variant="text" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
              ← Prev
            </AuraButton>
            <Typography variant="h6" fontWeight={auraTokens.fontWeights.semibold}>
              {format(currentDate, "MMMM yyyy")}
            </Typography>
            <AuraButton variant="text" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
              Next →
            </AuraButton>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: auraTokens.spacing.xs }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <Typography key={day} variant="caption" color="text.secondary" textAlign="center" py={1} fontWeight={auraTokens.fontWeights.semibold}>
                {day}
              </Typography>
            ))}
            {daysInMonth.map((day) => {
              const dayAppointments = appointmentsForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);
              return (
                <Box
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  sx={{
                    py: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    borderRadius: auraTokens.borderRadius.sm,
                    bgcolor: isSelected ? "primary.main" : isCurrentDay ? "primary.50" : "transparent",
                    color: isSelected ? "white" : "text.primary",
                    opacity: isSameMonth(day, currentDate) ? 1 : 0.3,
                    transition: auraTokens.transitions.fast,
                    "&:hover": { bgcolor: isSelected ? "primary.dark" : "action.hover" },
                  }}
                >
                  <Typography variant="body2" fontWeight={isCurrentDay || isSelected ? auraTokens.fontWeights.semibold : auraTokens.fontWeights.regular}>
                    {format(day, "d")}
                  </Typography>
                  {dayAppointments.length > 0 && (
                    <Box sx={{ display: "flex", gap: auraTokens.spacing.xs, mt: auraTokens.spacing.xs }}>
                      {dayAppointments.slice(0, 3).map((_, i) => (
                        <Box key={i} sx={{ width: 5, height: 5, borderRadius: auraTokens.borderRadius.round, bgcolor: isSelected ? "rgba(255,255,255,0.8)" : "primary.main" }} />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* Day Detail Sidebar */}
        <Paper sx={{ p: auraTokens.spacing.lg, borderRadius: auraTokens.borderRadius.lg }}>
          <Typography variant="h6" fontWeight={auraTokens.fontWeights.semibold}>
            {format(selectedDate, "EEEE")}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={auraTokens.spacing.lg}>
            {format(selectedDate, "MMMM d, yyyy")}
          </Typography>

          {isLoading ? (
            <Typography color="text.secondary">Loading...</Typography>
          ) : appointmentsForDate(selectedDate).length === 0 ? (
            <Box sx={{ textAlign: "center", py: auraTokens.spacing.xxl }}>
              <Typography color="text.secondary" mb={auraTokens.spacing.md}>No appointments scheduled</Typography>
              <AuraButton variant="outlined" size="small" onClick={() => setScheduleDialogOpen(true)}>
                + Add Appointment
              </AuraButton>
            </Box>
          ) : (
            <Stack spacing={auraTokens.spacing.sm}>
              {appointmentsForDate(selectedDate).map((apt) => (
                <Box
                  key={apt.id}
                  onClick={(e) => setMenuAnchor({ el: e.currentTarget as HTMLElement, apt })}
                  sx={{
                    p: auraTokens.spacing.md,
                    borderRadius: auraTokens.borderRadius.md,
                    border: "1px solid",
                    borderColor: "divider",
                    cursor: "pointer",
                    transition: auraTokens.transitions.fast,
                    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                  }}
                >
                  <Box sx={{ display: "flex", gap: auraTokens.spacing.md, alignItems: "center" }}>
                    <Avatar sx={{ width: auraTokens.iconSize.xxl, height: auraTokens.iconSize.xxl, bgcolor: "primary.main" }}>
                      {apt.patientName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: auraTokens.spacing.xs }}>
                        <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold} noWrap>
                          {apt.patientName}
                        </Typography>
                        <Chip label={apt.status} size="small" color={getStatusColor(apt.status)} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {format(parseISO(apt.scheduledStart), "h:mm a")} · {apt.appointmentType}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
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
          <MenuItem onClick={() => { if (menuAnchor?.apt) handleCompleteAppointment(menuAnchor.apt.id); setMenuAnchor(null); }}>
            <ListItemIcon><CompleteIcon fontSize="small" color="success" /></ListItemIcon>
            <ListItemText>Mark Complete</ListItemText>
          </MenuItem>
        )}
        {menuAnchor?.apt.status !== "cancelled" && menuAnchor?.apt.status !== "completed" && (
          <MenuItem onClick={() => { if (menuAnchor?.apt) handleCancelAppointment(menuAnchor.apt.id); setMenuAnchor(null); }}>
            <ListItemIcon><CancelIcon fontSize="small" color="warning" /></ListItemIcon>
            <ListItemText>Cancel Appointment</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => { if (menuAnchor?.apt) handleDeleteAppointment(menuAnchor.apt.id); setMenuAnchor(null); }}>
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
          {/* Patient Info Header */}
          <Box sx={{ 
            p: auraTokens.spacing.md, 
            bgcolor: "primary.50", 
            borderRadius: auraTokens.borderRadius.md,
            borderLeft: "4px solid",
            borderLeftColor: "primary.main"
          }}>
            <Typography variant="subtitle1" fontWeight={auraTokens.fontWeights.semibold}>
              {selectedAppointment?.patientName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedAppointment && format(parseISO(selectedAppointment.scheduledStart), "EEEE, MMMM d 'at' h:mm a")}
            </Typography>
            <Chip 
              label={selectedAppointment?.appointmentType} 
              size="small" 
              sx={{ mt: 1 }}
            />
          </Box>

          {/* Pain Assessment */}
          <Box>
            <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold} gutterBottom>
              Pain Level Assessment
            </Typography>
            <Box sx={{ px: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">No Pain</Typography>
                <Typography variant="body2" fontWeight={auraTokens.fontWeights.semibold} color="primary.main">
                  {painLevel}/10
                </Typography>
                <Typography variant="caption" color="text.secondary">Severe</Typography>
              </Box>
              <Slider 
                value={painLevel} 
                onChange={(_, v) => setPainLevel(v as number)} 
                min={0} 
                max={10} 
                marks 
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-track': {
                    background: painLevel <= 3 ? 'success.main' : painLevel <= 6 ? 'warning.main' : 'error.main',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Treatment Modalities */}
          <Box>
            <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold} gutterBottom>
              Treatment Provided
            </Typography>
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

          {/* Clinical Notes */}
          <Box>
            <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold} gutterBottom>
              Clinical Notes
            </Typography>
            <TextField
              multiline
              rows={6}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Document:&#10;• Subjective: Patient's reported symptoms&#10;• Objective: Clinical findings&#10;• Assessment: Progress evaluation&#10;• Plan: Next steps and home exercises"
              fullWidth
              sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
            />
          </Box>

          {/* Follow-up Actions */}
          <Box sx={{ 
            p: auraTokens.spacing.md, 
            bgcolor: "action.hover", 
            borderRadius: auraTokens.borderRadius.md 
          }}>
            <Typography variant="subtitle2" fontWeight={auraTokens.fontWeights.semibold} gutterBottom>
              Follow-up Actions
            </Typography>
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

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        severity={confirmDialog.severity}
        confirmLabel={confirmDialog.severity === "error" ? "Delete" : "Confirm"}
      />

      {/* Schedule Appointment Dialog */}
      <ScheduleAppointmentDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
      />
    </Box>
  );
}
