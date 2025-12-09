import apiClient from "../lib/api-client";

export interface PatientInvitation {
  id: string;
  intakeSubmissionId?: string;
  patientEmail: string;
  patientName: string;
  invitationToken: string;
  status: "pending" | "sent" | "accepted" | "expired" | "revoked";
  sentAt?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface CreateInvitationRequest {
  intakeSubmissionId?: string;
  patientEmail: string;
  patientName: string;
  patientPhone?: string;
}

export interface CreateInvitationResponse {
  id: string;
  invitationToken: string;
  patientEmail: string;
  patientName: string;
  expiresAt: string;
  inviteLink: string;
}

export const invitationApi = {
  /**
   * Create and send a patient invitation
   */
  async createInvitation(
    request: CreateInvitationRequest,
  ): Promise<CreateInvitationResponse> {
    return apiClient.post("/api/patient-invitations", request);
  },

  /**
   * Get all invitations for the tenant
   */
  async getInvitations(): Promise<PatientInvitation[]> {
    const response = await apiClient.get("/api/patient-invitations");
    return Array.isArray(response) ? response : [];
  },

  /**
   * Get invitation details
   */
  async getInvitation(id: string): Promise<PatientInvitation> {
    return apiClient.get(`/api/patient-invitations/${id}`);
  },

  /**
   * Resend an invitation
   */
  async resendInvitation(id: string): Promise<{ expiresAt: string }> {
    return apiClient.post(`/api/patient-invitations/${id}/resend`);
  },

  /**
   * Revoke an invitation
   */
  async revokeInvitation(id: string): Promise<void> {
    await apiClient.delete(`/api/patient-invitations/${id}`);
  },
};

export default invitationApi;
