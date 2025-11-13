import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { dialog } from '../../styles/constants';

export interface IconWithLabelProps extends Omit<BoxProps, 'children'> {
  /**
   * Icon component to display
   */
  icon: React.ReactNode;
  /**
   * Label text (shown above main content)
   */
  label: string;
  /**
   * Main content to display
   */
  children: React.ReactNode;
  /**
   * Whether to show the label as caption style
   */
  captionLabel?: boolean;
}

/**
 * A consistent layout for icon + label + content patterns in dialogs
 */
export const IconWithLabel: React.FC<IconWithLabelProps> = ({
  icon,
  label,
  children,
  captionLabel = true,
  sx,
  ...props
}) => {
  return (
    <Box
      sx={[
        dialog.iconWithLabel,
        { alignItems: 'flex-start' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <Box sx={{ color: 'action.active', mt: 0.5 }}>{icon}</Box>
      <Box>
        <Typography
          variant={captionLabel ? 'caption' : 'subtitle2'}
          color="text.secondary"
        >
          {label}
        </Typography>
        {typeof children === 'string' ? (
          <Typography variant="body1">{children}</Typography>
        ) : (
          children
        )}
      </Box>
    </Box>
  );
};
