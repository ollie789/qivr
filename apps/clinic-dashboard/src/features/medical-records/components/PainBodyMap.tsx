import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Slider,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { auraColors } from '@qivr/design-system';

export interface PainPoint {
  bodyPart: string;
  side?: 'left' | 'right' | 'bilateral' | null;
  intensity: number;
  quality?: string | null;
}

interface PainBodyMapProps {
  value: PainPoint[];
  onChange: (points: PainPoint[]) => void;
  disabled?: boolean;
}

const BODY_REGIONS = [
  { id: 'head', label: 'Head', x: 50, y: 5 },
  { id: 'neck', label: 'Neck', x: 50, y: 12 },
  { id: 'shoulder', label: 'Shoulder', x: 30, y: 18, hasSide: true },
  { id: 'upper-back', label: 'Upper Back', x: 50, y: 22 },
  { id: 'chest', label: 'Chest', x: 50, y: 28 },
  { id: 'upper-arm', label: 'Upper Arm', x: 20, y: 30, hasSide: true },
  { id: 'elbow', label: 'Elbow', x: 15, y: 38, hasSide: true },
  { id: 'lower-back', label: 'Lower Back', x: 50, y: 40 },
  { id: 'forearm', label: 'Forearm', x: 12, y: 45, hasSide: true },
  { id: 'abdomen', label: 'Abdomen', x: 50, y: 45 },
  { id: 'wrist', label: 'Wrist', x: 10, y: 52, hasSide: true },
  { id: 'hand', label: 'Hand', x: 8, y: 58, hasSide: true },
  { id: 'hip', label: 'Hip', x: 35, y: 52, hasSide: true },
  { id: 'groin', label: 'Groin', x: 50, y: 55 },
  { id: 'thigh', label: 'Thigh', x: 38, y: 62, hasSide: true },
  { id: 'knee', label: 'Knee', x: 40, y: 72, hasSide: true },
  { id: 'calf', label: 'Calf', x: 42, y: 80, hasSide: true },
  { id: 'ankle', label: 'Ankle', x: 40, y: 88, hasSide: true },
  { id: 'foot', label: 'Foot', x: 38, y: 95, hasSide: true },
];

const PAIN_QUALITIES = [
  'Sharp',
  'Dull',
  'Aching',
  'Burning',
  'Throbbing',
  'Stabbing',
  'Tingling',
  'Numbness',
];

const getIntensityColor = (intensity: number) => {
  if (intensity >= 8) return auraColors.red[600];
  if (intensity >= 6) return auraColors.red.main;
  if (intensity >= 4) return auraColors.orange.main;
  if (intensity >= 2) return auraColors.amber.main;
  return auraColors.green.main;
};

export const PainBodyMap: React.FC<PainBodyMapProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [editingPoint, setEditingPoint] = useState<{
    bodyPart: string;
    side?: 'left' | 'right' | 'bilateral' | null;
    intensity: number;
    quality?: string | null;
  } | null>(null);

  const handleRegionClick = (region: typeof BODY_REGIONS[0]) => {
    if (disabled) return;

    const existingPoint = value.find(p => p.bodyPart === region.label);
    if (existingPoint) {
      setEditingPoint(existingPoint);
    } else {
      setEditingPoint({
        bodyPart: region.label,
        side: region.hasSide ? 'bilateral' : null,
        intensity: 5,
        quality: null,
      });
    }
    setSelectedRegion(region.id);
  };

  const handleAddPoint = () => {
    if (!editingPoint) return;

    const existingIndex = value.findIndex(p => p.bodyPart === editingPoint.bodyPart);
    if (existingIndex >= 0) {
      const updated = [...value];
      updated[existingIndex] = editingPoint;
      onChange(updated);
    } else {
      onChange([...value, editingPoint]);
    }
    setEditingPoint(null);
    setSelectedRegion(null);
  };

  const handleRemovePoint = (bodyPart: string) => {
    onChange(value.filter(p => p.bodyPart !== bodyPart));
  };

  const isRegionSelected = (regionLabel: string) =>
    value.some(p => p.bodyPart === regionLabel);

  const getRegionIntensity = (regionLabel: string) => {
    const point = value.find(p => p.bodyPart === regionLabel);
    return point?.intensity ?? 0;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Body Map */}
        <Box
          sx={{
            width: 200,
            height: 400,
            position: 'relative',
            bgcolor: alpha(auraColors.grey[100], 0.5),
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          {/* Simple body outline */}
          <Box
            sx={{
              position: 'absolute',
              top: '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: auraColors.grey[400],
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 60,
              height: 80,
              borderRadius: '30px 30px 20px 20px',
              border: '2px solid',
              borderColor: auraColors.grey[400],
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '55%',
              left: '35%',
              width: 20,
              height: 90,
              borderRadius: 10,
              border: '2px solid',
              borderColor: auraColors.grey[400],
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '55%',
              right: '35%',
              width: 20,
              height: 90,
              borderRadius: 10,
              border: '2px solid',
              borderColor: auraColors.grey[400],
            }}
          />

          {/* Clickable regions */}
          {BODY_REGIONS.map((region) => {
            const isSelected = isRegionSelected(region.label);
            const intensity = getRegionIntensity(region.label);
            const isCurrentlyEditing = selectedRegion === region.id;

            return (
              <Tooltip key={region.id} title={region.label} arrow>
                <Box
                  onClick={() => handleRegionClick(region)}
                  sx={{
                    position: 'absolute',
                    left: `${region.x}%`,
                    top: `${region.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: isSelected
                      ? alpha(getIntensityColor(intensity), 0.8)
                      : isCurrentlyEditing
                        ? alpha(auraColors.blue.main, 0.3)
                        : alpha(auraColors.grey[400], 0.3),
                    border: '2px solid',
                    borderColor: isCurrentlyEditing
                      ? auraColors.blue.main
                      : isSelected
                        ? getIntensityColor(intensity)
                        : 'transparent',
                    cursor: disabled ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': disabled ? {} : {
                      transform: 'translate(-50%, -50%) scale(1.2)',
                      bgcolor: isSelected
                        ? alpha(getIntensityColor(intensity), 0.9)
                        : alpha(auraColors.blue.main, 0.4),
                    },
                  }}
                >
                  {isSelected && (
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, fontSize: 10 }}>
                      {intensity}
                    </Typography>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Edit Panel */}
        <Box sx={{ flex: 1 }}>
          {editingPoint ? (
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {editingPoint.bodyPart}
                </Typography>
                <IconButton size="small" onClick={() => { setEditingPoint(null); setSelectedRegion(null); }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Side selection */}
              {BODY_REGIONS.find(r => r.label === editingPoint.bodyPart)?.hasSide && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Side
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {(['left', 'right', 'bilateral'] as const).map((side) => (
                      <Chip
                        key={side}
                        label={side.charAt(0).toUpperCase() + side.slice(1)}
                        size="small"
                        onClick={() => setEditingPoint({ ...editingPoint, side })}
                        variant={editingPoint.side === side ? 'filled' : 'outlined'}
                        color={editingPoint.side === side ? 'primary' : 'default'}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Intensity slider */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Pain Intensity: {editingPoint.intensity}/10
                </Typography>
                <Slider
                  value={editingPoint.intensity}
                  onChange={(_, val) => setEditingPoint({ ...editingPoint, intensity: val as number })}
                  min={0}
                  max={10}
                  marks
                  sx={{
                    color: getIntensityColor(editingPoint.intensity),
                    '& .MuiSlider-thumb': {
                      bgcolor: getIntensityColor(editingPoint.intensity),
                    },
                  }}
                />
              </Box>

              {/* Quality selection */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Pain Quality
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {PAIN_QUALITIES.map((quality) => (
                    <Chip
                      key={quality}
                      label={quality}
                      size="small"
                      onClick={() => setEditingPoint({ ...editingPoint, quality: quality.toLowerCase() })}
                      variant={editingPoint.quality === quality.toLowerCase() ? 'filled' : 'outlined'}
                      color={editingPoint.quality === quality.toLowerCase() ? 'primary' : 'default'}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip
                  icon={<AddIcon />}
                  label={value.some(p => p.bodyPart === editingPoint.bodyPart) ? 'Update' : 'Add Pain Point'}
                  onClick={handleAddPoint}
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                {value.some(p => p.bodyPart === editingPoint.bodyPart) && (
                  <Chip
                    label="Remove"
                    onClick={() => {
                      handleRemovePoint(editingPoint.bodyPart);
                      setEditingPoint(null);
                      setSelectedRegion(null);
                    }}
                    color="error"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="body2">
                Click on a body region to add or edit a pain point
              </Typography>
            </Box>
          )}

          {/* Selected Pain Points List */}
          {value.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Selected Pain Points ({value.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {value.map((point, index) => (
                  <Chip
                    key={index}
                    label={`${point.bodyPart}${point.side && point.side !== 'bilateral' ? ` (${point.side})` : ''}: ${point.intensity}/10`}
                    onDelete={disabled ? undefined : () => handleRemovePoint(point.bodyPart)}
                    size="small"
                    sx={{
                      bgcolor: alpha(getIntensityColor(point.intensity), 0.1),
                      color: getIntensityColor(point.intensity),
                      borderColor: getIntensityColor(point.intensity),
                      '& .MuiChip-deleteIcon': {
                        color: getIntensityColor(point.intensity),
                      },
                    }}
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default PainBodyMap;
