import { api } from '../services/api';

export interface AppointmentFilters {
  upcoming?: boolean;
  past?: boolean;
  status?: string;
}

export interface AppointmentDto {
  id: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  appointmentType: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration: number;
  status: string;
  location?: string;
  isVirtual: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAppointments(filters: AppointmentFilters): Promise<AppointmentDto[]> {
  const params = new URLSearchParams();
  if (filters.upcoming) params.append('upcoming', 'true');
  if (filters.past) params.append('past', 'true');
  if (filters.status) params.append('status', filters.status);

  return api.get<AppointmentDto[]>(`/appointments?${params.toString()}`);
}

export async function cancelAppointment(id: string, reason: string): Promise<void> {
  await api.put(`/appointments/${id}/cancel`, { reason });
}

export interface RescheduleResponse {
  id: string;
}

export async function rescheduleAppointment(id: string): Promise<RescheduleResponse> {
  return api.post<RescheduleResponse>(`/appointments/${id}/reschedule`);
}
