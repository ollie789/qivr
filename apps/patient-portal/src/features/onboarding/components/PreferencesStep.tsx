import React from "react";
import {
  Box,
  Stack,
  Typography,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Callout, FormSection, SelectField } from "@qivr/design-system";
import type { HealthDetailsFormData } from "../../../types/profile";

interface PreferencesStepProps {
  formData: HealthDetailsFormData;
  updateField: <K extends keyof HealthDetailsFormData>(
    field: K,
    value: HealthDetailsFormData[K],
  ) => void;
}

const COMMUNICATION_OPTIONS = [
  { value: "email", label: "Email only" },
  { value: "sms", label: "SMS only" },
  { value: "both", label: "Both Email and SMS" },
  { value: "phone", label: "Phone calls" },
];

const REMINDER_OPTIONS = [
  { value: "24h", label: "24 hours before" },
  { value: "2h", label: "2 hours before" },
  { value: "1h", label: "1 hour before" },
  { value: "30min", label: "30 minutes before" },
];

export const PreferencesStep: React.FC<PreferencesStepProps> = ({
  formData,
  updateField,
}) => {
  return (
    <Stack spacing={3}>
      <Callout variant="info">
        Customize how we communicate with you. You can change these preferences
        at any time in your profile settings.
      </Callout>

      {/* Communication Preferences */}
      <FormSection title="Communication Preferences" divider>
        <Stack spacing={3}>
          <SelectField
            label="Preferred Contact Method"
            value={formData.communicationPreference || "email"}
            options={COMMUNICATION_OPTIONS}
            onChange={(value) =>
              updateField(
                "communicationPreference",
                value as HealthDetailsFormData["communicationPreference"],
              )
            }
          />

          <SelectField
            label="Appointment Reminder Timing"
            value={formData.reminderTiming || "24h"}
            options={REMINDER_OPTIONS}
            onChange={(value) =>
              updateField(
                "reminderTiming",
                value as HealthDetailsFormData["reminderTiming"],
              )
            }
          />
        </Stack>
      </FormSection>

      {/* Notification Settings */}
      <FormSection title="Notification Settings">
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.appointmentReminders ?? true}
                onChange={(e) =>
                  updateField("appointmentReminders", e.target.checked)
                }
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">Appointment Reminders</Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive reminders before your scheduled appointments
                </Typography>
              </Box>
            }
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.marketingConsent ?? false}
                onChange={(e) =>
                  updateField("marketingConsent", e.target.checked)
                }
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="body1">
                  Marketing Communications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Receive news, tips, and special offers from the clinic
                </Typography>
              </Box>
            }
          />
        </Stack>
      </FormSection>

      {/* Summary */}
      <Box
        sx={{
          p: 2,
          bgcolor: "background.default",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          What happens next?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          After completing your profile, you'll be able to:
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            Book your first appointment with a provider
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Access your health records and evaluations
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Communicate securely with your care team
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
};

export default PreferencesStep;
