import { api, handleApiError } from '../services/api';

type Maybe<T> = T | null | undefined;

type CursorResponse<T> = {
  items?: T[];
  Items?: T[];
  nextCursor?: string | null;
  NextCursor?: string | null;
  previousCursor?: string | null;
  PreviousCursor?: string | null;
  hasNext?: boolean;
  HasNext?: boolean;
  hasPrevious?: boolean;
  HasPrevious?: boolean;
  count?: number;
  Count?: number;
};

const unwrapItems = <T>(payload: CursorResponse<T> | T[] | { data: CursorResponse<T> | T[] }): T[] => {
  const raw = (payload && typeof payload === 'object' && 'data' in payload
    ? (payload as { data: CursorResponse<T> | T[] }).data
    : payload) ?? [];

  if (Array.isArray(raw)) {
    return raw;
  }

  // Type guard to ensure raw is CursorResponse<T>
  if (raw && typeof raw === 'object') {
    const cursorResponse = raw as CursorResponse<T>;
    const items = cursorResponse.items ?? cursorResponse.Items ?? [];
    return Array.isArray(items) ? items : [];
  }
  
  return [];
};

const toIsoString = (value: Maybe<string | Date>): string => {
  if (!value) {
    return new Date().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return new Date().toISOString();
  }
  const isoCandidate = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const finalValue = isoCandidate.endsWith('Z') ? isoCandidate : `${isoCandidate}Z`;
  const parsed = new Date(finalValue);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
};

const minutesBetween = (startIso: string, endIso: string): number => {
  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return 0;
  }
  return Math.max(0, Math.round((endMs - startMs) / 60000));
};

const normalizeStatus = (value: Maybe<string>): string => {
  if (!value) {
    return 'unknown';
  }
  return value.toLowerCase();
};

const mapAppointment = (raw: any): AppointmentDto => {
  const scheduledStart = toIsoString(raw.scheduledStart ?? raw.ScheduledStart);
  const scheduledEnd = toIsoString(raw.scheduledEnd ?? raw.ScheduledEnd ?? scheduledStart);
  const providerName = raw.providerName ?? raw.ProviderName ?? 'Assigned clinician';
  const providerSpecialty = raw.providerSpecialty ?? raw.ProviderSpecialty ?? raw.locationDetails?.specialty ?? undefined;
  const appointmentType = raw.appointmentType ?? raw.AppointmentType ?? 'consultation';
  const locationDetails = raw.locationDetails ?? raw.LocationDetails ?? {};
  const location = raw.location ?? raw.Location ?? (locationDetails.address ?? locationDetails.Address); 
  const videoLink = raw.videoLink ?? raw.VideoLink ?? locationDetails.meetingUrl ?? locationDetails.videoLink;

  return {
    id: String(raw.id ?? raw.Id ?? ''),
    providerId: String(raw.providerId ?? raw.ProviderId ?? ''),
    providerName,
    providerSpecialty: providerSpecialty ?? 'General',
    appointmentType,
    scheduledStart,
    scheduledEnd,
    duration: minutesBetween(scheduledStart, scheduledEnd),
    status: normalizeStatus(raw.status ?? raw.Status),
    location: location ?? '',
    isVirtual: Boolean((raw.locationType ?? raw.LocationType ?? '').toLowerCase() === 'virtual' || videoLink),
    notes: raw.notes ?? raw.Notes ?? '',
    createdAt: toIsoString(raw.createdAt ?? raw.CreatedAt),
    updatedAt: toIsoString(raw.updatedAt ?? raw.UpdatedAt ?? raw.createdAt ?? raw.CreatedAt),
  } satisfies AppointmentDto;
};

export interface AvailableProviderApi {
  id: string;
  Id?: string;
  specialty?: string | null;
  Specialty?: string | null;
  title?: string | null;
  Title?: string | null;
  fullName?: string | null;
  FullName?: string | null;
  name?: string | null;
  Name?: string | null;
  availableSlotCount?: number;
  AvailableSlotCount?: number;
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
  StartTime?: string;
  EndTime?: string;
  Available?: boolean;
  ProviderId?: string;
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
  const params: Record<string, string | number | boolean> = {
    limit: 50,
  };

  const nowIso = new Date().toISOString();

  if (filters.upcoming && !filters.past) {
    params.startDate = nowIso;
    params.sortDescending = false;
  } else if (filters.past && !filters.upcoming) {
    params.endDate = nowIso;
    params.sortDescending = true;
  } else {
    params.sortDescending = false;
  }

  if (filters.status) {
    params.status = filters.status.charAt(0).toUpperCase() + filters.status.slice(1);
  }

  const payload = await api.get<CursorResponse<any> | any[]>(
    '/api/appointments',
    params,
  );

  const mapped = unwrapItems(payload).map(mapAppointment);

  return mapped.sort((a, b) => {
    const delta = new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
    if (filters.past && !filters.upcoming) {
      return -delta;
    }
    return delta;
  });
}

export async function cancelAppointment(id: string, reason: string): Promise<void> {
  await api.post(`/api/appointments/${id}/cancel`, { reason });
}

export interface RescheduleResponse {
  id: string;
}

export async function rescheduleAppointment(id: string): Promise<RescheduleResponse> {
  await api.post(`/api/appointments/${id}/reschedule`, {});
  return { id } satisfies RescheduleResponse;
}

export async function fetchAvailableProviders(date: string, specialization?: string): Promise<AvailableProvider[]> {
  const params = new URLSearchParams({ date });
  if (specialization) params.append('specialization', specialization);

  const providers = await api.get<AvailableProviderApi[] | { data: AvailableProviderApi[] }>(
    `/api/appointments/providers/available`,
    Object.fromEntries(params.entries()),
  );

  const list = Array.isArray(providers)
    ? providers
    : (providers?.data ?? []);

  return list.map((provider) => {
    const name = provider.fullName
      || provider.FullName
      || provider.name
      || provider.Name
      || provider.user?.fullName
      || [provider.user?.firstName, provider.user?.lastName].filter(Boolean).join(' ')
      || 'Available provider';

    return {
      id: provider.id ?? provider.Id ?? '',
      name,
      specialty: provider.specialty ?? provider.Specialty ?? undefined,
      title: provider.title ?? provider.Title ?? undefined,
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

  const slots = await api.get<AvailableSlotApi[] | { data: AvailableSlotApi[] }>(
    '/api/appointments/availability',
    Object.fromEntries(params.entries()),
  );

  const list = Array.isArray(slots) ? slots : slots?.data ?? [];

  return list
    .filter((slot) => slot.available)
    .map((slot) => ({
      providerId: slot.providerId ?? slot.ProviderId ?? providerId,
      startTime: slot.startTime ?? slot.StartTime ?? '',
      endTime: slot.endTime ?? slot.EndTime ?? '',
      available: slot.available ?? slot.Available ?? true,
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
    const response = await api.post<any>('/api/appointments/book', {
      providerId: payload.providerId,
      startTime: payload.startTime,
      durationMinutes: payload.durationMinutes ?? 30,
      appointmentType: payload.appointmentType ?? 'consultation',
    });
    return mapAppointment(response);
  } catch (error) {
    throw new Error(handleApiError(error, 'Unable to book appointment'));
  }
}
