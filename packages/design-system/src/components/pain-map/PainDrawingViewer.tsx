import { Box, Paper, Typography, Chip, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import type { PainMapData } from '../../types/pain-drawing';

// Import SVG diagrams
import maleFront from '../../assets/body-diagrams/male-front.svg';
import maleBack from '../../assets/body-diagrams/male-back.svg';
import femaleFront from '../../assets/body-diagrams/female-front.svg';
import femaleBack from '../../assets/body-diagrams/female-back.svg';
import childFront from '../../assets/body-diagrams/child-front.svg';
import childBack from '../../assets/body-diagrams/child-back.svg';

interface PainDrawingViewerProps {
  painMapData: PainMapData;
  width?: number;
  height?: number;
}

export function PainDrawingViewer({ painMapData, width = 400, height = 600 }: PainDrawingViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewOrientation, setViewOrientation] = useState(painMapData.viewOrientation || 'front');

  useEffect(() => {
    redrawCanvas();
  }, [painMapData, viewOrientation]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !painMapData.drawingData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw all paths
    painMapData.drawingData.paths.forEach((path) => {
      const p = new Path2D(path.pathData);
      ctx.strokeStyle = path.color;
      ctx.globalAlpha = path.opacity;
      ctx.lineWidth = path.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(p);
    });

    ctx.globalAlpha = 1;
  };

  const getBackgroundImage = () => {
    const avatarType = painMapData.avatarType || 'male';
    const diagrams = {
      male: { front: maleFront, back: maleBack },
      female: { front: femaleFront, back: femaleBack },
      child: { front: childFront, back: childBack },
    };
    return diagrams[avatarType][viewOrientation];
  };

  if (!painMapData.drawingData || painMapData.drawingData.paths.length === 0) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No pain drawing available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2">
            Pain Drawing ({painMapData.avatarType || 'male'})
          </Typography>
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
          <img
            src={getBackgroundImage()}
            alt="Body diagram"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
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

        <Stack spacing={1}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Pain Qualities:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {painMapData.painQuality.map((quality, idx) => (
                <Chip key={idx} label={quality} size="small" />
              ))}
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="caption">
              <strong>Intensity:</strong> {painMapData.painIntensity}/10
            </Typography>
            {painMapData.depthIndicator && (
              <Typography variant="caption">
                <strong>Depth:</strong> {painMapData.depthIndicator}
              </Typography>
            )}
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
