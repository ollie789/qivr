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
    try {
      // If patientId is provided, use the patient-specific endpoint
      if (params?.patientId) {
        const response = await apiClient.get(`/api/Documents/patient/${params.patientId}`);
        return response.data;
      }
      // No generic documents endpoint exists, return mock data
      console.log('Note: Backend does not have generic /api/Documents endpoint - using mock data');
      return this.getMockDocuments();
    } catch (error) {
      console.error('Error fetching documents:', error);
      return this.getMockDocuments();
    }
  }

  async getDocument(id: string) {
    const response = await apiClient.get(`/api/Documents/${id}`);
    return response.data;
  }

  async uploadDocument(data: UploadDocumentRequest) {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('category', data.category);
    if (data.patientId) formData.append('patientId', data.patientId);
    if (data.description) formData.append('description', data.description);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));

    const response = await apiClient.post('/api/Documents/upload', formData, {
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
    const response = await apiClient.put(`/api/Documents/${id}`, data);
    return response.data;
  }

  async deleteDocument(id: string) {
    const response = await apiClient.delete(`/api/Documents/${id}`);
    return response.data;
  }

  async downloadDocument(id: string) {
    const response = await apiClient.get(`/api/Documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async shareDocument(id: string, data: {
    recipientEmail: string;
    message?: string;
    expiresIn?: number;
  }) {
    const response = await apiClient.post(`/api/Documents/${id}/share`, data);
    return response.data;
  }

  async getCategories() {
    const response = await apiClient.get('/api/Documents/categories');
    return response.data;
  }

  private getMockDocuments() {
    return [
      {
        id: '1',
        fileName: 'patient-intake-form.pdf',
        fileSize: 245000,
        mimeType: 'application/pdf',
        category: 'intake',
        patientId: '1',
        uploadedBy: 'Sarah Johnson',
        uploadedAt: new Date('2024-01-15').toISOString(),
        description: 'Initial intake form',
        tags: ['intake', 'new-patient'],
      },
      {
        id: '2',
        fileName: 'x-ray-results.jpg',
        fileSize: 1850000,
        mimeType: 'image/jpeg',
        category: 'imaging',
        patientId: '2',
        uploadedBy: 'Dr. James Williams',
        uploadedAt: new Date('2024-01-12').toISOString(),
        description: 'Knee X-ray',
        tags: ['x-ray', 'knee'],
      },
    ];
  }
}

export const documentsApi = new DocumentsApi();
