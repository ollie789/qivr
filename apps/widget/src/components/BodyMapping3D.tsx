import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Box, Sphere, Cylinder, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Typography, Paper, Chip, Button, Slider, Grid } from '@mui/material';

interface PainPoint {
  id: string;
  position: [number, number, number];
  bodyPart: string;
  intensity: number;
  description?: string;
}

interface BodyPart {
  name: string;
  position: [number, number, number];
  scale: [number, number, number];
  shape: 'box' | 'sphere' | 'cylinder';
  color: string;
}

const bodyParts: BodyPart[] = [
  // Head
  { name: 'Head', position: [0, 4.5, 0], scale: [0.8, 0.8, 0.8], shape: 'sphere', color: '#ffdbac' },
  
  // Torso
  { name: 'Chest', position: [0, 2.5, 0], scale: [1.5, 1.5, 0.8], shape: 'box', color: '#ffdbac' },
  { name: 'Abdomen', position: [0, 1, 0], scale: [1.3, 1.2, 0.7], shape: 'box', color: '#ffdbac' },
  
  // Arms
  { name: 'Left Shoulder', position: [-1.2, 3, 0], scale: [0.4, 0.4, 0.4], shape: 'sphere', color: '#ffdbac' },
  { name: 'Right Shoulder', position: [1.2, 3, 0], scale: [0.4, 0.4, 0.4], shape: 'sphere', color: '#ffdbac' },
  { name: 'Left Upper Arm', position: [-1.5, 2.2, 0], scale: [0.3, 0.8, 0.3], shape: 'cylinder', color: '#ffdbac' },
  { name: 'Right Upper Arm', position: [1.5, 2.2, 0], scale: [0.3, 0.8, 0.3], shape: 'cylinder', color: '#ffdbac' },
  { name: 'Left Elbow', position: [-1.5, 1.4, 0], scale: [0.25, 0.25, 0.25], shape: 'sphere', color: '#ffdbac' },
  { name: 'Right Elbow', position: [1.5, 1.4, 0], scale: [0.25, 0.25, 0.25], shape: 'sphere', color: '#ffdbac' },
  { name: 'Left Forearm', position: [-1.5, 0.7, 0], scale: [0.25, 0.7, 0.25], shape: 'cylinder', color: '#ffdbac' },
  { name: 'Right Forearm', position: [1.5, 0.7, 0], scale: [0.25, 0.7, 0.25], shape: 'cylinder', color: '#ffdbac' },
  { name: 'Left Hand', position: [-1.5, 0, 0], scale: [0.2, 0.3, 0.15], shape: 'box', color: '#ffdbac' },
  { name: 'Right Hand', position: [1.5, 0, 0], scale: [0.2, 0.3, 0.15], shape: 'box', color: '#ffdbac' },
  
  // Legs
  { name: 'Left Hip', position: [-0.5, 0, 0], scale: [0.35, 0.35, 0.35], shape: 'sphere', color: '#ffdbac' },
  { name: 'Right Hip', position: [0.5, 0, 0], scale: [0.35, 0.35, 0.35], shape: 'sphere', color: '#ffdbac' },
  { name: 'Left Thigh', position: [-0.5, -1, 0], scale: [0.35, 1, 0.35], shape: 'cylinder', color: '#ffdbac' },
  { name: 'Right Thigh', position: [0.5, -1, 0], scale: [0.35, 1, 0.35], shape: 'cylinder', color: '#ffdbac' },
  { name: 'Left Knee', position: [-0.5, -2, 0], scale: [0.3, 0.3, 0.3], shape: 'sphere', color: '#ffdbac' },
  { name: 'Right Knee', position: [0.5, -2, 0], scale: [0.3, 0.3, 0.3], shape: 'sphere', color: '#ffdbac' },
  { name: 'Left Shin', position: [-0.5, -2.8, 0], scale: [0.3, 0.8, 0.3], shape: 'cylinder', color: '#ffdbac' },
  { name: 'Right Shin', position: [0.5, -2.8, 0], scale: [0.3, 0.8, 0.3], shape: 'cylinder', color: '#ffdbac' },
  { name: 'Left Ankle', position: [-0.5, -3.6, 0], scale: [0.2, 0.2, 0.2], shape: 'sphere', color: '#ffdbac' },
  { name: 'Right Ankle', position: [0.5, -3.6, 0], scale: [0.2, 0.2, 0.2], shape: 'sphere', color: '#ffdbac' },
  { name: 'Left Foot', position: [-0.5, -4, 0.2], scale: [0.25, 0.15, 0.5], shape: 'box', color: '#ffdbac' },
  { name: 'Right Foot', position: [0.5, -4, 0.2], scale: [0.25, 0.15, 0.5], shape: 'box', color: '#ffdbac' },
  
  // Spine
  { name: 'Neck', position: [0, 3.7, 0], scale: [0.3, 0.5, 0.3], shape: 'cylinder', color: '#ffdbac' },
  { name: 'Upper Back', position: [0, 2.5, -0.3], scale: [1, 1, 0.3], shape: 'box', color: '#ffd0a0' },
  { name: 'Lower Back', position: [0, 0.8, -0.3], scale: [0.9, 0.8, 0.3], shape: 'box', color: '#ffd0a0' },
];

const painColors = [
  '#4caf50', // 0 - No pain (green)
  '#8bc34a', // 1
  '#cddc39', // 2
  '#ffeb3b', // 3
  '#ffc107', // 4
  '#ff9800', // 5
  '#ff5722', // 6
  '#f44336', // 7
  '#e91e63', // 8
  '#9c27b0', // 9
  '#673ab7', // 10 - Severe pain (purple)
];

interface BodyPartMeshProps {
  part: BodyPart;
  painPoints: PainPoint[];
  onBodyPartClick: (part: BodyPart, event: ThreeEvent<MouseEvent>) => void;
}

const BodyPartMesh: React.FC<BodyPartMeshProps> = ({ part, painPoints, onBodyPartClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Find pain point for this body part
  const painPoint = painPoints.find(p => p.bodyPart === part.name);
  const painIntensity = painPoint?.intensity || 0;
  const color = painIntensity > 0 ? painColors[painIntensity] : (hovered ? '#ffeecc' : part.color);
  
  useFrame(() => {
    if (meshRef.current && painIntensity > 0) {
      // Pulse effect for pain areas
      const scale = 1 + Math.sin(Date.now() * 0.003) * 0.05 * (painIntensity / 10);
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onBodyPartClick(part, event);
  };
  
  const commonProps = {
    ref: meshRef,
    position: part.position,
    onClick: handleClick,
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false),
    castShadow: true,
    receiveShadow: true,
  };
  
  const material = <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />;
  
  switch (part.shape) {
    case 'sphere':
      return (
        <Sphere {...commonProps} args={part.scale}>
          {material}
        </Sphere>
      );
    case 'cylinder':
      return (
        <Cylinder {...commonProps} args={part.scale}>
          {material}
        </Cylinder>
      );
    case 'box':
    default:
      return (
        <Box {...commonProps} args={part.scale}>
          {material}
        </Box>
      );
  }
};

interface HumanBodyModelProps {
  painPoints: PainPoint[];
  onBodyPartClick: (part: BodyPart, event: ThreeEvent<MouseEvent>) => void;
}

const HumanBodyModel: React.FC<HumanBodyModelProps> = ({ painPoints, onBodyPartClick }) => {
  return (
    <group>
      {bodyParts.map((part) => (
        <BodyPartMesh
          key={part.name}
          part={part}
          painPoints={painPoints}
          onBodyPartClick={onBodyPartClick}
        />
      ))}
      
      {/* Labels for pain points */}
      {painPoints.map((point) => (
        <Text
          key={point.id}
          position={[point.position[0], point.position[1] + 0.5, point.position[2] + 0.5]}
          fontSize={0.2}
          color="red"
          anchorX="center"
          anchorY="middle"
        >
          {point.intensity}/10
        </Text>
      ))}
    </group>
  );
};

export interface BodyMapping3DProps {
  onPainPointsChange?: (painPoints: PainPoint[]) => void;
  initialPainPoints?: PainPoint[];
}

export const BodyMapping3D: React.FC<BodyMapping3DProps> = ({ 
  onPainPointsChange, 
  initialPainPoints = [] 
}) => {
  const [painPoints, setPainPoints] = useState<PainPoint[]>(initialPainPoints);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [currentIntensity, setCurrentIntensity] = useState<number>(5);
  const [viewAngle, setViewAngle] = useState<'front' | 'back' | 'left' | 'right'>('front');
  
  const handleBodyPartClick = (part: BodyPart, _event: ThreeEvent<MouseEvent>) => {
    setSelectedBodyPart(part.name);
    
    // Check if pain point already exists for this body part
    const existingPoint = painPoints.find(p => p.bodyPart === part.name);
    
    if (existingPoint) {
      // Update existing pain point
      const updatedPoints = painPoints.map(p => 
        p.bodyPart === part.name 
          ? { ...p, intensity: currentIntensity }
          : p
      );
      setPainPoints(updatedPoints);
      onPainPointsChange?.(updatedPoints);
    } else {
      // Add new pain point
      const newPoint: PainPoint = {
        id: `pain-${Date.now()}`,
        position: part.position,
        bodyPart: part.name,
        intensity: currentIntensity,
      };
      const updatedPoints = [...painPoints, newPoint];
      setPainPoints(updatedPoints);
      onPainPointsChange?.(updatedPoints);
    }
  };
  
  const removePainPoint = (bodyPart: string) => {
    const updatedPoints = painPoints.filter(p => p.bodyPart !== bodyPart);
    setPainPoints(updatedPoints);
    onPainPointsChange?.(updatedPoints);
  };
  
  const clearAllPainPoints = () => {
    setPainPoints([]);
    onPainPointsChange?.([]);
  };
  
  const getCameraPosition = () => {
    switch (viewAngle) {
      case 'front': return [0, 0, 10];
      case 'back': return [0, 0, -10];
      case 'left': return [-10, 0, 0];
      case 'right': return [10, 0, 0];
      default: return [0, 0, 10];
    }
  };
  
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ height: '500px', position: 'relative' }}>
            <Canvas
              camera={{ position: getCameraPosition() as [number, number, number], fov: 50 }}
              shadows
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              <directionalLight position={[-10, 10, -5]} intensity={0.5} />
              
              <Suspense fallback={null}>
                <HumanBodyModel
                  painPoints={painPoints}
                  onBodyPartClick={handleBodyPartClick}
                />
              </Suspense>
              
              <OrbitControls 
                enablePan={false}
                minDistance={5}
                maxDistance={15}
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={3 * Math.PI / 4}
              />
              
              <gridHelper args={[10, 10]} position={[0, -4.5, 0]} />
            </Canvas>
            
            {/* View Controls */}
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <Button 
                size="small" 
                variant={viewAngle === 'front' ? 'contained' : 'outlined'}
                onClick={() => setViewAngle('front')}
                sx={{ mr: 1 }}
              >
                Front
              </Button>
              <Button 
                size="small" 
                variant={viewAngle === 'back' ? 'contained' : 'outlined'}
                onClick={() => setViewAngle('back')}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Button 
                size="small" 
                variant={viewAngle === 'left' ? 'contained' : 'outlined'}
                onClick={() => setViewAngle('left')}
                sx={{ mr: 1 }}
              >
                Left
              </Button>
              <Button 
                size="small" 
                variant={viewAngle === 'right' ? 'contained' : 'outlined'}
                onClick={() => setViewAngle('right')}
              >
                Right
              </Button>
            </div>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, height: '500px', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Pain Mapping Controls
            </Typography>
            
            <div style={{ marginBottom: 24 }}>
              <Typography gutterBottom>
                Pain Intensity: {currentIntensity}/10
              </Typography>
              <Slider
                value={currentIntensity}
                onChange={(_, value) => setCurrentIntensity(value as number)}
                min={0}
                max={10}
                marks
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: painColors[currentIntensity],
                  },
                  '& .MuiSlider-thumb': {
                    backgroundColor: painColors[currentIntensity],
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: painColors[currentIntensity],
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Click on body parts to mark pain areas
              </Typography>
            </div>
            
            {selectedBodyPart && (
              <div style={{ marginBottom: 16, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                <Typography variant="subtitle2">
                  Selected: {selectedBodyPart}
                </Typography>
              </div>
            )}
            
            <Typography variant="subtitle1" gutterBottom>
              Marked Pain Areas:
            </Typography>
            
            {painPoints.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No pain areas marked yet
              </Typography>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {painPoints.map((point) => (
                  <Chip
                    key={point.id}
                    label={`${point.bodyPart}: ${point.intensity}/10`}
                    onDelete={() => removePainPoint(point.bodyPart)}
                    sx={{
                      backgroundColor: painColors[point.intensity],
                      color: point.intensity > 5 ? 'white' : 'black',
                    }}
                  />
                ))}
              </div>
            )}
            
            {painPoints.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={clearAllPainPoints}
                sx={{ mt: 2 }}
              >
                Clear All
              </Button>
            )}
            
            {/* Legend */}
            <div style={{ marginTop: 24 }}>
              <Typography variant="subtitle2" gutterBottom>
                Pain Scale Legend:
              </Typography>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { level: 0, label: 'No Pain' },
                  { level: 3, label: 'Mild' },
                  { level: 5, label: 'Moderate' },
                  { level: 7, label: 'Severe' },
                  { level: 10, label: 'Worst Possible' },
                ].map(({ level, label }) => (
                  <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: painColors[level],
                        borderRadius: '4px',
                      }}
                    />
                    <Typography variant="caption">
                      {level} - {label}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};
