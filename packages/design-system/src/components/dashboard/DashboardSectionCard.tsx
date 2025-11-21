import { forwardRef } from 'react';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import { Paper, type PaperProps } from '@mui/material';

export interface DashboardSectionCardProps extends Omit<PaperProps, 'elevation'> {
  header?: React.ReactNode;
  headerProps?: BoxProps;
}

export const DashboardSectionCard = forwardRef<HTMLDivElement, DashboardSectionCardProps>(
  ({ children, header, headerProps, sx, ...rest }, ref) => (
    <Paper ref={ref} sx={{ p: 0, overflow: 'hidden', ...sx }} {...rest}>
      {header ? (
        <Box
          sx={{
            px: { xs: 3, md: 5 },
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
          {...headerProps}
        >
          {header}
        </Box>
      ) : null}
      <Box sx={{ p: { xs: 3, md: 5 } }}>{children}</Box>
    </Paper>
  )
);

DashboardSectionCard.displayName = 'DashboardSectionCard';
