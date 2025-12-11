import apiClient from '../lib/api-client';
import type { Appointment } from '../types';

interface CursorPaginationResponse<T> {
  items: T[];
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
  count: number;
}

interface PatientListItemDto {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  medicalRecordNumber?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  lastUpdated?: string | null;
}

interface PatientDetailsDto extends PatientListItemDto {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  insuranceProvider?: string | null;
  insuranceNumber?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  emergencyContactRelationship?: string | null;
  medicareNumber?: string | null;
  medicareRef?: string | null;
  medicareExpiry?: string | null;
  allergies?: string[] | null;
  medications?: string[] | null;
  conditions?: string[] | null;
  recentAppointments?: AppointmentDto[];
  RecentAppointments?: AppointmentDto[];
  recentProms?: PromDto[];
  RecentProms?: PromDto[];
}

interface AppointmentDto {
  id?: string | number;
  Id?: string | number;
  date?: string;
  Date?: string;
  provider?: string;
  Provider?: string;
  type?: string;
  Type?: string;
  status?: string;
  Status?: string;
  notes?: string;
  Notes?: string;
}

interface PromDto {
  id?: string | number;
  Id?: string | number;
  templateName?: string;
  TemplateName?: string;
  status?: string;
  Status?: string;
  createdAt?: string;
  CreatedAt?: string;
  completedAt?: string;
  CompletedAt?: string;
  score?: number;
  Score?: number;
}

// Helper type for responses that might be PascalCase
interface PascalCaseResponse<T> {
  Items?: T[];
  NextCursor?: string | null;
}

export interface PatientAddress {
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: PatientAddress | null;
  medicalRecordNumber?: string;
  status: 'active' | 'inactive' | 'pending';
  lastVisit?: string;
  nextAppointment?: string;
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
  provider?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  medicareNumber?: string;
  medicareRef?: string;
  medicareExpiry?: string;
  registeredDate?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyContactRelationship?: string;
  recentAppointments?: PatientAppointmentSummary[];
  recentProms?: PatientPromSummary[];
}

export interface PatientAppointmentSummary {
  id: string;
  date: string;
  provider: string;
  type: string;
  status: string;
  notes?: string;
}

export interface PatientPromSummary {
  id: string;
  templateName: string;
  status: string;
  createdAt?: string;
  completedAt?: string;
  score?: number;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: PatientAddress;
  insuranceProvider?: string;
  medicareNumber?: string;
  initialConditions?: string[];
  intakeId?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  status?: 'active' | 'inactive' | 'pending';
  provider?: string;
  tags?: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyContactRelationship?: string;
  insuranceNumber?: string;
  medicareRef?: string;
  medicareExpiry?: string;
}

export interface PatientSearchParams {
  search?: string;
  status?: string;
  provider?: string;
  condition?: string;
  limit?: number;
  cursor?: string;
}

export interface PatientListResponse {
  data: Patient[];
  total?: number;
  page?: number;
  pageSize?: number;
  nextCursor?: string | null;
}

const toSafeString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' && value.trim().length > 0 ? value : fallback;

const toIsoString = (value: unknown): string => {
  if (!value) {
    return new Date().toISOString();
  }
  const candidate = typeof value === 'string' ? value : String(value);
  const parsed = new Date(candidate);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `patient-${Date.now()}`;

class PatientApi {
  async getPatients(params: PatientSearchParams = {}): Promise<PatientListResponse> {
    const payload = await apiClient.get<
      CursorPaginationResponse<PatientListItemDto> | PatientListItemDto[]
    >('/api/patients', {
      limit: params.limit ?? 200,
      cursor: params.cursor,
      search: params.search,
      status: params.status,
      providerId: params.provider,
    });

    const items = Array.isArray(payload)
      ? payload
      : (payload?.items ?? (payload as PascalCaseResponse<PatientListItemDto>)?.Items ?? []);

    const patients = (items as PatientListItemDto[]).map(this.mapPatientDto);

    return {
      data: patients,
      total: Array.isArray(payload) ? patients.length : (payload?.count ?? patients.length),
      page: 1,
      pageSize: patients.length,
      nextCursor: Array.isArray(payload)
        ? undefined
        : (payload?.nextCursor ?? (payload as PascalCaseResponse<PatientListItemDto>)?.NextCursor),
    };
  }

  async getPatient(id: string): Promise<Patient | undefined> {
    try {
      const dto = await apiClient.get<PatientDetailsDto>(`/api/patients/${id}`);
      return this.mapPatientDto(dto);
    } catch (error) {
      console.error('Error fetching patient:', error);
      return undefined;
    }
  }

  async createPatient(patient: CreatePatientDto): Promise<Patient> {
    const response = await apiClient.post<PatientDetailsDto>('/api/patients', {
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
    });
    return this.mapPatientDto(response);
  }

  async updatePatient(id: string, updates: UpdatePatientDto): Promise<Patient | undefined> {
    const response = await apiClient.put<PatientDetailsDto>(`/api/patients/${id}`, updates);
    return this.mapPatientDto(response);
  }

  async deletePatient(id: string) {
    return apiClient.delete(`/api/patients/${id}`);
  }

  async getPatientHistory(_id: string) {
    console.warn('getPatientHistory is not yet backed by an API endpoint');
    return {
      appointments: [] as Appointment[],
      evaluations: [],
      proms: [],
      documents: [],
    };
  }

  async getPatientAppointments(id: string) {
    const payload = await apiClient.get<CursorPaginationResponse<Appointment> | Appointment[]>(
      '/api/appointments',
      { patientId: id, limit: 50, sortDescending: true }
    );

    const items = Array.isArray(payload)
      ? payload
      : (payload?.items ?? (payload as PascalCaseResponse<Appointment>)?.Items ?? []);

    return items as Appointment[];
  }

  async getPatientEvaluations(_id: string) {
    console.warn('getPatientEvaluations is not yet backed by an API endpoint');
    return [];
  }

  async linkPatientToIntake(_patientId: string, _intakeId: string) {
    console.warn('linkPatientToIntake is not yet backed by an API endpoint');
    return { success: true };
  }

  async createPatientFromIntake(_intakeId: string, patientData: CreatePatientDto) {
    return this.createPatient(patientData);
  }

  private mapPatientDto = (dto: PatientListItemDto | PatientDetailsDto): Patient => {
    const firstName = dto.firstName ?? '';
    const lastName = dto.lastName ?? '';
    const email = dto.email ?? '';
    const status: Patient['status'] = dto.isActive === false ? 'inactive' : 'active';
    const details = dto as PatientDetailsDto;

    const address: PatientAddress | null =
      details.address || details.city || details.state || details.postalCode
        ? {
            street: details.address ?? undefined,
            city: details.city ?? undefined,
            state: details.state ?? undefined,
            postcode: details.postalCode ?? undefined,
          }
        : null;

    const rawAppointments = details.recentAppointments ?? details.RecentAppointments;
    const recentAppointments: PatientAppointmentSummary[] | undefined = Array.isArray(
      rawAppointments
    )
      ? rawAppointments.map((appointment: AppointmentDto) => ({
          id: String(appointment.id ?? appointment.Id ?? generateId()),
          date: toIsoString(appointment.date ?? appointment.Date ?? new Date().toISOString()),
          provider: toSafeString(appointment.provider ?? appointment.Provider, 'Clinician'),
          type: toSafeString(appointment.type ?? appointment.Type, 'consultation'),
          status: toSafeString(appointment.status ?? appointment.Status, 'unknown'),
          notes: appointment.notes ?? appointment.Notes ?? undefined,
        }))
      : undefined;

    const rawProms = details.recentProms ?? details.RecentProms;
    const recentProms: PatientPromSummary[] | undefined = Array.isArray(rawProms)
      ? rawProms.map((prom: PromDto) => ({
          id: String(prom.id ?? prom.Id ?? generateId()),
          templateName: toSafeString(prom.templateName ?? prom.TemplateName, 'PROM'),
          status: toSafeString(prom.status ?? prom.Status, 'pending'),
          createdAt:
            (prom.createdAt ?? prom.CreatedAt)
              ? toIsoString(prom.createdAt ?? prom.CreatedAt)
              : undefined,
          completedAt:
            (prom.completedAt ?? prom.CompletedAt)
              ? toIsoString(prom.completedAt ?? prom.CompletedAt)
              : undefined,
          score:
            typeof prom.score === 'number'
              ? prom.score
              : typeof prom.Score === 'number'
                ? prom.Score
                : undefined,
        }))
      : undefined;

    return {
      id: dto.id,
      firstName,
      lastName,
      email,
      phone: dto.phoneNumber ?? undefined,
      dateOfBirth: dto.dateOfBirth ?? undefined,
      gender: dto.gender ?? details.gender ?? undefined,
      address,
      medicalRecordNumber: dto.medicalRecordNumber ?? undefined,
      status,
      lastVisit: recentAppointments?.[0]?.date,
      nextAppointment: undefined,
      conditions: details.conditions ?? [],
      allergies: details.allergies ?? [],
      medications: details.medications ?? [],
      provider: undefined,
      insuranceProvider: details.insuranceProvider ?? undefined,
      insuranceNumber: details.insuranceNumber ?? undefined,
      medicareNumber: details.medicareNumber ?? undefined,
      medicareRef: details.medicareRef ?? undefined,
      medicareExpiry: details.medicareExpiry ?? undefined,
      registeredDate: dto.createdAt ?? undefined,
      tags: [],
      createdAt: dto.createdAt ?? undefined,
      updatedAt: dto.lastUpdated ?? undefined,
      notes: details.notes ?? undefined,
      emergencyContact: details.emergencyContact ?? undefined,
      emergencyPhone: details.emergencyPhone ?? undefined,
      emergencyContactRelationship: details.emergencyContactRelationship ?? undefined,
      recentAppointments,
      recentProms,
    };
  };
}

export const patientApi = new PatientApi();
