import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import cognitoAuthService, { type ClinicUserAttributes } from '../services/cognitoAuthService';

interface User {
  id: string;
  name: string;
  email: string;
  clinicId?: string;
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
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Development mode - set to true to bypass authentication
const DEV_MODE = true;
const DEV_USER = DEV_MODE ? {
  id: 'dev-user-123',
  name: 'Dr. John Smith',
  email: 'john.smith@clinic.com',
  clinicId: 'clinic-123',
  clinicName: 'Qivr Health Clinic',
  role: 'practitioner' as const,
  employeeId: 'EMP001',
  licenseNumber: 'LIC12345',
  specialization: 'Physiotherapy',
} : null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: DEV_USER,
      token: DEV_MODE ? 'dev-token' : null,
      isAuthenticated: DEV_MODE,
      isLoading: false, // Changed from true to false
      mfaRequired: false,
      mfaSetupRequired: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const result = await cognitoAuthService.signIn(email, password);
          
          if (result.isSignedIn) {
            const userAttributes = await cognitoAuthService.getCurrentUser();
            const session = await cognitoAuthService.getSession();
            
            if (userAttributes && session) {
              const user: User = {
                id: userAttributes.sub || '',
                name: `${userAttributes.given_name} ${userAttributes.family_name}`,
                email: userAttributes.email || '',
                clinicId: userAttributes['custom:clinic_id'],
                role: userAttributes['custom:role'] || 'practitioner',
                employeeId: userAttributes['custom:employee_id'],
                licenseNumber: userAttributes['custom:license_number'],
                specialization: userAttributes['custom:specialization'],
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
        } catch (error: any) {
          if (error.message === 'MFA_TOTP_REQUIRED') {
            set({ mfaRequired: true });
          } else if (error.message === 'MFA_SETUP_REQUIRED') {
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
              clinicId: userAttributes['custom:clinic_id'],
              role: userAttributes['custom:role'] || 'practitioner',
              employeeId: userAttributes['custom:employee_id'],
              licenseNumber: userAttributes['custom:license_number'],
              specialization: userAttributes['custom:specialization'],
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
          await cognitoAuthService.signOut();
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

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const isAuth = await cognitoAuthService.isAuthenticated();
          
          if (isAuth) {
            const userAttributes = await cognitoAuthService.getCurrentUser();
            const session = await cognitoAuthService.getSession();
            
            if (userAttributes && session) {
              const user: User = {
                id: userAttributes.sub || '',
                name: `${userAttributes.given_name} ${userAttributes.family_name}`,
                email: userAttributes.email || '',
                clinicId: userAttributes['custom:clinic_id'],
                role: userAttributes['custom:role'] || 'practitioner',
                employeeId: userAttributes['custom:employee_id'],
                licenseNumber: userAttributes['custom:license_number'],
                specialization: userAttributes['custom:specialization'],
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
