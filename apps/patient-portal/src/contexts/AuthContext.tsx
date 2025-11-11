import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import authApi, { type AuthResponse, type UserInfo } from '../services/authApi';
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

interface AuthResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult<AuthResponse>>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult<AuthResponse>>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tenantId: string,
    phoneNumber?: string
  ) => Promise<AuthResponse>;
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
  tenantId: 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
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
        // Try to get user info from backend (checks cookie)
        const userInfo = await authApi.getUserInfo();
        setUser({
          username: userInfo.email,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          phoneNumber: userInfo.phoneNumber,
          tenantId: userInfo.tenantId,
          role: userInfo.role,
          emailVerified: true,
          phoneVerified: false
        });
        setIsAuthenticated(true);
        setActiveTenant(userInfo.tenantId);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
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
        return { success: true, data: {} as AuthResponse };
      }

      console.log('Attempting login for:', email);
      const response = await authApi.login(email, password);
      console.log('Login response:', response);
      
      const userInfo = response.userInfo;
      setIsAuthenticated(true);
      
      setUser({
        username: userInfo.email,
        email: userInfo.email,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        phoneNumber: userInfo.phoneNumber,
        tenantId: userInfo.tenantId,
        role: userInfo.role,
        emailVerified: true,
        phoneVerified: false
      });

      setActiveTenant(userInfo.tenantId);
      return { success: true, data: response };
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      clearActiveTenantId();
      setActiveTenant(null);
    }
  };

  const signIn = login; // Alias for compatibility
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
    firstName: string,
    lastName: string,
    tenantId: string,
    phoneNumber?: string,
  ): Promise<AuthResponse> => {
    const response = await authApi.signUp({
      email,
      password,
      firstName,
      lastName,
      tenantId,
      phoneNumber,
    });
    
    // Auto-login after signup
    const userInfo = response.userInfo;
    setUser({
      username: userInfo.email,
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phoneNumber: userInfo.phoneNumber,
      tenantId: userInfo.tenantId,
      role: userInfo.role,
      emailVerified: true,
      phoneVerified: false
    });
    setIsAuthenticated(true);
    setActiveTenant(userInfo.tenantId);
    
    return response;
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
