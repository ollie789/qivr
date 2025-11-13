import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import { dialog } from '../../styles/constants';

export interface DialogSectionProps extends BoxProps {
  /**
   * Content to render in the section
   */
  children: React.ReactNode;
}

/**
 * A standardized dialog section with consistent spacing
 */
export const DialogSection: React.FC<DialogSectionProps> = ({
  children,
  sx,
  ...props
}) => {
  return (
    <Box
      sx={[
        dialog.section,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Box>
  );
};
