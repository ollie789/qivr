import apiClient from '../lib/api-client';

interface ProviderDto {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  specialty?: string | null;
  email?: string | null;
  phone?: string | null;
  licenseNumber?: string | null;
  isActive?: boolean | null;
  patientCount?: number | null;
  appointmentsToday?: number | null;
  nextAvailableSlot?: string | null;
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  isActive: boolean;
  patientCount?: number;
  appointmentsToday?: number;
  nextAvailableSlot?: string | null;
}

const mapProvider = (dto: ProviderDto): Provider => {
  const firstName = (dto.firstName ?? '').trim();
  const lastName = (dto.lastName ?? '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    id: dto.id,
    firstName,
    lastName,
    fullName: fullName || dto.email || 'Provider',
    title: dto.title ?? undefined,
    specialty: dto.specialty ?? undefined,
    email: dto.email ?? undefined,
    phone: dto.phone ?? undefined,
    licenseNumber: dto.licenseNumber ?? undefined,
    isActive: Boolean(dto.isActive ?? true),
    patientCount: dto.patientCount ?? undefined,
    appointmentsToday: dto.appointmentsToday ?? undefined,
    nextAvailableSlot: dto.nextAvailableSlot ?? null,
  };
};

class ProviderApi {
  async getClinicProviders(clinicId: string, options: { activeOnly?: boolean } = {}): Promise<Provider[]> {
    if (!clinicId) {
      return [];
    }

    const { activeOnly = true } = options;

    const providers = await apiClient.get<ProviderDto[]>(
      `/api/clinic-management/clinics/${clinicId}/providers`,
      { activeOnly },
    );

    return Array.isArray(providers) ? providers.map(mapProvider) : [];
  }
}

export const providerApi = new ProviderApi();

export default providerApi;
