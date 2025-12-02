import apiClient from "../lib/api-client";

export interface DashboardMetrics {
  todayAppointments: number;
  completedToday: number;
  cancelledToday: number;
  noShowToday: number;
  completionRate: number;
  pendingIntakes: number;
  totalPatients: number;
  newPatientsThisMonth: number;
  estimatedRevenue: number;
  noShowRate: number;
  averageWaitTime: number;
  staffUtilization: number;
}

export interface ClinicalAnalytics {
  averagePromScore: number;
  totalEvaluations: number;
  topConditions: Array<{ condition: string; count: number }>;
  averagePainIntensity: number;
  bodyRegionDistribution: Array<{
    region: string;
    count: number;
    avgIntensity: number;
  }>;
  patientImprovementRate: number;
  totalPatientsTracked: number;
  appointmentTrends?: Array<{
    date: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>;
  promCompletionData?: Array<{
    week: string;
    completed: number;
    pending: number;
    completionRate: number;
  }>;
  patientSatisfaction?: number;
}

export interface PainMapAnalytics {
  totalPainMaps: number;
  painPoints3D: Array<{
    x: number;
    y: number;
    z: number;
    intensity: number;
    bodyRegion: string;
    painType: string;
  }>;
  painTypeDistribution: Array<{ type: string; count: number }>;
  intensityDistribution: Array<{ range: string; count: number }>;
  averageIntensity: number;
  mostCommonRegion: string;
}

// Unified analytics types matching backend ClinicAnalyticsController
export type TrendDirection = "up" | "down" | "stable";
export type MetricStatus = "good" | "warning" | "critical";
export type GoalStatus = "on-track" | "behind" | "achieved";
export type CorrelationSignificance = "high" | "medium" | "low";

export interface ClinicHealthMetric {
  id: string;
  category: string;
  name: string;
  value: number;
  unit: string;
  date: string;
  trend: TrendDirection;
  percentageChange: number;
  status: MetricStatus;
  target?: number;
}

export interface ClinicPromAnalytics {
  templateName: string;
  totalCount: number;
  completedCount: number;
  completionRate: number;
  averageScore: number;
}

export interface ClinicHealthGoal {
  id: string;
  title: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  progress: number;
  status: GoalStatus;
}

export interface ClinicMetricCorrelation {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: CorrelationSignificance;
}

export interface UnifiedAnalyticsData {
  healthMetrics: ClinicHealthMetric[];
  promAnalytics: ClinicPromAnalytics[];
  healthGoals: ClinicHealthGoal[];
  correlations: ClinicMetricCorrelation[];
  loading: boolean;
}

async function getDashboardMetrics(date?: Date): Promise<DashboardMetrics> {
  const params = date ? { date: date.toISOString() } : undefined;
  return apiClient.get("/api/clinic-analytics/dashboard", params);
}

async function getClinicalAnalytics(
  from?: Date,
  to?: Date,
): Promise<ClinicalAnalytics> {
  const params: Record<string, string> = {};
  if (from) params.from = from.toISOString();
  if (to) params.to = to.toISOString();
  return apiClient.get("/api/clinic-analytics/clinical", params);
}

async function getPainMapAnalytics(
  from?: Date,
  to?: Date,
): Promise<PainMapAnalytics> {
  const params: Record<string, string> = {};
  if (from) params.from = from.toISOString();
  if (to) params.to = to.toISOString();
  return apiClient.get("/api/clinic-analytics/pain-maps", params);
}

async function getUnifiedAnalytics(days = 30): Promise<UnifiedAnalyticsData> {
  return apiClient.get("/api/clinic-analytics/unified", { days: days.toString() });
}

const analyticsApi = {
  getDashboardMetrics,
  getClinicalAnalytics,
  getPainMapAnalytics,
  getUnifiedAnalytics,
};

export { analyticsApi };
export default analyticsApi;
