import { api } from './api-client';

export const apiKeysApi = {
  list: () => api.get('/api/api-keys'),
  create: (data: { name: string; description?: string; expiresInDays?: number }) => 
    api.post('/api/api-keys', data),
  revoke: (id: string) => api.delete(`/api/api-keys/${id}`),
  toggle: (id: string) => api.patch(`/api/api-keys/${id}/toggle`)
};

export const treatmentPlansApi = {
  list: (patientId?: string) => 
    api.get('/api/treatment-plans', patientId ? { patientId } : undefined),
  get: (id: string) => api.get(`/api/treatment-plans/${id}`),
  create: (data: any) => api.post('/api/treatment-plans', data),
  update: (id: string, data: any) => api.put(`/api/treatment-plans/${id}`, data),
  delete: (id: string) => api.delete(`/api/treatment-plans/${id}`)
};
