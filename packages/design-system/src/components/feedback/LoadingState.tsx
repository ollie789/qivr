import { Box, CircularProgress, Typography, Stack, SxProps } from '@mui/material';

export interface AuraLoadingStateProps {
  message?: string;
  size?: number;
  sx?: SxProps;
}

export const AuraLoadingState = ({ message = 'Loading...', size = 40, sx }: AuraLoadingStateProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        ...sx,
      }}
    >
      <Stack spacing={3} alignItems="center">
        <CircularProgress size={size} />
        {message && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};
