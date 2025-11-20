import { Suspense, useEffect } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Box, Stack, Typography, Chip, CircularProgress } from '@mui/material';
import * as THREE from 'three';
import { PAIN_QUALITIES, type PainRegion } from '../../types/pain-drawing';
import { getRegionDisplayName } from '../../types/anatomical-regions';

interface PainMap3DViewerProps {
  regions: PainRegion[];
  cameraView?: 'front' | 'back' | 'left' | 'right';
  width?: number;
  height?: number;
}

function BodyModelViewer({ 
  regions,
  cameraView = 'front'
}: { 
  regions: PainRegion[];
  cameraView: 'front' | 'back' | 'left' | 'right';
}) {
  const gltf = useLoader(GLTFLoader, '/assets/body-model.glb');
  const { camera } = useThree();
  
  useEffect(() => {
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

  useEffect(() => {
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        const selected = regions.find(r => r.meshName === child.name);
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
        } else {
          child.material = new THREE.MeshStandardMaterial({
            color: '#e0e0e0',
            transparent: true,
            opacity: 0.3
          });
        }
      }
    });
  }, [regions, gltf.scene]);

  return <primitive object={gltf.scene} />;
}

export function PainMap3DViewer({ 
  regions, 
  cameraView = 'front',
  width = 400,
  height = 500
}: PainMap3DViewerProps) {
  return (
    <Stack spacing={2}>
      <Box
        sx={{
          width,
          height,
          bgcolor: '#f5f5f5',
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        <Canvas camera={{ fov: 50 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, 10, -5]} intensity={0.5} />
            <BodyModelViewer regions={regions} cameraView={cameraView} />
          </Suspense>
        </Canvas>
      </Box>

      {regions.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Pain Regions ({regions.length})
          </Typography>
          <Stack spacing={1}>
            {regions.map((region, i) => {
              const quality = PAIN_QUALITIES.find(q => q.id === region.quality);
              const displayName = getRegionDisplayName(region.meshName);
              return (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
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
    </Stack>
  );
}
