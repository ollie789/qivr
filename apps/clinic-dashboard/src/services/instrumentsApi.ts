import apiClient from '../lib/api-client';

export interface InstrumentSummary {
  id: string;
  key: string;
  name: string;
  clinicalDomain?: string;
  licenseType: 'Open' | 'NonCommercial' | 'CommercialRequired' | 'Proprietary';
}

export interface Instrument extends InstrumentSummary {
  instrumentFamily?: string;
  description?: string;
  referenceUrl?: string;
  licenseNotes?: string;
  isGlobal: boolean;
  isActive: boolean;
  templateCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInstrumentRequest {
  key: string;
  name: string;
  instrumentFamily?: string;
  clinicalDomain?: string;
  licenseType?: 'Open' | 'NonCommercial' | 'CommercialRequired' | 'Proprietary';
  licenseNotes?: string;
  isGlobal?: boolean;
  description?: string;
  referenceUrl?: string;
}

export interface UpdateInstrumentRequest {
  name?: string;
  instrumentFamily?: string;
  clinicalDomain?: string;
  licenseType?: 'Open' | 'NonCommercial' | 'CommercialRequired' | 'Proprietary';
  licenseNotes?: string;
  isActive?: boolean;
  description?: string;
  referenceUrl?: string;
}

export const instrumentsApi = {
  getSummaryList: async (clinicalDomain?: string): Promise<InstrumentSummary[]> => {
    const params = clinicalDomain ? { clinicalDomain } : undefined;
    return apiClient.get<InstrumentSummary[]>('/api/instruments/summary', params);
  },

  getAll: async (includeInactive = false): Promise<Instrument[]> => {
    return apiClient.get<Instrument[]>('/api/instruments', { includeInactive });
  },

  getById: async (id: string): Promise<Instrument> => {
    return apiClient.get<Instrument>(`/api/instruments/${id}`);
  },

  getByKey: async (key: string): Promise<Instrument> => {
    return apiClient.get<Instrument>(`/api/instruments/key/${key}`);
  },

  create: async (data: CreateInstrumentRequest): Promise<Instrument> => {
    return apiClient.post<Instrument>('/api/instruments', data);
  },

  update: async (id: string, data: UpdateInstrumentRequest): Promise<Instrument> => {
    return apiClient.put<Instrument>(`/api/instruments/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/instruments/${id}`);
  },

  getClinicalDomains: async (): Promise<string[]> => {
    return apiClient.get<string[]>('/api/instruments/domains');
  },
};
