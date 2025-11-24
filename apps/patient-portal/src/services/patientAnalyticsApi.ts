import apiClient from "../lib/api-client";

export interface PatientDashboardData {
  upcomingAppointments: number;
  completedAppointments: number;
  totalAppointments: number;
  currentPromScore: number;
  promImprovement: number;
  currentStreak: number;
  longestStreak: number;
  currentPainLevel: number;
  painReduction: number;
  totalPromCompleted: number;
  achievements: Achievement[];
  level: number;
  pointsToNextLevel: number;
}

export interface Achievement {
  name: string;
  icon: string;
  description: string;
}

export interface PatientProgressData {
  promScoreTimeline: ScorePoint[];
  painIntensityTimeline: PainPoint[];
  attendanceRate: number;
  totalAppointments: number;
  completedAppointments: number;
}

export interface ScorePoint {
  date: string;
  score: number;
  type: string;
}

export interface PainPoint {
  date: string;
  intensity: number;
  bodyRegion: string;
}

async function getDashboard(): Promise<PatientDashboardData> {
  return apiClient.get("/api/patient-analytics/dashboard");
}

async function getProgress(
  from?: Date,
  to?: Date,
): Promise<PatientProgressData> {
  const params: Record<string, string> = {};
  if (from) params.from = from.toISOString();
  if (to) params.to = to.toISOString();
  return apiClient.get("/api/patient-analytics/progress", params);
}

const patientAnalyticsApi = {
  getDashboard,
  getProgress,
};

export default patientAnalyticsApi;
