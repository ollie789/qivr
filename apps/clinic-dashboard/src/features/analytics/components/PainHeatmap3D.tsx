import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import {
  Box,
  Paper,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
  Skeleton,
  Chip,
  LinearProgress,
} from '@mui/material';
import * as THREE from 'three';
import { auraColors, glassTokens } from '@qivr/design-system';

// Import the body model from public folder
const bodyModelUrl = '/models/body-model.glb';

interface PainPoint3D {
  x: number;
  y: number;
  z: number;
  intensity: number;
  bodyRegion: string;
  painType: string;
}

interface RegionHeatData {
  meshName: string;
  totalIntensity: number;
  count: number;
  avgIntensity: number;
  dominantPainType: string;
}

interface PainHeatmap3DProps {
  painPoints: PainPoint3D[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  height?: number;
}

// Get intensity color
const getIntensityColor = (intensity: number): string => {
  if (intensity >= 8) return auraColors.red[600];
  if (intensity >= 6) return auraColors.red.main;
  if (intensity >= 4) return auraColors.orange.main;
  if (intensity >= 2) return auraColors.amber.main;
  return auraColors.green.main;
};

// Get THREE.js color from intensity
const getIntensityColorThree = (intensity: number): number => {
  if (intensity >= 8) return 0xdc2626; // red-600
  if (intensity >= 6) return 0xef4444; // red
  if (intensity >= 4) return 0xf97316; // orange
  if (intensity >= 2) return 0xfbbf24; // amber
  return 0x22c55e; // green
};

// Aggregate pain points into region heat data
const aggregatePainData = (painPoints: PainPoint3D[]): RegionHeatData[] => {
  const regionMap = new Map<string, { total: number; count: number; types: Map<string, number> }>();

  painPoints.forEach((point) => {
    const existing = regionMap.get(point.bodyRegion) || {
      total: 0,
      count: 0,
      types: new Map(),
    };

    existing.total += point.intensity;
    existing.count += 1;
    existing.types.set(point.painType, (existing.types.get(point.painType) || 0) + 1);

    regionMap.set(point.bodyRegion, existing);
  });

  return Array.from(regionMap.entries()).map(([region, data]) => {
    let dominantType = 'Unknown';
    let maxCount = 0;
    data.types.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });

    return {
      meshName: region,
      totalIntensity: data.total,
      count: data.count,
      avgIntensity: data.total / data.count,
      dominantPainType: dominantType,
    };
  });
};

// Body Model from GLB
function BodyModel({ regionData }: { regionData: Map<string, number> }) {
  const { scene } = useGLTF(bodyModelUrl);
  const modelRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!modelRef.current) return;

    // Traverse the model and apply heat colors to meshes based on region data
    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const meshName = child.name;
        const intensity = regionData.get(meshName) || 0;
        
        if (intensity > 0) {
          const color = getIntensityColorThree(intensity);
          const material = child.material as THREE.MeshStandardMaterial;
          
          if (material) {
            material.color = new THREE.Color(color);
            material.emissive = new THREE.Color(color);
            material.emissiveIntensity = 0.2 + (intensity / 10) * 0.4;
            material.transparent = true;
            material.opacity = 0.5 + (intensity / 10) * 0.4;
          }
        } else {
          // Default appearance for unaffected regions
          const material = child.material as THREE.MeshStandardMaterial;
          if (material) {
            material.color = new THREE.Color(0xe2e8f0);
            material.transparent = true;
            material.opacity = 0.25;
            material.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [regionData, scene]);

  return <primitive ref={modelRef} object={scene.clone()} scale={1} position={[0, 0, 0]} />;
}

// Camera controller
function CameraController({ cameraView }: { cameraView: 'front' | 'back' | 'left' | 'right' }) {
  const { camera } = useThree();

  useEffect(() => {
    const positions: Record<'front' | 'back' | 'left' | 'right', [number, number, number]> = {
      front: [0, 1, 4],
      back: [0, 1, -4],
      left: [-4, 1, 0],
      right: [4, 1, 0],
    };
    const pos = positions[cameraView];
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(0, 1, 0);
  }, [cameraView, camera]);

  return null;
}

// 3D Body visualization with heatmap
function HeatmapBody({ regionData }: { regionData: RegionHeatData[] }) {
  const regionMap = useMemo(() => {
    const map = new Map<string, number>();
    regionData.forEach((r) => map.set(r.meshName, r.avgIntensity));
    return map;
  }, [regionData]);

  return (
    <group>
      <BodyModel regionData={regionMap} />
    </group>
  );
}

// Loading skeleton for 3D view
const Heatmap3DSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <Box
    sx={{
      width: '100%',
      height,
      bgcolor: 'grey.100',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 2,
    }}
  >
    <Skeleton variant="circular" width={120} height={120} />
    <Skeleton variant="text" width={200} />
    <LinearProgress sx={{ width: '60%' }} />
  </Box>
);

const PainHeatmap3D: React.FC<PainHeatmap3DProps> = ({
  painPoints,
  loading = false,
  title = 'Aggregate Pain Heatmap',
  subtitle = 'Combined pain data from all patients',
  height = 450,
}) => {
  const [cameraView, setCameraView] = useState<'front' | 'back' | 'left' | 'right'>('front');

  // Aggregate pain data by region
  const regionData = useMemo(() => aggregatePainData(painPoints), [painPoints]);

  // Sort by intensity for legend
  const sortedRegions = useMemo(
    () => [...regionData].sort((a, b) => b.avgIntensity - a.avgIntensity),
    [regionData]
  );

  const totalCases = painPoints.length;
  const avgIntensity =
    regionData.length > 0
      ? regionData.reduce((sum, r) => sum + r.avgIntensity * r.count, 0) /
        regionData.reduce((sum, r) => sum + r.count, 0)
      : 0;

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            label={`${totalCases} data points`}
            size="small"
            sx={{ bgcolor: alpha(auraColors.blue.main, 0.1), color: auraColors.blue.main }}
          />
          <Chip
            label={`Avg: ${avgIntensity.toFixed(1)}/10`}
            size="small"
            sx={{
              bgcolor: alpha(getIntensityColor(avgIntensity), 0.1),
              color: getIntensityColor(avgIntensity),
            }}
          />
        </Stack>
      </Stack>

      {/* View Controls */}
      <Box sx={{ mb: 2 }}>
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

      {/* 3D Canvas */}
      {loading ? (
        <Heatmap3DSkeleton height={height} />
      ) : painPoints.length === 0 ? (
        <Box
          sx={{
            width: '100%',
            height,
            bgcolor: 'grey.50',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No pain data available
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pain points will appear here when patients submit pain maps
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            width: '100%',
            height,
            bgcolor: 'grey.50',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Canvas camera={{ fov: 50, position: [0, 1, 4] }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={1} />
              <directionalLight position={[-5, 5, -5]} intensity={0.5} />
              <directionalLight position={[0, -5, 0]} intensity={0.2} />
              <CameraController cameraView={cameraView} />
              <HeatmapBody regionData={regionData} />
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={2.5}
                maxDistance={8}
                target={[0, 1, 0]}
              />
            </Suspense>
          </Canvas>
        </Box>
      )}

      {/* Legend / Top Regions */}
      {sortedRegions.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Most Affected Regions
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {sortedRegions.slice(0, 6).map((region) => (
              <Chip
                key={region.meshName}
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getIntensityColor(region.avgIntensity),
                      }}
                    />
                    <span>
                      {region.meshName} ({region.count})
                    </span>
                  </Stack>
                }
                size="small"
                variant="outlined"
                sx={{ borderColor: getIntensityColor(region.avgIntensity) }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Intensity Scale */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          Intensity Scale
        </Typography>
        <Box
          sx={{
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${auraColors.green.main} 0%, ${auraColors.amber.main} 30%, ${auraColors.orange.main} 60%, ${auraColors.red.main} 100%)`,
          }}
        />
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Low (1-2)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Moderate (4-6)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Severe (8-10)
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
};

export default PainHeatmap3D;
