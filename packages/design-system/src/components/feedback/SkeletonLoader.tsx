import { auraTokens } from "../../theme/auraTokens";
import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import Skeleton, { type SkeletonProps } from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export interface SkeletonLoaderProps extends BoxProps {
  /**
   * Type of skeleton to display
   */
  type?: 'text' | 'card' | 'list' | 'table' | 'custom';
  /**
   * Number of items to show
   */
  count?: number;
  /**
   * Custom skeleton elements (for type='custom')
   */
  children?: React.ReactNode;
}

/**
 * Pre-configured skeleton loaders for common patterns
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  count = 3,
  children,
  sx,
  ...props
}) => {
  if (type === 'custom' && children) {
    return <Box sx={sx} {...props}>{children}</Box>;
  }

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Stack spacing={2}>
            {Array.from({ length: count }).map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: auraTokens.borderRadius.sm,
                }}
              >
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="rectangular" width="100%" height={118} sx={{ mt: 1 }} />
              </Box>
            ))}
          </Stack>
        );

      case 'list':
        return (
          <Stack spacing={1}>
            {Array.from({ length: count }).map((_, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="40%" />
                  <Skeleton variant="text" width="60%" />
                </Box>
              </Box>
            ))}
          </Stack>
        );

      case 'table':
        return (
          <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 1, borderBottom: 1, borderColor: 'divider' }}>
              <Skeleton variant="text" width="25%" />
              <Skeleton variant="text" width="25%" />
              <Skeleton variant="text" width="25%" />
              <Skeleton variant="text" width="25%" />
            </Box>
            {/* Rows */}
            <Stack spacing={1}>
              {Array.from({ length: count }).map((_, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2, p: 1 }}>
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="25%" />
                  <Skeleton variant="text" width="25%" />
                </Box>
              ))}
            </Stack>
          </Box>
        );

      case 'text':
      default:
        return (
          <Stack spacing={1}>
            {Array.from({ length: count }).map((_, idx) => (
              <Skeleton
                key={idx}
                variant="text"
                width={idx === count - 1 ? '60%' : '100%'}
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
