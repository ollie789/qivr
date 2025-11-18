import { Box, type BoxProps } from '@mui/material';

export interface SectionProps extends BoxProps {
  spacing?: number;
  background?: 'default' | 'paper' | 'grey';
}

export const Section = ({ 
  spacing = 3, 
  background = 'default',
  children,
  sx,
  ...props 
}: SectionProps) => {
  const bgColors = {
    default: 'background.default',
    paper: 'background.paper',
    grey: 'grey.50',
  };

  return (
    <Box
      sx={{
        py: spacing,
        bgcolor: bgColors[background],
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};
