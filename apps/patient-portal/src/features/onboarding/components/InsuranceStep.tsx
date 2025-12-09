import React from "react";
import { TextField, Stack } from "@mui/material";
import { Callout, FormSection } from "@qivr/design-system";
import type { HealthDetailsFormData } from "../../../types/profile";

interface InsuranceStepProps {
  formData: HealthDetailsFormData;
  updateField: <K extends keyof HealthDetailsFormData>(
    field: K,
    value: HealthDetailsFormData[K],
  ) => void;
}

export const InsuranceStep: React.FC<InsuranceStepProps> = ({
  formData,
  updateField,
}) => {
  return (
    <Stack spacing={3}>
      <Callout variant="info">
        Insurance information helps us process your claims faster. You can skip
        this section if you don't have this information handy.
      </Callout>

      {/* Medicare Details */}
      <FormSection title="Medicare" divider>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Medicare Number"
              value={formData.medicareNumber || ""}
              onChange={(e) => updateField("medicareNumber", e.target.value)}
              placeholder="10 digit number"
              inputProps={{ maxLength: 10 }}
            />
            <TextField
              fullWidth
              label="Reference Number (IRN)"
              value={formData.medicareRef || ""}
              onChange={(e) => updateField("medicareRef", e.target.value)}
              placeholder="1-9"
              inputProps={{ maxLength: 1 }}
              sx={{ maxWidth: { sm: 150 } }}
            />
          </Stack>
          <TextField
            fullWidth
            label="Medicare Expiry"
            type="month"
            value={formData.medicareExpiry || ""}
            onChange={(e) => updateField("medicareExpiry", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ maxWidth: { sm: 200 } }}
          />
        </Stack>
      </FormSection>

      {/* Private Health Insurance */}
      <FormSection title="Private Health Insurance" divider>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Insurance Provider"
            value={formData.insuranceProvider || ""}
            onChange={(e) => updateField("insuranceProvider", e.target.value)}
            placeholder="e.g., Medibank, Bupa, HCF"
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Member ID / Policy Number"
              value={formData.insuranceMemberId || ""}
              onChange={(e) => updateField("insuranceMemberId", e.target.value)}
              placeholder="Your member or policy ID"
            />
            <TextField
              fullWidth
              label="Group Number (if applicable)"
              value={formData.insuranceGroupNumber || ""}
              onChange={(e) =>
                updateField("insuranceGroupNumber", e.target.value)
              }
              placeholder="Group or plan number"
            />
          </Stack>
        </Stack>
      </FormSection>

      {/* Healthcare Providers */}
      <FormSection
        title="Healthcare Providers"
        description="Optional: Help us coordinate your care with other providers."
      >
        <TextField
          fullWidth
          label="Primary Care Physician / GP"
          value={formData.primaryCarePhysician || ""}
          onChange={(e) => updateField("primaryCarePhysician", e.target.value)}
          placeholder="Dr. Smith at ABC Medical Center"
        />
      </FormSection>
    </Stack>
  );
};

export default InsuranceStep;
