import { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Slider, Typography, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { Undo, Redo, Delete, ZoomIn, ZoomOut } from '@mui/icons-material';
import { AnnotationTools } from './AnnotationTools';
import type { DrawingPath, PainQuality, Annotation, DrawingTool, SymbolType } from '../../types/pain-drawing';

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
  annotations: Annotation[];
  onAnnotationsChange: (annotations: Annotation[]) => void;
  drawingTool: DrawingTool;
  onDrawingToolChange: (tool: DrawingTool) => void;
  selectedSymbol: SymbolType;
  onSymbolChange: (symbol: SymbolType) => void;
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
  annotations,
  onAnnotationsChange,
  drawingTool,
  onDrawingToolChange,
  selectedSymbol,
  onSymbolChange,
}: PainDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [textContent, setTextContent] = useState('');
  const [history, setHistory] = useState<{ paths: DrawingPath[]; annotations: Annotation[] }[]>([{ paths, annotations }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    redrawCanvas();
  }, [paths, annotations, zoom, pan]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw paths
    paths.forEach((path) => {
      const p = new Path2D(path.pathData);
      ctx.strokeStyle = path.color;
      ctx.globalAlpha = path.opacity;
      ctx.lineWidth = path.brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(p);
    });

    // Draw annotations
    annotations.forEach((annotation) => {
      ctx.globalAlpha = 1;
      if (annotation.type === 'arrow' && annotation.endX !== undefined && annotation.endY !== undefined) {
        drawArrow(ctx, annotation.x, annotation.y, annotation.endX, annotation.endY, annotation.color || selectedQuality.color);
      } else if (annotation.type === 'symbol') {
        drawSymbol(ctx, annotation.x, annotation.y, annotation.symbolType || 'pin', annotation.color || selectedQuality.color);
      } else if (annotation.type === 'text' && annotation.content) {
        drawText(ctx, annotation.x, annotation.y, annotation.content);
      }
    });

    ctx.restore();
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

  const drawSymbol = (ctx: CanvasRenderingContext2D, x: number, y: number, symbol: SymbolType, color: string) => {
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

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x, y } = getCoordinates(e);

    if (drawingTool === 'draw' || drawingTool === 'erase') {
      setIsDrawing(true);
      setCurrentPath(`M ${x} ${y}`);
    } else if (drawingTool === 'arrow') {
      setArrowStart({ x, y });
    } else if (drawingTool === 'text') {
      setTextPosition({ x, y });
      setTextDialogOpen(true);
    } else if (drawingTool === 'symbol') {
      const newAnnotation: Annotation = {
        type: 'symbol',
        x,
        y,
        symbolType: selectedSymbol,
        color: selectedQuality.color,
      };
      addToHistory(paths, [...annotations, newAnnotation]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!isDrawing && !arrowStart) return;

    const { x, y } = getCoordinates(e);

    if (isDrawing) {
      setCurrentPath((prev) => `${prev} L ${x} ${y}`);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const path = new Path2D(currentPath + ` L ${x} ${y}`);
      ctx.strokeStyle = drawingTool === 'erase' ? '#ffffff' : selectedQuality.color;
      ctx.globalAlpha = drawingTool === 'erase' ? 1 : opacity;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = drawingTool === 'erase' ? 'destination-out' : 'source-over';
      ctx.stroke(path);

      ctx.restore();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (arrowStart) {
      const { x, y } = getCoordinates(e);
      const newAnnotation: Annotation = {
        type: 'arrow',
        x: arrowStart.x,
        y: arrowStart.y,
        endX: x,
        endY: y,
        color: selectedQuality.color,
      };
      addToHistory(paths, [...annotations, newAnnotation]);
      setArrowStart(null);
      return;
    }

    if (!isDrawing || !currentPath) return;

    const newPath: DrawingPath = {
      pathData: currentPath,
      color: drawingTool === 'erase' ? '#ffffff' : selectedQuality.color,
      opacity: drawingTool === 'erase' ? 1 : opacity,
      brushSize,
    };

    addToHistory([...paths, newPath], annotations);
    setIsDrawing(false);
    setCurrentPath('');
  };

  const addToHistory = (newPaths: DrawingPath[], newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      paths: newPaths,
      annotations: newAnnotations,
    });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onPathsChange(newPaths);
    onAnnotationsChange(newAnnotations);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onPathsChange(history[newIndex].paths);
      onAnnotationsChange(history[newIndex].annotations);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onPathsChange(history[newIndex].paths);
      onAnnotationsChange(history[newIndex].annotations);
    }
  };

  const clearAll = () => {
    addToHistory([], []);
  };

  const handleTextSubmit = () => {
    if (textPosition && textContent.trim()) {
      const newAnnotation: Annotation = {
        type: 'text',
        x: textPosition.x,
        y: textPosition.y,
        content: textContent.trim(),
      };
      addToHistory(paths, [...annotations, newAnnotation]);
    }
    setTextDialogOpen(false);
    setTextContent('');
    setTextPosition(null);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <AnnotationTools
          selectedTool={drawingTool}
          onToolChange={onDrawingToolChange}
          selectedSymbol={selectedSymbol}
          onSymbolChange={onSymbolChange}
        />

        <IconButton onClick={undo} disabled={historyIndex === 0} size="small">
          <Undo fontSize="small" />
        </IconButton>
        <IconButton onClick={redo} disabled={historyIndex === history.length - 1} size="small">
          <Redo fontSize="small" />
        </IconButton>
        <IconButton onClick={clearAll} size="small" color="error">
          <Delete fontSize="small" />
        </IconButton>

        <IconButton onClick={() => handleZoom(0.1)} size="small">
          <ZoomIn fontSize="small" />
        </IconButton>
        <Typography variant="caption">{Math.round(zoom * 100)}%</Typography>
        <IconButton onClick={() => handleZoom(-0.1)} size="small">
          <ZoomOut fontSize="small" />
        </IconButton>

        {(drawingTool === 'draw' || drawingTool === 'erase') && (
          <>
            <Box sx={{ flex: 1, minWidth: 120 }}>
              <Typography variant="caption">Brush Size</Typography>
              <Slider
                value={brushSize}
                onChange={(_, val) => onBrushSizeChange(val as number)}
                min={5}
                max={50}
                size="small"
              />
            </Box>

            {drawingTool === 'draw' && (
              <Box sx={{ flex: 1, minWidth: 120 }}>
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
            )}
          </>
        )}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Hold Shift + drag to pan
      </Typography>

      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width,
          height,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : drawingTool === 'draw' ? 'crosshair' : 'pointer',
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
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          />
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </Box>

      <Dialog open={textDialogOpen} onClose={() => setTextDialogOpen(false)}>
        <DialogTitle>Add Text Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Enter note..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTextSubmit} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
