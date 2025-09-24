import apiClient from '../lib/api-client';
import { EvaluationResponse } from '../types/api';

export interface IntakeSubmission {
  id: string;
  patientName: string;
  email: string;
  phone?: string;
  submittedAt: string;
  conditionType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'scheduled';
  painLevel: number;
  symptoms?: string[];
  aiSummary?: string;
  assignedTo?: string;
  notes?: string;
  patientId?: string; // Link to existing patient
  bodyMap?: {
    painPoints?: Array<{
      x: number;
      y: number;
      z: number;
      intensity: number;
      bodyPart: string;
    }>;
  };
}

export interface IntakeDetails {
  id: string;
  patient: {
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address?: string;
  };
  evaluation: {
    submittedAt: string;
    conditionType: string;
    severity: string;
    painLevel: number;
    symptoms: string[];
    description: string;
    duration: string;
    triggers?: string[];
    previousTreatments?: string[];
  };
  painMap?: {
    bodyParts: Array<{
      region: string;
      intensity: number;
      type: string;
    }>;
  };
  aiSummary?: {
    content: string;
    riskFactors: string[];
    recommendations: string[];
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
  };
  status: string;
  assignedTo?: string;
  notes?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

export interface IntakeFilters {
  status?: string;
  severity?: string;
  assignedTo?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

function mapEvaluationToIntake(e: EvaluationResponse): IntakeSubmission {
  const severityMap: Record<string, IntakeSubmission['severity']> = {
    urgent: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
  };
  const statusMap: Record<string, IntakeSubmission['status']> = {
    Pending: 'pending',
    Reviewed: 'reviewing',
    Triaged: 'approved',
    Archived: 'rejected',
  };
  return {
    id: e.id,
    patientName: e.patientName,
    email: e.patientEmail || 'n/a@unknown',
    phone: e.patientPhone || '',
    submittedAt: e.createdAt,
    conditionType: e.chiefComplaint,
    severity: severityMap[(e.urgency || '').toLowerCase()] || 'medium',
    status: statusMap[e.status] || 'pending',
    painLevel: (e.painMaps && e.painMaps[0]?.painIntensity) || 5,
    symptoms: e.symptoms || [],
  };
}

export const intakeApi = {
  async getIntakes(filters?: IntakeFilters): Promise<{ data: IntakeSubmission[]; total: number }> {
    try {
      const response = await apiClient.get('/api/v1/evaluations', { params: filters });
      const list = Array.isArray(response.data) ? response.data : [];
      const data = list.map(mapEvaluationToIntake);
      return { data, total: data.length };
    } catch (error) {
      console.error('Error fetching intakes:', error);
      return {
        data: [],
        total: 0,
      };
    }
  },

  async getIntakeDetails(id: string): Promise<IntakeDetails> {
    try {
      const response = await apiClient.get(`/api/v1/evaluations/${id}`);
      const e = response.data;
      return {
        id: e.id,
        patient: {
          name: e.patientName,
          email: e.patientEmail || '',
          phone: e.patientPhone || '',
          dateOfBirth: e.patientDateOfBirth || '',
        },
        evaluation: {
          submittedAt: e.createdAt,
          conditionType: e.chiefComplaint,
          severity: e.urgency || 'Medium',
          painLevel: (e.painMaps && e.painMaps[0]?.painIntensity) || 5,
          symptoms: e.supplements?.symptoms || e.symptoms || [],
          description: e.chiefComplaint || '',
          duration: e.supplements?.duration || 'unknown',
        },
        status: e.status,
      };
    } catch (error) {
      console.error('Error fetching intake details:', error);
      throw error;
    }
  },

  async updateIntakeStatus(id: string, status: string, notes?: string): Promise<void> {
    try {
      await apiClient.patch(`/api/v1/evaluations/${id}/status`, { status, notes });
    } catch (error) {
      console.error('Error updating intake status:', error);
      throw error;
    }
  },
};

export default intakeApi;
