import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import CircularProgress, { type CircularProgressProps } from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

export interface LoadingSpinnerProps extends Omit<BoxProps, 'children'> {
  /**
   * Size of the spinner
   */
  size?: number | 'small' | 'medium' | 'large';
  /**
   * Optional message to display below the spinner
   */
  message?: string;
  /**
   * Whether to center the spinner in its container
   */
  centered?: boolean;
  /**
   * Props passed to the CircularProgress component
   */
  progressProps?: CircularProgressProps;
  /**
   * Use layered (double-ring) style for more visual polish
   */
  layered?: boolean;
}

/**
 * A consistent loading spinner with optional message
 * Features Aurora-style layered progress rings for enhanced visual feedback
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  centered = false,
  progressProps,
  layered = true,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const spinnerSize = typeof size === 'string' ? sizeMap[size] : size;
  const thickness = spinnerSize > 40 ? 4 : 3;

  // Layered spinner with background track
  const layeredSpinner = (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      {/* Background track */}
      <CircularProgress
        variant="determinate"
        value={100}
        size={spinnerSize}
        thickness={thickness}
        sx={{
          color: alpha(theme.palette.primary.main, 0.12),
        }}
      />
      {/* Animated foreground */}
      <CircularProgress
        size={spinnerSize}
        thickness={thickness}
        sx={{
          position: 'absolute',
          left: 0,
          color: alpha(theme.palette.primary.main, 0.7),
        }}
        {...progressProps}
      />
    </Box>
  );

  // Simple spinner
  const simpleSpinner = (
    <CircularProgress size={spinnerSize} thickness={thickness} {...progressProps} />
  );

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {layered ? layeredSpinner : simpleSpinner}
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 2, textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (centered) {
    return (
      <Box
        sx={[
          {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...props}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {content}
    </Box>
  );
};
