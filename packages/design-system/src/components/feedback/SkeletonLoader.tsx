import { auraTokens } from "../../theme/auraTokens";
import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import Skeleton, { type SkeletonProps } from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';

export interface SkeletonLoaderProps extends BoxProps {
  /**
   * Type of skeleton to display
   */
  type?: 'text' | 'card' | 'list' | 'table' | 'chart' | 'profile' | 'custom';
  /**
   * Number of items to show
   */
  count?: number;
  /**
   * Custom skeleton elements (for type='custom')
   */
  children?: React.ReactNode;
  /**
   * Use shimmer animation effect
   */
  shimmer?: boolean;
}

// Shimmer overlay styles for enhanced loading effect
const shimmerStyles = {
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
    animation: 'shimmer 1.5s infinite',
  },
  '@keyframes shimmer': {
    '0%': { left: '-100%' },
    '100%': { left: '100%' },
  },
};

/**
 * Pre-configured skeleton loaders for common patterns
 * Features Aurora-style shimmer animations for enhanced visual feedback
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  count = 3,
  children,
  shimmer = false,
  sx,
  ...props
}) => {
  const theme = useTheme();

  if (type === 'custom' && children) {
    return <Box sx={sx} {...props}>{children}</Box>;
  }

  const wrapperStyles = shimmer ? shimmerStyles : {};

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Stack spacing={2}>
            {Array.from({ length: count }).map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: auraTokens.borderRadius.md,
                  ...wrapperStyles,
                }}
              >
                <Skeleton variant="text" width="60%" height={28} animation="wave" />
                <Skeleton variant="text" width="100%" animation="wave" />
                <Skeleton variant="text" width="80%" animation="wave" />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={118}
                  sx={{ mt: 1, borderRadius: 1 }}
                  animation="wave"
                />
              </Box>
            ))}
          </Stack>
        );

      case 'list':
        return (
          <Stack spacing={1.5}>
            {Array.from({ length: count }).map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  p: 1.5,
                  ...wrapperStyles,
                }}
              >
                <Skeleton variant="circular" width={44} height={44} animation="wave" />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" height={20} animation="wave" />
                  <Skeleton variant="text" width="60%" height={16} animation="wave" />
                </Box>
                <Skeleton variant="rounded" width={60} height={28} animation="wave" />
              </Box>
            ))}
          </Stack>
        );

      case 'table':
        return (
          <Box sx={wrapperStyles}>
            {/* Header */}
            <Box sx={{
              display: 'flex',
              gap: 2,
              mb: 1,
              p: 1.5,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderRadius: 1,
            }}>
              <Skeleton variant="text" width="25%" height={20} animation="wave" />
              <Skeleton variant="text" width="25%" height={20} animation="wave" />
              <Skeleton variant="text" width="25%" height={20} animation="wave" />
              <Skeleton variant="text" width="25%" height={20} animation="wave" />
            </Box>
            {/* Rows */}
            <Stack spacing={0.5}>
              {Array.from({ length: count }).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    p: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Skeleton variant="text" width="25%" animation="wave" />
                  <Skeleton variant="text" width="25%" animation="wave" />
                  <Skeleton variant="text" width="25%" animation="wave" />
                  <Skeleton variant="text" width="25%" animation="wave" />
                </Box>
              ))}
            </Stack>
          </Box>
        );

      case 'chart':
        return (
          <Box sx={wrapperStyles}>
            {/* Chart header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Skeleton variant="text" width={120} height={28} animation="wave" />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Skeleton variant="rounded" width={60} height={24} animation="wave" />
                <Skeleton variant="rounded" width={60} height={24} animation="wave" />
              </Box>
            </Box>
            {/* Chart area with bars */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 200 }}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <Skeleton
                  key={idx}
                  variant="rectangular"
                  width={`${100 / 8}%`}
                  height={`${40 + Math.random() * 60}%`}
                  sx={{ borderRadius: '4px 4px 0 0' }}
                  animation="wave"
                />
              ))}
            </Box>
            {/* X-axis labels */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <Skeleton key={idx} variant="text" width={30} height={16} animation="wave" />
              ))}
            </Box>
          </Box>
        );

      case 'profile':
        return (
          <Box sx={{ textAlign: 'center', ...wrapperStyles }}>
            <Skeleton
              variant="circular"
              width={80}
              height={80}
              sx={{ mx: 'auto', mb: 2 }}
              animation="wave"
            />
            <Skeleton variant="text" width="60%" height={28} sx={{ mx: 'auto' }} animation="wave" />
            <Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} animation="wave" />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
              <Skeleton variant="rounded" width={100} height={36} animation="wave" />
              <Skeleton variant="rounded" width={100} height={36} animation="wave" />
            </Box>
          </Box>
        );

      case 'text':
      default:
        return (
          <Stack spacing={1} sx={wrapperStyles}>
            {Array.from({ length: count }).map((_, idx) => (
              <Skeleton
                key={idx}
                variant="text"
                width={idx === count - 1 ? '60%' : '100%'}
                animation="wave"
              />
            ))}
          </Stack>
        );
    }
  };

  return (
    <Box sx={sx} {...props}>
      {renderSkeleton()}
    </Box>
  );
};

/**
 * Individual skeleton types for more granular control
 */
export const TextSkeleton: React.FC<SkeletonProps> = (props) => (
  <Skeleton variant="text" {...props} />
);

export const CircleSkeleton: React.FC<SkeletonProps> = (props) => (
  <Skeleton variant="circular" {...props} />
);

export const RectangularSkeleton: React.FC<SkeletonProps> = (props) => (
  <Skeleton variant="rectangular" {...props} />
);
