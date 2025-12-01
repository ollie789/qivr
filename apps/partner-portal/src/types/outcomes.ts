// Device outcome types matching the backend API responses

export interface DeviceOutcomeBriefSummary {
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  category?: string;
  bodyRegion?: string;
  patientCount: number;
  procedureCount: number;
  hasSufficientData: boolean;
}

export interface PromTypeOutcomeStats {
  promType: string;
  promName: string;
  baselineCount: number;
  baselineAverageScore: number;
  followUpCount: number;
  followUpAverageScore: number;
  finalOutcomeCount: number;
  finalOutcomeAverageScore: number;
  averageImprovement: number;
  percentImprovement: number;
}

export interface DateRangeInfo {
  earliestProcedure: string;
  latestProcedure: string;
}

export interface DeviceOutcomeSummaryResponse {
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  partnerName?: string;
  category?: string;
  bodyRegion?: string;
  patientCount: number;
  procedureCount: number;
  treatmentPlanCount: number;
  promResponseCount: number;
  supressedDueToPrivacy: boolean;
  message?: string;
  promTypeStats: PromTypeOutcomeStats[];
  dateRange?: DateRangeInfo;
}

export interface TimelineDataPoint {
  weeksPostProcedure: number;
  patientCount: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  responseCount: number;
}

export interface DeviceOutcomeTimelineResponse {
  deviceId: string;
  deviceName: string;
  promType: string;
  dataPoints: TimelineDataPoint[];
}

export interface DeviceComparisonResult {
  deviceId: string;
  deviceName: string;
  deviceCode?: string;
  category?: string;
  patientCount: number;
  supressedDueToPrivacy: boolean;
  baselineAverageScore: number;
  followUpAverageScore: number;
  averageImprovement: number;
  percentImprovement: number;
}

export interface DeviceComparisonResponse {
  promType: string;
  comparisons: DeviceComparisonResult[];
}

export interface Partner {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  contactEmail?: string;
}
