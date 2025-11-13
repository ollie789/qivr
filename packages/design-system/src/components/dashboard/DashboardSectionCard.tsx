import { forwardRef } from 'react';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import type { QivrCardProps } from '../QivrCard';
import { QivrCard } from '../QivrCard';

export interface DashboardSectionCardProps extends QivrCardProps {
  header?: React.ReactNode;
  headerProps?: BoxProps;
}

export const DashboardSectionCard = forwardRef<HTMLDivElement, DashboardSectionCardProps>(
  ({ children, header, headerProps, sx, ...rest }, ref) => (
    <QivrCard ref={ref} elevated sx={{ p: 0, overflow: 'hidden', ...sx }} {...rest}>
      {header ? (
        <Box
          sx={{
            px: 3,
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
      <Box sx={{ p: 3 }}>{children}</Box>
    </QivrCard>
  )
);

DashboardSectionCard.displayName = 'DashboardSectionCard';
