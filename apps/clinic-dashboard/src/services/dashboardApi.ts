import api from '../lib/api-client';

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
  // Get dashboard statistics from clinic dashboard overview
  async getStats(): Promise<DashboardStats> {
    try {
      const data = await api.get<any>('/api/clinic-dashboard/overview');
      
      // Map the actual backend response to our dashboard stats
      return {
        todayAppointments: data.statistics?.totalAppointmentsToday || 0,
        pendingIntakes: data.statistics?.pendingAppointments || 0,
        activePatients: data.statistics?.totalPatientsThisWeek || 0,
        completedToday: data.statistics?.completedAppointments || 0,
        averageWaitTime: data.statistics?.averageWaitTime || 0,
        patientSatisfaction: 0, // Not available in current API
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return zeros instead of mock data
      return {
        todayAppointments: 0,
        pendingIntakes: 0,
        activePatients: 0,
        completedToday: 0,
        averageWaitTime: 0,
        patientSatisfaction: 0,
      };
    }
  },

  // Get recent activity from PROM submissions and appointments
  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const data = await api.get<any>('/api/clinic-dashboard/overview');
      
      const activities: RecentActivity[] = [];
      
      // Add PROM submissions as activities
      if (data.recentPromSubmissions) {
        data.recentPromSubmissions.forEach((prom: any) => {
          activities.push({
            id: prom.id,
            type: 'prom',
            patientName: prom.patientName,
            description: `Submitted ${prom.templateName}`,
            timestamp: prom.submittedAt,
            status: prom.requiresReview ? 'urgent' : 'normal',
          });
        });
      }
      
      // Add today's appointments as activities
      if (data.todaysAppointments) {
        data.todaysAppointments.forEach((apt: any) => {
          activities.push({
            id: apt.id,
            type: 'appointment',
            patientName: apt.patientName,
            description: apt.appointmentType || 'Appointment',
            timestamp: apt.scheduledStart,
            status: apt.status?.toLowerCase() || 'scheduled',
          });
        });
      }
      
      // Sort by timestamp
      return activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 10);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  },

  // Get today's appointments
  async getTodayAppointments(): Promise<AppointmentSummary[]> {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const params = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      const response = await api.get<any[]>(`/api/Appointments?${params}`);
      const appts = Array.isArray(response) ? response : [];
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
    // Intakes endpoint not available, return 0
    return 0;
  },
};

export default dashboardApi;
