import { uploadWithProgress } from '@qivr/http';
import apiClient from '../lib/api-client';
import {
  ApiEnvelope,
  DocumentFilters,
  DocumentFolder,
  DocumentSummary,
  UploadDocumentInput,
} from '../types';

type EnvelopeOrValue<T> = ApiEnvelope<T> | T;

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

  return Object.keys(params).length ? params : undefined;
}

export async function fetchDocuments(filters: DocumentFilters = {}): Promise<DocumentSummary[]> {
  const response = await apiClient.get<EnvelopeOrValue<DocumentSummary[]>>(
    '/api/Documents',
    toQueryParams(filters),
  );
  return unwrapEnvelope(response);
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
  input.tags.forEach((tag) => formData.append('tags[]', tag));

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
