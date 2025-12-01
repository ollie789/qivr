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

// ==========================================
// Research Analytics Types (Perfect Study)
// ==========================================

// Perception Metrics
export interface GpeDistribution {
  veryMuchWorse: number;
  muchWorse: number;
  slightlyWorse: number;
  noChange: number;
  slightlyBetter: number;
  muchBetter: number;
  veryMuchBetter: number;
  averageGpe: number | null;
  totalResponses: number;
}

export interface DevicePerceptionMetrics {
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  patientCount: number;
  suppressedDueToPrivacy: boolean;
  gpeDistribution?: GpeDistribution;
  passRate: number | null;
  passResponses: number;
  averageSatisfaction: number | null;
  satisfactionResponses: number;
  perceivedSuccessRate: number | null;
  successResponses: number;
  averageExpectationMatch: number | null;
  expectationResponses: number;
  netPromoterScore: number | null;
  npsResponses: number;
}

// MCID Analysis
export interface PromTypeMcid {
  promType: string;
  patientCount: number;
  averageBaselineScore: number;
  averageFollowUpScore: number;
  averageChange: number;
  averagePercentChange: number;
  traditionalMcid: number | null;
  patientCenteredMcid: number | null;
  responderRate: number;
  respondersCount: number;
}

export interface DeviceMcidAnalysis {
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  patientCount: number;
  suppressedDueToPrivacy: boolean;
  mcidByPromType: PromTypeMcid[];
}

// Discordance Analysis
export interface DeviceDiscordanceAnalysis {
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  patientCount: number;
  suppressedDueToPrivacy: boolean;
  concordantSuccessCount: number;
  concordantSuccessRate: number;
  concordantNonSuccessCount: number;
  concordantNonSuccessRate: number;
  discordantObjectiveSuccessCount: number;
  discordantObjectiveSuccessRate: number;
  discordantSubjectiveSuccessCount: number;
  discordantSubjectiveSuccessRate: number;
  totalDiscordanceRate: number;
}

// Cohort Analytics
export interface FollowUpInterval {
  weeksPostProcedure: number;
  totalScheduled: number;
  completed: number;
  completionRate: number;
  withPerceptionData: number;
}

export interface MonthlyEnrollment {
  year: number;
  month: number;
  newPatients: number;
  procedures: number;
}

export interface DeviceEnrollment {
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  patientCount: number;
  procedureCount: number;
  withBaseline: number;
}

export interface CohortAnalyticsResponse {
  totalPatients: number;
  totalProcedures: number;
  patientsWithBaseline: number;
  baselineCompletionRate: number;
  followUpIntervals: FollowUpInterval[];
  monthlyEnrollment: MonthlyEnrollment[];
  deviceBreakdown: DeviceEnrollment[];
}

// Recovery Timeline
export interface RecoveryDataPoint {
  weeksPostProcedure: number;
  patientCount: number;
  averageScore: number;
  medianScore: number;
  percentile25: number;
  percentile75: number;
  minScore: number;
  maxScore: number;
  averageChangeFromBaseline: number;
}

export interface RecoveryTimelineResponse {
  deviceId: string;
  deviceName: string;
  promType: string;
  suppressedDueToPrivacy: boolean;
  patientCount: number;
  dataPoints: RecoveryDataPoint[];
}

// ==========================================
// Demographic Stratification Types
// ==========================================

export interface DemographicSubgroup {
  label: string;
  patientCount: number;
  averageBaselineScore: number;
  averageFollowUpScore: number;
  averageImprovement: number;
  percentImproved: number;
  suppressedDueToPrivacy: boolean;
}

export interface DeviceDemographicBreakdown {
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  patientCount: number;
  suppressedDueToPrivacy: boolean;
  ageGroups: DemographicSubgroup[];
  genderGroups: DemographicSubgroup[];
  geographicGroups: DemographicSubgroup[];
}

export interface DemographicStratificationResponse {
  devices: DeviceDemographicBreakdown[];
  totalPatients: number;
  patientsWithDemographics: number;
}
