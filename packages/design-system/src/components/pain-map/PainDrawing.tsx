import { useState } from 'react';
import { Box, Grid, Paper, ToggleButton, ToggleButtonGroup, Typography, Stack } from '@mui/material';
import PainDrawingCanvas from './PainDrawingCanvas';
import PainQualitySelector from './PainQualitySelector';
import {
  PAIN_QUALITIES,
  type AvatarType,
  type ViewOrientation,
  type DepthIndicator,
  type DrawingPath,
  type PainMapData,
} from '../../types/pain-drawing';

interface PainDrawingProps {
  value?: PainMapData;
  onChange: (data: PainMapData) => void;
}

export default function PainDrawing({ value, onChange }: PainDrawingProps) {
  const [avatarType, setAvatarType] = useState<AvatarType>(value?.avatarType || 'male');
  const [viewOrientation, setViewOrientation] = useState<ViewOrientation>(
    (value?.viewOrientation as ViewOrientation) || 'front'
  );
  const [selectedQuality, setSelectedQuality] = useState(PAIN_QUALITIES[0]);
  const [intensity, setIntensity] = useState(value?.painIntensity || 5);
  const [depthIndicator, setDepthIndicator] = useState<DepthIndicator>(
    (value?.depthIndicator as DepthIndicator) || 'superficial'
  );
  const [brushSize, setBrushSize] = useState(15);
  const [opacity, setOpacity] = useState(0.7);
  const [drawingMode, setDrawingMode] = useState<'draw' | 'erase'>('draw');
  const [paths, setPaths] = useState<DrawingPath[]>(value?.drawingData?.paths || []);

  const handlePathsChange = (newPaths: DrawingPath[]) => {
    setPaths(newPaths);
    
    // Update parent with new data
    onChange({
      ...value,
      bodyRegion: 'Multiple regions', // Will be computed from paths
      painIntensity: intensity,
      painQuality: [selectedQuality.quality],
      avatarType,
      viewOrientation,
      depthIndicator,
      submissionSource: 'portal',
      drawingData: {
        paths: newPaths,
        annotations: [],
      },
    });
  };

  const getBackgroundImage = () => {
    // Placeholder - will be replaced with actual body diagram SVGs
    return `/body-${avatarType}-${viewOrientation}.png`;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <ToggleButtonGroup
                  value={avatarType}
                  exclusive
                  onChange={(_, val) => val && setAvatarType(val)}
                  size="small"
                >
                  <ToggleButton value="male">Male</ToggleButton>
                  <ToggleButton value="female">Female</ToggleButton>
                  <ToggleButton value="child">Child</ToggleButton>
                </ToggleButtonGroup>

                <ToggleButtonGroup
                  value={viewOrientation}
                  exclusive
                  onChange={(_, val) => val && setViewOrientation(val)}
                  size="small"
                >
                  <ToggleButton value="front">Front</ToggleButton>
                  <ToggleButton value="back">Back</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Typography variant="caption" color="text.secondary">
                Draw on the body diagram to mark pain locations. Use different colors for different pain qualities.
              </Typography>

              <PainDrawingCanvas
                width={600}
                height={800}
                backgroundImage={getBackgroundImage()}
                selectedQuality={selectedQuality}
                brushSize={brushSize}
                opacity={opacity}
                onBrushSizeChange={setBrushSize}
                onOpacityChange={setOpacity}
                paths={paths}
                onPathsChange={handlePathsChange}
                drawingMode={drawingMode}
                onDrawingModeChange={setDrawingMode}
              />
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <PainQualitySelector
              selectedQuality={selectedQuality}
              onQualityChange={setSelectedQuality}
              intensity={intensity}
              onIntensityChange={setIntensity}
              depthIndicator={depthIndicator}
              onDepthChange={setDepthIndicator}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
