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

export interface PartnerProfile {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  contactEmail?: string;
  website?: string;
  description?: string;
  deviceCount: number;
  affiliatedClinicCount: number;
}

export interface Affiliation {
  id: string;
  tenantId: string;
  clinicName: string;
  status: string;
  dataSharingLevel: string;
  approvedAt?: string;
  notes?: string;
  patientCount: number;
}

export interface PartnerStats {
  totalDevices: number;
  totalAffiliatedClinics: number;
  totalPatients: number;
  totalProcedures: number;
  totalPromResponses: number;
  monthlyTrend: MonthlyDataPoint[];
}

export interface MonthlyDataPoint {
  year: number;
  month: number;
  procedureCount: number;
  patientCount: number;
}

// Device Management Types
export interface ManagedDevice {
  id: string;
  name: string;
  deviceCode: string;
  category?: string;
  bodyRegion?: string;
  description?: string;
  udiCode?: string;
  isActive: boolean;
  createdAt: string;
  usageCount: number;
  patientCount: number;
  updatedAt?: string;
}

export interface CreateDeviceRequest {
  name: string;
  deviceCode: string;
  category?: string;
  bodyRegion?: string;
  description?: string;
  udiCode?: string;
}

export interface UpdateDeviceRequest extends CreateDeviceRequest {}

export interface DeviceMetadata {
  categories: string[];
  bodyRegions: string[];
}

export interface BulkCreateResult {
  created: number;
  skipped: number;
  skippedCodes: string[];
  message: string;
}
