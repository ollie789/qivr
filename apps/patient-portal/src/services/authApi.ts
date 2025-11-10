import apiClient from '../lib/api-client';

export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  tenantId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  tenantId: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  userInfo: UserInfo;
}

class AuthApiService {
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async getUserInfo(): Promise<UserInfo> {
    const response = await apiClient.get<UserInfo>('/auth/user-info');
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/refresh');
    return response.data;
  }
}

export default new AuthApiService();
