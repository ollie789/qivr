import apiClient from "../lib/api-client";

export interface ValidateInviteResponse {
  isValid: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  clinicName?: string;
  errorMessage?: string;
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  message?: string;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  requiresProfileCompletion?: boolean;
}

class InviteApiService {
  /**
   * Validate an invitation token
   * This is a public endpoint - no auth required
   */
  async validateInvite(token: string): Promise<ValidateInviteResponse> {
    return await apiClient.get<ValidateInviteResponse>(
      `/api/patient-invitations/validate/${token}`,
    );
  }

  /**
   * Accept an invitation and create account
   * This is a public endpoint - no auth required
   */
  async acceptInvite(
    request: AcceptInviteRequest,
  ): Promise<AcceptInviteResponse> {
    return await apiClient.post<AcceptInviteResponse>(
      "/api/patient-invitations/accept",
      request,
    );
  }
}

export const inviteApi = new InviteApiService();
export default inviteApi;
