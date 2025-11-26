import apiClient from '../lib/api-client';

interface CursorPaginationResponse<T> {
  items: T[];
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
  count: number;
}

interface AppointmentDto {
  id: string;
  patientId: string;
  patientName?: string | null;
  patientEmail?: string | null;
  patientPhone?: string | null;
  providerId: string;
  providerName?: string | null;
  appointmentType: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  notes?: string | null;
  location?: string | null;
  reasonForVisit?: string | null;
  insuranceVerified?: boolean;
  copayAmount?: number;
  followUpRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

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

const mapAppointment = (dto: AppointmentDto): Appointment => ({
  id: dto.id,
  patientId: dto.patientId,
  patientName: dto.patientName ?? 'Unknown patient',
  patientEmail: dto.patientEmail ?? '',
  patientPhone: dto.patientPhone ?? '',
  providerId: dto.providerId,
  providerName: dto.providerName ?? 'Assigned provider',
  scheduledStart: dto.scheduledStart,
  scheduledEnd: dto.scheduledEnd,
  appointmentType: dto.appointmentType,
  status: (dto.status || '').toLowerCase() as Appointment['status'],
  notes: dto.notes ?? undefined,
  location: dto.location ?? undefined,
  reasonForVisit: dto.reasonForVisit ?? undefined,
  insuranceVerified: dto.insuranceVerified,
  copayAmount: dto.copayAmount,
  followUpRequired: dto.followUpRequired,
  createdAt: dto.createdAt,
  updatedAt: dto.updatedAt,
});

class AppointmentsApi {
  async getAppointments(params?: {
    startDate?: string;
    endDate?: string;
    patientId?: string;
    providerId?: string;
    status?: string;
    limit?: number;
    cursor?: string;
    sortDescending?: boolean;
  }): Promise<{ items: Appointment[]; nextCursor?: string | null; hasNext: boolean; }>
  {
    const payload = await apiClient.get<CursorPaginationResponse<AppointmentDto> | AppointmentDto[]>(
      '/api/appointments',
      { params },
    );

    const items = Array.isArray(payload)
      ? payload
      : payload?.items ?? (payload as any)?.Items ?? [];

    return {
      items: (items as AppointmentDto[]).map(mapAppointment),
      nextCursor: Array.isArray(payload) ? undefined : payload?.nextCursor ?? (payload as any)?.NextCursor,
      hasNext: Array.isArray(payload) ? false : Boolean(payload?.hasNext ?? (payload as any)?.HasNext),
    };
  }

  async getAppointment(id: string): Promise<Appointment> {
    const response = await apiClient.get<AppointmentDto>(`/api/appointments/${id}`);
    return mapAppointment(response);
  }

  async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    const response = await apiClient.post<AppointmentDto>('/api/appointments', data);
    return mapAppointment(response);
  }

  async updateAppointment(id: string, data: Partial<CreateAppointmentRequest>): Promise<Appointment> {
    const response = await apiClient.put<AppointmentDto>(`/api/appointments/${id}`, data);
    return mapAppointment(response);
  }

  async cancelAppointment(id: string, reason?: string) {
    return apiClient.post(`/api/appointments/${id}/cancel`, { reason });
  }

  async confirmAppointment(id: string) {
    return apiClient.post(`/api/appointments/${id}/confirm`);
  }

  async rescheduleAppointment(id: string, data: {
    scheduledStart: string;
    scheduledEnd: string;
    reason?: string;
  }) {
    return apiClient.post(`/api/appointments/${id}/reschedule`, data);
  }

  async markAsNoShow(id: string) {
    return apiClient.post(`/api/appointments/${id}/no-show`);
  }

  async completeAppointment(id: string, data?: {
    notes?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
  }) {
    return apiClient.post(`/api/appointments/${id}/complete`, data);
  }

  async getAvailableSlots(params: {
    providerId: string;
    date: string;
    duration: number;
  }): Promise<AppointmentSlot[]> {
    return apiClient.get('/api/appointments/availability', { params });
  }

  async sendReminder(id: string) {
    return apiClient.post(`/api/appointments/${id}/send-reminder`);
  }

  async getUpcoming(days: number = 7) {
    return apiClient.get('/api/appointments/upcoming', { params: { days } });
  }

  async getWaitlist() {
    return apiClient.get('/api/appointments/waitlist');
  }

  async addToWaitlist(data: {
    patientId: string;
    providerId?: string;
    preferredDates?: string[];
    appointmentType: string;
    notes?: string;
  }) {
    return apiClient.post('/api/appointments/waitlist', data);
  }

  async deleteAppointment(id: string): Promise<void> {
    return apiClient.delete(`/api/appointments/${id}`);
  }
}

export const appointmentsApi = new AppointmentsApi();
