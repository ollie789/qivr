import { useState, useEffect, useMemo } from "react";
import {
  TextField,
  Typography,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { enAU } from "date-fns/locale";
import type { ChipProps } from "@mui/material/Chip";
import { useSnackbar } from "notistack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  StepperDialog,
  FormSection,
  FormRow,
  TimeSlotPicker,
  Callout,
  auraTokens,
} from "@qivr/design-system";
import { appointmentsApi } from "../../services/appointmentsApi";
import api from "../../lib/api-client";

export interface ScheduleAppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  patientId?: string;
  intakeId?: string;
  treatmentPlanId?: string;
  appointmentType?: string;
  initialDate?: Date;
  prefilledData?: {
    chiefComplaint?: string;
    urgency?: string;
    preferredProvider?: string;
  };
}

interface Provider {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  availableSlotCount: number;
  isAvailable: boolean;
}

interface AvailableSlot {
  id: string;
  start: string;
  end: string;
  providerId: string;
  providerProfileId: string;
  providerName: string;
}

type AppointmentTypeOption = {
  id: string;
  label: string;
  duration: number;
  color: ChipProps["color"];
};

const appointmentTypes: AppointmentTypeOption[] = [
  {
    id: "initial",
    label: "Initial Consultation",
    duration: 60,
    color: "primary",
  },
  { id: "followup", label: "Follow-up", duration: 30, color: "info" },
  {
    id: "treatment",
    label: "Treatment Session",
    duration: 45,
    color: "success",
  },
  { id: "assessment", label: "Assessment", duration: 90, color: "warning" },
];

export const ScheduleAppointmentDialog: React.FC<
  ScheduleAppointmentDialogProps
> = ({
  open,
  onClose,
  patient,
  patientId,
  intakeId,
  treatmentPlanId,
  appointmentType: defaultAppointmentType,
  initialDate,
  prefilledData,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [appointmentData, setAppointmentData] = useState({
    patientId: patient?.id || patientId || "",
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
    patientEmail: patient?.email || "",
    patientPhone: patient?.phone || "",
    providerId: prefilledData?.preferredProvider || "",
    providerProfileId: "",
    providerName: "",
    appointmentType:
      defaultAppointmentType || (intakeId ? "initial" : "followup"),
    date: initialDate || null as Date | null,
    timeSlot: null as string | null,
    selectedSlot: null as AvailableSlot | null,
    duration: 60,
    notes: prefilledData?.chiefComplaint || "",
  });

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setAppointmentData({
        patientId: patient?.id || patientId || "",
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
        patientEmail: patient?.email || "",
        patientPhone: patient?.phone || "",
        providerId: prefilledData?.preferredProvider || "",
        providerProfileId: "",
        providerName: "",
        appointmentType:
          defaultAppointmentType || (intakeId ? "initial" : "followup"),
        date: initialDate || null,
        timeSlot: null,
        selectedSlot: null,
        duration: 60,
        notes: prefilledData?.chiefComplaint || "",
      });
    }
  }, [open, patient, patientId, prefilledData, defaultAppointmentType, intakeId, initialDate]);

  // Fetch providers from the API
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["available-providers"],
    queryFn: async () => {
      const response = await api.get("/api/provider-schedule/providers");
      return response as Provider[];
    },
    enabled: open,
  });

  // Fetch available slots when provider and date are selected
  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: [
      "available-slots",
      appointmentData.providerProfileId,
      appointmentData.date?.toISOString(),
      appointmentData.duration,
    ],
    queryFn: async () => {
      if (!appointmentData.providerProfileId || !appointmentData.date) {
        return [];
      }
      const dateStr = appointmentData.date.toISOString().split("T")[0];
      const response = await api.get(
        `/api/provider-schedule/${appointmentData.providerProfileId}/available-slots`,
        {
          date: dateStr,
          durationMinutes: appointmentData.duration,
        }
      );
      return response as { start: string; end: string; isAvailable: boolean }[];
    },
    enabled:
      open && !!appointmentData.providerProfileId && !!appointmentData.date,
  });

  // Convert slots to time strings for the TimeSlotPicker
  const timeSlots = useMemo(() => {
    return availableSlots.map((slot) => {
      const date = new Date(slot.start);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    });
  }, [availableSlots]);

  const steps = patient
    ? ["Select Provider", "Choose Date & Time", "Confirm"]
    : ["Patient Info", "Select Provider", "Date & Time", "Confirm"];

  const createAppointmentMutation = useMutation({
    mutationFn: (data: {
      patientId: string;
      providerId: string;
      scheduledStart: string;
      scheduledEnd: string;
      appointmentType: string;
      reasonForVisit?: string;
      notes?: string;
      treatmentPlanId?: string;
    }) => appointmentsApi.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
      enqueueSnackbar("Appointment scheduled successfully!", {
        variant: "success",
      });
      if (intakeId) {
        enqueueSnackbar("Intake status updated", { variant: "info" });
      }
      onClose();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to schedule appointment";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const handleSchedule = async () => {
    if (
      !appointmentData.date ||
      !appointmentData.timeSlot ||
      !appointmentData.duration
    )
      return;

    // Find the selected slot to get exact start/end times
    const selectedSlotData = availableSlots.find((slot) => {
      const slotTime = new Date(slot.start).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return slotTime === appointmentData.timeSlot;
    });

    if (selectedSlotData) {
      createAppointmentMutation.mutate({
        patientId: appointmentData.patientId,
        providerId: appointmentData.providerId,
        scheduledStart: selectedSlotData.start,
        scheduledEnd: selectedSlotData.end,
        appointmentType: appointmentData.appointmentType,
        reasonForVisit: prefilledData?.chiefComplaint,
        notes: appointmentData.notes,
        treatmentPlanId,
      });
    } else {
      // Fallback: calculate times manually
      const timeParts = appointmentData.timeSlot.split(":");
      const hours = parseInt(timeParts[0] || "0", 10);
      const minutes = parseInt(timeParts[1] || "0", 10);

      const scheduledStart = new Date(appointmentData.date);
      scheduledStart.setHours(hours, minutes, 0, 0);

      const scheduledEnd = new Date(scheduledStart);
      scheduledEnd.setMinutes(
        scheduledEnd.getMinutes() + appointmentData.duration
      );

      createAppointmentMutation.mutate({
        patientId: appointmentData.patientId,
        providerId: appointmentData.providerId,
        scheduledStart: scheduledStart.toISOString(),
        scheduledEnd: scheduledEnd.toISOString(),
        appointmentType: appointmentData.appointmentType,
        reasonForVisit: prefilledData?.chiefComplaint,
        notes: appointmentData.notes,
        treatmentPlanId,
      });
    }
  };

  const isStepValid = () => {
    const idx = patient ? activeStep : activeStep;
    if (!patient && idx === 0)
      return appointmentData.patientName && appointmentData.patientEmail;
    if ((patient && idx === 0) || (!patient && idx === 1))
      return appointmentData.providerId;
    if ((patient && idx === 1) || (!patient && idx === 2))
      return appointmentData.date && appointmentData.timeSlot;
    return true;
  };

  const renderStep = () => {
    const idx = patient ? activeStep : activeStep;

    // Patient Info Step
    if (!patient && idx === 0) {
      return (
        <FormSection
          title="Patient Information"
          description="Enter patient details"
        >
          {intakeId && (
            <Callout variant="info">
              Creating appointment from intake submission
            </Callout>
          )}
          <FormRow>
            <TextField
              fullWidth
              label="First Name"
              value={appointmentData.patientName.split(" ")[0] || ""}
              onChange={(e) =>
                setAppointmentData({
                  ...appointmentData,
                  patientName: `${e.target.value} ${appointmentData.patientName.split(" ")[1] || ""}`,
                })
              }
            />
          </FormRow>
          <FormRow>
            <TextField
              fullWidth
              label="Last Name"
              value={appointmentData.patientName.split(" ")[1] || ""}
              onChange={(e) =>
                setAppointmentData({
                  ...appointmentData,
                  patientName: `${appointmentData.patientName.split(" ")[0] || ""} ${e.target.value}`,
                })
              }
            />
          </FormRow>
          <FormRow>
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={appointmentData.patientEmail}
              onChange={(e) =>
                setAppointmentData({
                  ...appointmentData,
                  patientEmail: e.target.value,
                })
              }
            />
          </FormRow>
          <FormRow>
            <TextField
              fullWidth
              label="Phone"
              value={appointmentData.patientPhone}
              onChange={(e) =>
                setAppointmentData({
                  ...appointmentData,
                  patientPhone: e.target.value,
                })
              }
            />
          </FormRow>
        </FormSection>
      );
    }

    // Provider Step
    if ((patient && idx === 0) || (!patient && idx === 1)) {
      return (
        <FormSection
          title="Select Provider"
          description="Choose a provider for the appointment"
        >
          {providersLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : providers.length === 0 ? (
            <Alert severity="warning">
              No providers available. Please configure provider schedules in
              Settings.
            </Alert>
          ) : (
            <List>
              {providers.map((provider) => (
                <ListItem key={provider.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={appointmentData.providerProfileId === provider.id}
                    onClick={() =>
                      setAppointmentData({
                        ...appointmentData,
                        providerId: provider.userId,
                        providerProfileId: provider.id,
                        providerName: provider.name,
                        // Reset date/time when provider changes
                        timeSlot: null,
                      })
                    }
                    sx={{
                      border: 1,
                      borderColor:
                        appointmentData.providerProfileId === provider.id
                          ? "primary.main"
                          : "divider",
                      borderRadius: auraTokens.borderRadius.sm,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={provider.name}
                      secondary={
                        <>
                          {provider.specialization}
                          {provider.isAvailable && (
                            <Chip
                              label="Available Today"
                              size="small"
                              color="success"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Appointment Type
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {appointmentTypes.map((type) => (
                <Chip
                  key={type.id}
                  label={`${type.label} (${type.duration} min)`}
                  color={
                    appointmentData.appointmentType === type.id
                      ? type.color
                      : "default"
                  }
                  onClick={() =>
                    setAppointmentData({
                      ...appointmentData,
                      appointmentType: type.id,
                      duration: type.duration,
                      // Reset time slot when duration changes
                      timeSlot: null,
                    })
                  }
                  variant={
                    appointmentData.appointmentType === type.id
                      ? "filled"
                      : "outlined"
                  }
                />
              ))}
            </Box>
          </Box>
        </FormSection>
      );
    }

    // Date & Time Step
    if ((patient && idx === 1) || (!patient && idx === 2)) {
      return (
        <FormSection
          title="Date & Time"
          description="Choose appointment date and time"
        >
          <FormRow>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={enAU}
            >
              <DatePicker
                label="Appointment Date"
                value={appointmentData.date}
                onChange={(newDate) =>
                  setAppointmentData({
                    ...appointmentData,
                    date: newDate,
                    timeSlot: null, // Reset time when date changes
                  })
                }
                minDate={new Date()}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </LocalizationProvider>
          </FormRow>
          {appointmentData.date && (
            <FormRow>
              {slotsLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    Loading available times...
                  </Typography>
                </Box>
              ) : timeSlots.length === 0 ? (
                <Alert severity="info">
                  No available time slots for this date. The provider may be
                  fully booked or not working on this day.
                </Alert>
              ) : (
                <TimeSlotPicker
                  slots={timeSlots}
                  selectedSlot={appointmentData.timeSlot}
                  onSelectSlot={(slot) =>
                    setAppointmentData({ ...appointmentData, timeSlot: slot })
                  }
                />
              )}
            </FormRow>
          )}
          <FormRow>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={appointmentData.notes}
              onChange={(e) =>
                setAppointmentData({
                  ...appointmentData,
                  notes: e.target.value,
                })
              }
              placeholder="Add any notes or special requirements"
            />
          </FormRow>
        </FormSection>
      );
    }

    // Confirm Step
    return (
      <FormSection
        title="Confirm Details"
        description="Review appointment details"
      >
        <Callout variant="info" title="Appointment Summary">
          <Typography variant="body2">
            Patient: {appointmentData.patientName}
          </Typography>
          <Typography variant="body2">
            Provider: {appointmentData.providerName}
          </Typography>
          <Typography variant="body2">
            Type:{" "}
            {
              appointmentTypes.find(
                (t) => t.id === appointmentData.appointmentType
              )?.label
            }
          </Typography>
          <Typography variant="body2">
            Date: {appointmentData.date?.toLocaleDateString()}
          </Typography>
          <Typography variant="body2">Time: {appointmentData.timeSlot}</Typography>
          <Typography variant="body2">
            Duration: {appointmentData.duration} minutes
          </Typography>
        </Callout>
      </FormSection>
    );
  };

  return (
    <StepperDialog
      open={open}
      onClose={onClose}
      title="Schedule Appointment"
      steps={steps}
      activeStep={activeStep}
      onNext={() => setActiveStep((prev) => prev + 1)}
      onBack={() => setActiveStep((prev) => prev - 1)}
      onComplete={handleSchedule}
      isStepValid={Boolean(isStepValid())}
      loading={createAppointmentMutation.isPending}
      completeLabel="Schedule Appointment"
    >
      {renderStep()}
    </StepperDialog>
  );
};
