import { Box, type BoxProps } from '@mui/material';
import { ReactNode } from 'react';

export interface ContainerProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  padding?: number;
  children?: ReactNode;
  sx?: BoxProps['sx'];
}

const maxWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

export const Container = ({ 
  maxWidth = 'lg', 
  padding = 3,
  children,
  sx,
}: ContainerProps) => (
  <Box
    sx={{
      width: '100%',
      maxWidth: maxWidth ? maxWidths[maxWidth] : 'none',
      mx: 'auto',
      px: padding,
      ...sx,
    }}
  >
    {children}
  </Box>
);
