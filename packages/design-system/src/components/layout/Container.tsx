import { Box, type BoxProps } from '@mui/material';

export interface ContainerProps extends BoxProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  padding?: number;
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
  ...props 
}: ContainerProps) => (
  <Box
    sx={{
      width: '100%',
      maxWidth: maxWidth ? maxWidths[maxWidth] : 'none',
      mx: 'auto',
      px: padding,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);
