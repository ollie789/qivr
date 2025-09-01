import axios from 'axios';

const API_ROOT_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
const API_URL = API_ROOT_URL.replace(/\/+$/, '');

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('clinic-auth-storage');
  if (authStorage) {
    const { state } = JSON.parse(authStorage);
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

export interface DashboardStats {
  todayAppointments: number;
  pendingIntakes: number;
  activePatients: number;
  completedToday: number;
  averageWaitTime: number;
  patientSatisfaction: number;
}

export interface RecentActivity {
  id: string;
  type: 'intake' | 'appointment' | 'prom' | 'update';
  patientName: string;
  description: string;
  timestamp: string;
  status?: string;
}

export interface AppointmentSummary {
  id: string;
  patientName: string;
  time: string;
  type: string;
  provider: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
}

export const dashboardApi = {
  // Get dashboard statistics
  async getStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  },

  // Get recent activity
  async getRecentActivity(): Promise<RecentActivity[]> {
    const response = await apiClient.get('/api/dashboard/activity');
    return response.data;
  },

  // Get today's appointments
  async getTodayAppointments(): Promise<AppointmentSummary[]> {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const response = await apiClient.get('/api/appointments', {
        params: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });
      const appts = Array.isArray(response.data) ? response.data : [];
      return appts.map((a: any) => ({
        id: a.id,
        patientName: a.patientName || '',
        time: new Date(a.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: a.appointmentType,
        provider: a.providerName || '',
        status: (typeof a.status === 'string' ? a.status : (a.status?.toString?.() || 'scheduled')).toLowerCase(),
      }));
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      return [];
    }
  },

  // Get intake queue count
  async getIntakeQueueCount(): Promise<number> {
    const response = await apiClient.get('/api/intakes/count');
    return response.data.count || response.data;
  },
};

export default dashboardApi;
