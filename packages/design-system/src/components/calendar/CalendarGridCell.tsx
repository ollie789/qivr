import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import { calendar } from '../../styles/constants';

export interface CalendarGridCellProps extends BoxProps {
  /**
   * Whether the cell is currently selected
   */
  selected?: boolean;
  /**
   * Whether the cell represents today
   */
  isToday?: boolean;
  /**
   * Children to render inside the cell
   */
  children?: React.ReactNode;
}

/**
 * A standardized calendar grid cell with consistent sizing and hover effects
 */
export const CalendarGridCell: React.FC<CalendarGridCellProps> = ({
  selected = false,
  isToday = false,
  children,
  sx,
  ...props
}) => {
  return (
    // @ts-ignore - Complex union type from sx prop spreading
    <Box
      sx={{
        ...calendar.gridCell,
        ...(isToday && {
          bgcolor: 'primary.light',
        }),
        ...(selected && {
          border: 2,
          borderColor: 'primary.main',
        }),
        ...(Array.isArray(sx) ? sx.reduce((acc, s) => ({...acc, ...s}), {}) : sx || {}),
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
