import apiClient from '../lib/api-client';

export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  tenantId: string; // Patient must specify which clinic they belong to
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  tenantId: string; // Which clinic this patient belongs to
  role: string; // Should be "Patient"
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface AuthResponse {
  expiresIn: number;
  userInfo: UserInfo;
}

class AuthApiService {
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber || '',
      tenantId: data.tenantId, // Patient registers under specific clinic
      role: 'Patient',
    });
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    return response;
  }

  async getUserInfo(): Promise<UserInfo> {
    const response = await apiClient.get<UserInfo>('/api/auth/user-info');
    return response;
  }

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/refresh');
    return response;
  }
}

export default new AuthApiService();
