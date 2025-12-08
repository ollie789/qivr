import { Suspense, useState, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography, Slider, Chip, IconButton, Tooltip } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import * as THREE from 'three';
import { PAIN_QUALITIES } from '../../types/pain-drawing';
import { getRegionDisplayName } from '../../types/anatomical-regions';
import { auraTokens } from '../../theme/auraTokens';

interface SelectedRegion {
  meshName: string;
  quality: string;
  intensity: number;
}

interface PainMap3DProps {
  value?: SelectedRegion[];
  onChange: (regions: SelectedRegion[]) => void;
}

function BodyModel({ 
  selectedRegions, 
  onMeshClick,
  cameraView 
}: { 
  selectedRegions: SelectedRegion[];
  onMeshClick: (meshName: string) => void;
  cameraView: 'front' | 'back' | 'left' | 'right';
}) {
  const gltf = useLoader(GLTFLoader, '/assets/body-model.glb');
  const { camera } = useThree();
  
  useEffect(() => {
    // Set camera positions for locked views
    const positions = {
      front: [0, 200, 400],
      back: [0, 200, -400],
      left: [-400, 200, 0],
      right: [400, 200, 0]
    };
    const pos = positions[cameraView];
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(0, 200, 0);
  }, [cameraView, camera]);

  const handleClick = (event: any) => {
    event.stopPropagation();
    const meshName = event.object.name;
    if (meshName) {
      onMeshClick(meshName);
    }
  };

  // Apply materials to meshes based on selected regions
  useEffect(() => {
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        const selected = selectedRegions.find(r => r.meshName === child.name);
        if (selected) {
          const quality = PAIN_QUALITIES.find(q => q.id === selected.quality);
          if (quality) {
            child.material = new THREE.MeshStandardMaterial({
              color: quality.color,
              transparent: true,
              opacity: selected.intensity / 10,
              emissive: quality.color,
              emissiveIntensity: 0.3
            });
          }
        }
      }
    });
  }, [selectedRegions, gltf.scene]);

  return (
    <primitive
      object={gltf.scene} 
      onClick={handleClick}
      onPointerOver={(e: any) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    />
  );
}

export function PainMap3D({ value = [], onChange }: PainMap3DProps) {
  const [selectedRegions, setSelectedRegions] = useState<SelectedRegion[]>(value);
  const [cameraView, setCameraView] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [selectedQuality, setSelectedQuality] = useState(PAIN_QUALITIES[0]);
  const [intensity, setIntensity] = useState(5);
  const [_selectedMesh, setSelectedMesh] = useState<string | null>(null);

  const handleMeshClick = (meshName: string) => {
    setSelectedMesh(meshName);
    const existing = selectedRegions.find(r => r.meshName === meshName);
    
    if (existing) {
      // Remove region if clicking again
      const updated = selectedRegions.filter(r => r.meshName !== meshName);
      setSelectedRegions(updated);
      onChange(updated);
      setSelectedMesh(null);
    } else {
      // Add new region
      const updated = [...selectedRegions, {
        meshName,
        quality: selectedQuality.id,
        intensity
      }];
      setSelectedRegions(updated);
      onChange(updated);
    }
  };

  const removeRegion = (meshName: string) => {
    const updated = selectedRegions.filter(r => r.meshName !== meshName);
    setSelectedRegions(updated);
    onChange(updated);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Controls Row - Compact horizontal layout */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: auraTokens.borderRadius.md,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        {/* View Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            View:
          </Typography>
          <ToggleButtonGroup
            value={cameraView}
            exclusive
            onChange={(_, val) => val && setCameraView(val)}
            size="small"
            sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.5, fontSize: '0.75rem' } }}
          >
            <ToggleButton value="front">Front</ToggleButton>
            <ToggleButton value="back">Back</ToggleButton>
            <ToggleButton value="left">Left</ToggleButton>
            <ToggleButton value="right">Right</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Divider */}
        <Box sx={{ width: 1, height: 24, bgcolor: 'divider', display: { xs: 'none', sm: 'block' } }} />

        {/* Pain Type Selector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Type:
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {PAIN_QUALITIES.map(quality => (
              <Chip
                key={quality.id}
                label={quality.label}
                size="small"
                onClick={() => setSelectedQuality(quality)}
                sx={{
                  bgcolor: selectedQuality.id === quality.id ? quality.color : 'transparent',
                  color: selectedQuality.id === quality.id ? 'white' : 'text.primary',
                  border: '1px solid',
                  borderColor: selectedQuality.id === quality.id ? quality.color : 'divider',
                  fontWeight: selectedQuality.id === quality.id ? 600 : 400,
                  '&:hover': {
                    bgcolor: selectedQuality.id === quality.id ? quality.color : `${quality.color}20`,
                  },
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ width: 1, height: 24, bgcolor: 'divider', display: { xs: 'none', md: 'block' } }} />

        {/* Intensity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 180 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
            Intensity:
          </Typography>
          <Slider
            value={intensity}
            onChange={(_, val) => setIntensity(val as number)}
            min={1}
            max={10}
            size="small"
            valueLabelDisplay="auto"
            sx={{ flex: 1 }}
          />
          <Typography variant="body2" fontWeight={600} sx={{ minWidth: 32 }}>
            {intensity}/10
          </Typography>
        </Box>
      </Box>

      {/* Main Content - 3D Canvas and Selected Regions side by side on larger screens */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* 3D Canvas */}
        <Box
          sx={{
            flex: { xs: 'none', md: 2 },
            width: '100%',
            height: { xs: 400, md: 500 },
            bgcolor: 'background.elevation1',
            borderRadius: auraTokens.borderRadius.md,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Canvas camera={{ fov: 50 }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <directionalLight position={[-10, 10, -5]} intensity={0.5} />
              <BodyModel
                selectedRegions={selectedRegions}
                onMeshClick={handleMeshClick}
                cameraView={cameraView}
              />
            </Suspense>
          </Canvas>
        </Box>

        {/* Selected Regions Panel */}
        <Box
          sx={{
            flex: { xs: 'none', md: 1 },
            minWidth: { md: 280 },
            maxWidth: { md: 320 },
            bgcolor: 'background.paper',
            borderRadius: auraTokens.borderRadius.md,
            border: '1px solid',
            borderColor: 'divider',
            p: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Selected Areas {selectedRegions.length > 0 && `(${selectedRegions.length})`}
          </Typography>

          {selectedRegions.length === 0 ? (
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4
            }}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Click on the body model to mark pain areas
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1} sx={{ flex: 1, overflow: 'auto' }}>
              {selectedRegions.map((region, i) => {
                const quality = PAIN_QUALITIES.find(q => q.id === region.quality);
                const displayName = getRegionDisplayName(region.meshName);
                return (
                  <Box
                    key={i}
                    sx={{
                      p: 1.5,
                      bgcolor: 'background.elevation1',
                      borderRadius: auraTokens.borderRadius.sm,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: quality?.color,
                        flexShrink: 0
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={500} noWrap>
                        {displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {quality?.label} • {region.intensity}/10
                      </Typography>
                    </Box>
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        onClick={() => removeRegion(region.meshName)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
