import React from 'react';
import { Box, Skeleton, Grid } from '@mui/material';
import { auraTokens } from '@qivr/design-system';

export const DemographicsSkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    <Grid container spacing={3}>
      {[1, 2, 3, 4].map((i) => (
        <Grid key={i} size={{ xs: 12, lg: 6 }}>
          <Box
            sx={{
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Skeleton variant="rounded" width={36} height={36} />
              <Skeleton variant="text" width={150} height={24} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} variant="rounded" height={40} />
              ))}
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  </Box>
);

export const PainAssessmentSkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    {/* Header */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={300} height={20} />
      </Box>
      <Skeleton variant="rounded" width={160} height={36} />
    </Box>

    {/* Stats */}
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      {[1, 2, 3, 4].map((i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Skeleton variant="rounded" width={40} height={40} />
              <Skeleton variant="rounded" width={60} height={24} />
            </Box>
            <Skeleton variant="text" width={80} height={40} />
            <Skeleton variant="text" width={100} height={20} />
          </Box>
        </Grid>
      ))}
    </Grid>

    {/* Chart */}
    <Box
      sx={{
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3,
      }}
    >
      <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={240} />
    </Box>

    {/* Assessment cards */}
    <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
    <Grid container spacing={2}>
      {[1, 2, 3].map((i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Skeleton variant="text" width={100} height={20} />
                <Skeleton variant="text" width={60} height={16} />
              </Box>
              <Skeleton variant="rounded" width={50} height={24} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={80} height={16} />
                <Skeleton variant="text" width={60} height={20} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={80} height={16} />
                <Skeleton variant="text" width={60} height={20} />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} variant="rounded" width={80} height={24} />
              ))}
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  </Box>
);

export const MedicalHistorySkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    {/* Header */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Skeleton variant="text" width={180} height={32} />
        <Skeleton variant="text" width={320} height={20} />
      </Box>
      <Skeleton variant="rounded" width={120} height={36} />
    </Box>

    {/* Category cards */}
    <Grid container spacing={2.5} sx={{ mb: 4 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: auraTokens.chart.sm,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Skeleton variant="rounded" width={36} height={36} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={80} height={20} />
                <Skeleton variant="text" width={60} height={16} />
              </Box>
            </Box>
            {[1, 2, 3].map((j) => (
              <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Skeleton variant="circular" width={8} height={8} />
                <Skeleton variant="text" width="80%" height={20} />
              </Box>
            ))}
          </Box>
        </Grid>
      ))}
    </Grid>

    {/* Tabs */}
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" width={100} height={40} />
        ))}
      </Box>
    </Box>

    {/* List items */}
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <Box
          key={i}
          sx={{
            p: 2.5,
            borderBottom: i < 4 ? '1px solid' : 'none',
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
          }}
        >
          <Skeleton variant="rounded" width={36} height={36} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
              <Skeleton variant="text" width={150} height={24} />
              <Skeleton variant="rounded" width={60} height={20} />
            </Box>
            <Skeleton variant="text" width="60%" height={20} />
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Skeleton variant="text" width={100} height={20} />
            <Skeleton variant="rounded" width={80} height={24} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);

export const TimelineSkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    {/* Header */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Skeleton variant="text" width={150} height={32} />
        <Skeleton variant="text" width={250} height={20} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Skeleton variant="rounded" width={100} height={36} />
        <Skeleton variant="rounded" width={100} height={36} />
      </Box>
    </Box>

    {/* Timeline items */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            gap: 2,
            p: 2.5,
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton variant="circular" width={40} height={40} />
            {i < 5 && <Skeleton variant="rectangular" width={2} height={40} sx={{ mt: 1 }} />}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Skeleton variant="text" width={200} height={24} />
              <Skeleton variant="text" width={100} height={20} />
            </Box>
            <Skeleton variant="text" width="80%" height={20} />
            <Skeleton variant="rounded" width={80} height={24} sx={{ mt: 1 }} />
          </Box>
        </Box>
      ))}
    </Box>
  </Box>
);

export const DocumentsSkeleton: React.FC = () => (
  <Box sx={{ p: 3 }}>
    {/* Header */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Skeleton variant="text" width={120} height={32} />
        <Skeleton variant="text" width={300} height={20} />
      </Box>
      <Skeleton variant="rounded" width={160} height={36} />
    </Box>

    {/* Filters */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" width={100} height={32} />
        ))}
      </Box>
      <Skeleton variant="text" width={100} height={20} />
    </Box>

    {/* Document cards */}
    <Grid container spacing={2.5}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
          <Box
            sx={{
              p: 2.5,
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: auraTokens.chart.md,
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Skeleton variant="rounded" width={48} height={48} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width={100} height={16} />
              </Box>
              <Skeleton variant="circular" width={32} height={32} />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, mb: 2 }}>
              <Skeleton variant="rounded" width={80} height={22} />
              <Skeleton variant="rounded" width={60} height={22} />
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
              <Skeleton variant="text" width={100} height={16} />
              <Skeleton variant="text" width="90%" height={20} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
              <Skeleton variant="rounded" width="50%" height={32} />
              <Skeleton variant="rounded" width="50%" height={32} />
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  </Box>
);
