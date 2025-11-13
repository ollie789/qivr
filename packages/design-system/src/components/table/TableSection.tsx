import { forwardRef } from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import { QivrCard, type QivrCardProps } from '../QivrCard';

export interface TableSectionProps extends QivrCardProps {
  header?: React.ReactNode;
  headerProps?: BoxProps;
  bodyProps?: BoxProps;
}

export const TableSection = forwardRef<HTMLDivElement, TableSectionProps>(
  ({ children, header, headerProps, bodyProps, sx, ...rest }, ref) => (
    <QivrCard ref={ref} elevated sx={{ p: 0, overflow: 'hidden', ...sx }} {...rest}>
      {header ? (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
          {...headerProps}
        >
          {header}
        </Box>
      ) : null}
      <Box sx={{ p: 0, ...bodyProps?.sx }} {...bodyProps}>
        {children}
      </Box>
    </QivrCard>
  )
);

TableSection.displayName = 'TableSection';
