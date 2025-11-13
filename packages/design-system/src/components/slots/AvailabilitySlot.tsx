import { forwardRef } from 'react';
import Box, { type BoxProps } from '@mui/material/Box';

export interface AvailabilitySlotProps extends BoxProps {
  dashed?: boolean;
}

export const AvailabilitySlot = forwardRef<HTMLDivElement, AvailabilitySlotProps>(
  ({ dashed = true, sx, ...props }, ref) => (
    <Box
      ref={ref}
      sx={{
        height: 60,
        border: dashed ? '1px dashed' : '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 120ms ease',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        ...sx,
      }}
      {...props}
    />
  )
);

AvailabilitySlot.displayName = 'AvailabilitySlot';
