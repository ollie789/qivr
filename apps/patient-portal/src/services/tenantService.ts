import apiClient from '../lib/api-client';

export interface TenantOption {
  id: string;
  name: string;
  slug?: string | null;
  isDefault?: boolean;
}

export const fetchTenantOptions = async (): Promise<TenantOption[]> => {
  return apiClient.get<TenantOption[]>('/api/tenants');
};
