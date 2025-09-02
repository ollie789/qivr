import apiClient from './sharedApiClient';

export interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  patientId?: string;
  providerId?: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  tags?: string[];
  url?: string;
  thumbnailUrl?: string;
}

export interface UploadDocumentRequest {
  file: File;
  category: string;
  patientId?: string;
  description?: string;
  tags?: string[];
}

class DocumentsApi {
  async getDocuments(params?: {
    category?: string;
    patientId?: string;
    providerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/api/documents', { params });
    return response.data;
  }

  async getDocument(id: string) {
    const response = await apiClient.get(`/api/documents/${id}`);
    return response.data;
  }

  async uploadDocument(data: UploadDocumentRequest) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('category', data.category);
    if (data.patientId) formData.append('patientId', data.patientId);
    if (data.description) formData.append('description', data.description);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));

    const response = await apiClient.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async updateDocument(id: string, data: {
    category?: string;
    description?: string;
    tags?: string[];
  }) {
    const response = await apiClient.put(`/api/documents/${id}`, data);
    return response.data;
  }

  async deleteDocument(id: string) {
    const response = await apiClient.delete(`/api/documents/${id}`);
    return response.data;
  }

  async downloadDocument(id: string) {
    const response = await apiClient.get(`/api/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async shareDocument(id: string, data: {
    recipientEmail: string;
    message?: string;
    expiresIn?: number;
  }) {
    const response = await apiClient.post(`/api/documents/${id}/share`, data);
    return response.data;
  }

  async getCategories() {
    const response = await apiClient.get('/api/documents/categories');
    return response.data;
  }
}

export const documentsApi = new DocumentsApi();
