/**
 * TypeScript type definitions for authentication
 */

// AWS Cognito user attributes
export interface CognitoUserAttributes {
  sub: string;
  email: string;
  email_verified: boolean;
  'custom:clinicId'?: string;
  'custom:role'?: string;
  'custom:tenantId'?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  phone_number_verified?: boolean;
}

// Cognito session types
export interface CognitoSession {
  idToken: {
    jwtToken: string;
    payload: {
      sub: string;
      email: string;
      iat: number;
      exp: number;
      [key: string]: unknown;
    };
  };
  accessToken: {
    jwtToken: string;
    payload: {
      sub: string;
      iat: number;
      exp: number;
      [key: string]: unknown;
    };
  };
  refreshToken?: {
    token: string;
  };
  clockDrift?: number;
}

// Auth user data
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  clinicId: string;
  role: 'admin' | 'provider' | 'staff' | 'patient';
  tenantId: string;
  permissions?: string[];
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Sign up data
export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  clinicId?: string;
  role?: string;
}

// Auth response types
export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

// Password reset
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  email: string;
  code: string;
  newPassword: string;
}

// MFA types
export interface MfaSetupData {
  secret: string;
  qrCode: string;
}

export interface MfaVerification {
  code: string;
  rememberDevice?: boolean;
}

// Auth error types
export interface AuthError {
  code: 'UserNotConfirmedException' | 'PasswordResetRequiredException' | 
        'NotAuthorizedException' | 'UserNotFoundException' | 
        'CodeMismatchException' | 'InvalidParameterException' |
        'UsernameExistsException' | 'TooManyRequestsException' |
        'NetworkError' | 'Unknown';
  message: string;
  name: string;
}

// Token types
export interface DecodedToken {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  clinicId?: string;
  tenantId?: string;
  role?: string;
  permissions?: string[];
}

// Session management
export interface SessionInfo {
  isValid: boolean;
  expiresAt: Date;
  remainingTime: number;
  needsRefresh: boolean;
}

// Auth state
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  session: CognitoSession | null;
  error: AuthError | null;
}