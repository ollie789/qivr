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
  reasonForReferral?: string;
  appointmentDate?: string;
  appointmentLocation?: string;
  patientNotified: boolean;
  patientNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchMyReferrals(): Promise<Referral[]> {
  return apiClient.get("/api/referrals/my");
}

export async function fetchReferralById(id: string): Promise<Referral> {
  return apiClient.get(`/api/referrals/${id}`);
}

export const REFERRAL_PRIORITY_COLORS: Record<ReferralPriority, string> = {
  Routine: "default",
  SemiUrgent: "info",
  Urgent: "warning",
  Emergency: "error",
};

export const REFERRAL_STATUS_COLORS: Record<ReferralStatus, string> = {
  Draft: "default",
  PendingApproval: "warning",
  Sent: "info",
  Acknowledged: "info",
  Scheduled: "primary",
  Completed: "success",
  ResultsReceived: "success",
  Closed: "default",
  Cancelled: "error",
  Expired: "error",
};
