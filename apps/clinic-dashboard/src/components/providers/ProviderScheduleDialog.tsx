import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  EventBusy as EventBusyIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import {
  AuraButton,
  AuraCard,
  FormDialog,
  SectionLoader,
  SelectField,
  TabPanel,
} from "@qivr/design-system";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import api from "../../lib/api-client";

interface WeeklySchedule {
  dayOfWeek: number;
  dayName: string;
  isWorkingDay: boolean;
  startTime: string | null;
  endTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  defaultSlotDurationMinutes: number;
  bufferMinutes: number;
  allowsTelehealth: boolean;
  allowsInPerson: boolean;
  maxAppointmentsPerDay: number;
}

interface TimeOff {
  id: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  type: string;
  reason: string | null;
  isApproved: boolean;
  isRecurring: boolean;
  recurrencePattern: string | null;
  recurrenceEndDate: string | null;
}

interface ProviderScheduleDialogProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
}

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TIME_OFF_TYPES = [
  { value: "Vacation", label: "Vacation" },
  { value: "SickLeave", label: "Sick Leave" },
  { value: "PersonalDay", label: "Personal Day" },
  { value: "Training", label: "Training" },
  { value: "Conference", label: "Conference" },
  { value: "AdminTime", label: "Admin Time" },
  { value: "BlockedTime", label: "Blocked Time" },
  { value: "Holiday", label: "Holiday" },
  { value: "Other", label: "Other" },
];

export function ProviderScheduleDialog({
  open,
  onClose,
  providerId,
  providerName,
}: ProviderScheduleDialogProps) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [schedule, setSchedule] = useState<WeeklySchedule[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [addTimeOffDialog, setAddTimeOffDialog] = useState(false);
  const [newTimeOff, setNewTimeOff] = useState({
    startDate: "",
    endDate: "",
    isAllDay: true,
    type: "Vacation",
    reason: "",
  });

  // Fetch weekly schedule
  const { data: weeklySchedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["provider-schedule", providerId],
    queryFn: async () => {
      const response = await api.get(
        `/api/provider-schedule/${providerId}/weekly-schedule`
      );
      return response as WeeklySchedule[];
    },
    enabled: open && !!providerId,
  });

  // Fetch time offs
  const { data: timeOffs = [], isLoading: timeOffsLoading } = useQuery({
    queryKey: ["provider-time-offs", providerId],
    queryFn: async () => {
      const response = await api.get(
        `/api/provider-schedule/${providerId}/time-off`
      );
      return response as TimeOff[];
    },
    enabled: open && !!providerId,
  });

  useEffect(() => {
    if (weeklySchedule) {
      setSchedule(weeklySchedule);
      setHasChanges(false);
    }
  }, [weeklySchedule]);

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (scheduleData: WeeklySchedule[]) => {
      await api.put(
        `/api/provider-schedule/${providerId}/weekly-schedule`,
        scheduleData.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          isWorkingDay: s.isWorkingDay,
          startTime: s.startTime,
          endTime: s.endTime,
          breakStartTime: s.breakStartTime,
          breakEndTime: s.breakEndTime,
          defaultSlotDurationMinutes: s.defaultSlotDurationMinutes,
          bufferMinutes: s.bufferMinutes,
          allowsTelehealth: s.allowsTelehealth,
          allowsInPerson: s.allowsInPerson,
          maxAppointmentsPerDay: s.maxAppointmentsPerDay,
        }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["provider-schedule", providerId],
      });
      enqueueSnackbar("Schedule updated successfully", { variant: "success" });
      setHasChanges(false);
    },
    onError: () => {
      enqueueSnackbar("Failed to update schedule", { variant: "error" });
    },
  });

  // Add time off mutation
  const addTimeOffMutation = useMutation({
    mutationFn: async (timeOffData: typeof newTimeOff) => {
      await api.post(`/api/provider-schedule/${providerId}/time-off`, {
        startDateTime: new Date(timeOffData.startDate).toISOString(),
        endDateTime: new Date(timeOffData.endDate).toISOString(),
        isAllDay: timeOffData.isAllDay,
        type: timeOffData.type,
        reason: timeOffData.reason || null,
        autoApprove: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["provider-time-offs", providerId],
      });
      enqueueSnackbar("Time off added successfully", { variant: "success" });
      setAddTimeOffDialog(false);
      setNewTimeOff({
        startDate: "",
        endDate: "",
        isAllDay: true,
        type: "Vacation",
        reason: "",
      });
    },
    onError: () => {
      enqueueSnackbar("Failed to add time off", { variant: "error" });
    },
  });

  // Delete time off mutation
  const deleteTimeOffMutation = useMutation({
    mutationFn: async (timeOffId: string) => {
      await api.delete(
        `/api/provider-schedule/${providerId}/time-off/${timeOffId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["provider-time-offs", providerId],
      });
      enqueueSnackbar("Time off deleted", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to delete time off", { variant: "error" });
    },
  });

  const handleScheduleChange = (
    dayIndex: number,
    field: keyof WeeklySchedule,
    value: any
  ) => {
    setSchedule((prev) =>
      prev.map((day, idx) =>
        idx === dayIndex ? { ...day, [field]: value } : day
      )
    );
    setHasChanges(true);
  };

  const handleSaveSchedule = () => {
    updateScheduleMutation.mutate(schedule);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeOffTypeColor = (type: string) => {
    switch (type) {
      case "Vacation":
        return "primary";
      case "SickLeave":
        return "error";
      case "Training":
      case "Conference":
        return "info";
      case "BlockedTime":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{`${providerName} - Schedule & Availability`}</DialogTitle>
        <DialogContent>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
        >
          <Tab icon={<ScheduleIcon />} label="Weekly Schedule" iconPosition="start" />
          <Tab icon={<EventBusyIcon />} label="Time Off" iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {scheduleLoading ? (
            <SectionLoader minHeight={200} />
          ) : (
            <Box>
              {hasChanges && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  You have unsaved changes.
                  <AuraButton
                    size="small"
                    variant="contained"
                    sx={{ ml: 2 }}
                    onClick={handleSaveSchedule}
                    disabled={updateScheduleMutation.isPending}
                  >
                    Save Changes
                  </AuraButton>
                </Alert>
              )}

              {schedule.map((day, index) => (
                <Box
                  key={day.dayOfWeek}
                  sx={{
                    p: 2,
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: day.isWorkingDay
                      ? "background.paper"
                      : "action.disabledBackground",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={day.isWorkingDay}
                            onChange={(e) =>
                              handleScheduleChange(
                                index,
                                "isWorkingDay",
                                e.target.checked
                              )
                            }
                          />
                        }
                        label={
                          <Typography
                            fontWeight={day.isWorkingDay ? 600 : 400}
                            color={
                              day.isWorkingDay
                                ? "text.primary"
                                : "text.disabled"
                            }
                          >
                            {DAYS_OF_WEEK[day.dayOfWeek]}
                          </Typography>
                        }
                      />
                    </Grid>

                    {day.isWorkingDay && (
                      <>
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            type="time"
                            label="Start"
                            size="small"
                            fullWidth
                            value={day.startTime || "09:00"}
                            onChange={(e) =>
                              handleScheduleChange(
                                index,
                                "startTime",
                                e.target.value
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            type="time"
                            label="End"
                            size="small"
                            fullWidth
                            value={day.endTime || "17:00"}
                            onChange={(e) =>
                              handleScheduleChange(
                                index,
                                "endTime",
                                e.target.value
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            type="time"
                            label="Break Start"
                            size="small"
                            fullWidth
                            value={day.breakStartTime || ""}
                            onChange={(e) =>
                              handleScheduleChange(
                                index,
                                "breakStartTime",
                                e.target.value || null
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            type="time"
                            label="Break End"
                            size="small"
                            fullWidth
                            value={day.breakEndTime || ""}
                            onChange={(e) =>
                              handleScheduleChange(
                                index,
                                "breakEndTime",
                                e.target.value || null
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                          <Box display="flex" gap={0.5}>
                            <Chip
                              label="Telehealth"
                              size="small"
                              color={day.allowsTelehealth ? "primary" : "default"}
                              variant={day.allowsTelehealth ? "filled" : "outlined"}
                              onClick={() =>
                                handleScheduleChange(
                                  index,
                                  "allowsTelehealth",
                                  !day.allowsTelehealth
                                )
                              }
                              sx={{ cursor: "pointer" }}
                            />
                            <Chip
                              label="In-Person"
                              size="small"
                              color={day.allowsInPerson ? "primary" : "default"}
                              variant={day.allowsInPerson ? "filled" : "outlined"}
                              onClick={() =>
                                handleScheduleChange(
                                  index,
                                  "allowsInPerson",
                                  !day.allowsInPerson
                                )
                              }
                              sx={{ cursor: "pointer" }}
                            />
                          </Box>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Box>
              ))}

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom>
                Default Appointment Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    type="number"
                    label="Slot Duration (minutes)"
                    size="small"
                    fullWidth
                    value={schedule[1]?.defaultSlotDurationMinutes || 30}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 30;
                      setSchedule((prev) =>
                        prev.map((day) => ({
                          ...day,
                          defaultSlotDurationMinutes: value,
                        }))
                      );
                      setHasChanges(true);
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    type="number"
                    label="Buffer Between Appointments (minutes)"
                    size="small"
                    fullWidth
                    value={schedule[1]?.bufferMinutes || 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setSchedule((prev) =>
                        prev.map((day) => ({
                          ...day,
                          bufferMinutes: value,
                        }))
                      );
                      setHasChanges(true);
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    type="number"
                    label="Max Appointments/Day (0 = unlimited)"
                    size="small"
                    fullWidth
                    value={schedule[1]?.maxAppointmentsPerDay || 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setSchedule((prev) =>
                        prev.map((day) => ({
                          ...day,
                          maxAppointmentsPerDay: value,
                        }))
                      );
                      setHasChanges(true);
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="subtitle1">Scheduled Time Off</Typography>
            <AuraButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddTimeOffDialog(true)}
            >
              Add Time Off
            </AuraButton>
          </Box>

          {timeOffsLoading ? (
            <SectionLoader minHeight={150} />
          ) : timeOffs.length === 0 ? (
            <AuraCard>
              <Box textAlign="center" py={4}>
                <CalendarIcon
                  sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                />
                <Typography color="text.secondary">
                  No scheduled time off
                </Typography>
              </Box>
            </AuraCard>
          ) : (
            <List>
              {timeOffs.map((timeOff) => (
                <ListItem
                  key={timeOff.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={timeOff.type.replace(/([A-Z])/g, " $1").trim()}
                          size="small"
                          color={getTimeOffTypeColor(timeOff.type) as any}
                        />
                        <Typography>
                          {formatDate(timeOff.startDateTime)}
                          {timeOff.startDateTime !== timeOff.endDateTime && (
                            <> - {formatDate(timeOff.endDateTime)}</>
                          )}
                        </Typography>
                        {!timeOff.isApproved && (
                          <Chip
                            label="Pending Approval"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={timeOff.reason}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => deleteTimeOffMutation.mutate(timeOff.id)}
                      disabled={deleteTimeOffMutation.isPending}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
        </DialogContent>
      </Dialog>

      {/* Add Time Off Dialog */}
      <FormDialog
        open={addTimeOffDialog}
        onClose={() => setAddTimeOffDialog(false)}
        title="Add Time Off"
        maxWidth="sm"
        onSubmit={() => addTimeOffMutation.mutate(newTimeOff)}
        submitLabel="Add Time Off"
        loading={addTimeOffMutation.isPending}
      >
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="date"
              label="Start Date"
              fullWidth
              value={newTimeOff.startDate}
              onChange={(e) =>
                setNewTimeOff({ ...newTimeOff, startDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              type="date"
              label="End Date"
              fullWidth
              value={newTimeOff.endDate}
              onChange={(e) =>
                setNewTimeOff({ ...newTimeOff, endDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={12}>
            <SelectField
              label="Type"
              value={newTimeOff.type}
              onChange={(value) => setNewTimeOff({ ...newTimeOff, type: value })}
              options={TIME_OFF_TYPES}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label="Reason (optional)"
              fullWidth
              multiline
              rows={2}
              value={newTimeOff.reason}
              onChange={(e) =>
                setNewTimeOff({ ...newTimeOff, reason: e.target.value })
              }
            />
          </Grid>
        </Grid>
      </FormDialog>
    </>
  );
}
