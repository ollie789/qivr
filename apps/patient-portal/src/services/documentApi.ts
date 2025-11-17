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
        type: 'insurance',
        label: 'Insurance Details',
        description: 'Health insurance or Medicare card',
        required: false,
        uploaded: myDocs.some(d => d.documentType === 'insurance')
      },
      {
        type: 'imaging',
        label: 'Imaging/X-Rays',
        description: 'Any recent X-rays, MRI, or CT scans',
        required: false,
        uploaded: myDocs.some(d => d.documentType === 'imaging')
      },
      {
        type: 'lab_report',
        label: 'Lab Results',
        description: 'Recent blood work or lab tests',
        required: false,
        uploaded: myDocs.some(d => d.documentType === 'lab_report')
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
