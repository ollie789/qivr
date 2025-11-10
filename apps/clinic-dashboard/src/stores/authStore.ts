import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authApi, { type AuthUserInfo } from '../services/authApi';

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
  mfaSession: string | null;
  mfaChallenge: string | null;
  activeTenantId: string | null;
  login: (email: string, password: string) => Promise<void>;
  confirmMFA: (code: string) => Promise<void>;
  setupMFA: () => Promise<{ qrCode: string; secretKey: string }>;
  verifyMFASetup: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  setActiveTenantId: (tenantId: string | null) => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  resetAuth: () => void;
}

const mapProxyUserToUser = (info?: AuthUserInfo | null): User | null => {
  if (!info) {
    return null;
  }

  const email = info.email ?? '';
  const firstName = info.firstName ?? '';
  const lastName = info.lastName ?? '';
  const fullName = `${firstName} ${lastName}`.trim() || email;
  const tenantId = info.tenantId ?? undefined;
  const role = (info.role ?? 'practitioner').toLowerCase() as User['role'];
  const allowedRoles: User['role'][] = ['admin', 'practitioner', 'receptionist', 'manager'];

  return {
    id: info.username,
    name: fullName,
    email,
    clinicId: undefined,
    tenantId,
    clinicName: undefined,
    role: allowedRoles.includes(role) ? role : 'practitioner',
    employeeId: undefined,
    licenseNumber: undefined,
    specialization: undefined,
  };
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
      mfaSession: null,
      mfaChallenge: null,
      activeTenantId: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, mfaRequired: false, mfaSetupRequired: false });
        try {
          const response = await authApi.login(email, password);

          if ('requiresMfa' in response && response.requiresMfa) {
            set({
              mfaRequired: true,
              mfaSession: response.session ?? null,
              mfaChallenge: response.challengeName ?? null,
            });
            return;
          }

          let user = mapProxyUserToUser('userInfo' in response ? response.userInfo : null);
          if (!user) {
            try {
              const freshInfo = await authApi.getUserInfo();
              user = mapProxyUserToUser(freshInfo);
            } catch (err) {
              console.warn('Failed to load user info after login:', err);
            }
          }

          if (!user) {
            throw new Error('Unable to load user profile after login');
          }

          set({
            user,
            token: 'auth-proxy-token', // Token is in httpOnly cookie
            isAuthenticated: true,
            mfaRequired: false,
            mfaSetupRequired: false,
            mfaSession: null,
            mfaChallenge: null,
            activeTenantId: user.tenantId ?? null,
          });
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
          const { mfaSession, mfaChallenge } = get();
          if (!mfaSession) {
            throw new Error('No MFA session found');
          }

          const response = await authApi.verifyMfa(mfaSession, code, mfaChallenge ?? undefined);
          const user = mapProxyUserToUser(response.userInfo);

          if (!user) {
            throw new Error('Unable to load user profile after MFA');
          }

          set({
            user,
            token: 'auth-proxy-token',
            isAuthenticated: true,
            mfaRequired: false,
            mfaSession: null,
            mfaChallenge: null,
            activeTenantId: user.tenantId ?? null,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      setupMFA: async () => {
        throw new Error('MFA setup not yet implemented');
      },

      verifyMFASetup: async (code: string) => {
        throw new Error('MFA setup verification not yet implemented');
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            mfaRequired: false,
            mfaSetupRequired: false,
            mfaSession: null,
            mfaChallenge: null,
            activeTenantId: null,
          });
        }
      },

      setUser: (user: User) => set({ user }),

      setToken: (token: string | null) => set({ token }),

      setActiveTenantId: (tenantId: string | null) => set({ activeTenantId: tenantId }),

      checkAuth: async () => {
        try {
          const user = await authApi.getUserInfo();
          if (user) {
            const mappedUser = mapProxyUserToUser(user);
            if (mappedUser) {
              set({
                user: mappedUser,
                token: 'auth-proxy-token',
                isAuthenticated: true,
                activeTenantId: mappedUser.tenantId ?? null,
              });
              return;
            }
          }
        } catch (error) {
          console.error('Auth check failed:', error);
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          activeTenantId: null,
        });
      },

      refreshToken: async () => {
        try {
          await authApi.refresh();
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().resetAuth();
        }
      },

      resetAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          mfaRequired: false,
          mfaSetupRequired: false,
          mfaSession: null,
          mfaChallenge: null,
          activeTenantId: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        activeTenantId: state.activeTenantId,
      }),
    }
  )
);

export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  token: state.token,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  mfaRequired: state.mfaRequired,
  mfaSetupRequired: state.mfaSetupRequired,
  activeTenantId: state.activeTenantId,
}));

export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthStatus = () => useAuthStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
}));

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  confirmMFA: state.confirmMFA,
  setupMFA: state.setupMFA,
  verifyMFASetup: state.verifyMFASetup,
  logout: state.logout,
  setUser: state.setUser,
  setToken: state.setToken,
  setActiveTenantId: state.setActiveTenantId,
  checkAuth: state.checkAuth,
  refreshToken: state.refreshToken,
  resetAuth: state.resetAuth,
}));
