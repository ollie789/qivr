import { api } from '../lib/api-client';

export interface TenantOption {
  id: string;
  name: string;
  slug?: string | null;
  isDefault?: boolean;
}

export const fetchTenantOptions = async (): Promise<TenantOption[]> => {
  return api.get<TenantOption[]>('/api/tenants');
};
