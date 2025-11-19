// Pain Drawing Types for Phase 1

export type AvatarType = 'male' | 'female' | 'child';
export type ViewOrientation = 'front' | 'back';
export type BodySubdivision = 'simple' | 'dermatome' | 'myotome';
export type DepthIndicator = 'superficial' | 'deep';
export type SubmissionSource = 'portal' | 'mobile' | 'no-login' | 'clinic';

export interface PainQuality {
  quality: string;
  color: string;
  snomedCode?: string;
}

export const PAIN_QUALITIES: PainQuality[] = [
  { quality: 'Burning', color: '#ef4444', snomedCode: '90673000' },
  { quality: 'Throbbing', color: '#f97316', snomedCode: '8708008' },
  { quality: 'Sharp', color: '#eab308', snomedCode: '8708008' },
  { quality: 'Dull/Aching', color: '#22c55e', snomedCode: '410711009' },
  { quality: 'Numbness', color: '#3b82f6', snomedCode: '44077006' },
  { quality: 'Tingling', color: '#8b5cf6', snomedCode: '62507009' },
];

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
}

export interface PainDrawingData {
  paths: DrawingPath[];
  annotations: Annotation[];
  heatmapData?: string; // Base64 encoded image
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
  drawingMode: 'draw' | 'erase';
  paths: DrawingPath[];
  annotations: Annotation[];
  history: DrawingPath[][];
  historyIndex: number;
}
