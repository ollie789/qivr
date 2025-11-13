import { forwardRef } from 'react';
import Box, { type BoxProps } from '@mui/material/Box';

export const FlexBetween = forwardRef<HTMLDivElement, BoxProps>(
  ({ sx, ...props }, ref) => (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...sx,
      }}
      {...props}
    />
  )
);

FlexBetween.displayName = 'FlexBetween';
