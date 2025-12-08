/**
 * QuestionRenderer Component
 * Renders intake form questions with consistent Aura styling
 */

import React from "react";
import {
  Box,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Typography,
} from "@mui/material";
import { auraTokens } from "../../theme/auraTokens";
import type { Question, SelectOption, CheckboxOption } from "@qivr/eval";

// Re-export types for backwards compatibility
export type { Question, SelectOption, CheckboxOption } from "@qivr/eval";

// Legacy type aliases for backwards compatibility
export type IntakeSelectOption = SelectOption;
export type IntakeCheckboxOption = CheckboxOption;

export interface QuestionRendererProps {
  /** The question definition to render */
  question: Question;
  /** Current value of the field */
  value: unknown;
  /** Callback when value changes */
  onChange: (value: unknown) => void;
  /** Callback for checkbox toggle (for checkbox-group type) */
  onToggle?: (value: string) => void;
  /** Error message for this field */
  error?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: "small" | "medium";
}

/**
 * Renders a single question based on its type with Aura styling
 */
export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  onToggle,
  error,
  disabled = false,
  size = "medium",
}) => {
  const { name: _name, label, type, options, placeholder, rows = 4 } = question;

  // Text input types
  if (type === "text" || type === "email" || type === "tel") {
    return (
      <TextField
        fullWidth
        type={type}
        label={label}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={!!error}
        helperText={error}
        disabled={disabled}
        size={size}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: auraTokens.borderRadius.sm,
          },
        }}
      />
    );
  }

  // Textarea
  if (type === "textarea") {
    return (
      <TextField
        fullWidth
        multiline
        rows={rows}
        label={label}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        error={!!error}
        helperText={error}
        disabled={disabled}
        size={size}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: auraTokens.borderRadius.sm,
          },
        }}
      />
    );
  }

  // Select dropdown
  if (type === "select") {
    return (
      <FormControl fullWidth error={!!error} disabled={disabled} size={size}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={(value as string) || ""}
          label={label}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            borderRadius: auraTokens.borderRadius.sm,
          }}
        >
          {(options as IntakeSelectOption[])?.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        {error && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
            {error}
          </Typography>
        )}
      </FormControl>
    );
  }

  // Checkbox group
  if (type === "checkbox-group") {
    const values = (value as string[]) || [];
    return (
      <FormControl component="fieldset" error={!!error} disabled={disabled}>
        <FormLabel
          component="legend"
          sx={{
            fontWeight: auraTokens.fontWeights.medium,
            color: "text.primary",
            mb: 1,
            "&.Mui-focused": {
              color: "text.primary",
            },
          }}
        >
          {label}
        </FormLabel>
        <FormGroup
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 0.5,
          }}
        >
          {(options as IntakeCheckboxOption[])?.map((opt) => (
            <FormControlLabel
              key={opt.value}
              label={opt.label}
              control={
                <Checkbox
                  checked={values.includes(opt.value)}
                  onChange={() => onToggle?.(opt.value)}
                  size={size}
                  sx={{
                    "&.Mui-checked": {
                      color: "primary.main",
                    },
                  }}
                />
              }
              sx={{
                m: 0,
                py: 0.5,
                "& .MuiFormControlLabel-label": {
                  fontSize: size === "small" ? "0.875rem" : "1rem",
                },
              }}
            />
          ))}
        </FormGroup>
        {error && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
            {error}
          </Typography>
        )}
      </FormControl>
    );
  }

  return null;
};

export interface QuestionSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Array of questions to render */
  questions: Question[];
  /** Current form values */
  formValues: Record<string, unknown>;
  /** Callback when a field value changes */
  onFieldChange: (fieldName: string, value: unknown) => void;
  /** Callback for checkbox toggle */
  onCheckboxToggle: (fieldName: string, value: string) => void;
  /** Validation errors */
  errors?: Record<string, string>;
  /** Whether fields are disabled */
  disabled?: boolean;
  /** Size variant */
  size?: "small" | "medium";
  /** Spacing between questions */
  spacing?: number;
}

/**
 * Check if a question should be shown based on its showWhen condition
 */
function shouldShowQuestion(
  question: Question,
  formValues: Record<string, unknown>,
): boolean {
  if (!question.showWhen) return true;

  const { field, value } = question.showWhen;
  const fieldValue = formValues[field];

  if (Array.isArray(value)) {
    return value.includes(fieldValue as string);
  }

  return fieldValue === value;
}

/**
 * Renders a section of questions with consistent layout
 */
export const QuestionSection: React.FC<QuestionSectionProps> = ({
  title,
  description,
  questions,
  formValues,
  onFieldChange,
  onCheckboxToggle,
  errors = {},
  disabled = false,
  size = "medium",
  spacing = 3,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: spacing }}>
      {(title || description) && (
        <Box sx={{ mb: 1 }}>
          {title && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: auraTokens.fontWeights.semibold,
                color: "text.primary",
                mb: description ? 0.5 : 0,
              }}
            >
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      )}

      {questions.map((question) => {
        // Check if question should be displayed based on showWhen condition
        if (!shouldShowQuestion(question, formValues)) {
          return null;
        }

        return (
          <QuestionRenderer
            key={question.name}
            question={question}
            value={formValues[question.name]}
            onChange={(val) => onFieldChange(question.name, val)}
            onToggle={(val) => onCheckboxToggle(question.name, val)}
            error={errors[question.name]}
            disabled={disabled}
            size={size}
          />
        );
      })}
    </Box>
  );
};
