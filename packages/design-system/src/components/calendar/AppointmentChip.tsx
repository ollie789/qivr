import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import { calendar } from '../../styles/constants';

export interface AppointmentChipProps extends BoxProps {
  /**
   * Background color for the appointment
   */
  color: string;
  /**
   * Content to display
   */
  children: React.ReactNode;
}

/**
 * A compact appointment indicator for calendar grids
 */
export const AppointmentChip: React.FC<AppointmentChipProps> = ({
  color,
  children,
  sx,
  ...props
}) => {
  return (
    <Box
      sx={[
        calendar.appointmentChip,
        { bgcolor: color },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Box>
  );
};
