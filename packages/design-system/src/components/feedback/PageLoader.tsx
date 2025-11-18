import { Box, CircularProgress, Typography } from '@mui/material';
import { Stack } from '../layout';

export interface PageLoaderProps {
  message?: string;
  size?: number;
}

export const PageLoader = ({ message = 'Loading...', size = 60 }: PageLoaderProps) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
    }}
  >
    <Stack spacing={2} align="center">
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      )}
    </Stack>
  </Box>
);
