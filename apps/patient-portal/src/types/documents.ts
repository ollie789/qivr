export type DocumentCategory =
  | 'medical'
  | 'insurance'
  | 'lab'
  | 'imaging'
  | 'prescription'
  | 'billing'
  | 'legal'
  | 'other';

export type DocumentType = 'pdf' | 'image' | 'document' | 'spreadsheet' | 'other';

export interface DocumentSummary {
  id: string;
  name: string;
  type: DocumentType;
  category: DocumentCategory;
  size: number;
  uploadedDate: string;
  modifiedDate: string;
  uploadedBy: string;
  sharedWith: string[];
  tags: string[];
  starred: boolean;
  verified: boolean;
  encrypted: boolean;
  description?: string;
  url?: string;
  thumbnailUrl?: string;
  folderId?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  createdDate: string;
  documentCount: number;
  color?: string;
  icon?: string;
}

export interface DocumentFilters {
  folderId?: string | null;
  category?: DocumentCategory | 'all';
  search?: string;
}

export interface UploadDocumentInput {
  file: File;
  category: DocumentCategory | 'other';
  tags: string[];
}
