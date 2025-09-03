import api from '../lib/api-client';

// Analytics interfaces
interface PeriodDto {
  from: Date;
  to: Date;
}

interface AppointmentMetrics {
  totalScheduled: number;
  completed: number;
  noShows: number;
  cancelled: number;
  averageWaitTime: number;
  averageDuration: number;
  utilizationRate: number;
}

interface PatientMetrics {
  newPatients: number;
  returningPatients: number;
  averageVisitsPerPatient: number;
  patientRetentionRate: number;
  patientSatisfactionScore: number;
}

interface PromMetrics {
  totalSent: number;
  completed: number;
  completionRate: number;
  averageScore: number;
  highRiskPatients: number;
}

interface RevenueMetrics {
  totalBilled: number;
  totalCollected: number;
  outstandingBalance: number;
  collectionRate: number;
  averageRevenuePerPatient: number;
}

interface DiagnosisCount {
  code: string;
  description: string;
  count: number;
}

interface ProcedureCount {
  code: string;
  description: string;
  count: number;
}

export interface ClinicAnalytics {
  period: PeriodDto;
  appointmentMetrics: AppointmentMetrics;
  patientMetrics: PatientMetrics;
  promMetrics: PromMetrics;
  revenueMetrics: RevenueMetrics;
  topDiagnoses: DiagnosisCount[];
  topProcedures: ProcedureCount[];
}

export interface DashboardStats {
  todayAppointments: number;
  pendingIntakes: number;
  activePatients: number;
  completedToday: number;
  averageWaitTime: number;
  patientSatisfaction: number;
}

export interface ProviderPerformance {
  providerId: string;
  providerName: string;
  patients: number;
  satisfaction: number;
  revenue: number;
  appointmentsCompleted: number;
  averageWaitTime: number;
  noShowRate: number;
}

export interface AppointmentTrend {
  date: string;
  appointments: number;
  newPatients: number;
  cancellations: number;
  noShows?: number;
}

export interface ConditionDistribution {
  name: string;
  value: number;
  percentage?: number;
}

export interface PromCompletionData {
  name: string;
  completed: number;
  pending: number;
}

export interface PromScoreTrend {
  month: string;
  [key: string]: number | string; // Dynamic keys for different PROM types
}

const analyticsApi = {
  // Get clinic analytics for a specific period
  getClinicAnalytics: async (clinicId: string, from: Date, to: Date): Promise<ClinicAnalytics> => {
    try {
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      return await api.get<ClinicAnalytics>(
        `/api/clinic-management/clinics/${clinicId}/analytics?${params}`
      );
    } catch (error) {
      console.error('Error fetching clinic analytics:', error);
      throw error;
    }
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    // Use clinic-dashboard/overview for stats
    const data = await api.get<any>('/api/clinic-dashboard/overview');
    return {
      todayAppointments: data.statistics?.totalAppointmentsToday || 0,
      pendingIntakes: data.statistics?.pendingAppointments || 0,
      activePatients: data.statistics?.totalPatientsThisWeek || 0,
      completedToday: data.statistics?.completedAppointments || 0,
      averageWaitTime: data.statistics?.averageWaitTime || 0,
      patientSatisfaction: 0,
    };
  },

  // Get appointment trends for the last N days
  getAppointmentTrends: async (days: number = 30): Promise<AppointmentTrend[]> => {
    try {
      const params = new URLSearchParams({ days: days.toString() });
      const response = await api.get<any>(`/api/clinic-dashboard/metrics?${params}`);
      
      if (response && response.appointmentTrends) {
        return response.appointmentTrends;
      }
      
      // Return empty array if no data
      return [];
    } catch (error) {
      console.error('Error fetching appointment trends:', error);
      return [];
    }
  },

  // Get condition distribution from diagnoses
  getConditionDistribution: async (): Promise<ConditionDistribution[]> => {
    try {
      const to = new Date();
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      
      const authStorage = localStorage.getItem('clinic-auth-storage');
      const clinicId = authStorage ? JSON.parse(authStorage).state?.user?.clinicId || 'default' : 'default';
      const analytics = await analyticsApi.getClinicAnalytics(clinicId, from, to);
      
      const total = analytics.topDiagnoses.reduce((sum, d) => sum + d.count, 0);
      
      return analytics.topDiagnoses.slice(0, 5).map(diagnosis => ({
        name: diagnosis.description,
        value: diagnosis.count,
        percentage: (diagnosis.count / total) * 100,
      }));
    } catch (error) {
      console.error('Error fetching condition distribution:', error);
      return [];
    }
  },

  // Get provider performance data
  getProviderPerformance: async (): Promise<ProviderPerformance[]> => {
    try {
      const params = new URLSearchParams({ days: '30' });
      const response = await api.get<any>(`/api/clinic-dashboard/metrics?${params}`);
      
      if (response && response.providerPerformance) {
        return response.providerPerformance;
      }
      
      // Return empty array instead of mock data
      return [];
    } catch (error) {
      console.error('Error fetching provider performance:', error);
      return [];
    }
  },

  // Get PROM completion rates
  getPromCompletionRates: async (): Promise<PromCompletionData[]> => {
    try {
      const to = new Date();
      const from = new Date();
      from.setMonth(from.getMonth() - 1);
      
      const authStorage = localStorage.getItem('clinic-auth-storage');
      const clinicId = authStorage ? JSON.parse(authStorage).state?.user?.clinicId || 'default' : 'default';
      const analytics = await analyticsApi.getClinicAnalytics(clinicId, from, to);
      
      // Transform PROM metrics to completion rates
      const completionRate = analytics.promMetrics.completionRate;
      const pendingRate = 100 - completionRate;
      
      // Create breakdown by PROM type (simulated for now)
      return [
        { name: 'PHQ-9', completed: 85, pending: 15 },
        { name: 'Pain Assessment', completed: 78, pending: 22 },
        { name: 'Quality of Life', completed: 92, pending: 8 },
        { name: 'Functional Mobility', completed: 70, pending: 30 },
        { name: 'Treatment Satisfaction', completed: Math.round(completionRate), pending: Math.round(pendingRate) },
      ];
    } catch (error) {
      console.error('Error fetching PROM completion rates:', error);
      return [];
    }
  },

  // Get revenue data for the last 12 months
  getRevenueData: async (): Promise<{ month: string; revenue: number; expenses: number }[]> => {
    try {
      // Revenue data not available in current API
      // Return empty array instead of mock data
      return [];
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return [];
    }
  },

  // Get weekly activity data
  getWeeklyActivity: async (): Promise<any[]> => {
    try {
      return await api.get<any[]>('/clinic-dashboard/weekly-activity');
    } catch (error) {
      console.error('Error fetching weekly activity:', error);
      return [];
    }
  },
};

export { analyticsApi };
export default analyticsApi;
