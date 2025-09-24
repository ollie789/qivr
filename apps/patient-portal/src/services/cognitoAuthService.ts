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
  resendSignUpCode,
  type SignInInput,
  type SignInOutput,
  type SignUpInput,
  type SignUpOutput,
  type ConfirmSignUpInput,
  type ConfirmSignUpOutput,
  type ResetPasswordInput,
  type ConfirmResetPasswordInput,
  type ResetPasswordOutput,
} from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';

export interface UserAttributes {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
  given_name?: string;
  family_name?: string;
  'custom:tenant_id'?: string;
  'custom:role'?: string;
  'custom:clinic_id'?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  tenantId?: string;
  role?: string;
}

export interface MFASetupData {
  qrCode: string;
  secretKey: string;
}

type SignInResult = SignInOutput & { isSignedIn: boolean };
type ConfirmSignUpResult = ConfirmSignUpOutput | { isSignedIn: boolean };
type ForgotPasswordResult = ResetPasswordOutput;

class CognitoAuthService {
  private authStateChangeCallbacks: Array<(isAuthenticated: boolean) => void> = [];

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

  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      const result = await signIn({
        username: email,
        password,
      } as SignInInput);

      console.log('Cognito signIn result:', result);

      // Handle different sign-in states
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        throw new Error('CONFIRM_SIGNUP_REQUIRED');
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

      // Check if sign-in is complete
      const isSignedIn = result.nextStep?.signInStep === 'DONE' || result.isSignedIn === true;
      
      return {
        ...result,
        isSignedIn
      };
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signUp(data: SignUpData): Promise<SignUpOutput> {
    try {
      const result = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.firstName,
            family_name: data.lastName,
            ...(data.phoneNumber && { phone_number: data.phoneNumber }),
            ...(data.tenantId && { 'custom:tenant_id': data.tenantId }),
            ...(data.role && { 'custom:role': data.role }),
          },
          autoSignIn: true, // Enable auto sign-in after confirmation
        },
      } as SignUpInput);

      return result;
    } catch (error: unknown) {
      console.error('Sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  async confirmSignUp(email: string, code: string): Promise<ConfirmSignUpResult> {
    try {
      const result = await confirmSignUp({
        username: email,
        confirmationCode: code,
      } as ConfirmSignUpInput);

      // Auto sign-in might happen after confirmation
      if (result.nextStep?.signUpStep === 'DONE') {
        // User is signed in automatically
        return { isSignedIn: true };
      }

      return result;
    } catch (error: unknown) {
      console.error('Confirm sign up error:', error);
      throw this.handleAuthError(error);
    }
  }

  async resendConfirmationCode(email: string): Promise<void> {
    try {
      await resendSignUpCode({ username: email });
    } catch (error: unknown) {
      console.error('Resend confirmation code error:', error);
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut();
    } catch (error: unknown) {
      console.error('Sign out error:', error);
      throw this.handleAuthError(error);
    }
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    try {
      const result = await resetPassword({ username: email } as ResetPasswordInput);
      return result;
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Confirm forgot password error:', error);
      throw this.handleAuthError(error);
    }
  }

  async getCurrentUser(): Promise<UserAttributes | null> {
    try {
      await getCurrentUser();
      const attributes = await fetchUserAttributes();
      return attributes as unknown as UserAttributes;
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
        idToken: session.tokens.idToken?.toString() || ''
      };
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await fetchAuthSession();
      return !!session.tokens?.accessToken;
    } catch {
      return false;
    }
  }

  async updateUserAttributes(attributes: Partial<UserAttributes>): Promise<void> {
    try {
      const updateAttributes: Record<string, string> = {};
      
      if (attributes.given_name) updateAttributes.given_name = attributes.given_name;
      if (attributes.family_name) updateAttributes.family_name = attributes.family_name;
      if (attributes.phone_number) updateAttributes.phone_number = attributes.phone_number;
      
      await updateUserAttributes({ userAttributes: updateAttributes });
    } catch (error: unknown) {
      console.error('Update user attributes error:', error);
      throw this.handleAuthError(error);
    }
  }

  async confirmUserAttribute(attributeName: 'email' | 'phone_number', code: string): Promise<void> {
    try {
      await confirmUserAttribute({
        userAttributeKey: attributeName,
        confirmationCode: code,
      });
    } catch (error: unknown) {
      console.error('Confirm user attribute error:', error);
      throw this.handleAuthError(error);
    }
  }

  async setupMFA(): Promise<MFASetupData> {
    try {
      const totpSetup = await setUpTOTP();
      const secretCode = totpSetup.sharedSecret;
      const qrCodeUrl = totpSetup.getSetupUri('Qivr Health Portal').toString();
      
      return {
        qrCode: qrCodeUrl,
        secretKey: secretCode,
      };
    } catch (error: unknown) {
      console.error('Setup MFA error:', error);
      throw this.handleAuthError(error);
    }
  }

  async verifyMFAToken(token: string): Promise<void> {
    try {
      await verifyTOTPSetup({ code: token });
      await updateMFAPreference({ totp: 'PREFERRED' });
    } catch (error: unknown) {
      console.error('Verify MFA token error:', error);
      throw this.handleAuthError(error);
    }
  }

  async disableMFA(): Promise<void> {
    try {
      await updateMFAPreference({ totp: 'NOT_PREFERRED' });
    } catch (error: unknown) {
      console.error('Disable MFA error:', error);
      throw this.handleAuthError(error);
    }
  }

  private handleAuthError(error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Map Cognito error codes to user-friendly messages
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

export default new CognitoAuthService();
