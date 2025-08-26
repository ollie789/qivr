import axios from 'axios';

const API_ROOT_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_ROOT_URL.replace(/\/+$/, '')}/api`;

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresIn: number;
}

interface SignUpRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  tenantId?: string;
}

interface UserInfo {
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  tenantId?: string;
  role?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private idToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    this.idToken = localStorage.getItem('idToken');
    const expiry = localStorage.getItem('tokenExpiry');
    this.tokenExpiry = expiry ? parseInt(expiry) : null;
  }

  private saveTokensToStorage(tokens: LoginResponse) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.idToken = tokens.idToken;
    this.tokenExpiry = Date.now() + (tokens.expiresIn * 1000);

    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    localStorage.setItem('idToken', tokens.idToken);
    localStorage.setItem('tokenExpiry', this.tokenExpiry.toString());
  }

  private clearTokensFromStorage() {
    this.accessToken = null;
    this.refreshToken = null;
    this.idToken = null;
    this.tokenExpiry = null;

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('tokenExpiry');
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/auth/login`,
        { username, password }
      );
      
      this.saveTokensToStorage(response.data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.requiresMfa) {
        throw new Error('MFA_REQUIRED');
      }
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async signUp(request: SignUpRequest): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/signup`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Sign up failed');
    }
  }

  async confirmSignUp(username: string, confirmationCode: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/auth/confirm-signup`, {
        username,
        confirmationCode
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Confirmation failed');
    }
  }

  async forgotPassword(username: string): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { username });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }

  async confirmForgotPassword(
    username: string,
    confirmationCode: string,
    newPassword: string
  ): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/auth/confirm-forgot-password`, {
        username,
        confirmationCode,
        newPassword
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Password reset failed');
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<{
        accessToken: string;
        idToken: string;
        expiresIn: number;
      }>(`${API_BASE_URL}/auth/refresh-token`, {
        refreshToken: this.refreshToken
      });

      this.accessToken = response.data.accessToken;
      this.idToken = response.data.idToken;
      this.tokenExpiry = Date.now() + (response.data.expiresIn * 1000);

      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('idToken', this.idToken);
      localStorage.setItem('tokenExpiry', this.tokenExpiry.toString());

      return this.accessToken;
    } catch (error: any) {
      this.clearTokensFromStorage();
      throw new Error('Session expired. Please login again.');
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }

    // Check if token is expired or about to expire (5 minutes buffer)
    if (this.tokenExpiry && Date.now() > this.tokenExpiry - 300000) {
      try {
        return await this.refreshAccessToken();
      } catch {
        return null;
      }
    }

    return this.accessToken;
  }

  async getUserInfo(): Promise<UserInfo | null> {
    const token = await this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await axios.get<UserInfo>(
        `${API_BASE_URL}/auth/user-info`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          timeout: 5000 // 5 second timeout
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    const token = await this.getAccessToken();
    if (token) {
      try {
        await axios.post(
          `${API_BASE_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } catch {
        // Ignore logout errors
      }
    }
    
    this.clearTokensFromStorage();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.tokenExpiry && Date.now() < this.tokenExpiry;
  }

  getIdToken(): string | null {
    return this.idToken;
  }

  async socialLogin(provider: 'google' | 'facebook'): Promise<void> {
    // Redirect to Cognito hosted UI for social login
    const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN || 'qivr-auth';
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    
    const authUrl = `https://${cognitoDomain}.auth.ap-southeast-2.amazoncognito.com/oauth2/authorize?` +
      `identity_provider=${provider === 'google' ? 'Google' : 'Facebook'}&` +
      `redirect_uri=${redirectUri}&` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `scope=openid+profile+email`;
    
    window.location.href = authUrl;
  }

  async handleSocialCallback(code: string, provider: string): Promise<void> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE_URL}/auth/social/callback/${provider}`,
        { authorizationCode: code }
      );
      
      this.saveTokensToStorage(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Social login failed');
    }
  }
}

export default new AuthService();
