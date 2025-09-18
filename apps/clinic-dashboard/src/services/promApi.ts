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
    const response = await apiClient.get('/api/v1/proms/templates', { params });
    return response.data;
  }

  async getTemplate(id: string) {
    const response = await apiClient.get(`/api/v1/proms/templates/by-id/${id}`);
    return response.data;
  }

  async createTemplate(data: {
    key: string;
    name: string;
    description?: string;
    schemaJson: string;
    scoringMethod?: string;
    scoringRules?: string;
    isActive?: boolean;
    version?: number;
  }) {
    const response = await apiClient.post('/api/v1/proms/templates', data);
    return response.data;
  }

  async updateTemplate(id: string, data: Partial<PromTemplate>) {
    const response = await apiClient.put(`/api/v1/proms/templates/by-id/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: string) {
    const response = await apiClient.delete(`/api/v1/proms/templates/by-id/${id}`);
    return response.data;
  }

  async sendProm(data: {
    templateKey: string;
    version?: number;
    patientId: string;
    scheduledFor: string;
    dueAt?: string;
  }) {
    const response = await apiClient.post('/api/v1/proms/schedule', data);
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
    // Mock data for now since the backend returns different format
    return {
      data: [],
      total: 0
    };
  }

  async getResponse(id: string) {
    const response = await apiClient.get(`/api/v1/proms/instances/${id}`);
    return response.data;
  }

  async submitResponse(id: string, responses: Record<string, any>) {
    const response = await apiClient.post(`/api/v1/proms/instances/${id}/answers`, { responses });
    return response.data;
  }

  async getAnalytics(templateId: string, params?: {
    startDate?: string;
    endDate?: string;
  }) {
    const response = await apiClient.get(`/api/v1/proms/templates/by-id/${templateId}`, { params });
    return response.data;
  }
}

export const promApi = new PromApi();
