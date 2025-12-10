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
}

export const instrumentsApi = {
  getSummaryList: async (clinicalDomain?: string): Promise<InstrumentSummary[]> => {
    const params = clinicalDomain ? `?clinicalDomain=${clinicalDomain}` : '';
    const response = await apiClient.get(`/api/instruments/summary${params}`);
    return response.data;
  },

  getAll: async (includeInactive = false): Promise<Instrument[]> => {
    const response = await apiClient.get(`/api/instruments?includeInactive=${includeInactive}`);
    return response.data;
  },

  getByKey: async (key: string): Promise<Instrument> => {
    const response = await apiClient.get(`/api/instruments/key/${key}`);
    return response.data;
  },
};
