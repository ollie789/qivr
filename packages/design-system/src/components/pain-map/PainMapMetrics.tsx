import { Box, Grid, Paper, Typography, Chip, Stack, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, Remove } from '@mui/icons-material';

interface RegionFrequency {
  region: string;
  count: number;
}

interface IntensityCount {
  intensity: number;
  count: number;
}

interface QualityCount {
  quality: string;
  count: number;
}

interface MetricsData {
  totalMaps: number;
  averageIntensity: number;
  mostCommonRegions: RegionFrequency[];
  intensityDistribution: IntensityCount[];
  qualityDistribution: QualityCount[];
}

interface PainMapMetricsProps {
  data: MetricsData | null;
  loading?: boolean;
}

export function PainMapMetrics({ data, loading = false }: PainMapMetricsProps) {
  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading metrics...</Typography>
      </Paper>
    );
  }

  if (!data) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No metrics available</Typography>
      </Paper>
    );
  }

  const maxRegionCount = Math.max(...data.mostCommonRegions.map(r => r.count), 1);
  const maxIntensityCount = Math.max(...data.intensityDistribution.map(i => i.count), 1);
  const maxQualityCount = Math.max(...data.qualityDistribution.map(q => q.count), 1);

  const getTrendIcon = (intensity: number) => {
    if (intensity >= 7) return <TrendingUp color="error" />;
    if (intensity <= 3) return <TrendingDown color="success" />;
    return <Remove color="warning" />;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        {/* @ts-ignore - MUI v7 Grid size prop union type complexity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Pain Drawings
            </Typography>
            <Typography variant="h3">{data.totalMaps}</Typography>
          </Paper>
        </Grid>

        {/* @ts-ignore - MUI v7 Grid size prop union type complexity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Average Intensity
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h3">{data.averageIntensity.toFixed(1)}</Typography>
              <Typography variant="h6" color="text.secondary">/10</Typography>
              {getTrendIcon(data.averageIntensity)}
            </Box>
          </Paper>
        </Grid>

        {/* Most Common Regions */}
        {/* @ts-ignore - MUI v7 Grid size prop union type complexity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Most Common Pain Regions
            </Typography>
            <Stack spacing={1}>
              {data.mostCommonRegions.slice(0, 5).map((region, idx) => (
                <Box key={idx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{region.region}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {region.count} ({Math.round((region.count / data.totalMaps) * 100)}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(region.count / maxRegionCount) * 100}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Pain Quality Distribution */}
        {/* @ts-ignore - MUI v7 Grid size prop union type complexity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pain Quality Distribution
            </Typography>
            <Stack spacing={1}>
              {data.qualityDistribution.map((quality, idx) => (
                <Box key={idx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">{quality.quality}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {quality.count}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(quality.count / maxQualityCount) * 100}
                    sx={{ height: 8, borderRadius: 1 }}
                    color={
                      quality.quality === 'Burning' ? 'error' :
                      quality.quality === 'Sharp' ? 'warning' :
                      'primary'
                    }
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* Intensity Distribution */}
        {/* @ts-ignore - MUI v7 Grid size prop union type complexity */}
        <Grid size={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Pain Intensity Distribution
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 200 }}>
              {data.intensityDistribution.map((item) => (
                <Box
                  key={item.intensity}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {item.count}
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      height: `${(item.count / maxIntensityCount) * 150}px`,
                      bgcolor: item.intensity >= 7 ? 'error.main' : item.intensity >= 4 ? 'warning.main' : 'success.main',
                      borderRadius: 1,
                      transition: 'height 0.3s',
                    }}
                  />
                  <Chip
                    label={item.intensity}
                    size="small"
                    color={item.intensity >= 7 ? 'error' : item.intensity >= 4 ? 'warning' : 'success'}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
