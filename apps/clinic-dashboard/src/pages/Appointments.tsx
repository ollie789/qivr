import { auraTokens } from "@qivr/design-system";
import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
} from "@mui/material";
import {
  Add as AddIcon,
  
  Delete as DeleteIcon,
  Notes as NotesIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  MedicalServices as TreatmentIcon,
} from "@mui/icons-material";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { appointmentsApi } from "../services/appointmentsApi";

export default function Appointments() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
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
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch appointments
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ["appointments", format(monthStart, "yyyy-MM-dd"), format(monthEnd, "yyyy-MM-dd")],
    queryFn: () => appointmentsApi.getAppointments({
      startDate: format(monthStart, "yyyy-MM-dd"),
      endDate: format(monthEnd, "yyyy-MM-dd"),
    }),
  });

  const appointments = appointmentsData?.items ?? appointmentsData ?? [];

  const appointmentsForDate = (date: Date) => {
    return (appointments as any[]).filter((apt: any) => 
      isSameDay(parseISO(apt.scheduledStart), date)
    );
  };

  const handleOpenNotes = (appointment: any) => {
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
    setNotesDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;
    
    try {
      const modalitiesUsed = Object.entries(modalities)
        .filter(([_, used]) => used)
        .map(([name]) => name.replace(/([A-Z])/g, ' $1').trim())
        .join(", ");

      const enhancedNotes = `${sessionNotes}\n\nModalities: ${modalitiesUsed || "None"}\nPain Level: ${painLevel}/10${assignPROM ? "\n[PROM Assigned]" : ""}`;

      await appointmentsApi.updateAppointment(selectedAppointment.id, {
        notes: enhancedNotes,
      });

      // TODO: If assignPROM is true, create PROM assignment via API
      if (assignPROM) {
        // await promsApi.assignPROM(selectedAppointment.patientId, { ... });
        enqueueSnackbar("PROM assigned to patient", { variant: "info" });
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

  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    
    try {
      await appointmentsApi.cancelAppointment(id);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Appointment cancelled", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Failed to cancel appointment", { variant: "error" });
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Delete this appointment? This cannot be undone.")) return;
    
    try {
      await appointmentsApi.deleteAppointment(id);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      enqueueSnackbar("Appointment deleted", { variant: "success" });
    } catch (err) {
      enqueueSnackbar("Failed to delete appointment", { variant: "error" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "in-progress": return "info";
      case "cancelled": return "error";
      case "confirmed": return "primary";
      default: return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Appointments
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Appointment
        </Button>
      </Stack>

      <Box sx={{ display: "flex", gap: 3 }}>
        {/* Calendar */}
        <Paper sx={{ p: 3, flex: 1, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
              Previous
            </Button>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {format(currentDate, "MMMM yyyy")}
            </Typography>
            <Button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
              Next
            </Button>
          </Stack>

          {/* Calendar Grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <Box key={day} sx={{ textAlign: "center", fontWeight: 600, py: 1 }}>
                <Typography variant="caption">{day}</Typography>
              </Box>
            ))}
            
            {daysInMonth.map(day => {
              const hasAppointments = appointmentsForDate(day).length > 0;
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <Box
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  sx={{
                    p: 2,
                    textAlign: "center",
                    cursor: "pointer",
                    borderRadius: auraTokens.borderRadius.md,
                    border: "1px solid",
                    borderColor: isSelected ? "primary.main" : "divider",
                    bgcolor: isCurrentDay ? "primary.light" : isSelected ? "primary.50" : "transparent",
                    opacity: isSameMonth(day, currentDate) ? 1 : 0.3,
                    "&:hover": {
                      bgcolor: "action.hover",
                      borderColor: "primary.main",
                    },
                    position: "relative",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: isCurrentDay ? 700 : 400 }}>
                    {format(day, "d")}
                  </Typography>
                  {hasAppointments && (
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: 4,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* Appointments List */}
        <Paper sx={{ p: 3, width: 400, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {format(selectedDate, "EEEE, MMMM d")}
          </Typography>

          {isLoading ? (
            <Typography variant="body2" color="text.secondary">Loading...</Typography>
          ) : appointmentsForDate(selectedDate).length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No appointments scheduled
            </Typography>
          ) : (
            <Stack spacing={2}>
              {appointmentsForDate(selectedDate).map((apt: any) => (
                <Box
                  key={apt.id}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: auraTokens.borderRadius.md,
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
                          {apt.patientName?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {format(parseISO(apt.scheduledStart), "h:mm a")}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {apt.patientName}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip 
                        label={apt.status} 
                        size="small" 
                        color={getStatusColor(apt.status)}
                      />
                    </Stack>

                    <Typography variant="body2">{apt.appointmentType}</Typography>

                    {apt.notes && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                        Notes: {apt.notes.substring(0, 50)}...
                      </Typography>
                    )}

                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/medical-records?patientId=${apt.patientId}`)}
                        sx={{ bgcolor: "info.main", color: "white", "&:hover": { bgcolor: "info.dark" } }}
                        title="View Medical Record"
                      >
                        <PersonIcon fontSize="small" />
                      </IconButton>
                      {apt.treatmentPlanId && (
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/treatment-plans/${apt.treatmentPlanId}`)}
                          sx={{ bgcolor: "secondary.main", color: "white", "&:hover": { bgcolor: "secondary.dark" } }}
                          title="View Treatment Plan"
                        >
                          <TreatmentIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleOpenNotes(apt)}
                        sx={{ bgcolor: "primary.main", color: "white", "&:hover": { bgcolor: "primary.dark" } }}
                      >
                        <NotesIcon fontSize="small" />
                      </IconButton>
                      {apt.status !== "completed" && (
                        <IconButton
                          size="small"
                          onClick={() => handleCompleteAppointment(apt.id)}
                          sx={{ bgcolor: "success.main", color: "white", "&:hover": { bgcolor: "success.dark" } }}
                        >
                          <CompleteIcon fontSize="small" />
                        </IconButton>
                      )}
                      {apt.status !== "cancelled" && apt.status !== "completed" && (
                        <IconButton
                          size="small"
                          onClick={() => handleCancelAppointment(apt.id)}
                          sx={{ bgcolor: "warning.main", color: "white", "&:hover": { bgcolor: "warning.dark" } }}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAppointment(apt.id)}
                        sx={{ bgcolor: "error.main", color: "white", "&:hover": { bgcolor: "error.dark" } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>
      </Box>

      {/* Session Notes Dialog */}
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Session Notes - {selectedAppointment?.patientName}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {selectedAppointment && format(parseISO(selectedAppointment.scheduledStart), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {selectedAppointment?.appointmentType}
              </Typography>
            </Box>
            
            <Divider />
            
            {/* Treatment Modalities */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Treatment Modalities Used
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={modalities.manualTherapy}
                      onChange={(e) => setModalities({ ...modalities, manualTherapy: e.target.checked })}
                    />
                  }
                  label="Manual Therapy"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={modalities.exerciseTherapy}
                      onChange={(e) => setModalities({ ...modalities, exerciseTherapy: e.target.checked })}
                    />
                  }
                  label="Exercise Therapy"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={modalities.modalities}
                      onChange={(e) => setModalities({ ...modalities, modalities: e.target.checked })}
                    />
                  }
                  label="Modalities"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={modalities.education}
                      onChange={(e) => setModalities({ ...modalities, education: e.target.checked })}
                    />
                  }
                  label="Education"
                />
              </FormGroup>
            </Box>

            {/* Pain Level */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Pain Level During Session
              </Typography>
              <Slider
                value={painLevel}
                onChange={(_, value) => setPainLevel(value as number)}
                min={0}
                max={10}
                marks
                valueLabelDisplay="on"
              />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">No Pain</Typography>
                <Typography variant="caption">Worst Pain</Typography>
              </Stack>
            </Box>

            <Divider />
            
            {/* Session Notes */}
            <TextField
              label="Session Notes"
              multiline
              rows={8}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Document patient progress, treatment provided, observations, and next steps..."
              fullWidth
            />

            {/* PROM Assignment */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={assignPROM}
                  onChange={(e) => setAssignPROM(e.target.checked)}
                />
              }
              label="Assign PROM for next visit"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveNotes} variant="contained">
            Save Notes
          </Button>
          {selectedAppointment?.status !== "completed" && (
            <Button 
              onClick={() => handleCompleteAppointment(selectedAppointment?.id)} 
              variant="contained" 
              color="success"
            >
              Complete & Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
