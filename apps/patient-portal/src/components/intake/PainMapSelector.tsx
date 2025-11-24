import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Grid,
  Button,
  ButtonGroup,
} from "@mui/material";
import { findHotspot } from "../../data/painMapHotspots";

export interface PainPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  intensity: number;
}

interface PainMapSelectorProps {
  selectedPoints: PainPoint[];
  onChange: (points: PainPoint[]) => void;
}

export default function PainMapSelector({
  selectedPoints,
  onChange,
}: PainMapSelectorProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const [intensity, setIntensity] = useState(5);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const hotspot = findHotspot(x, y, view);
    if (!hotspot) return;

    const newPoint: PainPoint = {
      id: `${Date.now()}`,
      name: hotspot.name,
      x,
      y,
      intensity,
    };

    onChange([...selectedPoints, newPoint]);
  };

  const removePoint = (id: string) => {
    onChange(selectedPoints.filter((p) => p.id !== id));
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 2,
                alignItems: "center",
              }}
            >
              <ButtonGroup size="small">
                <Button
                  variant={view === "front" ? "contained" : "outlined"}
                  onClick={() => setView("front")}
                >
                  Front
                </Button>
                <Button
                  variant={view === "back" ? "contained" : "outlined"}
                  onClick={() => setView("back")}
                >
                  Back
                </Button>
              </ButtonGroup>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption">Pain: {intensity}/10</Typography>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  style={{ width: 100 }}
                />
              </Box>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Click on the body diagram to mark pain locations
            </Typography>

            <Box
              ref={canvasRef}
              onClick={handleCanvasClick}
              sx={{
                position: "relative",
                width: "100%",
                height: 600,
                backgroundImage: `url(/body-${view}.png)`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                cursor: "crosshair",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              {selectedPoints.map((point) => (
                <Box
                  key={point.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePoint(point.id);
                  }}
                  sx={{
                    position: "absolute",
                    left: `${point.x * 100}%`,
                    top: `${point.y * 100}%`,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    bgcolor: getIntensityColor(point.intensity),
                    border: "3px solid white",
                    boxShadow: 2,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    "&:hover": {
                      transform: "translate(-50%, -50%) scale(1.3)",
                    },
                  }}
                >
                  {point.intensity}
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
              Pain Points ({selectedPoints.length})
            </Typography>
            {selectedPoints.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No pain points selected. Click on the body diagram to add pain
                locations.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {selectedPoints.map((point) => (
                  <Chip
                    key={point.id}
                    label={`${point.name} (${point.intensity}/10)`}
                    onDelete={() => removePoint(point.id)}
                    sx={{
                      bgcolor: getIntensityColor(point.intensity),
                      color: "white",
                      "& .MuiChip-deleteIcon": {
                        color: "white",
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function getIntensityColor(intensity: number): string {
  if (intensity <= 3) return "#26CD82"; // Aura green (low pain)
  if (intensity <= 6) return "#F68D2A"; // Aura orange (medium pain)
  return "#EF4444"; // Aura red (high pain)
}
