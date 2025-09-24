import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import cognitoAuthService from '../services/cognitoAuthService';

interface User {
  id: string;
  name: string;
  email: string;
  clinicId?: string;
  tenantId?: string;
  clinicName?: string;
  role: 'admin' | 'practitioner' | 'receptionist' | 'manager';
  employeeId?: string;
  licenseNumber?: string;
  specialization?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
  mfaSetupRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  confirmMFA: (code: string) => Promise<void>;
  setupMFA: () => Promise<{ qrCode: string; secretKey: string }>;
  verifyMFASetup: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Development mode - set to false to use real authentication
const DEV_MODE = false;
const DEV_USER: User = {
  id: 'dev-user-123',
  name: 'Dr. Sarah Johnson',
  email: 'sarah.johnson@clinic.com',
  clinicId: '11111111-1111-1111-1111-111111111111',
  clinicName: 'Springfield Medical Center',
  role: 'admin',
  employeeId: 'EMP001',
  licenseNumber: 'LIC123456',
  specialization: 'General Practice',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      mfaRequired: false,
      mfaSetupRequired: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Use mock authentication in development
          if (DEV_MODE) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
            const mockToken = 'mock-jwt-token-' + Date.now();
            set({
              user: DEV_USER,
              token: mockToken,
              isAuthenticated: true,
              mfaRequired: false,
              mfaSetupRequired: false,
            });
            localStorage.setItem('mockToken', mockToken);
            localStorage.setItem('mockUser', JSON.stringify(DEV_USER));
            set({ isLoading: false });
            return;
          }
          
          const result = await cognitoAuthService.signIn(email, password);
          
          if (result.isSignedIn) {
            const userAttributes = await cognitoAuthService.getCurrentUser();
            const session = await cognitoAuthService.getSession();
            
            if (userAttributes && session) {
              const user: User = {
                id: userAttributes.sub || '',
                name: `${userAttributes.given_name} ${userAttributes.family_name}`,
                email: userAttributes.email || '',
                clinicId: userAttributes['custom:custom:clinic_id'] || userAttributes['custom:clinic_id'],
                tenantId: userAttributes['custom:custom:tenant_id'] || userAttributes['custom:tenant_id'] || userAttributes['custom:custom:clinic_id'] || userAttributes['custom:clinic_id'],
                role: userAttributes['custom:custom:role'] || userAttributes['custom:role'] || 'practitioner',
                employeeId: userAttributes['custom:custom:employee_id'] || userAttributes['custom:employee_id'],
                licenseNumber: userAttributes['custom:custom:license_num'] || userAttributes['custom:license_number'],
                specialization: userAttributes['custom:custom:specialty'] || userAttributes['custom:specialization'],
              };
              
              set({
                user,
                token: session.accessToken,
                isAuthenticated: true,
                mfaRequired: false,
                mfaSetupRequired: false,
              });
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage === 'MFA_TOTP_REQUIRED') {
            set({ mfaRequired: true });
          } else if (errorMessage === 'MFA_SETUP_REQUIRED') {
            set({ mfaSetupRequired: true });
          } else {
            throw error;
          }
        } finally {
          set({ isLoading: false });
        }
      },

      confirmMFA: async (code: string) => {
        set({ isLoading: true });
        try {
          await cognitoAuthService.confirmMFACode(code);
          
          const userAttributes = await cognitoAuthService.getCurrentUser();
          const session = await cognitoAuthService.getSession();
          
          if (userAttributes && session) {
            const user: User = {
              id: userAttributes.sub || '',
              name: `${userAttributes.given_name} ${userAttributes.family_name}`,
              email: userAttributes.email || '',
              clinicId: userAttributes['custom:custom:clinic_id'] || userAttributes['custom:clinic_id'],
              tenantId: userAttributes['custom:custom:tenant_id'] || userAttributes['custom:tenant_id'] || userAttributes['custom:custom:clinic_id'] || userAttributes['custom:clinic_id'],
              role: userAttributes['custom:custom:role'] || userAttributes['custom:role'] || 'practitioner',
              employeeId: userAttributes['custom:custom:employee_id'] || userAttributes['custom:employee_id'],
              licenseNumber: userAttributes['custom:custom:license_num'] || userAttributes['custom:license_number'],
              specialization: userAttributes['custom:custom:specialty'] || userAttributes['custom:specialization'],
            };
            
            set({
              user,
              token: session.accessToken,
              isAuthenticated: true,
              mfaRequired: false,
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      setupMFA: async () => {
        const result = await cognitoAuthService.setupMFA();
        return result;
      },

      verifyMFASetup: async (code: string) => {
        set({ isLoading: true });
        try {
          await cognitoAuthService.verifyMFASetup(code);
          set({ mfaSetupRequired: false });
          
          // Complete sign-in after MFA setup
          await get().checkAuth();
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          if (DEV_MODE) {
            localStorage.removeItem('mockToken');
            localStorage.removeItem('mockUser');
          } else {
            await cognitoAuthService.signOut();
          }
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            mfaRequired: false,
            mfaSetupRequired: false,
          });
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string | null) => {
        set({ token });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          // Use mock authentication in development
          if (DEV_MODE) {
            const mockToken = localStorage.getItem('mockToken');
            const mockUser = localStorage.getItem('mockUser');
            if (mockToken && mockUser) {
              set({
                user: JSON.parse(mockUser),
                token: mockToken,
                isAuthenticated: true,
              });
            } else {
              set({
                user: null,
                token: null,
                isAuthenticated: false,
              });
            }
            set({ isLoading: false });
            return;
          }
          
          const isAuth = await cognitoAuthService.isAuthenticated();
          
          if (isAuth) {
            const userAttributes = await cognitoAuthService.getCurrentUser();
            const session = await cognitoAuthService.getSession();
            
            if (userAttributes && session) {
              const user: User = {
                id: userAttributes.sub || '',
                name: `${userAttributes.given_name} ${userAttributes.family_name}`,
                email: userAttributes.email || '',
                clinicId: userAttributes['custom:custom:clinic_id'] || userAttributes['custom:clinic_id'],
                tenantId: userAttributes['custom:custom:tenant_id'] || userAttributes['custom:tenant_id'] || userAttributes['custom:custom:clinic_id'] || userAttributes['custom:clinic_id'],
                role: userAttributes['custom:custom:role'] || userAttributes['custom:role'] || 'practitioner',
                employeeId: userAttributes['custom:custom:employee_id'] || userAttributes['custom:employee_id'],
                licenseNumber: userAttributes['custom:custom:license_num'] || userAttributes['custom:license_number'],
                specialization: userAttributes['custom:custom:specialty'] || userAttributes['custom:specialization'],
              };
              
              set({
                user,
                token: session.accessToken,
                isAuthenticated: true,
              });
            }
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshToken: async () => {
        try {
          const session = await cognitoAuthService.getSession();
          if (session) {
            set({ token: session.accessToken });
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          set({ isAuthenticated: false, token: null });
        }
      },
    }),
    {
      name: 'clinic-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

export const useAuth = () =>
  useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    mfaRequired: state.mfaRequired,
    mfaSetupRequired: state.mfaSetupRequired,
  }));

export const useAuthUser = () => useAuthStore((state) => state.user);

export const useAuthStatus = () =>
  useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    mfaRequired: state.mfaRequired,
    mfaSetupRequired: state.mfaSetupRequired,
  }));

export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    confirmMFA: state.confirmMFA,
    setupMFA: state.setupMFA,
    verifyMFASetup: state.verifyMFASetup,
    logout: state.logout,
    checkAuth: state.checkAuth,
    refreshToken: state.refreshToken,
    setUser: state.setUser,
    setToken: state.setToken,
  }));
