import apiClient from '../lib/api-client';

export interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

export interface RequiredDocument {
  type: string;
  label: string;
  description: string;
  required: boolean;
  uploaded: boolean;
  documentId?: string;
}

export const documentApi = {
  async upload(file: File, documentType: string): Promise<Document> {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('DocumentType', documentType);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  async getMyDocuments(): Promise<Document[]> {
    return apiClient.get('/api/documents');
  },

  async getDownloadUrl(id: string): Promise<{ url: string }> {
    return apiClient.get(`/api/documents/${id}/download`);
  },

  async getRequiredDocuments(): Promise<RequiredDocument[]> {
    // This would come from backend based on upcoming appointments
    // For now, return static list
    const myDocs = await this.getMyDocuments();
    
    const required: RequiredDocument[] = [
      {
        type: 'referral',
        label: 'Referral Letter',
        description: 'Required for first appointment',
        required: true,
        uploaded: myDocs.some(d => d.documentType === 'referral')
      },
      {
        type: 'consent',
        label: 'Consent Form',
        description: 'Treatment consent and privacy agreement',
        required: true,
        uploaded: myDocs.some(d => d.documentType === 'consent')
      },
      {
        type: 'assessment',
        label: 'Previous Assessments',
        description: 'Any previous therapy or medical assessments',
        required: false,
        uploaded: myDocs.some(d => d.documentType === 'assessment')
      }
    ];

    return required;
  }
};
