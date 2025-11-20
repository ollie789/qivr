// Pain Drawing Types for Phase 1 & 2

export type AvatarType = 'male' | 'female' | 'child';
export type ViewOrientation = 'front' | 'back';
export type BodySubdivision = 'simple' | 'dermatome' | 'myotome';
export type DepthIndicator = 'superficial' | 'deep';
export type SubmissionSource = 'portal' | 'mobile' | 'no-login' | 'clinic';
export type DrawingTool = 'draw' | 'erase' | 'arrow' | 'text' | 'symbol';
export type SymbolType = 'pin' | 'lightning' | 'star' | 'cross';

export interface PainQuality {
  id: string;
  label: string;
  quality: string;
  color: string;
  snomedCode?: string;
}

export const PAIN_QUALITIES: PainQuality[] = [
  { id: 'burning', label: 'Burning', quality: 'Burning', color: '#ef4444', snomedCode: '90673000' },
  { id: 'throbbing', label: 'Throbbing', quality: 'Throbbing', color: '#f97316', snomedCode: '8708008' },
  { id: 'sharp', label: 'Sharp', quality: 'Sharp', color: '#eab308', snomedCode: '8708008' },
  { id: 'dull', label: 'Dull/Aching', quality: 'Dull/Aching', color: '#22c55e', snomedCode: '410711009' },
  { id: 'numbness', label: 'Numbness', quality: 'Numbness', color: '#3b82f6', snomedCode: '44077006' },
  { id: 'tingling', label: 'Tingling', quality: 'Tingling', color: '#8b5cf6', snomedCode: '62507009' },
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
  cameraView: 'front' | 'back' | 'left' | 'right';
  timestamp: string;
}

// Export anatomical regions
export * from './anatomical-regions';

export interface DrawingPath {
  pathData: string; // SVG path data
  color: string;
  opacity: number;
  brushSize: number;
}

export interface Annotation {
  type: 'arrow' | 'text' | 'symbol';
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
  history: { paths: DrawingPath[]; annotations: Annotation[] }[];
  historyIndex: number;
  zoom: number;
  panX: number;
  panY: number;
}
