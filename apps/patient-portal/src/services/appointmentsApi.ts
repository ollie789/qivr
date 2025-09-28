import { api, handleApiError } from '../services/api';

export interface AvailableProviderApi {
  id: string;
  specialty?: string | null;
  title?: string | null;
  fullName?: string | null;
  user?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  };
}

export interface AvailableProvider {
  id: string;
  name: string;
  specialty?: string;
  title?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AvailableSlotApi {
  startTime: string;
  endTime: string;
  available: boolean;
  providerId: string;
}

export interface AvailableSlot {
  providerId: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

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

export async function fetchAvailableProviders(date: string, specialization?: string): Promise<AvailableProvider[]> {
  const params = new URLSearchParams({ date });
  if (specialization) params.append('specialization', specialization);

  const providers = await api.get<AvailableProviderApi[]>(
    `/appointments/providers/available?${params.toString()}`,
  );

  return providers.map((provider) => {
    const name = provider.fullName
      || provider.user?.fullName
      || [provider.user?.firstName, provider.user?.lastName].filter(Boolean).join(' ')
      || 'Available provider';

    return {
      id: provider.id,
      name,
      specialty: provider.specialty ?? undefined,
      title: provider.title ?? undefined,
      email: provider.user?.email ?? undefined,
      phone: provider.user?.phone ?? undefined,
      avatarUrl: provider.user?.avatarUrl ?? undefined,
    } satisfies AvailableProvider;
  });
}

export async function fetchAvailableSlots(
  providerId: string,
  date: string,
  durationMinutes = 30,
): Promise<AvailableSlot[]> {
  const params = new URLSearchParams({
    providerId,
    date,
    durationMinutes: String(durationMinutes),
  });

  const slots = await api.get<AvailableSlotApi[]>(`/appointments/availability?${params.toString()}`);

  return slots
    .filter((slot) => slot.available)
    .map((slot) => ({
      providerId: slot.providerId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: slot.available,
    }));
}

export interface BookAppointmentPayload {
  providerId: string;
  startTime: string;
  durationMinutes?: number;
  appointmentType?: string;
}

export async function bookAppointment(payload: BookAppointmentPayload): Promise<AppointmentDto> {
  try {
    return await api.post<AppointmentDto>('/appointments/book', {
      providerId: payload.providerId,
      startTime: payload.startTime,
      durationMinutes: payload.durationMinutes ?? 30,
      appointmentType: payload.appointmentType ?? 'consultation',
    });
  } catch (error) {
    throw new Error(handleApiError(error, 'Unable to book appointment'));
  }
}
