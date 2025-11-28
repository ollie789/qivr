import { Box, LinearProgress, Typography, Stack } from '@mui/material';
import { auraTokens } from '../../theme/auraTokens';

export interface ProgressBarProps {
  value: number;
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  /** Show animation when value changes */
  animated?: boolean;
}

const heights = { small: 4, medium: 8, large: 12 };

export const ProgressBar = ({
  value,
  label,
  showValue = true,
  color = 'primary',
  size = 'medium',
  animated = true,
}: ProgressBarProps) => (
  <Box>
    {(label || showValue) && (
      <Stack direction="row" justifyContent="space-between" mb={0.5}>
        {label && <Typography variant="body2" color="text.secondary">{label}</Typography>}
        {showValue && (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              // Smooth number transition effect
              transition: animated ? 'opacity 0.2s ease' : undefined,
            }}
          >
            {Math.round(value)}%
          </Typography>
        )}
      </Stack>
    )}
    <LinearProgress
      variant="determinate"
      value={Math.min(100, Math.max(0, value))}
      color={color}
      sx={{
        height: heights[size],
        borderRadius: auraTokens.borderRadius.sm,
        // Use theme token instead of hardcoded color
        bgcolor: 'action.disabledBackground',
        '& .MuiLinearProgress-bar': {
          borderRadius: auraTokens.borderRadius.sm,
          // Smooth value animation
          transition: animated ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
        },
      }}
    />
  </Box>
);
