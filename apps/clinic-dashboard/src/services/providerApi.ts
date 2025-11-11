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

export interface CreateProviderData {
  firstName: string;
  lastName: string;
  title?: string;
  specialty?: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  npiNumber?: string;
  isActive?: boolean;
}

export interface UpdateProviderData {
  firstName: string;
  lastName: string;
  title?: string;
  specialty?: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  isActive: boolean;
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
  async getClinicProviders(clinicId?: string, options: { activeOnly?: boolean } = {}): Promise<Provider[]> {
    const { activeOnly = true } = options;

    const providers = await apiClient.get<ProviderDto[]>(
      `/api/clinic-management/providers`,
      { activeOnly },
    );

    return Array.isArray(providers) ? providers.map(mapProvider) : [];
  }

  async createProvider(data: CreateProviderData, clinicId?: string): Promise<Provider> {
    const provider = await apiClient.post<ProviderDto>(
      `/api/clinic-management/providers`,
      data
    );
    return mapProvider(provider);
  }

  async updateProvider(providerId: string, data: UpdateProviderData): Promise<Provider> {
    const provider = await apiClient.put<ProviderDto>(
      `/api/clinic-management/providers/${providerId}`,
      data
    );
    return mapProvider(provider);
  }

  async deleteProvider(providerId: string): Promise<void> {
    await apiClient.delete(`/api/clinic-management/providers/${providerId}`);
  }

  async getProvider(providerId: string): Promise<Provider> {
    const provider = await apiClient.get<ProviderDto>(
      `/api/clinic-management/providers/${providerId}`
    );
    return mapProvider(provider);
  }
}

export const providerApi = new ProviderApi();

export default providerApi;
