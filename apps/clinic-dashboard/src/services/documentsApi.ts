import { uploadWithProgress } from '@qivr/http';
import apiClient from '../lib/api-client';

export type DocumentCategory =
  | 'intake'
  | 'imaging'
  | 'lab-report'
  | 'insurance'
  | 'treatment-plan'
  | 'billing'
  | 'consent'
  | 'other'
  | string;

export interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted?: string;
  mimeType?: string;
  category?: string;
  documentType?: string;
  status?: string;
  patientId: string;
  patientName?: string;
  providerId?: string;
  providerName?: string;
  uploadedById?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  createdAt?: string;
  description?: string | null;
  notes?: string | null;
  tags: string[];
  url?: string;
  thumbnailUrl?: string;
  requiresReview?: boolean;
  reviewStatus?: string;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  // OCR/extraction fields
  extractedText?: string;
  extractedPatientName?: string;
  extractedDob?: string;
  confidenceScore?: number;
  // Assignment fields
  isUrgent?: boolean;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
}

export interface DocumentShare {
  shareId: string;
  sharedWithUserId: string;
  sharedWithName: string;
  sharedByUserId: string;
  sharedByName: string;
  sharedAt: string;
  expiresAt?: string | null;
  accessLevel: string;
  message?: string | null;
  revoked: boolean;
  revokedAt?: string | null;
}

export interface UploadDocumentRequest {
  file: File;
  category: string;
  patientId?: string;
  providerId?: string;
  providerName?: string;
  description?: string;
  tags?: string[];
}

type DocumentListParams = {
  patientId?: string;
  category?: string;
  providerId?: string;
  search?: string;
  requiresReview?: boolean;
  page?: number;
  pageSize?: number;
};

// Legacy filter interface for backwards compatibility
export interface DocumentFilter {
  patientId?: string;
  documentType?: string;
  status?: string;
  assignedTo?: string;
  isUrgent?: boolean;
  fromDate?: string;
  toDate?: string;
}

interface DocumentResponseDto {
  id: string;
  patientId: string;
  patientName?: string;
  providerId?: string | null;
  providerName?: string | null;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  mimeType: string;
  category: string;
  description?: string | null;
  uploadedById?: string | null;
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
  url?: string | null;
  thumbnailUrl?: string | null;
  requiresReview: boolean;
  reviewStatus: string;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  shares?: DocumentShare[];
}

const mapDocument = (dto: DocumentResponseDto): Document => ({
  id: dto.id,
  patientId: dto.patientId,
  patientName: dto.patientName,
  providerId: dto.providerId ?? undefined,
  providerName: dto.providerName ?? undefined,
  fileName: dto.fileName,
  fileSize: dto.fileSize,
  fileSizeFormatted: dto.fileSizeFormatted,
  mimeType: dto.mimeType,
  category: dto.category,
  description: dto.description,
  uploadedById: dto.uploadedById ?? undefined,
  uploadedBy: dto.uploadedBy,
  uploadedAt: dto.uploadedAt,
  tags: dto.tags ?? [],
  url: dto.url ?? undefined,
  thumbnailUrl: dto.thumbnailUrl ?? undefined,
  requiresReview: dto.requiresReview,
  reviewStatus: dto.reviewStatus,
  reviewNotes: dto.reviewNotes,
  reviewedBy: dto.reviewedBy,
  reviewedAt: dto.reviewedAt,
});

class DocumentsApi {
  async list(params: DocumentListParams = {}): Promise<Document[]> {
    const payload = await apiClient.get<DocumentResponseDto[]>(
      '/api/documents',
      {
        patientId: params.patientId,
        category: params.category,
        providerId: params.providerId,
        search: params.search,
        requiresReview: params.requiresReview,
        page: params.page,
        pageSize: params.pageSize,
      },
    );

    return payload.map(mapDocument);
  }

  async listForPatient(patientId: string, params: Omit<DocumentListParams, 'patientId'> = {}): Promise<Document[]> {
    const payload = await apiClient.get<DocumentResponseDto[]>(
      `/api/documents/patient/${patientId}`,
      {
        category: params.category,
        page: params.page,
        pageSize: params.pageSize,
      },
    );

    return payload.map(mapDocument);
  }

  async get(documentId: string): Promise<Document> {
    const payload = await apiClient.get<DocumentResponseDto>(`/api/documents/${documentId}`);
    return mapDocument(payload);
  }

  async upload(request: UploadDocumentRequest, onProgress?: (percent: number) => void): Promise<Document> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('category', request.category);

    if (request.patientId) {
      formData.append('patientId', request.patientId);
    }

    if (request.providerId) {
      formData.append('providerId', request.providerId);
    }

    if (request.providerName) {
      formData.append('providerName', request.providerName);
    }

    if (request.description) {
      formData.append('description', request.description);
    }

    if (request.tags?.length) {
      formData.append('tags', JSON.stringify(request.tags));
    }

    const payload = await uploadWithProgress('/api/documents/upload', formData, {
      onUploadProgress: (percent) => onProgress?.(percent),
    });

    return mapDocument(payload as DocumentResponseDto);
  }

  async delete(documentId: string): Promise<void> {
    await apiClient.delete(`/api/documents/${documentId}`);
  }

  async download(documentId: string): Promise<Blob> {
    return apiClient.get(`/api/documents/${documentId}/download`);
  }

  async share(documentId: string, payload: {
    userId: string;
    expiresAt?: string;
    message?: string;
    accessLevel?: string;
  }): Promise<DocumentShare> {
    return apiClient.post(`/api/documents/${documentId}/share`, payload);
  }

  async listShares(documentId: string): Promise<DocumentShare[]> {
    return apiClient.get(`/api/documents/${documentId}/shares`);
  }

  async revokeShare(documentId: string, shareId: string): Promise<void> {
    await apiClient.delete(`/api/documents/${documentId}/shares/${shareId}`);
  }

  async requestReview(documentId: string, payload: {
    assignedToUserId?: string;
    notes?: string;
  }): Promise<Document> {
    const response = await apiClient.post<DocumentResponseDto>(
      `/api/documents/${documentId}/review/request`,
      payload,
    );
    return mapDocument(response);
  }

  async completeReview(documentId: string, payload: {
    status?: string;
    notes?: string;
    agreesWithAssessment?: boolean;
    recommendations?: string;
  }): Promise<Document> {
    const response = await apiClient.post<DocumentResponseDto>(
      `/api/documents/${documentId}/review/complete`,
      payload,
    );
    return mapDocument(response);
  }

  async categories(): Promise<string[]> {
    return apiClient.get('/api/documents/categories');
  }

  // Methods from legacy documentApi for backwards compatibility
  async classify(documentId: string, documentType: string): Promise<Document> {
    const response = await apiClient.patch<DocumentResponseDto>(
      `/api/documents/${documentId}/classify`,
      { documentType }
    );
    return mapDocument(response);
  }

  async assign(documentId: string, assignedTo: string): Promise<Document> {
    const response = await apiClient.patch<DocumentResponseDto>(
      `/api/documents/${documentId}/assign`,
      { assignedTo }
    );
    return mapDocument(response);
  }

  async getDownloadUrl(documentId: string): Promise<{ url: string; expiresIn: number }> {
    return apiClient.get(`/api/documents/${documentId}/download`);
  }

  // Legacy list method with filter support
  async listWithFilter(filter?: DocumentFilter): Promise<Document[]> {
    const params = new URLSearchParams();
    if (filter?.patientId) params.append('patientId', filter.patientId);
    if (filter?.documentType) params.append('documentType', filter.documentType);
    if (filter?.status) params.append('status', filter.status);
    if (filter?.assignedTo) params.append('assignedTo', filter.assignedTo);
    if (filter?.isUrgent !== undefined) params.append('isUrgent', String(filter.isUrgent));
    if (filter?.fromDate) params.append('fromDate', filter.fromDate);
    if (filter?.toDate) params.append('toDate', filter.toDate);

    const payload = await apiClient.get<DocumentResponseDto[]>(`/api/documents?${params.toString()}`);
    return payload.map(mapDocument);
  }
}

export const documentsApi = new DocumentsApi();

// Legacy alias for backwards compatibility
export const documentApi = {
  upload: (request: { file: File; patientId: string; documentType?: string; tags?: string[]; notes?: string; isUrgent?: boolean; assignedTo?: string; dueDate?: string }) =>
    documentsApi.upload({
      file: request.file,
      category: request.documentType || 'other',
      patientId: request.patientId,
      tags: request.tags,
      description: request.notes,
    }),
  list: documentsApi.listWithFilter.bind(documentsApi),
  getById: documentsApi.get.bind(documentsApi),
  getDownloadUrl: documentsApi.getDownloadUrl.bind(documentsApi),
  classify: documentsApi.classify.bind(documentsApi),
  assign: documentsApi.assign.bind(documentsApi),
  delete: documentsApi.delete.bind(documentsApi),
};

export const {
  list: getDocuments,
  get: getDocument,
  upload,
  delete: deleteDocument,
  download,
  share,
  categories: getCategories,
} = documentsApi;

