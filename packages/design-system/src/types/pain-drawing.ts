// Pain Drawing Types for Phase 1 & 2

export type AvatarType = "male" | "female" | "child";
export type ViewOrientation = "front" | "back";
export type BodySubdivision = "simple" | "dermatome" | "myotome";
export type DepthIndicator = "superficial" | "deep";
export type SubmissionSource = "portal" | "mobile" | "no-login" | "clinic";
export type DrawingTool = "draw" | "erase" | "arrow" | "text" | "symbol";
export type SymbolType = "pin" | "lightning" | "star" | "cross";

export interface PainQuality {
  id: string;
  label: string;
  quality: string;
  color: string;
  snomedCode?: string;
}

export const PAIN_QUALITIES: PainQuality[] = [
  // Type 1 – Dull / Aching (Mechanical) - muscles, joints, ligaments; "heavy", "throbbing", "stiff"
  {
    id: "dull",
    label: "Dull / Aching",
    quality: "Dull/Aching",
    color: "#14b8a6",
    snomedCode: "410711009",
  }, // Teal
  // Type 2 – Sharp / Stabbing (Acute) - sudden "knife-like", "catching", "stabbing" pain
  {
    id: "sharp",
    label: "Sharp / Stabbing",
    quality: "Sharp/Stabbing",
    color: "#f59e0b",
    snomedCode: "8708008",
  }, // Amber
  // Type 3 – Burning / Electric (Neuropathic) - nerve-type pain – burning, shooting, tingling, pins & needles
  {
    id: "burning",
    label: "Burning / Electric",
    quality: "Burning/Electric",
    color: "#ec4899",
    snomedCode: "90673000",
  }, // Magenta/Pink
];

// 3D Region-based pain map
export interface PainRegion {
  meshName: string;
  anatomicalName?: string;
  quality: string;
  intensity: number;
  snomedCode?: string;
}

export interface PainMap3DData {
  regions: PainRegion[];
  cameraView: "front" | "back" | "left" | "right";
  timestamp: string;
}

// Export anatomical regions
export * from "./anatomical-regions";

export interface DrawingPath {
  pathData: string; // SVG path data
  color: string;
  opacity: number;
  brushSize: number;
}

export interface Annotation {
  type: "arrow" | "text" | "symbol";
  x: number;
  y: number;
  content?: string;
  // Arrow-specific
  endX?: number;
  endY?: number;
  // Symbol-specific
  symbolType?: SymbolType;
  color?: string;
}

export interface PainDrawingData {
  paths: DrawingPath[];
  annotations: Annotation[];
  heatmapData?: string; // Base64 encoded image
  zoom?: number;
  panX?: number;
  panY?: number;
}

export interface PainMapData {
  id?: string;
  evaluationId?: string;
  bodyRegion: string;
  painIntensity: number; // 0-10
  painType?: string;
  painQuality: string[];
  onsetDate?: string;
  notes?: string;

  // Drawing fields
  avatarType?: AvatarType;
  bodySubdivision?: BodySubdivision;
  viewOrientation?: ViewOrientation;
  depthIndicator?: DepthIndicator;
  submissionSource?: SubmissionSource;
  drawingData?: PainDrawingData;
}

export interface PainDrawingState {
  avatarType: AvatarType;
  viewOrientation: ViewOrientation;
  selectedQuality: PainQuality;
  intensity: number;
  depthIndicator: DepthIndicator;
  brushSize: number;
  opacity: number;
  drawingTool: DrawingTool;
  selectedSymbol: SymbolType;
  paths: DrawingPath[];
  annotations: Annotation[];
  history: Array<{ paths: DrawingPath[]; annotations: Annotation[] }>;
  historyIndex: number;
  zoom: number;
  panX: number;
  panY: number;
}
