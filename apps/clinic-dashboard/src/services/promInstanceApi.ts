import axios from 'axios';
import authService from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

// Types
export interface SendPromRequest {
  templateId: string;
  patientId: string;
  scheduledAt?: string;
  dueDate?: string;
  notificationMethod: NotificationMethod;
  tags?: string[];
  notes?: string;
}

export interface SendBulkPromRequest {
  templateId: string;
  patientIds: string[];
  scheduledAt?: string;
  dueDate?: string;
  notificationMethod: NotificationMethod;
  tags?: string[];
  notes?: string;
}

export interface PromInstanceDto {
  id: string;
  templateId: string;
  templateName: string;
  patientId: string;
  patientName: string;
  status: string;
  createdAt: string;
  scheduledAt: string;
  dueDate: string;
  completedAt?: string;
  completionTimeMinutes?: number;
  totalScore?: number;
  questionCount: number;
  answeredCount: number;
  notificationMethod: string;
  reminderCount: number;
  lastReminderSentAt?: string;
  tags?: string[];
  notes?: string;
}

export interface PromResponse {
  answers: PromAnswer[];
  requestBooking?: boolean;
  bookingRequest?: BookingRequest;
}

export interface BookingRequest {
  preferredDate: string;
  alternativeDate?: string;
  timePreference: string; // morning, afternoon, evening
  reasonForVisit?: string;
  notes?: string;
}

export interface BookingRequestDto {
  id: string;
  promInstanceId: string;
  patientId: string;
  patientName: string;
  requestedDate: string;
  alternativeDate?: string;
  timePreference: string;
  reasonForVisit: string;
  urgency: string;
  notes?: string;
  createdAt: string;
  status: string;
  promTemplateName: string;
  promCompletedAt?: string;
  promScore?: number;
}

export interface PromAnswer {
  questionId: string;
  value: any;
}

export interface PromInstanceStats {
  totalSent: number;
  completed: number;
  pending: number;
  scheduled: number;
  expired: number;
  completionRate: number;
  averageCompletionTimeMinutes: number;
  averageScore: number;
}

export interface PromPreviewDto {
  templateId: string;
  templateName: string;
  description: string;
  estimatedTimeMinutes: number;
  questionCount: number;
  questions: PromQuestionDto[];
}

export interface PromQuestionDto {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
}

export enum NotificationMethod {
  None = 0,
  Email = 1,
  Sms = 2,
  InApp = 4
}

// Helper to get headers with auth
const getHeaders = () => {
  const token = authService.getToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const promInstanceApi = {
  // Send PROM to a single patient
  sendToPatient: async (request: SendPromRequest): Promise<PromInstanceDto> => {
    const response = await axios.post(
      `${API_URL}/prominstance/send`,
      request,
      { headers: getHeaders() }
    );
    return response.data;
  },

  // Send PROM to multiple patients
  sendBulk: async (request: SendBulkPromRequest): Promise<PromInstanceDto[]> => {
    const response = await axios.post(
      `${API_URL}/prominstance/send/bulk`,
      request,
      { headers: getHeaders() }
    );
    return response.data;
  },

  // Get a specific PROM instance
  getInstance: async (instanceId: string): Promise<PromInstanceDto> => {
    const response = await axios.get(
      `${API_URL}/prominstance/${instanceId}`,
      { headers: getHeaders() }
    );
    return response.data;
  },

  // Get all PROM instances for a patient
  getPatientInstances: async (patientId: string): Promise<PromInstanceDto[]> => {
    const response = await axios.get(
      `${API_URL}/prominstance/patient/${patientId}`,
      { headers: getHeaders() }
    );
    return response.data;
  },

  // Submit PROM response (for patient portal)
  submitResponse: async (instanceId: string, response: PromResponse): Promise<PromInstanceDto> => {
    const apiResponse = await axios.post(
      `${API_URL}/prominstance/${instanceId}/submit`,
      response,
      { headers: { 'Content-Type': 'application/json' } } // No auth for patient submission
    );
    return apiResponse.data;
  },

  // Send reminder for a PROM
  sendReminder: async (instanceId: string): Promise<void> => {
    await axios.post(
      `${API_URL}/prominstance/${instanceId}/reminder`,
      {},
      { headers: getHeaders() }
    );
  },

  // Get pending PROMs
  getPending: async (dueBefore?: string): Promise<PromInstanceDto[]> => {
    const params = dueBefore ? `?dueBefore=${dueBefore}` : '';
    const response = await axios.get(
      `${API_URL}/prominstance/pending${params}`,
      { headers: getHeaders() }
    );
    return response.data;
  },

  // Get PROM statistics
  getStats: async (params?: {
    templateId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PromInstanceStats> => {
    const queryParams = new URLSearchParams();
    if (params?.templateId) queryParams.append('templateId', params.templateId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `${API_URL}/prominstance/stats${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url, { headers: getHeaders() });
    return response.data;
  },

  // Cancel a PROM instance
  cancel: async (instanceId: string, reason?: string): Promise<void> => {
    await axios.post(
      `${API_URL}/prominstance/${instanceId}/cancel`,
      { reason },
      { headers: getHeaders() }
    );
  },

  // Preview a PROM template
  previewTemplate: async (templateId: string): Promise<PromPreviewDto> => {
    const response = await axios.get(
      `${API_URL}/prominstance/preview/${templateId}`,
      { headers: getHeaders() }
    );
    return response.data;
  },

  // Request a booking from a PROM instance
  requestBooking: async (instanceId: string, request: BookingRequest): Promise<BookingRequestDto> => {
    const response = await axios.post(
      `${API_URL}/prominstance/${instanceId}/booking`,
      request,
      { headers: { 'Content-Type': 'application/json' } } // No auth for patient booking
    );
    return response.data;
  }
};

export default promInstanceApi;
