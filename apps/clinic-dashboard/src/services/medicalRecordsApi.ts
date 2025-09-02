import apiClient from './sharedApiClient';

export interface MedicalRecord {
  id: string;
  patientId: string;
  type: 'diagnosis' | 'prescription' | 'lab-result' | 'imaging' | 'procedure' | 'immunization' | 'allergy' | 'vitals';
  title: string;
  description: string;
  date: string;
  providerId: string;
  providerName: string;
  attachments?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Vitals {
  id: string;
  patientId: string;
  recordedAt: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  prescribedDate: string;
  startDate: string;
  endDate?: string;
  refills?: number;
  instructions?: string;
  status: 'active' | 'completed' | 'cancelled' | 'on-hold';
}

export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  testDate: string;
  orderedBy: string;
  performedBy?: string;
  results: Array<{
    parameter: string;
    value: string;
    unit: string;
    referenceRange?: string;
    flag?: 'normal' | 'high' | 'low' | 'critical';
  }>;
  interpretation?: string;
  attachments?: string[];
}

class MedicalRecordsApi {
  async getMedicalRecords(patientId: string, params?: {
    type?: string;
    startDate?: string;
    endDate?: string;
    providerId?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get(`/api/medical-records/patient/${patientId}`, { params });
    return response.data;
  }

  async getMedicalRecord(id: string) {
    const response = await apiClient.get(`/api/medical-records/${id}`);
    return response.data;
  }

  async createMedicalRecord(data: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    const response = await apiClient.post('/api/medical-records', data);
    return response.data;
  }

  async updateMedicalRecord(id: string, data: Partial<MedicalRecord>) {
    const response = await apiClient.put(`/api/medical-records/${id}`, data);
    return response.data;
  }

  async deleteMedicalRecord(id: string) {
    const response = await apiClient.delete(`/api/medical-records/${id}`);
    return response.data;
  }

  // Vitals
  async getVitals(patientId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    const response = await apiClient.get(`/api/medical-records/vitals/${patientId}`, { params });
    return response.data;
  }

  async recordVitals(data: Omit<Vitals, 'id'>) {
    const response = await apiClient.post('/api/medical-records/vitals', data);
    return response.data;
  }

  async getLatestVitals(patientId: string) {
    const response = await apiClient.get(`/api/medical-records/vitals/${patientId}/latest`);
    return response.data;
  }

  // Prescriptions
  async getPrescriptions(patientId: string, params?: {
    status?: string;
    providerId?: string;
  }) {
    const response = await apiClient.get(`/api/medical-records/prescriptions/${patientId}`, { params });
    return response.data;
  }

  async createPrescription(data: Omit<Prescription, 'id'>) {
    const response = await apiClient.post('/api/medical-records/prescriptions', data);
    return response.data;
  }

  async updatePrescription(id: string, data: Partial<Prescription>) {
    const response = await apiClient.put(`/api/medical-records/prescriptions/${id}`, data);
    return response.data;
  }

  async refillPrescription(id: string) {
    const response = await apiClient.post(`/api/medical-records/prescriptions/${id}/refill`);
    return response.data;
  }

  // Lab Results
  async getLabResults(patientId: string, params?: {
    startDate?: string;
    endDate?: string;
    testType?: string;
  }) {
    const response = await apiClient.get(`/api/medical-records/lab-results/${patientId}`, { params });
    return response.data;
  }

  async createLabResult(data: Omit<LabResult, 'id'>) {
    const response = await apiClient.post('/api/medical-records/lab-results', data);
    return response.data;
  }

  // Medical History
  async getMedicalHistory(patientId: string) {
    const response = await apiClient.get(`/api/medical-records/history/${patientId}`);
    return response.data;
  }

  async getAllergies(patientId: string) {
    const response = await apiClient.get(`/api/medical-records/allergies/${patientId}`);
    return response.data;
  }

  async addAllergy(patientId: string, data: {
    allergen: string;
    reaction: string;
    severity: 'mild' | 'moderate' | 'severe';
    onsetDate?: string;
  }) {
    const response = await apiClient.post(`/api/medical-records/allergies/${patientId}`, data);
    return response.data;
  }

  async getImmunizations(patientId: string) {
    const response = await apiClient.get(`/api/medical-records/immunizations/${patientId}`);
    return response.data;
  }

  async addImmunization(patientId: string, data: {
    vaccine: string;
    dateAdministered: string;
    administeredBy: string;
    nextDoseDate?: string;
    lotNumber?: string;
  }) {
    const response = await apiClient.post(`/api/medical-records/immunizations/${patientId}`, data);
    return response.data;
  }

  // Reports
  async generateHealthSummary(patientId: string) {
    const response = await apiClient.get(`/api/medical-records/summary/${patientId}`);
    return response.data;
  }

  async exportRecords(patientId: string, format: 'pdf' | 'csv' | 'json' = 'pdf') {
    const response = await apiClient.get(`/api/medical-records/export/${patientId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }
}

export const medicalRecordsApi = new MedicalRecordsApi();
