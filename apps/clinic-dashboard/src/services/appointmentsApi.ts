import apiClient from './sharedApiClient';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  providerId: string;
  providerName: string;
  scheduledStart: string;
  scheduledEnd: string;
  appointmentType: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  videoLink?: string;
  location?: string;
  reasonForVisit?: string;
  insuranceVerified?: boolean;
  copayAmount?: number;
  followUpRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  appointmentType: string;
  reasonForVisit?: string;
  notes?: string;
  location?: string;
  sendReminder?: boolean;
}

export interface AppointmentSlot {
  start: string;
  end: string;
  available: boolean;
  providerId: string;
}

class AppointmentsApi {
  async getAppointments(params?: {
    startDate?: string;
    endDate?: string;
    patientId?: string;
    providerId?: string;
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/api/Appointments', { params });
    return response.data;
  }

  async getAppointment(id: string) {
    const response = await apiClient.get(`/api/Appointments/${id}`);
    return response.data;
  }

  async createAppointment(data: CreateAppointmentRequest) {
    const response = await apiClient.post('/api/Appointments/book', data);
    return response.data;
  }

  async updateAppointment(id: string, data: Partial<CreateAppointmentRequest>) {
    const response = await apiClient.put(`/api/Appointments/${id}`, data);
    return response.data;
  }

  async cancelAppointment(id: string, reason?: string) {
    const response = await apiClient.post(`/api/Appointments/${id}/cancel`, { reason });
    return response.data;
  }

  async confirmAppointment(id: string) {
    const response = await apiClient.post(`/api/Appointments/${id}/confirm`);
    return response.data;
  }

  async rescheduleAppointment(id: string, data: {
    scheduledStart: string;
    scheduledEnd: string;
    reason?: string;
  }) {
    const response = await apiClient.post(`/api/Appointments/${id}/reschedule`, data);
    return response.data;
  }

  async markAsNoShow(id: string) {
    const response = await apiClient.post(`/api/Appointments/${id}/no-show`);
    return response.data;
  }

  async completeAppointment(id: string, data?: {
    notes?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
  }) {
    const response = await apiClient.post(`/api/Appointments/${id}/complete`, data);
    return response.data;
  }

  async getAvailableSlots(params: {
    providerId: string;
    date: string;
    duration: number;
  }) {
    const response = await apiClient.get('/api/Appointments/availability', { params });
    return response.data;
  }

  async sendReminder(id: string) {
    const response = await apiClient.post(`/api/Appointments/${id}/send-reminder`);
    return response.data;
  }

  async getUpcoming(days: number = 7) {
    const response = await apiClient.get('/api/Appointments/upcoming', { 
      params: { days } 
    });
    return response.data;
  }

  async getWaitlist() {
    const response = await apiClient.get('/api/Appointments/waitlist');
    return response.data;
  }

  async addToWaitlist(data: {
    patientId: string;
    providerId?: string;
    preferredDates?: string[];
    appointmentType: string;
    notes?: string;
  }) {
    const response = await apiClient.post('/api/Appointments/waitlist', data);
    return response.data;
  }
}

export const appointmentsApi = new AppointmentsApi();
