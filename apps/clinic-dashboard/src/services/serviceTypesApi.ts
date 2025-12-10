import api from "../lib/api-client";

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  specialty?: string;
  durationMinutes: number;
  price: number;
  billingCode?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateServiceTypeRequest {
  name: string;
  description?: string;
  specialty?: string;
  durationMinutes: number;
  price: number;
  billingCode?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateServiceTypeRequest extends CreateServiceTypeRequest {}

export const serviceTypesApi = {
  getAll: async (specialty?: string): Promise<ServiceType[]> => {
    const params = specialty ? `?specialty=${encodeURIComponent(specialty)}` : "";
    return api.get<ServiceType[]>(`/api/servicetypes${params}`);
  },

  getById: async (id: string): Promise<ServiceType> => {
    return api.get<ServiceType>(`/api/servicetypes/${id}`);
  },

  create: async (data: CreateServiceTypeRequest): Promise<ServiceType> => {
    return api.post<ServiceType>("/api/servicetypes", data);
  },

  update: async (id: string, data: UpdateServiceTypeRequest): Promise<ServiceType> => {
    return api.put<ServiceType>(`/api/servicetypes/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/servicetypes/${id}`);
  },

  getSpecialties: async (): Promise<string[]> => {
    return api.get<string[]>("/api/servicetypes/specialties");
  },
};
