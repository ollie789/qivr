import { useRef, useEffect } from 'react';
import { Box, Paper, Typography, Stack, CircularProgress } from '@mui/material';

interface HeatMapData {
  gridSize: number;
  frequencyGrid: number[][];
  intensityGrid: number[][];
  totalMaps: number;
  avatarType: string;
  viewOrientation: string;
}

interface PainMapHeatMapProps {
  data: HeatMapData | null;
  loading?: boolean;
  width?: number;
  height?: number;
  backgroundImage?: string;
}

export function PainMapHeatMap({ 
  data, 
  loading = false,
  width = 600, 
  height = 800,
  backgroundImage 
}: PainMapHeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (data) {
      renderHeatMap();
    }
  }, [data]);

  const renderHeatMap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const cellWidth = width / data.gridSize;
    const cellHeight = height / data.gridSize;

    // Find max values for normalization
    let maxFrequency = 0;
    let maxIntensity = 0;

    for (let x = 0; x < data.gridSize; x++) {
      for (let y = 0; y < data.gridSize; y++) {
        if (data.frequencyGrid[x] && data.frequencyGrid[x][y]) {
          maxFrequency = Math.max(maxFrequency, data.frequencyGrid[x][y]);
        }
        if (data.intensityGrid[x] && data.intensityGrid[x][y]) {
          maxIntensity = Math.max(maxIntensity, data.intensityGrid[x][y]);
        }
      }
    }

    // Draw heat map
    for (let x = 0; x < data.gridSize; x++) {
      for (let y = 0; y < data.gridSize; y++) {
        const frequency = data.frequencyGrid[x]?.[y] || 0;
        const intensity = data.intensityGrid[x]?.[y] || 0;

        if (frequency > 0) {
          // Normalize values
          const normalizedFreq = frequency / maxFrequency;
          const normalizedIntensity = intensity / maxIntensity;

          // Color based on intensity (red scale)
          const alpha = normalizedFreq * 0.7; // Opacity based on frequency
          const red = Math.floor(255 * normalizedIntensity);
          const green = Math.floor(100 * (1 - normalizedIntensity));
          const blue = 0;

          ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Generating heat map...</Typography>
      </Paper>
    );
  }

  if (!data) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No data available for heat map
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6">
            Pain Heat Map
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Aggregated from {data.totalMaps} pain drawings
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            width,
            height,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            mx: 'auto',
          }}
        >
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt="Body diagram"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
                opacity: 0.3,
              }}
            />
          )}
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
          <Typography variant="caption">Low frequency</Typography>
          <Box
            sx={{
              width: 200,
              height: 20,
              background: 'linear-gradient(to right, rgba(255,100,0,0.1), rgba(255,0,0,0.7))',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          />
          <Typography variant="caption">High frequency</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
