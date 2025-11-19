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

    // Draw annotations
    if (painMapData.drawingData.annotations) {
      painMapData.drawingData.annotations.forEach((annotation) => {
        ctx.globalAlpha = 1;
        if (annotation.type === 'arrow' && annotation.endX !== undefined && annotation.endY !== undefined) {
          drawArrow(ctx, annotation.x, annotation.y, annotation.endX, annotation.endY, annotation.color || '#ef4444');
        } else if (annotation.type === 'symbol' && annotation.symbolType) {
          drawSymbol(ctx, annotation.x, annotation.y, annotation.symbolType, annotation.color || '#ef4444');
        } else if (annotation.type === 'text' && annotation.content) {
          drawText(ctx, annotation.x, annotation.y, annotation.content);
        }
      });
    }

    ctx.globalAlpha = 1;
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
    const headLength = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const drawSymbol = (ctx: CanvasRenderingContext2D, x: number, y: number, symbol: string, color: string) => {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    switch (symbol) {
      case 'pin':
        ctx.beginPath();
        ctx.arc(x, y - 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x, y - 2);
        ctx.lineTo(x, y + 10);
        ctx.stroke();
        break;
      case 'lightning':
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x - 5, y);
        ctx.lineTo(x + 2, y);
        ctx.lineTo(x - 3, y + 15);
        ctx.lineTo(x + 8, y - 5);
        ctx.lineTo(x + 3, y - 5);
        ctx.closePath();
        ctx.fill();
        break;
      case 'star':
        const spikes = 5;
        const outerRadius = 12;
        const innerRadius = 6;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes - Math.PI / 2;
          const px = x + Math.cos(angle) * radius;
          const py = y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
      case 'cross':
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 8);
        ctx.lineTo(x + 8, y + 8);
        ctx.moveTo(x + 8, y - 8);
        ctx.lineTo(x - 8, y + 8);
        ctx.stroke();
        break;
    }
  };

  const drawText = (ctx: CanvasRenderingContext2D, x: number, y: number, text: string) => {
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
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
