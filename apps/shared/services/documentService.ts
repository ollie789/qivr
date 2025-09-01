import { defaultAxiosInstance } from '../axiosConfig';
import type { AxiosProgressEvent } from 'axios';

export interface DocumentUploadOptions {
  patientId?: string;
  appointmentId?: string;
  documentType: string;
  description?: string;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
}

export interface DocumentResponse {
  id: string;
  fileName: string;
  fileSize: string;
  documentType: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface DocumentListOptions {
  documentType?: string;
  page?: number;
  pageSize?: number;
}

class DocumentService {
  private apiInstance = defaultAxiosInstance;

  /**
   * Upload a document for a patient
   */
  async uploadPatientDocument(
    file: File,
    patientId: string,
    options: Omit<DocumentUploadOptions, 'patientId'>
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', options.documentType);
    if (options.description) {
      formData.append('description', options.description);
    }

    const response = await this.apiInstance.post<DocumentResponse>(
      `/documents/patient/${patientId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: options.onUploadProgress,
      }
    );

    return response.data;
  }

  /**
   * Upload a document for an appointment
   */
  async uploadAppointmentDocument(
    file: File,
    appointmentId: string,
    options: Omit<DocumentUploadOptions, 'appointmentId'>
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', options.documentType);
    if (options.description) {
      formData.append('description', options.description);
    }

    const response = await this.apiInstance.post<DocumentResponse>(
      `/documents/appointment/${appointmentId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: options.onUploadProgress,
      }
    );

    return response.data;
  }

  /**
   * Get a specific document
   */
  async getDocument(documentId: string): Promise<DocumentResponse> {
    const response = await this.apiInstance.get<DocumentResponse>(
      `/documents/${documentId}`
    );
    return response.data;
  }

  /**
   * Download a document
   */
  async downloadDocument(documentId: string, fileName?: string): Promise<void> {
    const response = await this.apiInstance.get(
      `/documents/${documentId}/download`,
      {
        responseType: 'blob',
      }
    );

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `document-${documentId}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  /**
   * List documents for a patient
   */
  async listPatientDocuments(
    patientId: string,
    options?: DocumentListOptions
  ): Promise<{ documents: DocumentResponse[]; totalCount: number }> {
    const params = new URLSearchParams();
    if (options?.documentType) {
      params.append('documentType', options.documentType);
    }
    if (options?.page) {
      params.append('page', options.page.toString());
    }
    if (options?.pageSize) {
      params.append('pageSize', options.pageSize.toString());
    }

    const response = await this.apiInstance.get<DocumentResponse[]>(
      `/documents/patient/${patientId}`,
      { params }
    );

    const totalCount = parseInt(response.headers['x-total-count'] || '0', 10);

    return {
      documents: response.data,
      totalCount,
    };
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.apiInstance.delete(`/documents/${documentId}`);
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    const allowedExtensions = [
      '.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', 
      '.txt', '.csv', '.xls', '.xlsx'
    ];

    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      // Check by extension as fallback
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        return {
          isValid: false,
          error: `File type is not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get file preview URL (for images)
   */
  getFilePreview(file: File): string | null {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const documentService = new DocumentService();

// Export for testing or custom instances
export default DocumentService;
