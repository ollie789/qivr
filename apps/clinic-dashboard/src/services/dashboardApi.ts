import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
    try {
      const response = await apiClient.get('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return mock data for development
      return {
        todayAppointments: 12,
        pendingIntakes: 5,
        activePatients: 247,
        completedToday: 8,
        averageWaitTime: 15,
        patientSatisfaction: 4.8,
      };
    }
  },

  // Get recent activity
  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.get('/api/dashboard/activity');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          type: 'intake',
          patientName: 'John Doe',
          description: 'New intake form submitted',
          timestamp: new Date().toISOString(),
          status: 'pending',
        },
        {
          id: '2',
          type: 'appointment',
          patientName: 'Jane Smith',
          description: 'Appointment scheduled for tomorrow',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'scheduled',
        },
        {
          id: '3',
          type: 'prom',
          patientName: 'Bob Johnson',
          description: 'Completed pain assessment',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ];
    }
  },

  // Get today's appointments
  async getTodayAppointments(): Promise<AppointmentSummary[]> {
    try {
      const response = await apiClient.get('/api/appointments/today');
      return response.data;
    } catch (error) {
      console.error('Error fetching today appointments:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          patientName: 'Alice Brown',
          time: '09:00 AM',
          type: 'Initial Consultation',
          provider: 'Dr. Smith',
          status: 'completed',
        },
        {
          id: '2',
          patientName: 'Charlie Wilson',
          time: '10:30 AM',
          type: 'Follow-up',
          provider: 'Dr. Smith',
          status: 'in-progress',
        },
        {
          id: '3',
          patientName: 'Diana Prince',
          time: '02:00 PM',
          type: 'Assessment',
          provider: 'Dr. Smith',
          status: 'scheduled',
        },
      ];
    }
  },

  // Get intake queue count
  async getIntakeQueueCount(): Promise<number> {
    try {
      const response = await apiClient.get('/api/intakes/count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching intake count:', error);
      return 5; // Mock data
    }
  },
};

export default dashboardApi;
