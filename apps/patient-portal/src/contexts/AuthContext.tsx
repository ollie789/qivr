import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/authService';

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

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  register: (email: string, password: string, emailAddr: string, phoneNumber?: string, firstName?: string, lastName?: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        // Skip auth check for now - just check if token exists
        const hasToken = authService.isAuthenticated();
        if (hasToken) {
          // Don't make API call during initial load
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        // Always set loading to false after a short delay
        setTimeout(() => setLoading(false), 100);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      const userInfo = await authService.getUserInfo();
      if (userInfo) {
        setUser(userInfo);
        setIsAuthenticated(true);
      }
    } catch (error) {
      throw error;
    }
  };

  const signIn = login; // Alias for compatibility

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const signOut = logout; // Alias for compatibility

  const signInWithGoogle = async () => {
    try {
      await authService.socialLogin('google');
    } catch (error) {
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      await authService.socialLogin('facebook');
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, emailAddr: string, phoneNumber?: string, firstName?: string, lastName?: string) => {
    try {
      const result = await authService.register(email, password, firstName, lastName, phoneNumber);
      return result;
    } catch (error) {
      throw error;
    }
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
        register
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
