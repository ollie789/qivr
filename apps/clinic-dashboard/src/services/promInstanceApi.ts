import apiClient from '../lib/api-client';
import type { PromAnswerValue } from './promApi';

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
  bookingRequested?: boolean;
  bookingRequestedAt?: string;
  answers?: Record<string, PromAnswerValue>;
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
  value: PromAnswerValue;
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
  InApp = 4,
}

// Base path for API
const BASE_PATH = "/api/PromInstance";

export const promInstanceApi = {
  // Send PROM to a single patient
  sendToPatient: async (request: SendPromRequest): Promise<PromInstanceDto> => {
    return await apiClient.post<PromInstanceDto>(`${BASE_PATH}/send`, request);
  },

  // Send PROM to multiple patients
  sendBulk: async (
    request: SendBulkPromRequest,
  ): Promise<PromInstanceDto[]> => {
    return await apiClient.post<PromInstanceDto[]>(
      `${BASE_PATH}/send/bulk`,
      request,
    );
  },

  // Get a specific PROM instance
  getInstance: async (instanceId: string): Promise<PromInstanceDto> => {
    return await apiClient.get<PromInstanceDto>(`${BASE_PATH}/${instanceId}`);
  },

  // Get all PROM instances for a patient
  getPatientInstances: async (
    patientId: string,
  ): Promise<PromInstanceDto[]> => {
    return await apiClient.get<PromInstanceDto[]>(
      `${BASE_PATH}/patient/${patientId}`,
    );
  },

  // Submit PROM response (for patient portal)
  submitResponse: async (
    instanceId: string,
    response: PromResponse,
  ): Promise<PromInstanceDto> => {
    // Use regular API post for patient submission
    return await apiClient.post<PromInstanceDto>(
      `${BASE_PATH}/${instanceId}/submit`,
      response,
    );
  },

  // Send reminder for a PROM
  sendReminder: async (instanceId: string): Promise<void> => {
    await apiClient.post<void>(`${BASE_PATH}/${instanceId}/reminder`, {});
  },

  // Get pending PROMs
  getPending: async (dueBefore?: string): Promise<PromInstanceDto[]> => {
    const params = dueBefore ? { dueBefore } : undefined;
    return await apiClient.get<PromInstanceDto[]>(
      `${BASE_PATH}/pending`,
      params,
    );
  },

  // Get PROM statistics
  getStats: async (params?: {
    templateId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PromInstanceStats> => {
    return await apiClient.get<PromInstanceStats>(`${BASE_PATH}/stats`, params);
  },

  // Cancel a PROM instance
  cancel: async (instanceId: string, reason?: string): Promise<void> => {
    await apiClient.post<void>(`${BASE_PATH}/${instanceId}/cancel`, { reason });
  },

  // Preview a PROM template
  previewTemplate: async (templateId: string): Promise<PromPreviewDto> => {
    return await apiClient.get<PromPreviewDto>(
      `${BASE_PATH}/preview/${templateId}`,
    );
  },

  // Request a booking from a PROM instance
  requestBooking: async (
    instanceId: string,
    request: BookingRequest,
  ): Promise<BookingRequestDto> => {
    return await apiClient.post<BookingRequestDto>(
      `${BASE_PATH}/${instanceId}/booking`,
      request,
    );
  },
};

export default promInstanceApi;
