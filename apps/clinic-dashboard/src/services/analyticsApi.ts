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

const analyticsApi = {
  getDashboardMetrics,
  getClinicalAnalytics,
  getPainMapAnalytics,
};

export { analyticsApi };
export default analyticsApi;
