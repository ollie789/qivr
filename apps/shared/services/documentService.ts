import { uploadWithProgress, getWithAuth, delWithAuth } from '@qivr/http';

export interface DocumentUploadOptions {
  patientId?: string;
  appointmentId?: string;
  documentType: string;
  description?: string;
  onUploadProgress?: (percent: number, loaded: number, total: number) => void;
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

    return await uploadWithProgress(
      `/documents/patient/${patientId}`,
      formData,
      {
        onUploadProgress: options.onUploadProgress,
      }
    );
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

    return await uploadWithProgress(
      `/documents/appointment/${appointmentId}`,
      formData,
      {
        onUploadProgress: options.onUploadProgress,
      }
    );
  }

  /**
   * Get a specific document
   */
  async getDocument(documentId: string): Promise<DocumentResponse> {
    return await getWithAuth<DocumentResponse>(`/documents/${documentId}`);
  }

  /**
   * Download a document
   */
  async downloadDocument(documentId: string, fileName?: string): Promise<void> {
    // For blob downloads, we need to use native fetch with auth
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('clinic-auth-storage');
    let token = authToken;
    if (authToken && authToken.includes('state')) {
      try {
        const parsed = JSON.parse(authToken);
        token = parsed.state?.token;
      } catch {}
    }
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || ''}/documents/${documentId}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    // Create a download link
    const url = window.URL.createObjectURL(blob);
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

    const queryString = params.toString();
    const url = `/documents/patient/${patientId}${queryString ? `?${queryString}` : ''}`;
    
    // For getting headers, we need to use native fetch
    const authToken = localStorage.getItem('authToken') || localStorage.getItem('clinic-auth-storage');
    let token = authToken;
    if (authToken && authToken.includes('state')) {
      try {
        const parsed = JSON.parse(authToken);
        token = parsed.state?.token;
      } catch {}
    }
    
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    const documents = await response.json();
    const totalCount = parseInt(response.headers.get('x-total-count') || '0', 10);

    return {
      documents,
      totalCount,
    };
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await delWithAuth(`/documents/${documentId}`);
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
