import { Suspense, useState, useEffect } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Slider,
  Chip,
  IconButton,
  Popover,
} from "@mui/material";
import { Delete as DeleteIcon, Close as CloseIcon } from "@mui/icons-material";
import * as THREE from "three";
import { PAIN_QUALITIES } from "../../types/pain-drawing";
import { getRegionDisplayName } from "../../types/anatomical-regions";
import { auraTokens } from "../../theme/auraTokens";
import { AuraButton } from "../buttons/Button";

interface SelectedRegion {
  meshName: string;
  quality: string;
  intensity: number;
}

interface PainMap3DProps {
  value?: SelectedRegion[];
  onChange: (regions: SelectedRegion[]) => void;
}

// Default neutral skin-tone material for body
const defaultBodyMaterial = new THREE.MeshStandardMaterial({
  color: "#e8d4c4", // Neutral skin tone
  roughness: 0.7,
  metalness: 0.0,
});

// Store original materials to restore when deselecting
const originalMaterials = new Map<string, THREE.Material>();

function BodyModel({
  selectedRegions,
  onMeshClick,
  cameraView,
}: {
  selectedRegions: SelectedRegion[];
  onMeshClick: (meshName: string, event: any) => void;
  cameraView: "front" | "back" | "left" | "right";
}) {
  const gltf = useLoader(GLTFLoader, "/assets/body-model.glb");
  const { camera } = useThree();

  // Calculate model center and set up camera on first load
  useEffect(() => {
    // Compute bounding box to find model center
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Distance based on model size (closer = larger model)
    const distance = maxDim * 1.3;

    // Set camera positions for locked views - centered on model
    const positions = {
      front: [center.x, center.y, center.z + distance],
      back: [center.x, center.y, center.z - distance],
      left: [center.x - distance, center.y, center.z],
      right: [center.x + distance, center.y, center.z],
    };
    const pos = positions[cameraView];
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(center.x, center.y, center.z);
  }, [cameraView, camera, gltf.scene]);

  // Apply default material to all meshes on load
  useEffect(() => {
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        // Store original material if not already stored
        if (!originalMaterials.has(child.name)) {
          originalMaterials.set(child.name, child.material);
        }
        // Apply default neutral material
        child.material = defaultBodyMaterial.clone();
      }
    });
  }, [gltf.scene]);

  const handleClick = (event: any) => {
    event.stopPropagation();
    const meshName = event.object.name;
    if (meshName) {
      onMeshClick(meshName, event);
    }
  };

  // Apply colored materials to selected regions only
  useEffect(() => {
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        const selected = selectedRegions.find((r) => r.meshName === child.name);
        if (selected) {
          // Apply pain color to selected region
          const quality = PAIN_QUALITIES.find((q) => q.id === selected.quality);
          if (quality) {
            child.material = new THREE.MeshStandardMaterial({
              color: quality.color,
              transparent: true,
              opacity: 0.5 + selected.intensity / 20, // Min 0.5, max 1.0
              emissive: quality.color,
              emissiveIntensity: 0.2,
              roughness: 0.5,
            });
          }
        } else {
          // Reset to default neutral material
          child.material = defaultBodyMaterial.clone();
        }
      }
    });
  }, [selectedRegions, gltf.scene]);

  return (
    /* eslint-disable react/no-unknown-property */
    <primitive
      object={gltf.scene}
      onClick={handleClick}
      onPointerOver={(e: any) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    />
    /* eslint-enable react/no-unknown-property */
  );
}

export function PainMap3D({ value = [], onChange }: PainMap3DProps) {
  const [selectedRegions, setSelectedRegions] =
    useState<SelectedRegion[]>(value);
  const [cameraView, setCameraView] = useState<
    "front" | "back" | "left" | "right"
  >("front");

  // Popover state for pain detail selection
  const [popoverAnchor, setPopoverAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [pendingMesh, setPendingMesh] = useState<string | null>(null);
  const [pendingQuality, setPendingQuality] = useState(PAIN_QUALITIES[0]);
  const [pendingIntensity, setPendingIntensity] = useState(5);

  const handleMeshClick = (meshName: string, event: any) => {
    const existing = selectedRegions.find((r) => r.meshName === meshName);

    if (existing) {
      // Remove region if clicking again on existing
      const updated = selectedRegions.filter((r) => r.meshName !== meshName);
      setSelectedRegions(updated);
      onChange(updated);
    } else {
      // Show popover to select type and intensity
      // Get screen position from the 3D event
      const rect =
        event.target?.domElement?.getBoundingClientRect?.() ||
        document.querySelector("canvas")?.getBoundingClientRect();
      if (rect) {
        setPopoverAnchor({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      } else {
        // Fallback to center of viewport
        setPopoverAnchor({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      }
      setPendingMesh(meshName);
      setPendingQuality(PAIN_QUALITIES[0]);
      setPendingIntensity(5);
    }
  };

  const handleConfirmPain = () => {
    if (pendingMesh) {
      const updated = [
        ...selectedRegions,
        {
          meshName: pendingMesh,
          quality: pendingQuality.id,
          intensity: pendingIntensity,
        },
      ];
      setSelectedRegions(updated);
      onChange(updated);
    }
    closePopover();
  };

  const closePopover = () => {
    setPopoverAnchor(null);
    setPendingMesh(null);
  };

  const removeRegion = (meshName: string) => {
    const updated = selectedRegions.filter((r) => r.meshName !== meshName);
    setSelectedRegions(updated);
    onChange(updated);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Minimal View Controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          py: 1,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600 }}
        >
          View:
        </Typography>
        <ToggleButtonGroup
          value={cameraView}
          exclusive
          onChange={(_, val) => val && setCameraView(val)}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              px: 1.5,
              py: 0.5,
              fontSize: "0.75rem",
            },
          }}
        >
          <ToggleButton value="front">Front</ToggleButton>
          <ToggleButton value="back">Back</ToggleButton>
          <ToggleButton value="left">Left</ToggleButton>
          <ToggleButton value="right">Right</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Main Content - 3D Canvas and Selected Regions side by side on larger screens */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* 3D Canvas */}
        <Box
          sx={{
            flex: { xs: "none", md: 2 },
            width: "100%",
            height: { xs: 400, md: 500 },
            bgcolor: "background.elevation1",
            borderRadius: auraTokens.borderRadius.md,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Canvas camera={{ fov: 50 }}>
            <Suspense fallback={null}>
              {/* eslint-disable-next-line react/no-unknown-property */}
              <ambientLight intensity={0.5} />
              {/* eslint-disable-next-line react/no-unknown-property */}
              <directionalLight position={[10, 10, 5]} intensity={1} />
              {/* eslint-disable-next-line react/no-unknown-property */}
              <directionalLight position={[-10, 10, -5]} intensity={0.5} />
              <BodyModel
                selectedRegions={selectedRegions}
                onMeshClick={handleMeshClick}
                cameraView={cameraView}
              />
            </Suspense>
          </Canvas>
        </Box>

        {/* Compact Selected Regions Panel */}
        <Box
          sx={{
            width: { xs: "100%", md: 200 },
            flexShrink: 0,
            bgcolor: "background.paper",
            borderRadius: auraTokens.borderRadius.md,
            border: "1px solid",
            borderColor: "divider",
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            maxHeight: { md: 500 },
          }}
        >
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            Selected ({selectedRegions.length})
          </Typography>

          {selectedRegions.length === 0 ? (
            <Typography
              variant="caption"
              color="text.secondary"
              textAlign="center"
              sx={{ py: 2 }}
            >
              Click body to mark pain
            </Typography>
          ) : (
            <Stack spacing={0.5} sx={{ flex: 1, overflow: "auto" }}>
              {selectedRegions.map((region, i) => {
                const quality = PAIN_QUALITIES.find(
                  (q) => q.id === region.quality,
                );
                const displayName = getRegionDisplayName(region.meshName);
                return (
                  <Box
                    key={i}
                    sx={{
                      p: 1,
                      bgcolor: "background.elevation1",
                      borderRadius: auraTokens.borderRadius.sm,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: quality?.color,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="caption"
                        fontWeight={500}
                        noWrap
                        sx={{ lineHeight: 1.2 }}
                      >
                        {displayName}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.65rem", display: "block" }}
                      >
                        {quality?.label.split(" / ")[0]} • {region.intensity}/10
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => removeRegion(region.meshName)}
                      sx={{ color: "text.secondary", p: 0.25 }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>

      {/* Compact Pain Detail Popover */}
      <Popover
        open={Boolean(popoverAnchor)}
        anchorReference="anchorPosition"
        anchorPosition={
          popoverAnchor
            ? { top: popoverAnchor.y, left: popoverAnchor.x }
            : undefined
        }
        onClose={closePopover}
        transformOrigin={{ horizontal: "center", vertical: "center" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: auraTokens.borderRadius.md,
              boxShadow: 4,
              overflow: "visible",
              minWidth: 260,
              maxWidth: 280,
            },
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Compact Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              {pendingMesh ? getRegionDisplayName(pendingMesh) : "Pain Details"}
            </Typography>
            <IconButton size="small" onClick={closePopover} sx={{ p: 0.5 }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          {/* Pain Type - Horizontal Chips */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, mb: 0.5, display: "block" }}
          >
            Type
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ mb: 2, flexWrap: "wrap", gap: 0.5 }}
          >
            {PAIN_QUALITIES.map((quality) => (
              <Chip
                key={quality.id}
                label={quality.label.split(" / ")[0]} // Just first word: Dull, Sharp, Burning
                size="small"
                onClick={() => setPendingQuality(quality)}
                sx={{
                  bgcolor:
                    pendingQuality.id === quality.id
                      ? quality.color
                      : "transparent",
                  color:
                    pendingQuality.id === quality.id ? "white" : "text.primary",
                  border: "1px solid",
                  borderColor:
                    pendingQuality.id === quality.id
                      ? quality.color
                      : "divider",
                  fontWeight: pendingQuality.id === quality.id ? 600 : 400,
                  fontSize: "0.75rem",
                  height: 28,
                  "&:hover": {
                    bgcolor:
                      pendingQuality.id === quality.id
                        ? quality.color
                        : `${quality.color}20`,
                  },
                }}
              />
            ))}
          </Stack>

          {/* Compact Intensity Slider */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, mb: 0.5, display: "block" }}
          >
            Intensity
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Slider
              value={pendingIntensity}
              onChange={(_, val) => setPendingIntensity(val as number)}
              min={1}
              max={10}
              size="small"
              sx={{
                flex: 1,
                color: pendingQuality.color,
                "& .MuiSlider-thumb": {
                  width: 16,
                  height: 16,
                },
              }}
            />
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{
                color: pendingQuality.color,
                minWidth: 32,
                textAlign: "right",
              }}
            >
              {pendingIntensity}/10
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <AuraButton
              variant="outlined"
              size="small"
              onClick={closePopover}
              sx={{ flex: 1 }}
            >
              Cancel
            </AuraButton>
            <AuraButton
              variant="contained"
              size="small"
              onClick={handleConfirmPain}
              sx={{
                flex: 1,
                bgcolor: pendingQuality.color,
                "&:hover": {
                  bgcolor: pendingQuality.color,
                  filter: "brightness(0.9)",
                },
              }}
            >
              Add
            </AuraButton>
          </Stack>
        </Box>
      </Popover>
    </Box>
  );
}
