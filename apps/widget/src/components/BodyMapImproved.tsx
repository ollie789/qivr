import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Slider, 
  Button,
  Paper,
  Stack,
  IconButton,
  Fade
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

interface PainPoint {
  id: string;
  bodyPart: string;
  intensity: number;
  side: 'front' | 'back';
  type?: 'aching' | 'burning' | 'sharp' | 'throbbing' | 'stabbing' | 'tingling' | 'shooting';
}

const painTypes = [
  { value: 'sharp', label: 'Sharp', color: '#ef5350' },
  { value: 'dull', label: 'Dull', color: '#5c6bc0' },
  { value: 'aching', label: 'Aching', color: '#42a5f5' },
  { value: 'burning', label: 'Burning', color: '#ff7043' },
  { value: 'stabbing', label: 'Stabbing', color: '#f44336' },
  { value: 'shooting', label: 'Shooting', color: '#ab47bc' },
  { value: 'throbbing', label: 'Throbbing', color: '#ec407a' },
  { value: 'tingling', label: 'Tingling', color: '#ffb74d' },
];

interface BodyMapImprovedProps {
  onPainPointsChange?: (painPoints: PainPoint[]) => void;
  initialPainPoints?: PainPoint[];
}

export const BodyMapImproved: React.FC<BodyMapImprovedProps> = ({ 
  onPainPointsChange, 
  initialPainPoints = [] 
}) => {
  const [painPoints, setPainPoints] = useState<PainPoint[]>(initialPainPoints);
  const [currentIntensity, setCurrentIntensity] = useState<number>(5);
  const [currentPainType, setCurrentPainType] = useState<string>('aching');
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<PainPoint | null>(null);

  const handleAreaClick = (bodyPart: string, side: 'front' | 'back', x: number, y: number) => {
    const existingPoint = painPoints.find(p => p.bodyPart === bodyPart && p.side === side);
    
    if (existingPoint) {
      // Update existing point
      const updatedPoints = painPoints.map(p => 
        p.id === existingPoint.id 
          ? { ...p, intensity: currentIntensity, type: currentPainType as any }
          : p
      );
      setPainPoints(updatedPoints);
      onPainPointsChange?.(updatedPoints);
      setSelectedPoint({ ...existingPoint, intensity: currentIntensity, type: currentPainType as any });
    } else {
      // Add new pain point
      const newPoint: PainPoint = {
        id: `pain-${Date.now()}-${Math.random()}`,
        bodyPart,
        intensity: currentIntensity,
        side,
        type: currentPainType as any,
      };
      const updatedPoints = [...painPoints, newPoint];
      setPainPoints(updatedPoints);
      onPainPointsChange?.(updatedPoints);
      setSelectedPoint(newPoint);
    }
  };

  const removePainPoint = (id: string) => {
    const updatedPoints = painPoints.filter(p => p.id !== id);
    setPainPoints(updatedPoints);
    onPainPointsChange?.(updatedPoints);
    if (selectedPoint?.id === id) {
      setSelectedPoint(null);
    }
  };

  const clearAll = () => {
    setPainPoints([]);
    onPainPointsChange?.([]);
    setSelectedPoint(null);
  };

  const getAreaColor = (bodyPart: string, side: 'front' | 'back') => {
    const painPoint = painPoints.find(p => p.bodyPart === bodyPart && p.side === side);
    if (painPoint) {
      const type = painTypes.find(t => t.value === painPoint.type);
      return type?.color || '#ef5350';
    }
    return 'none';
  };

  const getAreaOpacity = (bodyPart: string, side: 'front' | 'back') => {
    const painPoint = painPoints.find(p => p.bodyPart === bodyPart && p.side === side);
    if (painPoint) {
      return 0.2 + (painPoint.intensity / 10) * 0.6;
    }
    return hoveredArea === `${bodyPart}-${side}` ? 0.1 : 0;
  };

  // SVG Component for body outline
  const BodySVG = ({ side }: { side: 'front' | 'back' }) => (
    <svg 
      width="280" 
      height="500" 
      viewBox="0 0 280 500" 
      style={{ 
        width: '100%',
        height: 'auto',
        maxHeight: '500px',
      }}
    >
      <defs>
        <linearGradient id={`bodyGradient-${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#f5f5f5', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#eeeeee', stopOpacity: 1 }} />
        </linearGradient>
        
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
        </filter>
      </defs>

      {/* Background */}
      <rect width="280" height="500" fill="#fafafa" />
      
      <g transform="translate(140, 250)">
        {/* Head */}
        <ellipse
          cx="0" cy="-200" rx="35" ry="42"
          fill={getAreaColor('Head', side)}
          fillOpacity={getAreaOpacity('Head', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Head', side, 0, -200)}
          onMouseEnter={() => setHoveredArea(`Head-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        
        {/* Neck */}
        <rect
          x="-15" y="-158" width="30" height="28"
          rx="5"
          fill={getAreaColor('Neck', side)}
          fillOpacity={getAreaOpacity('Neck', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Neck', side, 0, -144)}
          onMouseEnter={() => setHoveredArea(`Neck-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Shoulders */}
        <ellipse
          cx="-55" cy="-125" rx="28" ry="20"
          fill={getAreaColor('Left Shoulder', side)}
          fillOpacity={getAreaOpacity('Left Shoulder', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Shoulder', side, -55, -125)}
          onMouseEnter={() => setHoveredArea(`Left Shoulder-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <ellipse
          cx="55" cy="-125" rx="28" ry="20"
          fill={getAreaColor('Right Shoulder', side)}
          fillOpacity={getAreaOpacity('Right Shoulder', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Shoulder', side, 55, -125)}
          onMouseEnter={() => setHoveredArea(`Right Shoulder-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Chest/Upper Back */}
        <path
          d="M -50 -130 L 50 -130 L 45 -60 L -45 -60 Z"
          fill={getAreaColor(side === 'front' ? 'Chest' : 'Upper Back', side)}
          fillOpacity={getAreaOpacity(side === 'front' ? 'Chest' : 'Upper Back', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick(side === 'front' ? 'Chest' : 'Upper Back', side, 0, -95)}
          onMouseEnter={() => setHoveredArea(`${side === 'front' ? 'Chest' : 'Upper Back'}-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Upper Arms */}
        <rect
          x="-80" y="-120" width="22" height="65"
          rx="11"
          fill={getAreaColor('Left Upper Arm', side)}
          fillOpacity={getAreaOpacity('Left Upper Arm', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Upper Arm', side, -70, -87)}
          onMouseEnter={() => setHoveredArea(`Left Upper Arm-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <rect
          x="58" y="-120" width="22" height="65"
          rx="11"
          fill={getAreaColor('Right Upper Arm', side)}
          fillOpacity={getAreaOpacity('Right Upper Arm', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Upper Arm', side, 70, -87)}
          onMouseEnter={() => setHoveredArea(`Right Upper Arm-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Elbows */}
        <circle
          cx="-69" cy="-50" r="10"
          fill={getAreaColor('Left Elbow', side)}
          fillOpacity={getAreaOpacity('Left Elbow', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Elbow', side, -69, -50)}
          onMouseEnter={() => setHoveredArea(`Left Elbow-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <circle
          cx="69" cy="-50" r="10"
          fill={getAreaColor('Right Elbow', side)}
          fillOpacity={getAreaOpacity('Right Elbow', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Elbow', side, 69, -50)}
          onMouseEnter={() => setHoveredArea(`Right Elbow-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Forearms */}
        <rect
          x="-78" y="-45" width="18" height="55"
          rx="9"
          fill={getAreaColor('Left Forearm', side)}
          fillOpacity={getAreaOpacity('Left Forearm', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Forearm', side, -69, -17)}
          onMouseEnter={() => setHoveredArea(`Left Forearm-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <rect
          x="60" y="-45" width="18" height="55"
          rx="9"
          fill={getAreaColor('Right Forearm', side)}
          fillOpacity={getAreaOpacity('Right Forearm', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Forearm', side, 69, -17)}
          onMouseEnter={() => setHoveredArea(`Right Forearm-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Hands */}
        <ellipse
          cx="-69" cy="20" rx="12" ry="18"
          fill={getAreaColor('Left Hand', side)}
          fillOpacity={getAreaOpacity('Left Hand', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Hand', side, -69, 20)}
          onMouseEnter={() => setHoveredArea(`Left Hand-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <ellipse
          cx="69" cy="20" rx="12" ry="18"
          fill={getAreaColor('Right Hand', side)}
          fillOpacity={getAreaOpacity('Right Hand', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Hand', side, 69, 20)}
          onMouseEnter={() => setHoveredArea(`Right Hand-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Abdomen/Lower Back */}
        <path
          d="M -45 -60 L 45 -60 L 40 -10 L -40 -10 Z"
          fill={getAreaColor(side === 'front' ? 'Abdomen' : 'Lower Back', side)}
          fillOpacity={getAreaOpacity(side === 'front' ? 'Abdomen' : 'Lower Back', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick(side === 'front' ? 'Abdomen' : 'Lower Back', side, 0, -35)}
          onMouseEnter={() => setHoveredArea(`${side === 'front' ? 'Abdomen' : 'Lower Back'}-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Hips/Pelvis */}
        <ellipse
          cx="0" cy="5" rx="45" ry="20"
          fill={getAreaColor('Hips', side)}
          fillOpacity={getAreaOpacity('Hips', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Hips', side, 0, 5)}
          onMouseEnter={() => setHoveredArea(`Hips-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Thighs */}
        <rect
          x="-35" y="20" width="25" height="75"
          rx="12"
          fill={getAreaColor('Left Thigh', side)}
          fillOpacity={getAreaOpacity('Left Thigh', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Thigh', side, -22, 57)}
          onMouseEnter={() => setHoveredArea(`Left Thigh-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <rect
          x="10" y="20" width="25" height="75"
          rx="12"
          fill={getAreaColor('Right Thigh', side)}
          fillOpacity={getAreaOpacity('Right Thigh', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Thigh', side, 22, 57)}
          onMouseEnter={() => setHoveredArea(`Right Thigh-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Knees */}
        <circle
          cx="-22" cy="100" r="14"
          fill={getAreaColor('Left Knee', side)}
          fillOpacity={getAreaOpacity('Left Knee', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Knee', side, -22, 100)}
          onMouseEnter={() => setHoveredArea(`Left Knee-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <circle
          cx="22" cy="100" r="14"
          fill={getAreaColor('Right Knee', side)}
          fillOpacity={getAreaOpacity('Right Knee', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Knee', side, 22, 100)}
          onMouseEnter={() => setHoveredArea(`Right Knee-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Lower Legs */}
        <rect
          x="-30" y="110" width="20" height="70"
          rx="10"
          fill={getAreaColor('Left Lower Leg', side)}
          fillOpacity={getAreaOpacity('Left Lower Leg', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Lower Leg', side, -20, 145)}
          onMouseEnter={() => setHoveredArea(`Left Lower Leg-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <rect
          x="10" y="110" width="20" height="70"
          rx="10"
          fill={getAreaColor('Right Lower Leg', side)}
          fillOpacity={getAreaOpacity('Right Lower Leg', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Lower Leg', side, 20, 145)}
          onMouseEnter={() => setHoveredArea(`Right Lower Leg-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Ankles */}
        <circle
          cx="-20" cy="185" r="9"
          fill={getAreaColor('Left Ankle', side)}
          fillOpacity={getAreaOpacity('Left Ankle', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Ankle', side, -20, 185)}
          onMouseEnter={() => setHoveredArea(`Left Ankle-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <circle
          cx="20" cy="185" r="9"
          fill={getAreaColor('Right Ankle', side)}
          fillOpacity={getAreaOpacity('Right Ankle', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Ankle', side, 20, 185)}
          onMouseEnter={() => setHoveredArea(`Right Ankle-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />

        {/* Feet */}
        <ellipse
          cx="-20" cy="205" rx="14" ry="22"
          fill={getAreaColor('Left Foot', side)}
          fillOpacity={getAreaOpacity('Left Foot', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Left Foot', side, -20, 205)}
          onMouseEnter={() => setHoveredArea(`Left Foot-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
        <ellipse
          cx="20" cy="205" rx="14" ry="22"
          fill={getAreaColor('Right Foot', side)}
          fillOpacity={getAreaOpacity('Right Foot', side)}
          stroke="#9e9e9e"
          strokeWidth="2"
          filter="url(#shadow)"
          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => handleAreaClick('Right Foot', side, 20, 205)}
          onMouseEnter={() => setHoveredArea(`Right Foot-${side}`)}
          onMouseLeave={() => setHoveredArea(null)}
        />
      </g>

      {/* Labels */}
      <text x="140" y="490" textAnchor="middle" fontSize="14" fill="#666" fontWeight="500">
        {side === 'front' ? 'FRONT VIEW' : 'BACK VIEW'}
      </text>
    </svg>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ color: '#333', fontWeight: 600, mb: 3 }}>
        Show us where it hurts
      </Typography>
      <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
        Click on the body diagram to mark your pain areas (optional)
      </Typography>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
        {/* Body Diagrams */}
        <Box sx={{ flex: 1.5 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
            }}
          >
            <Stack direction="row" spacing={2} justifyContent="center">
              <Box sx={{ flex: 1 }}>
                <BodySVG side="front" />
              </Box>
              <Box sx={{ flex: 1 }}>
                <BodySVG side="back" />
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Controls Panel */}
        <Box sx={{ flex: 1, minWidth: 320 }}>
          <Stack spacing={3}>
            {/* Selected Area Info */}
            {selectedPoint && (
              <Fade in={true}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Edit: {selectedPoint.bodyPart}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedPoint.side === 'front' ? 'Front' : 'Back'} • Intensity: {selectedPoint.intensity}/10
                  </Typography>
                </Paper>
              </Fade>
            )}

            {/* Pain Type Selection */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1.5 }}>
                Pain Type:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {painTypes.map((type) => (
                  <Chip
                    key={type.value}
                    label={type.label}
                    onClick={() => setCurrentPainType(type.value)}
                    variant={currentPainType === type.value ? 'filled' : 'outlined'}
                    size="medium"
                    sx={{ 
                      borderColor: type.color,
                      backgroundColor: currentPainType === type.value ? type.color : 'transparent',
                      color: currentPainType === type.value ? 'white' : type.color,
                      fontWeight: currentPainType === type.value ? 600 : 400,
                      '&:hover': {
                        backgroundColor: type.color,
                        color: 'white',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Pain Intensity */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Pain Intensity: {currentIntensity}/10
              </Typography>
              <Slider
                value={currentIntensity}
                onChange={(_, value) => setCurrentIntensity(value as number)}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-track': {
                    background: `linear-gradient(90deg, #66bb6a 0%, #ffa726 50%, #ef5350 100%)`,
                  },
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#fff',
                    border: '2px solid currentColor',
                  },
                }}
              />
            </Box>

            {/* Marked Areas */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Marked Areas ({painPoints.length})
                </Typography>
                {painPoints.length > 0 && (
                  <IconButton size="small" onClick={clearAll} sx={{ color: '#ef5350' }}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
              
              <Paper 
                elevation={0}
                sx={{ 
                  p: 2,
                  backgroundColor: '#fafafa',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {painPoints.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No areas marked yet
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {painPoints.map((point) => {
                      const type = painTypes.find(t => t.value === point.type);
                      return (
                        <Chip
                          key={point.id}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                {point.bodyPart}
                              </Typography>
                              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                • {point.side} • {point.intensity}/10
                              </Typography>
                            </Box>
                          }
                          onDelete={() => removePainPoint(point.id)}
                          sx={{
                            backgroundColor: type?.color || '#666',
                            color: 'white',
                            height: 32,
                            '& .MuiChip-deleteIcon': {
                              color: 'rgba(255,255,255,0.7)',
                              '&:hover': {
                                color: 'white',
                              },
                            },
                          }}
                        />
                      );
                    })}
                  </Stack>
                )}
              </Paper>
            </Box>

            {painPoints.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={clearAll}
                startIcon={<DeleteIcon />}
                fullWidth
                sx={{ mt: 1 }}
              >
                Remove All Areas
              </Button>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};
