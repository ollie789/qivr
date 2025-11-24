import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import CircularProgress, { type CircularProgressProps } from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

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
}

/**
 * A consistent loading spinner with optional message
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  centered = false,
  progressProps,
  sx,
  ...props
}) => {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const spinnerSize = typeof size === 'string' ? sizeMap[size] : size;

  const content = (
    <Box
      sx={{
        animation: 'pulse 2s ease-in-out infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      }}
    >
      <CircularProgress size={spinnerSize} {...progressProps} />
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
