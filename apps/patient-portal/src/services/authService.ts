import axios from 'axios';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, fetchAuthSession, resetPassword, confirmResetPassword } from 'aws-amplify/auth';

// Configure Amplify with Cognito settings
const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_ZMcriKNGJ',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '4kugfmvk56o3otd0grc4gddi8r',
      signUpVerificationMethod: 'code' as const,
      loginWith: {
        email: true,
      },
    },
  },
};

// Initialize Amplify
Amplify.configure(amplifyConfig);

// Keep API_BASE_URL for other API calls
const rawApiUrl = (import.meta as any).env?.VITE_API_URL;
const API_BASE_URL = (() => {
  if (rawApiUrl) {
    const clean = rawApiUrl.replace(/\/+$/, '');
    return clean.includes('/api') ? clean : `${clean}/api`;
  }
  return 'http://localhost:5001/api';
})();

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
    // Clear any existing Amplify session on initialization
    this.clearExistingSession();
  }

  private async clearExistingSession() {
    try {
      // Check if there's an existing session and clear it
      const user = await getCurrentUser();
      if (user) {
        console.log('Found existing session, clearing...');
        await signOut();
      }
    } catch (error) {
      // No user signed in, which is fine
      console.log('No existing Amplify session');
    }
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
      // First, sign out any existing user
      try {
        const existingUser = await getCurrentUser();
        if (existingUser) {
          console.log('Signing out existing user before new login');
          await signOut();
        }
      } catch {
        // No existing user, continue
      }

      // Use AWS Cognito for authentication
      const { isSignedIn, nextStep } = await signIn({ username, password });
      
      if (isSignedIn) {
        // Get the session tokens
        const session = await fetchAuthSession();
        
        if (session.tokens) {
          const tokens: LoginResponse = {
            accessToken: session.tokens.accessToken?.toString() || '',
            idToken: session.tokens.idToken?.toString() || '',
            refreshToken: session.tokens.refreshToken?.toString() || '',
            expiresIn: 3600, // Default to 1 hour
          };
          
          this.saveTokensToStorage(tokens);
          return tokens;
        }
      }
      
      // Handle MFA if required
      if (nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        throw new Error('MFA_REQUIRED');
      }
      
      throw new Error('Login failed');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.name === 'NotAuthorizedException') {
        throw new Error('Invalid email or password');
      } else if (error.name === 'UserNotFoundException') {
        throw new Error('User not found');
      } else if (error.name === 'UserNotConfirmedException') {
        throw new Error('Please verify your email first');
      } else if (error.message === 'MFA_REQUIRED') {
        throw error;
      }
      
      throw new Error(error.message || 'Login failed');
    }
  }

  async signUp(request: SignUpRequest): Promise<any> {
    try {
      const { userId, isSignUpComplete, nextStep } = await signUp({
        username: request.email,
        password: request.password,
        options: {
          userAttributes: {
            email: request.email,
            given_name: request.firstName,
            family_name: request.lastName,
            ...(request.phoneNumber && { phone_number: request.phoneNumber }),
          },
        },
      });
      
      return {
        userId,
        isSignUpComplete,
        nextStep,
        userConfirmed: isSignUpComplete,
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Sign up failed');
    }
  }

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phoneNumber?: string
  ): Promise<any> {
    return this.signUp({
      username: email,
      password,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber: phoneNumber || '',
    });
  }

  async confirmSignUp(username: string, confirmationCode: string): Promise<void> {
    try {
      const { isSignUpComplete } = await confirmSignUp({
        username,
        confirmationCode,
      });
      
      if (!isSignUpComplete) {
        throw new Error('Sign up confirmation incomplete');
      }
    } catch (error: any) {
      console.error('Confirmation error:', error);
      throw new Error(error.message || 'Confirmation failed');
    }
  }

  async forgotPassword(username: string): Promise<void> {
    try {
      const output = await resetPassword({ username });
      console.log('Password reset initiated:', output);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Password reset failed');
    }
  }

  async confirmForgotPassword(
    username: string,
    confirmationCode: string,
    newPassword: string
  ): Promise<void> {
    try {
      await confirmResetPassword({
        username,
        confirmationCode,
        newPassword,
      });
    } catch (error: any) {
      console.error('Password reset confirmation error:', error);
      throw new Error(error.message || 'Password reset failed');
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
    try {
      // Sign out from Cognito
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if Cognito signOut fails
    }
    
    // Clear local storage
    this.clearTokensFromStorage();
    localStorage.removeItem('authToken');
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
