export interface Hotspot {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const frontHotspots: Hotspot[] = [
  // Head & Neck
  { id: 1, name: "Forehead", x: 0.45, y: 0.02, width: 0.1, height: 0.03 },
  { id: 1, name: "Left Temple", x: 0.35, y: 0.04, width: 0.05, height: 0.03 },
  { id: 1, name: "Right Temple", x: 0.6, y: 0.04, width: 0.05, height: 0.03 },
  { id: 1, name: "Left Eye", x: 0.4, y: 0.06, width: 0.05, height: 0.02 },
  { id: 1, name: "Right Eye", x: 0.55, y: 0.06, width: 0.05, height: 0.02 },
  { id: 1, name: "Nose", x: 0.48, y: 0.08, width: 0.04, height: 0.03 },
  { id: 1, name: "Left Cheek", x: 0.38, y: 0.09, width: 0.08, height: 0.04 },
  { id: 1, name: "Right Cheek", x: 0.54, y: 0.09, width: 0.08, height: 0.04 },
  { id: 1, name: "Jaw", x: 0.46, y: 0.13, width: 0.08, height: 0.03 },
  { id: 2, name: "Neck (Front)", x: 0.46, y: 0.17, width: 0.08, height: 0.04 },

  // Shoulders & Chest
  { id: 3, name: "Left Shoulder", x: 0.28, y: 0.2, width: 0.08, height: 0.06 },
  { id: 4, name: "Right Shoulder", x: 0.64, y: 0.2, width: 0.08, height: 0.06 },
  { id: 5, name: "Chest (Upper)", x: 0.46, y: 0.23, width: 0.08, height: 0.06 },
  { id: 6, name: "Left Pectoral", x: 0.36, y: 0.24, width: 0.09, height: 0.06 },
  {
    id: 7,
    name: "Right Pectoral",
    x: 0.55,
    y: 0.24,
    width: 0.09,
    height: 0.06,
  },

  // Abdomen
  {
    id: 12,
    name: "Upper Abdomen",
    x: 0.46,
    y: 0.33,
    width: 0.08,
    height: 0.05,
  },
  {
    id: 13,
    name: "Left Upper Abdomen",
    x: 0.38,
    y: 0.33,
    width: 0.07,
    height: 0.05,
  },
  {
    id: 14,
    name: "Right Upper Abdomen",
    x: 0.55,
    y: 0.33,
    width: 0.07,
    height: 0.05,
  },
  { id: 15, name: "Navel Area", x: 0.48, y: 0.39, width: 0.04, height: 0.03 },
  {
    id: 16,
    name: "Left Lower Abdomen",
    x: 0.4,
    y: 0.42,
    width: 0.06,
    height: 0.06,
  },
  {
    id: 17,
    name: "Right Lower Abdomen",
    x: 0.54,
    y: 0.42,
    width: 0.06,
    height: 0.06,
  },
  { id: 20, name: "Pelvis", x: 0.47, y: 0.49, width: 0.06, height: 0.04 },

  // Arms
  { id: 8, name: "Left Upper Arm", x: 0.24, y: 0.28, width: 0.05, height: 0.1 },
  {
    id: 9,
    name: "Right Upper Arm",
    x: 0.71,
    y: 0.28,
    width: 0.05,
    height: 0.1,
  },
  { id: 8, name: "Left Elbow", x: 0.22, y: 0.38, width: 0.04, height: 0.04 },
  { id: 9, name: "Right Elbow", x: 0.74, y: 0.38, width: 0.04, height: 0.04 },
  { id: 10, name: "Left Forearm", x: 0.18, y: 0.43, width: 0.05, height: 0.1 },
  { id: 11, name: "Right Forearm", x: 0.77, y: 0.43, width: 0.05, height: 0.1 },
  { id: 10, name: "Left Wrist", x: 0.17, y: 0.53, width: 0.04, height: 0.03 },
  { id: 11, name: "Right Wrist", x: 0.79, y: 0.53, width: 0.04, height: 0.03 },
  { id: 10, name: "Left Hand", x: 0.16, y: 0.57, width: 0.05, height: 0.08 },
  { id: 11, name: "Right Hand", x: 0.79, y: 0.57, width: 0.05, height: 0.08 },

  // Hips & Legs
  { id: 21, name: "Left Hip", x: 0.4, y: 0.52, width: 0.06, height: 0.06 },
  { id: 22, name: "Right Hip", x: 0.54, y: 0.52, width: 0.06, height: 0.06 },
  {
    id: 23,
    name: "Left Thigh (Front)",
    x: 0.4,
    y: 0.6,
    width: 0.06,
    height: 0.12,
  },
  {
    id: 24,
    name: "Right Thigh (Front)",
    x: 0.54,
    y: 0.6,
    width: 0.06,
    height: 0.12,
  },
  { id: 25, name: "Left Knee", x: 0.41, y: 0.73, width: 0.05, height: 0.05 },
  { id: 26, name: "Right Knee", x: 0.54, y: 0.73, width: 0.05, height: 0.05 },
  { id: 27, name: "Left Shin", x: 0.42, y: 0.79, width: 0.04, height: 0.12 },
  { id: 28, name: "Right Shin", x: 0.54, y: 0.79, width: 0.04, height: 0.12 },
  { id: 29, name: "Left Ankle", x: 0.42, y: 0.92, width: 0.04, height: 0.03 },
  { id: 30, name: "Right Ankle", x: 0.54, y: 0.92, width: 0.04, height: 0.03 },
  { id: 31, name: "Left Foot", x: 0.41, y: 0.96, width: 0.05, height: 0.04 },
  { id: 32, name: "Right Foot", x: 0.54, y: 0.96, width: 0.05, height: 0.04 },
];

export const backHotspots: Hotspot[] = [
  // Head & Neck
  { id: 33, name: "Back of Head", x: 0.48, y: 0.05, width: 0.08, height: 0.06 },
  { id: 34, name: "Neck (Back)", x: 0.47, y: 0.12, width: 0.06, height: 0.06 },

  // Upper Back
  {
    id: 35,
    name: "Left Upper Trapezius",
    x: 0.38,
    y: 0.18,
    width: 0.08,
    height: 0.06,
  },
  {
    id: 36,
    name: "Right Upper Trapezius",
    x: 0.54,
    y: 0.18,
    width: 0.08,
    height: 0.06,
  },
  {
    id: 37,
    name: "Upper Back (Thoracic)",
    x: 0.46,
    y: 0.24,
    width: 0.08,
    height: 0.1,
  },
  {
    id: 38,
    name: "Left Shoulder Blade",
    x: 0.38,
    y: 0.26,
    width: 0.07,
    height: 0.08,
  },
  {
    id: 39,
    name: "Right Shoulder Blade",
    x: 0.55,
    y: 0.26,
    width: 0.07,
    height: 0.08,
  },

  // Mid & Lower Back
  { id: 40, name: "Mid Back", x: 0.46, y: 0.36, width: 0.08, height: 0.08 },
  {
    id: 41,
    name: "Lower Back (Lumbar)",
    x: 0.46,
    y: 0.45,
    width: 0.08,
    height: 0.08,
  },
  { id: 42, name: "Sacrum", x: 0.47, y: 0.54, width: 0.06, height: 0.06 },
  { id: 43, name: "Left Buttock", x: 0.4, y: 0.56, width: 0.06, height: 0.08 },
  {
    id: 44,
    name: "Right Buttock",
    x: 0.54,
    y: 0.56,
    width: 0.06,
    height: 0.08,
  },

  // Arms (Back)
  {
    id: 45,
    name: "Left Shoulder (Back)",
    x: 0.3,
    y: 0.22,
    width: 0.06,
    height: 0.06,
  },
  {
    id: 46,
    name: "Right Shoulder (Back)",
    x: 0.64,
    y: 0.22,
    width: 0.06,
    height: 0.06,
  },
  { id: 47, name: "Left Triceps", x: 0.25, y: 0.3, width: 0.05, height: 0.1 },
  { id: 48, name: "Right Triceps", x: 0.7, y: 0.3, width: 0.05, height: 0.1 },
  {
    id: 49,
    name: "Left Elbow (Back)",
    x: 0.23,
    y: 0.4,
    width: 0.04,
    height: 0.04,
  },
  {
    id: 50,
    name: "Right Elbow (Back)",
    x: 0.73,
    y: 0.4,
    width: 0.04,
    height: 0.04,
  },
  {
    id: 51,
    name: "Left Forearm (Back)",
    x: 0.19,
    y: 0.45,
    width: 0.05,
    height: 0.1,
  },
  {
    id: 52,
    name: "Right Forearm (Back)",
    x: 0.76,
    y: 0.45,
    width: 0.05,
    height: 0.1,
  },

  // Legs (Back)
  {
    id: 53,
    name: "Left Hamstring",
    x: 0.4,
    y: 0.65,
    width: 0.06,
    height: 0.12,
  },
  {
    id: 54,
    name: "Right Hamstring",
    x: 0.54,
    y: 0.65,
    width: 0.06,
    height: 0.12,
  },
  {
    id: 55,
    name: "Left Knee (Back)",
    x: 0.41,
    y: 0.78,
    width: 0.05,
    height: 0.04,
  },
  {
    id: 56,
    name: "Right Knee (Back)",
    x: 0.54,
    y: 0.78,
    width: 0.05,
    height: 0.04,
  },
  { id: 57, name: "Left Calf", x: 0.42, y: 0.83, width: 0.04, height: 0.1 },
  { id: 58, name: "Right Calf", x: 0.54, y: 0.83, width: 0.04, height: 0.1 },
  {
    id: 59,
    name: "Left Achilles",
    x: 0.42,
    y: 0.93,
    width: 0.03,
    height: 0.03,
  },
  {
    id: 60,
    name: "Right Achilles",
    x: 0.55,
    y: 0.93,
    width: 0.03,
    height: 0.03,
  },
];

export function findHotspot(
  x: number,
  y: number,
  view: "front" | "back",
): Hotspot | null {
  const hotspots = view === "front" ? frontHotspots : backHotspots;

  return (
    hotspots.find(
      (h) => x >= h.x && x <= h.x + h.width && y >= h.y && y <= h.y + h.height,
    ) || null
  );
}
