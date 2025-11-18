import { Box, type BoxProps } from '@mui/material';

export interface StackProps extends Omit<BoxProps, 'display' | 'flexDirection'> {
  direction?: 'row' | 'column';
  spacing?: number;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
}

export const Stack = ({ 
  direction = 'column', 
  spacing = 2, 
  align,
  justify,
  children,
  sx,
  ...props 
}: StackProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: direction,
      gap: spacing,
      alignItems: align,
      justifyContent: justify,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);
