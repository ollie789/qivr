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
  requiresReview: boolean;
  reviewStatus: string;
  reviewNotes?: string;
  shares: DocumentShare[];
  encrypted: boolean;
  description?: string;
  url?: string;
  thumbnailUrl?: string;
  folderId?: string;
}

export interface DocumentShare {
  id: string;
  userId: string;
  name: string;
  sharedById: string;
  sharedByName: string;
  sharedAt: string;
  expiresAt?: string;
  accessLevel: string;
  message?: string;
  revoked: boolean;
  revokedAt?: string;
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
  requiresReview?: boolean;
}

export interface UploadDocumentInput {
  file: File;
  category: DocumentCategory | 'other';
  tags: string[];
}

export interface DocumentSharePayload {
  userId: string;
  expiresAt?: string;
  message?: string;
  accessLevel?: string;
}

export interface DocumentReviewRequestPayload {
  assignedToUserId?: string;
  notes?: string;
}

export interface DocumentReviewCompletePayload {
  notes?: string;
  agreesWithAssessment?: boolean;
  recommendations?: string;
  status?: string;
}
