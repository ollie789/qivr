import { Box, CircularProgress, Typography } from '@mui/material';
import { Stack } from '../layout';

export interface SectionLoaderProps {
  message?: string;
  size?: number;
  minHeight?: string | number;
}

export const SectionLoader = ({ 
  message, 
  size = 40,
  minHeight = '200px',
}: SectionLoaderProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight,
      width: '100%',
      py: 4,
    }}
  >
    <Stack spacing={2} align="center">
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Stack>
  </Box>
);
