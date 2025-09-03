import apiClient from './sharedApiClient';

export interface Message {
  id: string;
  from: string;
  to: string;
  subject?: string;
  body: string;
  type: 'sms' | 'email' | 'in-app';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  createdAt: string;
  readAt?: string;
  patientId?: string;
  providerId?: string;
  attachments?: string[];
}

export interface SendMessageRequest {
  to: string;
  subject?: string;
  body: string;
  type: 'sms' | 'email' | 'in-app';
  patientId?: string;
  templateId?: string;
  scheduledAt?: string;
}

class MessagesApi {
  async getMessages(params?: {
    type?: string;
    status?: string;
    patientId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/api/Messages', { params });
    return response.data;
  }

  async getMessage(id: string) {
    const response = await apiClient.get(`/api/Messages/${id}`);
    return response.data;
  }

  async sendMessage(data: SendMessageRequest) {
    const response = await apiClient.post('/api/Messages', data);
    return response.data;
  }

  async markAsRead(id: string) {
    const response = await apiClient.put(`/api/Messages/${id}/read`);
    return response.data;
  }

  async deleteMessage(id: string) {
    const response = await apiClient.delete(`/api/Messages/${id}`);
    return response.data;
  }

  async getTemplates() {
    const response = await apiClient.get('/api/Messages/templates');
    return response.data;
  }

  async createTemplate(data: {
    name: string;
    subject?: string;
    body: string;
    type: 'sms' | 'email';
    variables?: string[];
  }) {
    const response = await apiClient.post('/api/Messages/templates', data);
    return response.data;
  }

  async updateTemplate(id: string, data: any) {
    const response = await apiClient.put(`/api/Messages/templates/${id}`, data);
    return response.data;
  }

  async deleteTemplate(id: string) {
    const response = await apiClient.delete(`/api/Messages/templates/${id}`);
    return response.data;
  }

  async getConversation(patientId: string) {
    const response = await apiClient.get(`/api/Messages/conversation/${patientId}`);
    return response.data;
  }
}

export const messagesApi = new MessagesApi();
