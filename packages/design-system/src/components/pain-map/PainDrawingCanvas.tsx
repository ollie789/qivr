import { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Slider, Typography, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Undo, Redo, Delete, Brush, Clear } from '@mui/icons-material';
import type { DrawingPath, PainQuality } from '../../types/pain-drawing';

interface PainDrawingCanvasProps {
  width: number;
  height: number;
  backgroundImage?: string;
  selectedQuality: PainQuality;
  brushSize: number;
  opacity: number;
  onBrushSizeChange: (size: number) => void;
  onOpacityChange: (opacity: number) => void;
  paths: DrawingPath[];
  onPathsChange: (paths: DrawingPath[]) => void;
  drawingMode: 'draw' | 'erase';
  onDrawingModeChange: (mode: 'draw' | 'erase') => void;
}

export function PainDrawingCanvas({
  width,
  height,
  backgroundImage,
  selectedQuality,
  brushSize,
  opacity,
  onBrushSizeChange,
  onOpacityChange,
  paths,
  onPathsChange,
  drawingMode,
  onDrawingModeChange,
}: PainDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [history, setHistory] = useState<DrawingPath[][]>([paths]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    redrawCanvas();
  }, [paths, backgroundImage]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw all paths
    paths.forEach((path) => {
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

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    setIsDrawing(true);
    setCurrentPath(`M ${x} ${y}`);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    setCurrentPath((prev) => `${prev} L ${x} ${y}`);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const path = new Path2D(currentPath + ` L ${x} ${y}`);
    ctx.strokeStyle = drawingMode === 'erase' ? '#ffffff' : selectedQuality.color;
    ctx.globalAlpha = drawingMode === 'erase' ? 1 : opacity;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = drawingMode === 'erase' ? 'destination-out' : 'source-over';
    ctx.stroke(path);
  };

  const stopDrawing = () => {
    if (!isDrawing || !currentPath) return;

    const newPath: DrawingPath = {
      pathData: currentPath,
      color: drawingMode === 'erase' ? '#ffffff' : selectedQuality.color,
      opacity: drawingMode === 'erase' ? 1 : opacity,
      brushSize,
    };

    const newPaths = [...paths, newPath];
    onPathsChange(newPaths);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPaths);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setIsDrawing(false);
    setCurrentPath('');
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onPathsChange(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onPathsChange(history[newIndex]);
    }
  };

  const clearAll = () => {
    onPathsChange([]);
    setHistory([[]]); 
    setHistoryIndex(0);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <ToggleButtonGroup
          value={drawingMode}
          exclusive
          onChange={(_, mode) => mode && onDrawingModeChange(mode)}
          size="small"
        >
          <ToggleButton value="draw">
            <Brush fontSize="small" />
          </ToggleButton>
          <ToggleButton value="erase">
            <Clear fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        <IconButton onClick={undo} disabled={historyIndex === 0} size="small">
          <Undo fontSize="small" />
        </IconButton>
        <IconButton onClick={redo} disabled={historyIndex === history.length - 1} size="small">
          <Redo fontSize="small" />
        </IconButton>
        <IconButton onClick={clearAll} size="small" color="error">
          <Delete fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1 }}>
          <Typography variant="caption">Brush Size</Typography>
          <Slider
            value={brushSize}
            onChange={(_, val) => onBrushSizeChange(val as number)}
            min={5}
            max={50}
            size="small"
          />
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="caption">Opacity</Typography>
          <Slider
            value={opacity}
            onChange={(_, val) => onOpacityChange(val as number)}
            min={0.1}
            max={1}
            step={0.1}
            size="small"
          />
        </Box>
      </Stack>

      <Box
        sx={{
          position: 'relative',
          width,
          height,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          cursor: drawingMode === 'draw' ? 'crosshair' : 'pointer',
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
            }}
          />
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </Box>
    </Box>
  );
}
