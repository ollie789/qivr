import api from '../lib/api-client';

type ISODateString = string;

export interface PeriodDto {
  from: ISODateString;
  to: ISODateString;
}

export interface AppointmentMetrics {
  totalScheduled: number;
  completed: number;
  noShows: number;
  cancelled: number;
  averageWaitTime: number;
  averageDuration: number;
  utilizationRate: number;
}

export interface PatientMetrics {
  newPatients: number;
  returningPatients: number;
  averageVisitsPerPatient: number;
  patientRetentionRate: number;
  patientSatisfactionScore: number;
}

export interface PromMetrics {
  totalSent: number;
  completed: number;
  completionRate: number;
  averageScore: number;
  highRiskPatients: number;
}

export interface RevenueMetrics {
  totalBilled: number;
  totalCollected: number;
  outstandingBalance: number;
  collectionRate: number;
  averageRevenuePerPatient: number;
}

export interface DiagnosisCount {
  code: string;
  description: string;
  count: number;
}

export interface ProcedureCount {
  code: string;
  description: string;
  count: number;
}

export interface AppointmentTrend {
  date: ISODateString;
  appointments: number;
  completed: number;
  cancellations: number;
  noShows: number;
  newPatients: number;
}

export interface PromCompletionBreakdown {
  templateName: string;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface ProviderPerformance {
  providerId: string;
  providerName: string;
  patients: number;
  appointmentsCompleted: number;
  noShowRate: number;
  revenue: number;
  satisfaction: number;
  averageWaitTime: number;
}

export interface ClinicAnalytics {
  period: PeriodDto;
  appointmentMetrics: AppointmentMetrics;
  patientMetrics: PatientMetrics;
  promMetrics: PromMetrics;
  revenueMetrics: RevenueMetrics;
  topDiagnoses: DiagnosisCount[];
  topProcedures: ProcedureCount[];
  appointmentTrends: AppointmentTrend[];
  promCompletionBreakdown: PromCompletionBreakdown[];
  providerPerformance: ProviderPerformance[];
}

export interface DashboardStats {
  todayAppointments: number;
  pendingIntakes: number;
  activePatients: number;
  completedToday: number;
  averageWaitTime: number;
  patientSatisfaction: number;
}

const buildSearchParams = (params?: { from?: Date; to?: Date }) => {
  const search = new URLSearchParams();
  if (params?.from) {
    search.set('from', params.from.toISOString());
  }
  if (params?.to) {
    search.set('to', params.to.toISOString());
  }
  return search;
};

const getClinicAnalytics = async (
  clinicId: string,
  params?: { from?: Date; to?: Date }
): Promise<ClinicAnalytics> => {
  const search = buildSearchParams(params);
  const query = search.toString();
  const url = `/api/clinic-management/clinics/${clinicId}/analytics${query ? `?${query}` : ''}`;
  return await api.get<ClinicAnalytics>(url);
};

const analyticsApi = {
  getClinicAnalytics,
};

export { analyticsApi };
export default analyticsApi;
