import React from "react";
import { TextField, Stack } from "@mui/material";
import { FormSection, SelectField, PhoneInput } from "@qivr/design-system";
import type { HealthDetailsFormData } from "../../../types/profile";

interface PersonalDetailsStepProps {
  formData: HealthDetailsFormData;
  updateField: <K extends keyof HealthDetailsFormData>(
    field: K,
    value: HealthDetailsFormData[K],
  ) => void;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const RELATIONSHIP_OPTIONS = [
  { value: "spouse", label: "Spouse/Partner" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

export const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  formData,
  updateField,
}) => {
  return (
    <Stack spacing={3}>
      {/* Date of Birth & Gender */}
      <FormSection title="Basic Information">
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            required
            label="Date of Birth"
            type="date"
            value={formData.dateOfBirth || ""}
            onChange={(e) => updateField("dateOfBirth", e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: new Date().toISOString().split("T")[0],
            }}
          />
          <SelectField
            label="Gender"
            value={formData.gender || ""}
            options={GENDER_OPTIONS}
            onChange={(value) => updateField("gender", value)}
          />
        </Stack>
      </FormSection>

      {/* Address */}
      <FormSection title="Address">
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Street Address"
            value={formData.address || ""}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="123 Main Street, Apt 4B"
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="City"
              value={formData.city || ""}
              onChange={(e) => updateField("city", e.target.value)}
            />
            <TextField
              fullWidth
              label="State"
              value={formData.state || ""}
              onChange={(e) => updateField("state", e.target.value)}
            />
            <TextField
              fullWidth
              label="Postcode"
              value={formData.postcode || ""}
              onChange={(e) => updateField("postcode", e.target.value)}
            />
          </Stack>
        </Stack>
      </FormSection>

      {/* Emergency Contact */}
      <FormSection
        title="Emergency Contact"
        description="Please provide someone we can contact in case of an emergency."
        divider
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              required
              label="Contact Name"
              value={formData.emergencyContactName || ""}
              onChange={(e) =>
                updateField("emergencyContactName", e.target.value)
              }
              placeholder="Jane Doe"
            />
            <SelectField
              label="Relationship"
              value={formData.emergencyContactRelationship || ""}
              options={RELATIONSHIP_OPTIONS}
              onChange={(value) =>
                updateField("emergencyContactRelationship", value)
              }
            />
          </Stack>
          <PhoneInput
            fullWidth
            required
            label="Contact Phone Number"
            defaultCountryCode="+61"
            onChange={(fullNumber) =>
              updateField("emergencyContactPhone", fullNumber)
            }
          />
        </Stack>
      </FormSection>
    </Stack>
  );
};

export default PersonalDetailsStep;
