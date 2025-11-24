import { useState } from 'react';
import { Box, Paper, Typography, Slider, Stack, Chip } from '@mui/material';
import { PainMap3DViewer } from './PainMap3DViewer';
import type { PainMap3DData } from '../../types/pain-drawing';
import { format } from 'date-fns';

interface ProgressionData {
  date: string;
  intensity: number;
  bodyRegion: string;
  drawingDataJson?: string;
  avatarType?: string;
  viewOrientation?: string;
}

interface PainMapProgressionProps {
  data: ProgressionData[];
  loading?: boolean;
}

export function PainMapProgression({ data, loading = false }: PainMapProgressionProps) {
  const [selectedIndex, setSelectedIndex] = useState(data.length - 1);

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading progression...</Typography>
      </Paper>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No progression data available
        </Typography>
      </Paper>
    );
  }

  const currentData = data[selectedIndex];
  const painMapData: PainMap3DData | undefined = currentData.drawingDataJson
    ? JSON.parse(currentData.drawingDataJson)
    : undefined;

  // Calculate trend
  const getTrend = () => {
    if (selectedIndex === 0) return null;
    const prevIntensity = data[selectedIndex - 1].intensity;
    const currentIntensity = currentData.intensity;
    const diff = currentIntensity - prevIntensity;
    
    if (diff > 0) return { label: 'Increased', color: 'error' as const, value: `+${diff}` };
    if (diff < 0) return { label: 'Decreased', color: 'success' as const, value: diff.toString() };
    return { label: 'Stable', color: 'default' as const, value: '0' };
  };

  const trend = getTrend();

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Pain Progression Timeline
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.length} recordings
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                {format(new Date(currentData.date), 'MMM d, yyyy')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={`Intensity: ${currentData.intensity}/10`}
                  size="small"
                  color={
                    currentData.intensity >= 7 ? 'error' :
                    currentData.intensity >= 4 ? 'warning' :
                    'success'
                  }
                />
                {trend && (
                  <Chip
                    label={`${trend.label} (${trend.value})`}
                    size="small"
                    color={trend.color}
                  />
                )}
              </Box>
            </Box>

            <Slider
              value={selectedIndex}
              onChange={(_, val) => setSelectedIndex(val as number)}
              min={0}
              max={data.length - 1}
              marks={data.map((_, idx) => ({
                value: idx,
                label: idx === 0 || idx === data.length - 1 ? format(new Date(data[idx].date), 'MMM d') : '',
              }))}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => format(new Date(data[value].date), 'MMM d, yyyy')}
            />
          </Box>
        </Stack>
      </Paper>

      {painMapData?.regions && painMapData.regions.length > 0 ? (
        <PainMap3DViewer
          regions={painMapData.regions}
          cameraView={painMapData.cameraView || 'front'}
          width={400}
          height={600}
        />
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No drawing data for this date
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Region: {currentData.bodyRegion}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
