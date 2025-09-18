import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService from '../services/cognitoAuthService';

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
  login: (email: string, password: string) => Promise<{success: boolean; data?: any; error?: any}>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{success: boolean; data?: any; error?: any}>;
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
        const hasToken = await authService.isAuthenticated();
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
      console.log('Attempting login for:', email);
      const response = await authService.signIn(email, password);
      console.log('Sign in response:', response);
      
      if (response.isSignedIn) {
        const userInfo = await authService.getCurrentUser();
        console.log('User info:', userInfo);
        
        setIsAuthenticated(true);
        if (userInfo) {
          setUser({
            username: userInfo.email || '',
            email: userInfo.email,
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            phoneNumber: userInfo.phone_number,
            tenantId: userInfo['custom:tenant_id'],
            role: userInfo['custom:role'],
            emailVerified: userInfo.email_verified || false,
            phoneVerified: userInfo.phone_number_verified || false
          });
        }
        return { success: true, data: response };
      } else {
        console.error('Sign in not completed:', response);
        return { success: false, error: 'Sign in not completed' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || error.toString();
      
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
      await authService.signOut();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
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

  const register = async (email: string, password: string, emailAddr: string, phoneNumber?: string, firstName?: string, lastName?: string) => {
    try {
      const result = await authService.signUp({
        email,
        password,
        firstName: firstName || '',
        lastName: lastName || '',
        phoneNumber
      });
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
