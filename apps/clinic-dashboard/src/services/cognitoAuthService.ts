import { 
  signIn, 
  signUp, 
  confirmSignUp, 
  signOut,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
  getCurrentUser,
  fetchUserAttributes,
  updateUserAttributes,
  confirmUserAttribute,
  setUpTOTP,
  verifyTOTPSetup,
  updateMFAPreference,
  confirmSignIn,
  type SignInInput,
  type SignUpInput,
  type ConfirmSignUpInput,
  type ResetPasswordInput,
  type ConfirmResetPasswordInput,
} from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';

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

class ClinicCognitoAuthService {
  private authStateChangeCallbacks: ((isAuthenticated: boolean) => void)[] = [];
  private mfaSetupRequired = false;

  constructor() {
    this.setupAuthListener();
  }

  private setupAuthListener() {
    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case 'signedIn':
          this.notifyAuthStateChange(true);
          break;
        case 'signedOut':
          this.notifyAuthStateChange(false);
          break;
        case 'tokenRefresh':
          console.log('Token refreshed');
          break;
        case 'tokenRefresh_failure':
          console.error('Token refresh failed');
          this.notifyAuthStateChange(false);
          break;
      }
    });
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
      const result = await signIn({
        username: email,
        password,
      } as SignInInput);

      // Handle different sign-in states
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        throw new Error('CONFIRM_SIGNUP_REQUIRED');
      }
      
      if (result.nextStep?.signInStep === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP') {
        this.mfaSetupRequired = true;
        throw new Error('MFA_SETUP_REQUIRED');
      }
      
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        throw new Error('MFA_TOTP_REQUIRED');
      }
      
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
        throw new Error('MFA_SMS_REQUIRED');
      }
      
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        throw new Error('NEW_PASSWORD_REQUIRED');
      }

      // Check if user has required role for clinic access
      const attributes = await this.getCurrentUser();
      const role = attributes?.['custom:role'];
      if (!role || !['admin', 'practitioner', 'receptionist', 'manager'].includes(role)) {
        await this.signOut();
        throw new Error('UNAUTHORIZED_ROLE');
      }

      return result;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  async confirmMFACode(code: string): Promise<any> {
    try {
      const result = await confirmSignIn({ challengeResponse: code });
      return result;
    } catch (error: any) {
      console.error('MFA confirmation error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signUp(data: ClinicSignUpData): Promise<any> {
    try {
      const result = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName,
            family_name: data.lastName,
            phone_number: data.phoneNumber,
            'custom:clinic_id': data.clinicId,
            'custom:role': data.role,
            ...(data.employeeId && { 'custom:employee_id': data.employeeId }),
            ...(data.licenseNumber && { 'custom:license_number': data.licenseNumber }),
            ...(data.specialization && { 'custom:specialization': data.specialization }),
          },
          autoSignIn: false, // Don't auto sign-in for clinic staff
        },
      } as SignUpInput);

      return result;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  async confirmSignUp(email: string, code: string): Promise<any> {
    try {
      const result = await confirmSignUp({
        username: email,
        confirmationCode: code,
      } as ConfirmSignUpInput);

      return result;
    } catch (error: any) {
      console.error('Confirm sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut();
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  async forgotPassword(email: string): Promise<any> {
    try {
      const result = await resetPassword({ username: email } as ResetPasswordInput);
      return result;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw this.handleAuthError(error);
    }
  }

  async confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      } as ConfirmResetPasswordInput);
    } catch (error: any) {
      console.error('Confirm forgot password error:', error);
      throw this.handleAuthError(error);
    }
  }

  async getCurrentUser(): Promise<ClinicUserAttributes | null> {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      return attributes as ClinicUserAttributes;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async getSession(): Promise<AuthTokens | null> {
    try {
      const session = await fetchAuthSession();
      
      if (!session.tokens) {
        return null;
      }

      return {
        accessToken: session.tokens.accessToken?.toString() || '',
        idToken: session.tokens.idToken?.toString() || '',
        refreshToken: session.tokens.refreshToken?.toString(),
      };
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens?.accessToken) {
        return false;
      }

      // Check role authorization
      const attributes = await this.getCurrentUser();
      const role = attributes?.['custom:role'];
      return !!role && ['admin', 'practitioner', 'receptionist', 'manager'].includes(role);
    } catch {
      return false;
    }
  }

  async setupMFA(): Promise<MFASetupData> {
    try {
      const totpSetup = await setUpTOTP();
      const secretCode = totpSetup.sharedSecret;
      const qrCodeUrl = totpSetup.getSetupUri('Qivr Clinic Dashboard').toString();
      
      return {
        qrCode: qrCodeUrl,
        secretKey: secretCode,
      };
    } catch (error: any) {
      console.error('Setup MFA error:', error);
      throw this.handleAuthError(error);
    }
  }

  async verifyMFASetup(token: string): Promise<void> {
    try {
      await verifyTOTPSetup({ code: token });
      await updateMFAPreference({ totp: 'PREFERRED' });
      this.mfaSetupRequired = false;
    } catch (error: any) {
      console.error('Verify MFA token error:', error);
      throw this.handleAuthError(error);
    }
  }

  isMFASetupRequired(): boolean {
    return this.mfaSetupRequired;
  }

  private handleAuthError(error: any): Error {
    const errorMessage = error.message || error.toString();
    
    // Map Cognito error codes to user-friendly messages
    if (errorMessage.includes('UNAUTHORIZED_ROLE')) {
      return new Error('You do not have permission to access the clinic dashboard');
    }
    if (errorMessage.includes('UserNotFoundException')) {
      return new Error('No account found with this email address');
    }
    if (errorMessage.includes('NotAuthorizedException')) {
      return new Error('Incorrect email or password');
    }
    if (errorMessage.includes('UserNotConfirmedException')) {
      return new Error('Please verify your email address before signing in');
    }
    if (errorMessage.includes('UsernameExistsException')) {
      return new Error('An account with this email already exists');
    }
    if (errorMessage.includes('InvalidPasswordException')) {
      return new Error('Password does not meet security requirements');
    }
    if (errorMessage.includes('CodeMismatchException')) {
      return new Error('Invalid verification code');
    }
    if (errorMessage.includes('ExpiredCodeException')) {
      return new Error('Verification code has expired');
    }
    if (errorMessage.includes('LimitExceededException')) {
      return new Error('Too many attempts. Please try again later');
    }
    
    return new Error(errorMessage);
  }
}

export default new ClinicCognitoAuthService();
