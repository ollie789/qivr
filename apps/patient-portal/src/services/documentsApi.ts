import { uploadWithProgress } from '@qivr/http';
import apiClient from '../lib/api-client';
import {
  ApiEnvelope,
  DocumentFilters,
  DocumentFolder,
  DocumentSummary,
  UploadDocumentInput,
  DocumentShare,
  DocumentSharePayload,
  DocumentReviewRequestPayload,
  DocumentReviewCompletePayload,
  DocumentCategory,
} from '../types';

type EnvelopeOrValue<T> = ApiEnvelope<T> | T;

const VALID_CATEGORIES: DocumentCategory[] = [
  'medical',
  'insurance',
  'lab',
  'imaging',
  'prescription',
  'billing',
  'legal',
  'other',
];

interface DocumentShareApi {
  shareId: string;
  sharedWithUserId: string;
  sharedWithName?: string;
  sharedByUserId: string;
  sharedByName?: string;
  sharedAt: string;
  expiresAt?: string;
  accessLevel: string;
  message?: string;
  revoked: boolean;
  revokedAt?: string;
}

interface DocumentApiResponse {
  id: string;
  patientId: string;
  patientName?: string;
  providerId?: string;
  providerName?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  description?: string;
  uploadedById?: string;
  uploadedBy: string;
  uploadedAt: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  url?: string;
  thumbnailUrl?: string;
  requiresReview: boolean;
  reviewStatus: string;
  reviewNotes?: string;
  reviewedById?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  shares?: DocumentShareApi[];
}

function unwrapEnvelope<T>(payload: EnvelopeOrValue<T>): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

function toQueryParams(filters: DocumentFilters = {}): Record<string, string> | undefined {
  const params: Record<string, string> = {};

  if (filters.folderId) {
    params.folderId = filters.folderId;
  }

  if (filters.category && filters.category !== 'all') {
    params.category = filters.category;
  }

  if (filters.search) {
    params.search = filters.search;
  }

  if (typeof filters.requiresReview === 'boolean') {
    params.requiresReview = String(filters.requiresReview);
  }

  return Object.keys(params).length ? params : undefined;
}

function mapMimeTypeToDocumentType(mimeType: string): 'pdf' | 'image' | 'document' | 'spreadsheet' | 'other' {
  if (!mimeType) return 'other';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('word') || mimeType.includes('text')) return 'document';
  return 'other';
}

function mapShare(api: DocumentShareApi): DocumentShare {
  return {
    id: api.shareId,
    userId: api.sharedWithUserId,
    name: api.sharedWithName || api.sharedWithUserId,
    sharedById: api.sharedByUserId,
    sharedByName: api.sharedByName || api.sharedByUserId,
    sharedAt: api.sharedAt,
    expiresAt: api.expiresAt,
    accessLevel: api.accessLevel,
    message: api.message,
    revoked: api.revoked,
    revokedAt: api.revokedAt,
  };
}

function mapDocument(dto: DocumentApiResponse): DocumentSummary {
  const shares = (dto.shares ?? []).map(mapShare);
  const activeShares = shares.filter((share) => !share.revoked);
  const category = VALID_CATEGORIES.includes(dto.category as DocumentCategory)
    ? (dto.category as DocumentCategory)
    : 'other';

  return {
    id: dto.id,
    name: dto.fileName,
    type: mapMimeTypeToDocumentType(dto.mimeType),
    category,
    size: dto.fileSize,
    uploadedDate: dto.uploadedAt,
    modifiedDate: dto.uploadedAt,
    uploadedBy: dto.uploadedBy,
    sharedWith: activeShares.map((share) => share.name),
    tags: dto.tags ?? [],
    starred: Boolean(dto.metadata && dto.metadata['starred'] === true),
    verified: !dto.requiresReview,
    requiresReview: dto.requiresReview,
    reviewStatus: dto.reviewStatus,
    reviewNotes: dto.reviewNotes,
    shares,
    encrypted: Boolean(dto.metadata && dto.metadata['encrypted'] === true),
    description: dto.description,
    url: dto.url,
    thumbnailUrl: dto.thumbnailUrl,
    folderId: dto.metadata && typeof dto.metadata['folderId'] === 'string' ? (dto.metadata['folderId'] as string) : undefined,
  };
}

export async function fetchDocuments(filters: DocumentFilters = {}): Promise<DocumentSummary[]> {
  const response = await apiClient.get<EnvelopeOrValue<DocumentApiResponse[]>>(
    '/api/Documents',
    toQueryParams(filters),
  );
  return unwrapEnvelope(response).map(mapDocument);
}

export async function fetchFolders(): Promise<DocumentFolder[]> {
  const response = await apiClient.get<EnvelopeOrValue<DocumentFolder[]>>(
    '/api/Documents/folders',
  );
  return unwrapEnvelope(response);
}

export async function uploadDocument(
  input: UploadDocumentInput,
  onProgress?: (percent: number) => void,
): Promise<unknown> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('category', input.category);
  formData.append('tags', JSON.stringify(input.tags));

  return uploadWithProgress('/api/Documents/upload', formData, {
    onUploadProgress: (percent) => onProgress?.(percent),
  });
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/api/Documents/${documentId}`);
}

export async function toggleStar(documentId: string, starred: boolean): Promise<void> {
  await apiClient.patch(`/api/Documents/${documentId}/star`, { starred });
}

export async function listDocumentShares(documentId: string): Promise<DocumentShare[]> {
  const response = await apiClient.get<EnvelopeOrValue<DocumentShareApi[]>>(
    `/api/Documents/${documentId}/shares`,
  );
  return unwrapEnvelope(response).map(mapShare);
}

export async function createDocumentShare(documentId: string, payload: DocumentSharePayload): Promise<DocumentShare> {
  const response = await apiClient.post<DocumentShareApi>(
    `/api/Documents/${documentId}/share`,
    {
      userId: payload.userId,
      expiresAt: payload.expiresAt,
      message: payload.message,
      accessLevel: payload.accessLevel,
    },
  );
  return mapShare(response);
}

export async function revokeDocumentShare(documentId: string, shareId: string): Promise<void> {
  await apiClient.delete(`/api/Documents/${documentId}/shares/${shareId}`);
}

export async function requestDocumentReview(documentId: string, payload: DocumentReviewRequestPayload): Promise<void> {
  await apiClient.post(`/api/Documents/${documentId}/review/request`, payload);
}

export async function completeDocumentReview(documentId: string, payload: DocumentReviewCompletePayload): Promise<void> {
  await apiClient.post(`/api/Documents/${documentId}/review/complete`, payload);
}
