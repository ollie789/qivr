import { auraTokens } from '../../../theme/auraTokens';
import { Box, Paper, Skeleton } from '@mui/material';

export const StatCardSkeleton = () => {
  return (
    <Paper
      sx={{
        p: { xs: 3, md: 5 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: 'shimmer 2s infinite',
        },
        '@keyframes shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Skeleton variant="circular" width={48} height={48} animation="wave" />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} animation="wave" />
          <Skeleton variant="text" width="40%" height={40} sx={{ mt: 1 }} animation="wave" />
        </Box>
      </Box>
    </Paper>
  );
};
