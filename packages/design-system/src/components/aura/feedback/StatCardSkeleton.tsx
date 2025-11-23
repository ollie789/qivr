import { Box, Paper, Skeleton } from '@mui/material';

export const StatCardSkeleton = () => {
  return (
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} />
        </Box>
      </Box>
    </Paper>
  );
};
