import { useState } from 'react';
import { Box, Grid, Paper, ToggleButton, ToggleButtonGroup, Typography, Stack, FormControlLabel, Checkbox } from '@mui/material';
import { PainDrawingCanvas } from './PainDrawingCanvas';
import { PainQualitySelector } from './PainQualitySelector';
import {
  PAIN_QUALITIES,
  type AvatarType,
  type ViewOrientation,
  type DepthIndicator,
  type DrawingPath,
  type Annotation,
  type DrawingTool,
  type SymbolType,
  type PainMapData,
} from '../../types/pain-drawing';

// Import SVG diagrams
import maleFront from '../../assets/body-diagrams/male-front.svg';
import maleBack from '../../assets/body-diagrams/male-back.svg';
import femaleFront from '../../assets/body-diagrams/female-front.svg';
import femaleBack from '../../assets/body-diagrams/female-back.svg';
import childFront from '../../assets/body-diagrams/child-front.svg';
import childBack from '../../assets/body-diagrams/child-back.svg';
import dermatomeFront from '../../assets/overlays/dermatome-front.svg';
import dermatomeBack from '../../assets/overlays/dermatome-back.svg';

interface PainDrawingProps {
  value?: PainMapData;
  onChange: (data: PainMapData) => void;
}

export function PainDrawing({ value, onChange }: PainDrawingProps) {
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
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('draw');
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType>('pin');
  const [paths, setPaths] = useState<DrawingPath[]>(value?.drawingData?.paths || []);
  const [annotations, setAnnotations] = useState<Annotation[]>(value?.drawingData?.annotations || []);
  const [showDermatome, setShowDermatome] = useState(false);

  const handleUpdate = (newPaths?: DrawingPath[], newAnnotations?: Annotation[]) => {
    const updatedPaths = newPaths !== undefined ? newPaths : paths;
    const updatedAnnotations = newAnnotations !== undefined ? newAnnotations : annotations;

    if (newPaths !== undefined) setPaths(newPaths);
    if (newAnnotations !== undefined) setAnnotations(newAnnotations);
    
    onChange({
      ...value,
      bodyRegion: 'Multiple regions',
      painIntensity: intensity,
      painQuality: [selectedQuality.quality],
      avatarType,
      viewOrientation,
      depthIndicator,
      submissionSource: 'portal',
      drawingData: {
        paths: updatedPaths,
        annotations: updatedAnnotations,
      },
    });
  };

  const getBackgroundImage = () => {
    const diagrams = {
      male: { front: maleFront, back: maleBack },
      female: { front: femaleFront, back: femaleBack },
      child: { front: childFront, back: childBack },
    };
    return diagrams[avatarType][viewOrientation];
  };

  const getOverlayImage = () => {
    if (!showDermatome) return undefined;
    return viewOrientation === 'front' ? dermatomeFront : dermatomeBack;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
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

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Draw pain areas, add arrows for radiating pain, or place symbols/notes
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={showDermatome}
                      onChange={(e) => setShowDermatome(e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">Show Dermatomes</Typography>}
                />
              </Box>

              <PainDrawingCanvas
                width={600}
                height={800}
                backgroundImage={getBackgroundImage()}
                overlayImage={getOverlayImage()}
                selectedQuality={selectedQuality}
                brushSize={brushSize}
                opacity={opacity}
                onBrushSizeChange={setBrushSize}
                onOpacityChange={setOpacity}
                paths={paths}
                onPathsChange={(newPaths) => handleUpdate(newPaths, undefined)}
                annotations={annotations}
                onAnnotationsChange={(newAnnotations) => handleUpdate(undefined, newAnnotations)}
                drawingTool={drawingTool}
                onDrawingToolChange={setDrawingTool}
                selectedSymbol={selectedSymbol}
                onSymbolChange={setSelectedSymbol}
              />
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
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
