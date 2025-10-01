/**
 * Centralized TypeScript type definitions for API responses and data models
 */

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Cursor-based pagination wrapper matching API responses
export interface CursorPaginationResponse<T> {
  items: T[];
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
  count: number;
}

// Common error response
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingIntakes: number;
  activeProms: number;
  completedProms: number;
  averageResponseRate: number;
  clinicOccupancy: number;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
}

// Patient data types
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Appointment types
export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  providerId: string;
  providerName: string;
  scheduledStart: string;
  scheduledEnd: string;
  appointmentType: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  videoLink?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// PROM types
export interface PromTemplate {
  id: string;
  name: string;
  description?: string;
  version: string;
  category: string;
  estimatedTimeMinutes: number;
  questionCount: number;
  isActive: boolean;
  questions: PromQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface PromQuestion {
  id: string;
  text: string;
  type: 'text' | 'number' | 'single-choice' | 'multiple-choice' | 'scale' | 'boolean';
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface PromResponse {
  id: string;
  templateId: string;
  templateName: string;
  patientId: string;
  patientName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  answers: Record<string, unknown>;
  score?: number;
  submittedAt?: string;
  completedAt?: string;
  dueDate: string;
  createdAt: string;
}

// Intake types
export interface Intake {
  id: string;
  patientId: string;
  patientName: string;
  formType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  submittedAt: string;
  processedAt?: string;
  extractedData?: Record<string, unknown>;
  confidence?: number;
  errors?: string[];
}

// Medical record types
export interface VitalSign {
  id: string;
  patientId: string;
  recordedAt: string;
  recordedBy: string;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  weight: number;
  height: number;
  bmi: number;
  oxygenSaturation?: number;
  painLevel?: number;
  notes?: string;
}

export interface MedicalHistory {
  id: string;
  patientId: string;
  category: 'condition' | 'surgery' | 'allergy' | 'medication' | 'immunization' | 'family';
  title: string;
  description: string;
  date?: string;
  status: 'active' | 'resolved' | 'ongoing';
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  notes?: string;
}

// Message types
export interface Message {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  subject: string;
  body: string;
  isRead: boolean;
  attachments?: MessageAttachment[];
  sentAt: string;
  readAt?: string;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  url: string;
}

// Analytics types
export interface AnalyticsData {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  patients: {
    total: number;
    active: number;
    new: number;
  };
  revenue: {
    total: number;
    collected: number;
    pending: number;
  };
  proms: {
    sent: number;
    completed: number;
    responseRate: number;
  };
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
}

// Backend API Response Types (from actual API)
export interface EvaluationResponse {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  patientDateOfBirth?: string;
  createdAt: string;
  status: string;
  chiefComplaint: string;
  urgency?: string;
  symptoms?: string[];
  painMaps?: Array<{
    painIntensity?: number;
    bodyPart?: string;
    x?: number;
    y?: number;
    z?: number;
  }>;
  supplements?: {
    symptoms?: string[];
    duration?: string;
    triggers?: string[];
    previousTreatments?: string[];
  };
}

// Metadata types for medical records
export interface MedicalRecordMetadata {
  source?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  tags?: string[];
  confidential?: boolean;
  externalId?: string;
  [key: string]: string | boolean | string[] | undefined;
}

// PROM API types
export interface PromTemplateResponse {
  id: string;
  name: string;
  description?: string;
  category: string;
  questions: PromQuestionResponse[];
  scoring?: {
    method: string;
    ranges?: Array<{
      min: number;
      max: number;
      label: string;
      color: string;
    }>;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version?: number;
  isActive?: boolean;
}

export interface PromQuestionResponse {
  id: string;
  text: string;
  type: string;
  required?: boolean;
  options?: string[];
  order?: number;
  validation?: Record<string, unknown>;
}

export interface PromInstanceResponse {
  id: string;
  templateId: string;
  templateName?: string;
  patientId: string;
  patientName?: string;
  status: string;
  responses?: Record<string, unknown>;
  score?: number;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
}

// Message API types
export interface MessageResponse {
  id: string;
  type: 'sms' | 'email';
  direction: 'sent' | 'received';
  recipientId?: string;
  recipientName?: string;
  recipientType?: 'patient' | 'staff';
  subject?: string;
  content: string;
  status: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
}

// Notification API types  
export interface NotificationResponse {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
}

// Export all types
export type {
  ApiResponse as IApiResponse,
  PaginatedResponse as IPaginatedResponse,
  ApiError as IApiError,
};
