import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import authService from '../services/cognitoAuthService';
import {
  getActiveTenantId as getStoredTenantId,
  setActiveTenantId as storeActiveTenantId,
  clearActiveTenantId,
} from '../state/tenantState';

interface User {
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

type SignInResponse = Awaited<ReturnType<typeof authService.signIn>>;
type RegisterResponse = Awaited<ReturnType<typeof authService.signUp>>;

interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult<SignInResponse>>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult<SignInResponse>>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  register: (
    email: string,
    password: string,
    emailAddr: string,
    phoneNumber?: string,
    firstName?: string,
    lastName?: string
  ) => Promise<RegisterResponse>;
  activeTenantId: string | null;
  setActiveTenantId: (tenantId: string | null) => void;
}

const DEV_AUTH_ENABLED = (import.meta.env.VITE_ENABLE_DEV_AUTH ?? 'false') === 'true';

const DEV_USER: User = {
  username: 'dev.patient@qivr.local',
  email: 'dev.patient@qivr.local',
  firstName: 'Dev',
  lastName: 'Patient',
  phoneNumber: '+15551112222',
  tenantId: null,
  role: 'patient',
  emailVerified: true,
  phoneVerified: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(() => getStoredTenantId());

  const setActiveTenant = useCallback((tenantId: string | null) => {
    setActiveTenantIdState(tenantId);
    storeActiveTenantId(tenantId);
  }, []);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      if (DEV_AUTH_ENABLED) {
        setUser(DEV_USER);
        setIsAuthenticated(true);
        setActiveTenant(DEV_USER.tenantId ?? null);
        setLoading(false);
        return;
      }

      try {
        // Skip auth check for now - just check if token exists
        const hasToken = await authService.isAuthenticated();
        if (hasToken) {
          // Don't make API call during initial load
          setIsAuthenticated(true);
          if (!activeTenantId) {
            setActiveTenant(getStoredTenantId());
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        // Always set loading to false after a short delay
        setTimeout(() => setLoading(false), 100);
      }
    };
    checkAuth();
  }, [setActiveTenant]);

  const login = async (email: string, password: string) => {
    try {
      if (DEV_AUTH_ENABLED) {
        const derivedUser: User = {
          ...DEV_USER,
          email,
          username: email,
          firstName: DEV_USER.firstName,
          lastName: DEV_USER.lastName,
        };
        setUser(derivedUser);
        setIsAuthenticated(true);
        setActiveTenant(derivedUser.tenantId ?? null);
        return { success: true, data: { isSignedIn: true } as SignInResponse };
      }

      console.log('Attempting login for:', email);
      const response = await authService.signIn(email, password);
      console.log('Sign in response:', response);
      
      if (response.isSignedIn) {
        const userInfo = await authService.getCurrentUser();
        console.log('User info:', userInfo);
        
        setIsAuthenticated(true);
        if (userInfo) {
          const tenantIdFromAttributes =
            (userInfo['custom:custom:tenant_id'] as string | undefined)
            ?? (userInfo['custom:tenant_id'] as string | undefined)
            ?? (userInfo['tenant_id'] as string | undefined)
            ?? (userInfo['custom:custom:clinic_id'] as string | undefined)
            ?? (userInfo['custom:clinic_id'] as string | undefined)
            ?? (userInfo['clinic_id'] as string | undefined)
            ?? null;
          const roleClaim =
            (userInfo['custom:custom:role'] as string | undefined)
            ?? (userInfo['custom:role'] as string | undefined)
            ?? (userInfo['role'] as string | undefined);
          const role = typeof roleClaim === 'string'
            ? roleClaim.toLowerCase()
            : undefined;

          setUser({
            username: userInfo.email || '',
            email: userInfo.email,
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            phoneNumber: userInfo.phone_number,
            tenantId: tenantIdFromAttributes ?? undefined,
            role,
            emailVerified: userInfo.email_verified || false,
            phoneVerified: userInfo.phone_number_verified || false
          });

          setActiveTenant(tenantIdFromAttributes ?? getStoredTenantId());
        }
        return { success: true, data: response };
      } else {
        console.error('Sign in not completed:', response);
        return { success: false, error: 'Sign in not completed' };
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      
      // Handle specific error cases
      if (errorMessage.includes('CONFIRM_SIGNUP_REQUIRED')) {
        return { success: false, error: 'Please verify your email address before signing in' };
      }
      if (errorMessage.includes('UserNotFoundException') || errorMessage.includes('NotAuthorizedException')) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const signIn = login; // Alias for compatibility

  const logout = async () => {
    try {
      if (!DEV_AUTH_ENABLED) {
        await authService.signOut();
      }
      setIsAuthenticated(false);
      setUser(null);
      setActiveTenant(null);
      clearActiveTenantId();
    } catch (error: unknown) {
      console.error('Logout error:', error);
    }
  };

  const signOut = logout; // Alias for compatibility

  const signInWithGoogle = async () => {
    // Social login not implemented yet
    throw new Error('Google sign-in not available');
  };

  const signInWithFacebook = async () => {
    // Social login not implemented yet  
    throw new Error('Facebook sign-in not available');
  };

  const register = async (
    email: string,
    password: string,
    emailAddr: string,
    phoneNumber?: string,
    firstName?: string,
    lastName?: string,
  ): Promise<RegisterResponse> => {
    return authService.signUp({
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      phoneNumber,
    });
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        isAuthenticated,
        signIn,
        signInWithGoogle,
        signInWithFacebook,
        signOut,
        loading,
        register,
        activeTenantId,
        setActiveTenantId: setActiveTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
