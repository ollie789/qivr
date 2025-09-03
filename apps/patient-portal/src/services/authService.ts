import { 
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode as amplifyResendSignUpCode,
  resetPassword as amplifyResetPassword,
  confirmResetPassword as amplifyConfirmResetPassword,
  getCurrentUser as amplifyGetCurrentUser,
  fetchAuthSession
} from '@aws-amplify/auth';

export interface SignUpParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
}

export const authService = {
  async signIn(email: string, password: string) {
    try {
      const result = await amplifySignIn({ username: email, password });
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign in' 
      };
    }
  },

  async signOut() {
    try {
      await amplifySignOut();
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign out' 
      };
    }
  },

  async signUp({ email, password, firstName, lastName, phone }: SignUpParams) {
    try {
      const result = await amplifySignUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
            phone_number: phone,
          }
        }
      });
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign up' 
      };
    }
  },

  async confirmSignUp(email: string, code: string) {
    try {
      const result = await amplifyConfirmSignUp({ 
        username: email, 
        confirmationCode: code 
      });
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Confirm sign up error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to confirm sign up' 
      };
    }
  },

  async resendSignUpCode(email: string) {
    try {
      const result = await amplifyResendSignUpCode({ username: email });
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Resend code error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to resend code' 
      };
    }
  },

  async resetPassword(email: string) {
    try {
      const result = await amplifyResetPassword({ username: email });
      return { success: true, data: result };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to reset password' 
      };
    }
  },

  async confirmResetPassword(email: string, code: string, newPassword: string) {
    try {
      await amplifyConfirmResetPassword({ 
        username: email, 
        confirmationCode: code, 
        newPassword 
      });
      return { success: true };
    } catch (error: any) {
      console.error('Confirm reset password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to confirm password reset' 
      };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await amplifyGetCurrentUser();
      const session = await fetchAuthSession();
      
      if (!session.tokens?.idToken) {
        return null;
      }

      const payload = session.tokens.idToken.payload;
      
      return {
        id: user.userId,
        email: payload.email as string || '',
        firstName: payload.given_name as string,
        lastName: payload.family_name as string,
        emailVerified: payload.email_verified as boolean || false
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async getAccessToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() || null;
    } catch (error) {
      console.error('Get access token error:', error);
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch {
      return false;
    }
  }
};

export default authService;
