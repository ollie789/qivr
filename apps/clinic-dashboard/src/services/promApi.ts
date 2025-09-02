import apiClient from './sharedApiClient';

export interface PromTemplate {
  id: string;
  name: string;
  description: string;
  questions: PromQuestion[];
  estimatedTime?: string;
  tags?: string[];
  category?: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'scale' | 'multiple-choice' | 'checkbox' | 'date' | 'time';
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  validation?: any;
}

export interface PromResponse {
  id: string;
  templateId: string;
  patientId: string;
  patientName: string;
  responses: Record<string, any>;
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  startedAt?: string;
  completedAt?: string;
  score?: number;
  notes?: string;
}

class PromApi {
  async getTemplates(params?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/api/proms/templates', { params });
    return response.data;
  }

  async getTemplate(id: string) {
    const response = await apiClient.get(`/api/proms/templates/${id}`);
    return response.data;
  }

  async createTemplate(data: Omit<PromTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await apiClient.post('/api/proms/templates', data);
    return response.data;
  }

  async updateTemplate(id: string, data: Partial<PromTemplate>) {
    const response = await apiClient.put(`/api/proms/templates/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: string) {
    const response = await apiClient.delete(`/api/proms/templates/${id}`);
    return response.data;
  }

  async sendProm(data: {
    templateId: string;
    patientIds: string[];
    scheduledAt?: string;
    expiresAt?: string;
    reminderSettings?: any;
  }) {
    const response = await apiClient.post('/api/proms/send', data);
    return response.data;
  }

  async getResponses(params?: {
    templateId?: string;
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/api/proms/responses', { params });
    return response.data;
  }

  async getResponse(id: string) {
    const response = await apiClient.get(`/api/proms/responses/${id}`);
    return response.data;
  }

  async submitResponse(id: string, responses: Record<string, any>) {
    const response = await apiClient.post(`/api/proms/responses/${id}/submit`, { responses });
    return response.data;
  }

  async getAnalytics(templateId: string, params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const response = await apiClient.get(`/api/proms/templates/${templateId}/analytics`, { params });
    return response.data;
  }
}

export const promApi = new PromApi();
