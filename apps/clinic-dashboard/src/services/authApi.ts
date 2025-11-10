import apiClient from '../lib/api-client';

export interface AuthUserInfo {
  username: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  tenantId?: string | null;
  role?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}

export type LoginSuccessResponse = {
  expiresIn: number;
  userInfo?: AuthUserInfo | null;
};

export type LoginChallengeResponse = {
  requiresMfa: true;
  session: string;
  challengeName?: string;
};

export type LoginResponse = LoginSuccessResponse | LoginChallengeResponse;

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/api/auth/login', {
      email,
      password,
    });
  },

  async verifyMfa(session: string, code: string, challengeName?: string): Promise<LoginSuccessResponse> {
    return apiClient.post<LoginSuccessResponse>('/api/auth/mfa/verify', {
      session,
      mfaCode: code,
      challengeName,
    });
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  },

  async refresh(): Promise<{ expiresIn?: number }> {
    return apiClient.post<{ expiresIn?: number }>('/api/auth/refresh');
  },

  async getUserInfo(): Promise<AuthUserInfo> {
    return apiClient.get<AuthUserInfo>('/api/auth/user-info');
  },
};

export default authApi;
