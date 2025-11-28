import { auraTokens, glassTokens } from '../../theme/auraTokens';
import { Box, Paper, Skeleton, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

export interface StatCardSkeletonProps {
  /** Use compact layout */
  compact?: boolean;
}

export const StatCardSkeleton = ({ compact = false }: StatCardSkeletonProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        minHeight: 140,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: glassTokens.shadow.subtle,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: 'shimmer 1.8s infinite',
        },
        '@keyframes shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      }}
    >
      <Stack spacing={1.5} sx={{ flex: 1 }}>
        {/* Icon */}
        <Skeleton
          variant="rounded"
          width={40}
          height={40}
          animation="wave"
          sx={{ borderRadius: 2 }}
        />

        {/* Value and title */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Skeleton
            variant="text"
            width="60%"
            height={36}
            animation="wave"
          />
          <Skeleton
            variant="text"
            width="80%"
            height={18}
            sx={{ mt: 0.5 }}
            animation="wave"
          />
        </Box>

        {/* Trend */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Skeleton
            variant="rounded"
            width={52}
            height={22}
            animation="wave"
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="text"
            width={70}
            height={16}
            animation="wave"
          />
        </Box>
      </Stack>
    </Paper>
  );
};

export interface ChartCardSkeletonProps {
  /** Height of the chart area */
  height?: number;
  /** Chart type visualization */
  type?: 'bar' | 'line' | 'area';
}

export const ChartCardSkeleton = ({ height = 240, type = 'bar' }: ChartCardSkeletonProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: glassTokens.shadow.subtle,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          animation: 'shimmer 1.8s infinite',
        },
        '@keyframes shimmer': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={140} height={24} animation="wave" />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={50} height={24} animation="wave" />
          <Skeleton variant="rounded" width={50} height={24} animation="wave" />
        </Box>
      </Box>

      {/* Chart area */}
      {type === 'bar' && (
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height, px: 1 }}>
          {Array.from({ length: 7 }).map((_, idx) => (
            <Skeleton
              key={idx}
              variant="rectangular"
              width={`${100 / 7}%`}
              height={`${30 + (idx % 3) * 20 + Math.random() * 30}%`}
              sx={{ borderRadius: '4px 4px 0 0' }}
              animation="wave"
            />
          ))}
        </Box>
      )}

      {(type === 'line' || type === 'area') && (
        <Box sx={{ height, position: 'relative' }}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height="100%"
            sx={{
              borderRadius: 2,
              opacity: 0.5,
            }}
            animation="wave"
          />
          {/* Fake line overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: '30%',
              left: 0,
              right: 0,
              height: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: 1,
              transform: 'rotate(-5deg)',
            }}
          />
        </Box>
      )}

      {/* X-axis labels */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        {Array.from({ length: 7 }).map((_, idx) => (
          <Skeleton key={idx} variant="text" width={28} height={14} animation="wave" />
        ))}
      </Box>
    </Paper>
  );
};
