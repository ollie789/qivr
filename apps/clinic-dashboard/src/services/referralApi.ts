import apiClient from "../lib/api-client";

export type ReferralType =
  | "Specialist"
  | "Imaging"
  | "Laboratory"
  | "Therapy"
  | "Hospital"
  | "EmergencyDept"
  | "AlliedHealth"
  | "Other";

export type ReferralPriority =
  | "Routine"
  | "SemiUrgent"
  | "Urgent"
  | "Emergency";

export type ReferralStatus =
  | "Draft"
  | "PendingApproval"
  | "Sent"
  | "Acknowledged"
  | "Scheduled"
  | "Completed"
  | "ResultsReceived"
  | "Closed"
  | "Cancelled"
  | "Expired";

export interface Referral {
  id: string;
  patientId: string;
  patientName?: string;
  referringProviderId: string;
  referringProviderName?: string;
  type: ReferralType;
  typeName: string;
  specialty: string;
  specificService?: string;
  priority: ReferralPriority;
  priorityName: string;
  status: ReferralStatus;
  statusName: string;
  externalProviderName?: string;
  externalProviderPhone?: string;
  externalProviderEmail?: string;
  externalProviderAddress?: string;
  externalProviderFax?: string;
  reasonForReferral?: string;
  clinicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  relevantTestResults?: string;
  specificQuestions?: string;
  referralDate?: string;
  expiryDate?: string;
  sentAt?: string;
  acknowledgedAt?: string;
  scheduledAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  responseNotes?: string;
  appointmentDate?: string;
  appointmentLocation?: string;
  referralDocumentId?: string;
  responseDocumentId?: string;
  patientNotified: boolean;
  patientNotifiedAt?: string;
  requiresFollowUp: boolean;
  followUpDate?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReferralRequest {
  patientId: string;
  type: ReferralType;
  specialty: string;
  specificService?: string;
  priority: ReferralPriority;
  externalProviderName?: string;
  externalProviderPhone?: string;
  externalProviderEmail?: string;
  externalProviderAddress?: string;
  externalProviderFax?: string;
  reasonForReferral?: string;
  clinicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  relevantTestResults?: string;
  specificQuestions?: string;
  expiryDate?: string;
}

export interface UpdateReferralRequest {
  specialty?: string;
  specificService?: string;
  priority?: ReferralPriority;
  externalProviderName?: string;
  externalProviderPhone?: string;
  externalProviderEmail?: string;
  externalProviderAddress?: string;
  externalProviderFax?: string;
  reasonForReferral?: string;
  clinicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  relevantTestResults?: string;
  specificQuestions?: string;
  expiryDate?: string;
  appointmentDate?: string;
  appointmentLocation?: string;
  responseNotes?: string;
  requiresFollowUp?: boolean;
  followUpDate?: string;
}

export interface ReferralFilterRequest {
  patientId?: string;
  providerId?: string;
  status?: ReferralStatus;
  type?: ReferralType;
  priority?: ReferralPriority;
  specialty?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  sentReferrals: number;
  completedReferrals: number;
  cancelledReferrals: number;
  avgCompletionDays: number;
  byType: { type: string; count: number }[];
  bySpecialty: { specialty: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

export const referralApi = {
  async create(request: CreateReferralRequest): Promise<Referral> {
    return apiClient.post("/api/referrals", request);
  },

  async getAll(filter?: ReferralFilterRequest): Promise<Referral[]> {
    const params = new URLSearchParams();
    if (filter?.patientId) params.append("patientId", filter.patientId);
    if (filter?.providerId) params.append("providerId", filter.providerId);
    if (filter?.status) params.append("status", filter.status);
    if (filter?.type) params.append("type", filter.type);
    if (filter?.priority) params.append("priority", filter.priority);
    if (filter?.specialty) params.append("specialty", filter.specialty);
    if (filter?.fromDate) params.append("fromDate", filter.fromDate);
    if (filter?.toDate) params.append("toDate", filter.toDate);
    return apiClient.get(`/api/referrals?${params.toString()}`);
  },

  async getById(id: string): Promise<Referral> {
    return apiClient.get(`/api/referrals/${id}`);
  },

  async getByPatient(patientId: string): Promise<Referral[]> {
    return apiClient.get(`/api/referrals/patient/${patientId}`);
  },

  async update(id: string, request: UpdateReferralRequest): Promise<Referral> {
    return apiClient.put(`/api/referrals/${id}`, request);
  },

  async updateStatus(
    id: string,
    status: ReferralStatus,
    notes?: string,
  ): Promise<Referral> {
    return apiClient.patch(`/api/referrals/${id}/status`, { status, notes });
  },

  async send(id: string): Promise<Referral> {
    return apiClient.post(`/api/referrals/${id}/send`, {});
  },

  async cancel(id: string, reason: string): Promise<Referral> {
    return apiClient.post(`/api/referrals/${id}/cancel`, { reason });
  },

  async attachDocument(
    id: string,
    documentId: string,
    isResponse: boolean = false,
  ): Promise<Referral> {
    return apiClient.post(`/api/referrals/${id}/documents`, {
      documentId,
      isResponse,
    });
  },

  async getStats(providerId?: string): Promise<ReferralStats> {
    const params = providerId ? `?providerId=${providerId}` : "";
    return apiClient.get(`/api/referrals/stats${params}`);
  },
};

// Utility constants for dropdowns
export const REFERRAL_TYPES: { value: ReferralType; label: string }[] = [
  { value: "Specialist", label: "Specialist" },
  { value: "Imaging", label: "Imaging (X-Ray, MRI, CT)" },
  { value: "Laboratory", label: "Laboratory" },
  { value: "Therapy", label: "Therapy (Physio, OT, Speech)" },
  { value: "Hospital", label: "Hospital" },
  { value: "EmergencyDept", label: "Emergency Department" },
  { value: "AlliedHealth", label: "Allied Health" },
  { value: "Other", label: "Other" },
];

export const REFERRAL_PRIORITIES: {
  value: ReferralPriority;
  label: string;
  color: string;
}[] = [
  { value: "Routine", label: "Routine", color: "default" },
  { value: "SemiUrgent", label: "Semi-Urgent (2-4 weeks)", color: "info" },
  { value: "Urgent", label: "Urgent (1 week)", color: "warning" },
  { value: "Emergency", label: "Emergency (Same day)", color: "error" },
];

export const REFERRAL_STATUSES: {
  value: ReferralStatus;
  label: string;
  color: string;
}[] = [
  { value: "Draft", label: "Draft", color: "default" },
  { value: "PendingApproval", label: "Pending Approval", color: "warning" },
  { value: "Sent", label: "Sent", color: "info" },
  { value: "Acknowledged", label: "Acknowledged", color: "info" },
  { value: "Scheduled", label: "Scheduled", color: "primary" },
  { value: "Completed", label: "Completed", color: "success" },
  { value: "ResultsReceived", label: "Results Received", color: "success" },
  { value: "Closed", label: "Closed", color: "default" },
  { value: "Cancelled", label: "Cancelled", color: "error" },
  { value: "Expired", label: "Expired", color: "error" },
];

export const COMMON_SPECIALTIES = [
  "Radiology",
  "Orthopedics",
  "Cardiology",
  "Neurology",
  "Gastroenterology",
  "Dermatology",
  "Ophthalmology",
  "ENT",
  "Urology",
  "Gynecology",
  "Oncology",
  "Rheumatology",
  "Pulmonology",
  "Endocrinology",
  "Physiotherapy",
  "Psychology",
  "Podiatry",
  "Dietitian",
  "Pathology",
  "Other",
];
