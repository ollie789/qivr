import apiClient from "../lib/api-client";

export interface Document {
  id: string;
  patientId: string;
  patientName?: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  status: string;
  extractedPatientName?: string;
  extractedDob?: string;
  confidenceScore?: number;
  tags: string[];
  notes?: string;
  isUrgent: boolean;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  createdAt: string;
}

export interface UploadDocumentRequest {
  file: File;
  patientId: string;
  documentType?: string;
  tags?: string[];
  notes?: string;
  isUrgent?: boolean;
  assignedTo?: string;
  dueDate?: string;
}

export interface DocumentFilter {
  patientId?: string;
  documentType?: string;
  status?: string;
  assignedTo?: string;
  isUrgent?: boolean;
  fromDate?: string;
  toDate?: string;
}

export const documentApi = {
  async upload(request: UploadDocumentRequest): Promise<Document> {
    const formData = new FormData();
    formData.append("File", request.file);
    formData.append("PatientId", request.patientId);

    if (request.documentType)
      formData.append("DocumentType", request.documentType);
    if (request.notes) formData.append("Notes", request.notes);
    if (request.isUrgent !== undefined)
      formData.append("IsUrgent", String(request.isUrgent));
    if (request.assignedTo) formData.append("AssignedTo", request.assignedTo);
    if (request.dueDate) formData.append("DueDate", request.dueDate);
    if (request.tags) {
      request.tags.forEach((tag) => formData.append("Tags", tag));
    }

    const response = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return response.json();
  },

  async list(filter?: DocumentFilter): Promise<Document[]> {
    const params = new URLSearchParams();
    if (filter?.patientId) params.append("patientId", filter.patientId);
    if (filter?.documentType)
      params.append("documentType", filter.documentType);
    if (filter?.status) params.append("status", filter.status);
    if (filter?.assignedTo) params.append("assignedTo", filter.assignedTo);
    if (filter?.isUrgent !== undefined)
      params.append("isUrgent", String(filter.isUrgent));
    if (filter?.fromDate) params.append("fromDate", filter.fromDate);
    if (filter?.toDate) params.append("toDate", filter.toDate);

    return apiClient.get(`/api/documents?${params.toString()}`);
  },

  async getById(id: string): Promise<Document> {
    return apiClient.get(`/api/documents/${id}`);
  },

  async getDownloadUrl(
    id: string,
  ): Promise<{ url: string; expiresIn: number }> {
    return apiClient.get(`/api/documents/${id}/download`);
  },

  async classify(id: string, documentType: string): Promise<Document> {
    return apiClient.patch(`/api/documents/${id}/classify`, { documentType });
  },

  async assign(id: string, assignedTo: string): Promise<Document> {
    return apiClient.patch(`/api/documents/${id}/assign`, { assignedTo });
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/documents/${id}`);
  },
};
