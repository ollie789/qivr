import { postJson, getJson, ApiError } from '@qivr/http';

export interface ClinicUserAttributes {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
  given_name?: string;
  family_name?: string;
  'custom:tenant_id'?: string;
  'custom:clinic_id'?: string;
  'custom:role'?: 'admin' | 'practitioner' | 'receptionist' | 'manager';
  'custom:employee_id'?: string;
  'custom:license_number'?: string;
  'custom:specialization'?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
}

export interface ClinicSignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  clinicId: string;
  role: 'admin' | 'practitioner' | 'receptionist' | 'manager';
  employeeId?: string;
  licenseNumber?: string;
  specialization?: string;
}

export interface MFASetupData {
  qrCode: string;
  secretKey: string;
}

class JwtAuthService {
  private authStateChangeCallbacks: ((isAuthenticated: boolean) => void)[] = [];
  private mfaSetupRequired = false;
  private currentUser: ClinicUserAttributes | null = null;
  private tokens: AuthTokens | null = null;

  constructor() {
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    const storedTokens = localStorage.getItem('authTokens');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedTokens) {
      this.tokens = JSON.parse(storedTokens);
      // Token will be automatically used by @qivr/http helpers
    }
    
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  private saveAuth(tokens: AuthTokens, user: ClinicUserAttributes) {
    this.tokens = tokens;
    this.currentUser = user;
    
    localStorage.setItem('authTokens', JSON.stringify(tokens));
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Store token for @qivr/http to use
    localStorage.setItem('authToken', tokens.accessToken);
  }

  private clearAuth() {
    this.tokens = null;
    this.currentUser = null;
    
    localStorage.removeItem('authTokens');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }

  private notifyAuthStateChange(isAuthenticated: boolean) {
    this.authStateChangeCallbacks.forEach(callback => callback(isAuthenticated));
  }

  public onAuthStateChange(callback: (isAuthenticated: boolean) => void) {
    this.authStateChangeCallbacks.push(callback);
    return () => {
      this.authStateChangeCallbacks = this.authStateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  async signIn(email: string, password: string): Promise<any> {
    try {
      const response = await postJson<any>('/api/Auth/login', {
        username: email,
        password: password,
      });

      const { accessToken, idToken, refreshToken, expiresIn, userInfo } = response;

      // Map user info to our format
      const user: ClinicUserAttributes = {
        sub: userInfo?.id || email,
        email: userInfo?.email || email,
        email_verified: userInfo?.emailVerified || false,
        given_name: userInfo?.firstName || '',
        family_name: userInfo?.lastName || '',
        phone_number: userInfo?.phoneNumber || '',
        'custom:tenant_id': userInfo?.tenantId || '',
        'custom:clinic_id': userInfo?.clinicId || userInfo?.tenantId || '',
        'custom:role': userInfo?.role || 'practitioner',
        'custom:employee_id': userInfo?.employeeId,
        'custom:license_number': userInfo?.licenseNumber,
        'custom:specialization': userInfo?.specialization,
      };

      const tokens: AuthTokens = {
        accessToken,
        idToken: idToken || accessToken, // Use access token as ID token if not provided
        refreshToken,
      };

      this.saveAuth(tokens, user);
      this.notifyAuthStateChange(true);

      return { 
        isSignedIn: true, 
        nextStep: { signInStep: 'DONE' } 
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      if (error instanceof ApiError && error.problem?.detail) {
        const errorMessage = error.problem.detail;
        
        if (errorMessage.includes('Email verification required')) {
          throw new Error('Email not verified. Please check your inbox for the verification link.');
        }
        if (errorMessage.includes('Invalid username or password')) {
          throw new Error('Incorrect username or password');
        }
        if (errorMessage.includes('Account is disabled')) {
          throw new Error('Your account has been disabled. Please contact support.');
        }
        
        throw new Error(errorMessage);
      }
      
      throw new Error('Unable to sign in. Please try again.');
    }
  }

  async confirmMFACode(code: string): Promise<any> {
    // MFA not yet implemented in JWT backend
    throw new Error('MFA not yet implemented');
  }

  async setupMFA(): Promise<MFASetupData> {
    // MFA not yet implemented in JWT backend
    throw new Error('MFA not yet implemented');
  }

  async verifyMFASetup(code: string): Promise<void> {
    // MFA not yet implemented in JWT backend
    throw new Error('MFA not yet implemented');
  }

  async signUp(data: ClinicSignUpData): Promise<any> {
    try {
      const response = await postJson<any>('/api/Auth/signup', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        tenantId: data.clinicId,
        role: data.role,
      });

      return {
        isSignUpComplete: false,
        userId: response.userSub,
        nextStep: { 
          signUpStep: 'CONFIRM_SIGN_UP',
          codeDeliveryDetails: {
            deliveryMedium: 'EMAIL',
            destination: data.email,
          }
        }
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      if (error instanceof ApiError && error.problem?.detail) {
        throw new Error(error.problem.detail);
      }
      
      throw new Error('Unable to create account. Please try again.');
    }
  }

  async confirmSignUp(email: string, code: string): Promise<any> {
    try {
      await postJson('/api/EmailVerification/verify', {
        token: code,
      });

      return {
        isSignUpComplete: true,
        nextStep: { signUpStep: 'DONE' }
      };
    } catch (error: any) {
      console.error('Confirm sign up error:', error);
      
      if (error instanceof ApiError && error.problem?.detail) {
        throw new Error(error.problem.detail);
      }
      
      throw new Error('Unable to verify email. Please try again.');
    }
  }

  async signOut(): Promise<void> {
    try {
      // Call backend logout if needed
      await postJson('/api/Auth/logout', {}).catch(() => {
        // Ignore logout errors
      });
    } finally {
      this.clearAuth();
      this.notifyAuthStateChange(false);
    }
  }

  async forgotPassword(email: string): Promise<any> {
    try {
      await postJson('/api/Auth/forgot-password', {
        email,
      });

      return {
        isPasswordReset: false,
        nextStep: {
          resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE',
          codeDeliveryDetails: {
            deliveryMedium: 'EMAIL',
            destination: email,
          }
        }
      };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw new Error('Unable to reset password. Please try again.');
    }
  }

  async confirmResetPassword(email: string, code: string, newPassword: string): Promise<any> {
    try {
      await postJson('/api/Auth/confirm-forgot-password', {
        email,
        code,
        newPassword,
      });

      return { isPasswordReset: true };
    } catch (error: any) {
      console.error('Confirm reset password error:', error);
      throw new Error('Unable to reset password. Please try again.');
    }
  }

  async getCurrentUser(): Promise<ClinicUserAttributes | null> {
    if (!this.tokens?.accessToken) {
      return null;
    }

    try {
      const { getWithAuth } = await import('@qivr/http');
      const userInfo = await getWithAuth<any>('/api/Auth/user-info');
      
      const user: ClinicUserAttributes = {
        sub: userInfo.id || userInfo.username,
        email: userInfo.email,
        email_verified: userInfo.emailVerified || false,
        given_name: userInfo.firstName,
        family_name: userInfo.lastName,
        phone_number: userInfo.phoneNumber,
        'custom:tenant_id': userInfo.tenantId,
        'custom:clinic_id': userInfo.clinicId || userInfo.tenantId,
        'custom:role': userInfo.role,
        'custom:employee_id': userInfo.employeeId,
        'custom:license_number': userInfo.licenseNumber,
        'custom:specialization': userInfo.specialization,
      };

      this.currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return this.currentUser;
    }
  }

  async getSession(): Promise<AuthTokens | null> {
    if (!this.tokens?.accessToken) {
      return null;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(this.tokens.accessToken.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      
      if (Date.now() >= exp) {
        // Token expired, try to refresh
        if (this.tokens.refreshToken) {
          await this.refreshToken();
        } else {
          // No refresh token, clear auth
          this.clearAuth();
          this.notifyAuthStateChange(false);
          return null;
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
    }

    return this.tokens;
  }

  async refreshToken(): Promise<AuthTokens | null> {
    if (!this.tokens?.refreshToken) {
      return null;
    }

    try {
      const response = await postJson<any>('/api/Auth/refresh-token', {
        refreshToken: this.tokens.refreshToken,
      });

      const { accessToken, idToken } = response;

      const newTokens: AuthTokens = {
        ...this.tokens,
        accessToken,
        idToken: idToken || accessToken,
      };

      this.tokens = newTokens;
      localStorage.setItem('authTokens', JSON.stringify(newTokens));
      localStorage.setItem('authToken', accessToken);

      return newTokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      this.notifyAuthStateChange(false);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session;
  }

  private handleAuthError(error: any): Error {
    if (error.message) {
      return error;
    }

    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Authentication failed';
    return new Error(errorMessage);
  }
}

// Export a singleton instance
const jwtAuthService = new JwtAuthService();
export default jwtAuthService;
