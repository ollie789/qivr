import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography, Slider, CircularProgress, Chip } from '@mui/material';
import * as THREE from 'three';
import { PAIN_QUALITIES, type PainQuality } from '../../types/pain-drawing';
import { getRegionDisplayName, getRegionSnomedCode } from '../../types/anatomical-regions';
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
    // @ts-ignore - React Three Fiber JSX elements
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
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);

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

  return (
    <Stack spacing={2}>
      {/* Camera View Selector */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>View</Typography>
        <ToggleButtonGroup
          value={cameraView}
          exclusive
          onChange={(_, val) => val && setCameraView(val)}
          size="small"
        >
          <ToggleButton value="front">Front</ToggleButton>
          <ToggleButton value="back">Back</ToggleButton>
          <ToggleButton value="left">Left</ToggleButton>
          <ToggleButton value="right">Right</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Pain Quality Selector */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>Pain Type</Typography>
        <ToggleButtonGroup
          value={selectedQuality.id}
          exclusive
          onChange={(_, val) => {
            const quality = PAIN_QUALITIES.find(q => q.id === val);
            if (quality) setSelectedQuality(quality);
          }}
          size="small"
        >
          {PAIN_QUALITIES.map(quality => (
            <ToggleButton key={quality.id} value={quality.id}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: quality.color,
                  mr: 1
                }}
              />
              {quality.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Intensity Slider */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Intensity: {intensity}/10
        </Typography>
        <Slider
          value={intensity}
          onChange={(_, val) => setIntensity(val as number)}
          min={1}
          max={10}
          marks
          valueLabelDisplay="auto"
        />
      </Box>

      {/* 3D Canvas */}
      <Box
        sx={{
          width: '100%',
          height: 600,
          bgcolor: '#f5f5f5',
          borderRadius: auraTokens.borderRadius.sm,
          overflow: 'hidden'
        }}
      >
        <Canvas camera={{ fov: 50 }}>
          <Suspense fallback={null}>
            {/* @ts-ignore - React Three Fiber JSX elements */}
            <ambientLight intensity={0.5} />
            {/* @ts-ignore */}
            <directionalLight position={[10, 10, 5]} intensity={1} />
            {/* @ts-ignore */}
            <directionalLight position={[-10, 10, -5]} intensity={0.5} />
            <BodyModel 
              selectedRegions={selectedRegions}
              onMeshClick={handleMeshClick}
              cameraView={cameraView}
            />
          </Suspense>
        </Canvas>
      </Box>

      {/* Selected Regions List */}
      {selectedRegions.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Selected Regions ({selectedRegions.length})
          </Typography>
          <Stack spacing={1}>
            {selectedRegions.map((region, i) => {
              const quality = PAIN_QUALITIES.find(q => q.id === region.quality);
              const displayName = getRegionDisplayName(region.meshName);
              return (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: auraTokens.borderRadius.sm,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: quality?.color,
                      flexShrink: 0
                    }}
                  />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                    {displayName}
                  </Typography>
                  <Chip 
                    label={quality?.label} 
                    size="small" 
                    sx={{ bgcolor: quality?.color, color: 'white', fontSize: '0.7rem' }}
                  />
                  <Chip 
                    label={`${region.intensity}/10`} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary">
        Click on body regions to mark pain areas. Click again to remove.
      </Typography>
    </Stack>
  );
}
