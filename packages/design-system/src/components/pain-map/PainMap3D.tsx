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
  Tooltip,
  Popover,
  Paper,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import * as THREE from "three";
import { PAIN_QUALITIES } from "../../types/pain-drawing";
import { getRegionDisplayName } from "../../types/anatomical-regions";
import { auraTokens } from "../../theme/auraTokens";

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

    // Distance based on model size (zoom out more)
    const distance = maxDim * 1.8;

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

        {/* Selected Regions Panel */}
        <Box
          sx={{
            flex: { xs: "none", md: 1 },
            minWidth: { md: 280 },
            maxWidth: { md: 320 },
            bgcolor: "background.paper",
            borderRadius: auraTokens.borderRadius.md,
            border: "1px solid",
            borderColor: "divider",
            p: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Selected Areas{" "}
            {selectedRegions.length > 0 && `(${selectedRegions.length})`}
          </Typography>

          {selectedRegions.length === 0 ? (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 4,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Click on the body model to mark pain areas
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1} sx={{ flex: 1, overflow: "auto" }}>
              {selectedRegions.map((region, i) => {
                const quality = PAIN_QUALITIES.find(
                  (q) => q.id === region.quality,
                );
                const displayName = getRegionDisplayName(region.meshName);
                return (
                  <Box
                    key={i}
                    sx={{
                      p: 1.5,
                      bgcolor: "background.elevation1",
                      borderRadius: auraTokens.borderRadius.sm,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: quality?.color,
                        flexShrink: 0,
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
                        sx={{ color: "text.secondary" }}
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

      {/* Pain Detail Popover */}
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
              borderRadius: auraTokens.borderRadius.lg,
              boxShadow: 6,
              overflow: "visible",
            },
          },
        }}
      >
        <Paper sx={{ p: 2.5, width: 320 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {pendingMesh
                  ? getRegionDisplayName(pendingMesh)
                  : "Pain Details"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Select the type and intensity of your pain
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={closePopover}
              sx={{ mt: -0.5, mr: -0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Pain Type Selection */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, mb: 1, display: "block" }}
          >
            Pain Type
          </Typography>
          <Stack spacing={1} sx={{ mb: 3 }}>
            {PAIN_QUALITIES.map((quality) => (
              <Box
                key={quality.id}
                onClick={() => setPendingQuality(quality)}
                sx={{
                  p: 1.5,
                  borderRadius: auraTokens.borderRadius.sm,
                  border: "2px solid",
                  borderColor:
                    pendingQuality.id === quality.id
                      ? quality.color
                      : "divider",
                  bgcolor:
                    pendingQuality.id === quality.id
                      ? `${quality.color}15`
                      : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: quality.color,
                    bgcolor: `${quality.color}10`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    bgcolor: quality.color,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    fontWeight={pendingQuality.id === quality.id ? 600 : 500}
                  >
                    {quality.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ lineHeight: 1.2 }}
                  >
                    {quality.id === "dull" &&
                      "Muscles, joints - heavy, throbbing, stiff"}
                    {quality.id === "sharp" &&
                      "Sudden, knife-like, catching, stabbing"}
                    {quality.id === "burning" &&
                      "Nerve pain - burning, shooting, tingling"}
                  </Typography>
                </Box>
                {pendingQuality.id === quality.id && (
                  <CheckIcon sx={{ color: quality.color, fontSize: 20 }} />
                )}
              </Box>
            ))}
          </Stack>

          {/* Intensity Slider */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 600, mb: 1, display: "block" }}
          >
            Pain Intensity
          </Typography>
          <Box sx={{ px: 1 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Mild
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ color: pendingQuality.color }}
              >
                {pendingIntensity}/10
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Severe
              </Typography>
            </Box>
            <Slider
              value={pendingIntensity}
              onChange={(_, val) => setPendingIntensity(val as number)}
              min={1}
              max={10}
              marks={[
                { value: 1, label: "1" },
                { value: 5, label: "5" },
                { value: 10, label: "10" },
              ]}
              sx={{
                color: pendingQuality.color,
                "& .MuiSlider-markLabel": {
                  fontSize: "0.7rem",
                  color: "text.secondary",
                },
              }}
            />
          </Box>

          {/* Confirm Button */}
          <Box sx={{ display: "flex", gap: 1, mt: 3 }}>
            <Chip
              label="Cancel"
              onClick={closePopover}
              variant="outlined"
              sx={{ flex: 1, height: 40 }}
            />
            <Chip
              label="Add Pain Area"
              onClick={handleConfirmPain}
              sx={{
                flex: 2,
                height: 40,
                bgcolor: pendingQuality.color,
                color: "white",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: pendingQuality.color,
                  filter: "brightness(0.9)",
                },
              }}
            />
          </Box>
        </Paper>
      </Popover>
    </Box>
  );
}
