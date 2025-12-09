import React, { useState } from "react";
import {
  Box,
  TextField,
  Stack,
  Chip,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import { Callout, FormSection } from "@qivr/design-system";
import type { HealthDetailsFormData } from "../../../types/profile";

interface MedicalDetailsStepProps {
  formData: HealthDetailsFormData;
  updateField: <K extends keyof HealthDetailsFormData>(
    field: K,
    value: HealthDetailsFormData[K],
  ) => void;
}

interface ChipInputProps {
  label: string;
  placeholder: string;
  helperText?: string;
  values: string[];
  onChange: (values: string[]) => void;
  chipColor?: "error" | "warning" | "info" | "default";
}

const ChipInput: React.FC<ChipInputProps> = ({
  label,
  placeholder,
  helperText,
  values,
  onChange,
  chipColor = "default",
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setInputValue("");
    }
  };

  const handleDelete = (valueToDelete: string) => {
    onChange(values.filter((v) => v !== valueToDelete));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleAdd}
                disabled={!inputValue.trim()}
                edge="end"
                size="small"
              >
                <AddIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      {values.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          {values.map((value) => (
            <Chip
              key={value}
              label={value}
              onDelete={() => handleDelete(value)}
              deleteIcon={<CloseIcon />}
              color={chipColor}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export const MedicalDetailsStep: React.FC<MedicalDetailsStepProps> = ({
  formData,
  updateField,
}) => {
  return (
    <Stack spacing={3}>
      <Callout variant="warning">
        <strong>Important:</strong> Please list any allergies, especially to
        medications. This information is critical for your safety during
        treatment.
      </Callout>

      {/* Allergies */}
      <FormSection title="Allergies">
        <ChipInput
          label="Allergies"
          placeholder="Type an allergy and press Enter"
          helperText="Include drug allergies, food allergies, and environmental allergies"
          values={formData.allergies || []}
          onChange={(values) => updateField("allergies", values)}
          chipColor="error"
        />
      </FormSection>

      {/* Current Medications */}
      <FormSection title="Current Medications">
        <ChipInput
          label="Medications"
          placeholder="Type a medication and press Enter"
          helperText="List any medications you're currently taking (including supplements)"
          values={formData.medications || []}
          onChange={(values) => updateField("medications", values)}
          chipColor="info"
        />
      </FormSection>

      {/* Medical Conditions */}
      <FormSection title="Medical Conditions">
        <ChipInput
          label="Existing Conditions"
          placeholder="Type a condition and press Enter"
          helperText="List any chronic conditions or diagnoses (e.g., diabetes, hypertension)"
          values={formData.conditions || []}
          onChange={(values) => updateField("conditions", values)}
        />
      </FormSection>
    </Stack>
  );
};

export default MedicalDetailsStep;
