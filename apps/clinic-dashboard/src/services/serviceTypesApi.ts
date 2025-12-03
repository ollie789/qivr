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
    const response = await api.get(`/api/servicetypes${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<ServiceType> => {
    const response = await api.get(`/api/servicetypes/${id}`);
    return response.data;
  },

  create: async (data: CreateServiceTypeRequest): Promise<ServiceType> => {
    const response = await api.post("/api/servicetypes", data);
    return response.data;
  },

  update: async (id: string, data: UpdateServiceTypeRequest): Promise<ServiceType> => {
    const response = await api.put(`/api/servicetypes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/servicetypes/${id}`);
  },

  getSpecialties: async (): Promise<string[]> => {
    const response = await api.get("/api/servicetypes/specialties");
    return response.data;
  },
};
