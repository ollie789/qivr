import React, { useState } from "react";
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
} from "@mui/material";
import { Person as PersonIcon } from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { enAU } from "date-fns/locale";
import type { ChipProps } from "@mui/material/Chip";
import { useSnackbar } from "notistack";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  StepperDialog,
  FormSection,
  FormRow,
  TimeSlotPicker,
  Callout,
  auraTokens,
} from "@qivr/design-system";
import { appointmentsApi } from "../../services/appointmentsApi";

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

const providers = [
  {
    id: "1",
    name: "Dr. Emily Chen",
    title: "Physiotherapist",
    availability: "Mon-Fri",
  },
  {
    id: "2",
    name: "Dr. James Williams",
    title: "Sports Therapist",
    availability: "Tue-Sat",
  },
  {
    id: "3",
    name: "Dr. Priya Patel",
    title: "Pain Specialist",
    availability: "Mon-Thu",
  },
];

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

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
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
    appointmentType:
      defaultAppointmentType || (intakeId ? "initial" : "followup"),
    date: initialDate || null as Date | null,
    timeSlot: null as string | null,
    duration: 60,
    notes: prefilledData?.chiefComplaint || "",
  });

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
      enqueueSnackbar("Appointment scheduled successfully!", {
        variant: "success",
      });
      if (intakeId) {
        enqueueSnackbar("Intake status updated", { variant: "info" });
      }
      onClose();
    },
    onError: (error: any) => {
      enqueueSnackbar(error?.message || "Failed to schedule appointment", {
        variant: "error",
      });
    },
  });

  const handleSchedule = async () => {
    if (
      !appointmentData.date ||
      !appointmentData.timeSlot ||
      !appointmentData.duration
    )
      return;

    const timeParts = appointmentData.timeSlot.split(":");
    const hours = parseInt(timeParts[0] || "0", 10);
    const minutes = parseInt(timeParts[1] || "0", 10);

    const scheduledStart = new Date(appointmentData.date);
    scheduledStart.setHours(hours, minutes, 0, 0);

    const scheduledEnd = new Date(scheduledStart);
    scheduledEnd.setMinutes(
      scheduledEnd.getMinutes() + appointmentData.duration,
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
          <List>
            {providers.map((provider) => (
              <ListItem key={provider.id} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  selected={appointmentData.providerId === provider.id}
                  onClick={() =>
                    setAppointmentData({
                      ...appointmentData,
                      providerId: provider.id,
                    })
                  }
                  sx={{
                    border: 1,
                    borderColor:
                      appointmentData.providerId === provider.id
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
                    secondary={`${provider.title} • Available ${provider.availability}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
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
                value={appointmentData.date}
                onChange={(newDate) =>
                  setAppointmentData({ ...appointmentData, date: newDate })
                }
              />
            </LocalizationProvider>
          </FormRow>
          {appointmentData.date && (
            <FormRow>
              <TimeSlotPicker
                slots={timeSlots}
                selectedSlot={appointmentData.timeSlot}
                onSelectSlot={(slot) =>
                  setAppointmentData({ ...appointmentData, timeSlot: slot })
                }
              />
            </FormRow>
          )}
          <FormRow>
            <TextField
              fullWidth
              multiline
              rows={3}
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
            Provider:{" "}
            {providers.find((p) => p.id === appointmentData.providerId)?.name}
          </Typography>
          <Typography variant="body2">
            Type:{" "}
            {
              appointmentTypes.find(
                (t) => t.id === appointmentData.appointmentType,
              )?.label
            }
          </Typography>
          <Typography variant="body2">
            Date: {appointmentData.date?.toLocaleDateString()}
          </Typography>
          <Typography variant="body2">
            Time: {appointmentData.timeSlot}
          </Typography>
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
