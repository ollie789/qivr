import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api-client', () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

const { uploadWithProgressMock } = vi.hoisted(() => ({
  uploadWithProgressMock: vi.fn(),
}));

vi.mock('@qivr/http', () => ({
  uploadWithProgress: uploadWithProgressMock,
}));

import apiClient from '../../lib/api-client';
import {
  fetchDocuments,
  fetchFolders,
  uploadDocument,
  deleteDocument,
  toggleStar,
} from '../documentsApi';
import type { DocumentFolder, DocumentSummary } from '../../types';

const mockClient = vi.mocked(apiClient);

describe('documentsApi', () => {
  const documents: DocumentSummary[] = [
    {
      id: 'doc-1',
      name: 'Intake.pdf',
      type: 'pdf',
      category: 'medical',
      size: 1234,
      uploadedDate: '2024-01-01T00:00:00Z',
      modifiedDate: '2024-01-01T00:00:00Z',
      uploadedBy: 'Nurse Joy',
      sharedWith: [],
      tags: [],
      starred: false,
      verified: false,
      encrypted: false,
    },
  ];

  const folders: DocumentFolder[] = [
    {
      id: 'folder-1',
      name: 'Medical',
      createdDate: '2024-01-01T00:00:00Z',
      documentCount: 5,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchDocuments unwraps envelope and forwards filters', async () => {
    mockClient.get.mockResolvedValueOnce({ data: documents });

    const result = await fetchDocuments({ category: 'medical', search: 'intake' });

    expect(mockClient.get).toHaveBeenCalledWith('/api/Documents', { category: 'medical', search: 'intake' });
    expect(result).toEqual(documents);
  });

  it('fetchFolders returns plain data', async () => {
    mockClient.get.mockResolvedValueOnce(folders);

    const result = await fetchFolders();

    expect(mockClient.get).toHaveBeenCalledWith('/api/Documents/folders');
    expect(result).toEqual(folders);
  });

  it('uploadDocument delegates to uploadWithProgress', async () => {
    uploadWithProgressMock.mockResolvedValueOnce({ id: 'upload-1' });
    const file = new File(['data'], 'report.pdf', { type: 'application/pdf' });
    const progressSpy = vi.fn();

    const result = await uploadDocument({ file, category: 'medical', tags: ['intake'] }, progressSpy);

    expect(uploadWithProgressMock).toHaveBeenCalledTimes(1);
    const [path, formData, options] = uploadWithProgressMock.mock.calls[0];
    expect(path).toBe('/api/Documents/upload');
    expect(formData).toBeInstanceOf(FormData);
    expect(typeof options.onUploadProgress).toBe('function');

    // simulate progress callback
    options.onUploadProgress?.(42);
    expect(progressSpy).toHaveBeenCalledWith(42);

    expect(result).toEqual({ id: 'upload-1' });
  });

  it('toggleStar calls patch with flipped value', async () => {
    mockClient.patch.mockResolvedValueOnce(undefined);

    await toggleStar('doc-2', true);

    expect(mockClient.patch).toHaveBeenCalledWith('/api/Documents/doc-2/star', { starred: true });
  });

  it('deleteDocument calls delete endpoint', async () => {
    mockClient.delete.mockResolvedValueOnce(undefined);

    await deleteDocument('doc-3');

    expect(mockClient.delete).toHaveBeenCalledWith('/api/Documents/doc-3');
  });
});
