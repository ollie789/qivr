/**
 * PainIntensitySlider Component
 * Pain intensity slider with descriptive labels and Aura styling
 */

import React from "react";
import { Box, Slider, Typography } from "@mui/material";
import { auraTokens } from "../../theme/auraTokens";
import { painDescriptions } from "@qivr/eval";

// Re-export for backwards compatibility
export { painDescriptions } from "@qivr/eval";

/** Color scale for pain intensity */
const getIntensityColor = (value: number): string => {
  if (value <= 2) return auraTokens.colors.green.main;
  if (value <= 4) return auraTokens.colors.cyan.main;
  if (value <= 6) return auraTokens.colors.amber.main;
  if (value <= 8) return auraTokens.colors.red.light;
  return auraTokens.colors.red.main;
};

export interface PainIntensitySliderProps {
  /** Current pain intensity value (0-10) */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Label text (default: "Pain Level") */
  label?: string;
  /** Whether to show the description text */
  showDescription?: boolean;
  /** Whether to show the numeric value */
  showValue?: boolean;
  /** Whether to show marks on the slider */
  showMarks?: boolean;
  /** Size variant */
  size?: "small" | "medium";
}

/**
 * Pain intensity slider with visual feedback and descriptions
 */
export const PainIntensitySlider: React.FC<PainIntensitySliderProps> = ({
  value,
  onChange,
  disabled = false,
  label = "Pain Level",
  showDescription = true,
  showValue = true,
  showMarks = true,
  size = "medium",
}) => {
  const intensityColor = getIntensityColor(value);
  const description = painDescriptions[value] || "";

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: 1,
        }}
      >
        <Typography
          variant={size === "small" ? "body2" : "body1"}
          sx={{
            fontWeight: auraTokens.fontWeights.medium,
            color: "text.primary",
          }}
        >
          {label}
          {showValue && (
            <Typography
              component="span"
              sx={{
                ml: 1,
                fontWeight: auraTokens.fontWeights.bold,
                color: intensityColor,
              }}
            >
              {value}/10
            </Typography>
          )}
        </Typography>

        {showDescription && (
          <Typography
            variant={size === "small" ? "caption" : "body2"}
            sx={{
              fontWeight: auraTokens.fontWeights.medium,
              color: intensityColor,
              transition: auraTokens.transitions.fast,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      <Slider
        value={value}
        onChange={(_, val) => onChange(val as number)}
        min={0}
        max={10}
        marks={showMarks}
        valueLabelDisplay="auto"
        disabled={disabled}
        size={size}
        sx={{
          color: intensityColor,
          transition: auraTokens.transitions.default,
          "& .MuiSlider-thumb": {
            width: size === "small" ? 16 : 20,
            height: size === "small" ? 16 : 20,
            transition: auraTokens.transitions.fast,
            "&:hover, &.Mui-focusVisible": {
              boxShadow: `0 0 0 8px ${intensityColor}33`,
            },
          },
          "& .MuiSlider-track": {
            height: size === "small" ? 4 : 6,
            borderRadius: 3,
          },
          "& .MuiSlider-rail": {
            height: size === "small" ? 4 : 6,
            borderRadius: 3,
            opacity: 0.3,
          },
          "& .MuiSlider-mark": {
            width: 2,
            height: 8,
            borderRadius: 1,
          },
          "& .MuiSlider-valueLabel": {
            background: intensityColor,
            borderRadius: auraTokens.borderRadius.sm,
          },
        }}
      />

      {/* Scale labels */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 0.5,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          No Pain
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Worst Possible
        </Typography>
      </Box>
    </Box>
  );
};
