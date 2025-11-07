import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import cognitoAuthService, { type ClinicUserAttributes } from '../services/cognitoAuthService';
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
  usingAuthProxy: boolean;
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

// Development mode flag controlled via environment variable (defaults to Cognito integration)
const DEV_MODE = (import.meta.env.VITE_ENABLE_DEV_AUTH ?? 'false') === 'true';
const DEV_USER: User = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Dev Clinician',
  email: 'dev.clinician@clinic.local',
  clinicId: null,
  tenantId: null,
  clinicName: 'Development Clinic',
  role: 'practitioner',
  employeeId: 'DEV-EMP-001',
  licenseNumber: 'DEV-LIC-001',
  specialization: 'Primary Care',
};

const USE_AUTH_PROXY = import.meta.env.VITE_USE_AUTH_PROXY === 'true';

const mapAttributesToUser = (attributes: ClinicUserAttributes): User => {
  const attr = attributes as Record<string, string | undefined>;

  const getAttribute = (primary: string, legacy?: string) => {
    // Check double-prefixed first (what actually exists in Cognito)
    const doublePrefix = `custom:custom:${primary.replace('custom:', '')}`;
    const doublePrefixValue = attr[doublePrefix];
    if (doublePrefixValue && doublePrefixValue.length > 0) {
      return doublePrefixValue;
    }
    
    // Fallback to single prefix
    const value = attr[primary];
    if (value && value.length > 0) {
      return value;
    }
    return legacy ? attr[legacy] : undefined;
  };

  const clinicId = getAttribute('custom:clinic_id');
  const tenantId = getAttribute('custom:tenant_id') ?? clinicId ?? undefined;

  const rawRole = (getAttribute('custom:role') ?? 'practitioner').toLowerCase();
  const allowedRoles: User['role'][] = ['admin', 'practitioner', 'receptionist', 'manager'];
  const role = (allowedRoles.includes(rawRole as User['role'])
    ? rawRole
    : 'practitioner') as User['role'];

  const givenName = attr['given_name'] ?? '';
  const familyName = attr['family_name'] ?? '';
  const fullName = `${givenName} ${familyName}`.trim();
  const email = attr['email'] ?? '';

  return {
    id: attr['sub'] ?? '',
    name: fullName || email,
    email,
    clinicId: clinicId,
    tenantId: tenantId,
    clinicName: getAttribute('custom:clinic_name', 'custom:custom:clinic_name'),
    role,
    employeeId: getAttribute('custom:employee_id', 'custom:custom:employee_id'),
    licenseNumber: getAttribute('custom:license_number', 'custom:custom:license_num'),
    specialization: getAttribute('custom:specialization', 'custom:custom:specialty'),
  };
};

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
      usingAuthProxy: USE_AUTH_PROXY,

      login: async (email: string, password: string) => {
        set({ isLoading: true, mfaRequired: false, mfaSetupRequired: false });
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
              mfaSession: null,
              activeTenantId: DEV_USER.tenantId ?? null,
            });
            localStorage.setItem('mockToken', mockToken);
            localStorage.setItem('mockUser', JSON.stringify(DEV_USER));
            set({ isLoading: false });
            return;
          }

          if (USE_AUTH_PROXY) {
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

            // Get session tokens for API requests
            const cognitoSession = await cognitoAuthService.getSession();
            set({
              user,
              token: cognitoSession?.accessToken || null,
              isAuthenticated: true,
              mfaRequired: false,
              mfaSetupRequired: false,
              mfaSession: null,
              mfaChallenge: null,
              activeTenantId: user.tenantId ?? null,
            });
            return;
          }

          const result = await cognitoAuthService.signIn(email, password);

          if (result.isSignedIn) {
            const [userAttributes, session] = await Promise.all([
              cognitoAuthService.getCurrentUser(),
              cognitoAuthService.getSession(),
            ]);

            if (userAttributes && session?.accessToken) {
              const user = mapAttributesToUser(userAttributes);

              set({
                user,
                token: session.accessToken,
                isAuthenticated: true,
                mfaRequired: false,
                mfaSetupRequired: false,
                mfaSession: null,
                mfaChallenge: null,
                activeTenantId: user.tenantId ?? null,
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
          if (USE_AUTH_PROXY) {
            const session = get().mfaSession;
            if (!session) {
              throw new Error('MFA session expired. Please sign in again.');
            }

            const challengeName = get().mfaChallenge ?? undefined;
            const response = await authApi.verifyMfa(session, code, challengeName);
            let user = mapProxyUserToUser(response.userInfo);
            if (!user) {
              try {
                const info = await authApi.getUserInfo();
                user = mapProxyUserToUser(info);
              } catch (err) {
                console.warn('Failed to fetch user info after MFA verification:', err);
              }
            }

            if (!user) {
              throw new Error('Unable to load user profile after MFA verification');
            }

            // Get session tokens for API requests
            const cognitoSession = await cognitoAuthService.getSession();
            set({
              user,
              token: cognitoSession?.accessToken || null,
              isAuthenticated: true,
              mfaRequired: false,
              mfaSetupRequired: false,
              mfaSession: null,
              mfaChallenge: null,
              activeTenantId: user.tenantId ?? null,
            });
            return;
          }

          await cognitoAuthService.confirmMFACode(code);

          const [userAttributes, session] = await Promise.all([
            cognitoAuthService.getCurrentUser(),
            cognitoAuthService.getSession(),
          ]);

          if (userAttributes && session?.accessToken) {
            const user = mapAttributesToUser(userAttributes);

            set({
              user,
              token: session.accessToken,
              isAuthenticated: true,
              mfaRequired: false,
              mfaSession: null,
              mfaChallenge: null,
              activeTenantId: user.tenantId ?? null,
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      setupMFA: async () => {
        if (USE_AUTH_PROXY) {
          throw new Error('MFA setup via auth proxy is not yet implemented');
        }
        return cognitoAuthService.setupMFA();
      },

      verifyMFASetup: async (code: string) => {
        set({ isLoading: true });
        try {
          if (USE_AUTH_PROXY) {
            throw new Error('MFA setup verification via auth proxy is not yet implemented');
          }
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
          } else if (USE_AUTH_PROXY) {
            await authApi.logout();
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
            mfaSession: null,
            mfaChallenge: null,
            activeTenantId: null,
          });
        }
      },

      setUser: (user: User) => {
        set((state) => ({
          user,
          activeTenantId: state.activeTenantId ?? user.tenantId ?? null,
        }));
      },

      setToken: (token: string | null) => {
        set({ token });
      },

      setActiveTenantId: (tenantId: string | null) => {
        set({ activeTenantId: tenantId });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          // Clean up any mock authentication data first
          localStorage.removeItem('mockToken');
          localStorage.removeItem('mockUser');
          
          // Use mock authentication in development
          if (DEV_MODE) {
            const mockToken = localStorage.getItem('mockToken');
            const mockUser = localStorage.getItem('mockUser');
            if (mockToken && mockUser) {
              set({
                user: JSON.parse(mockUser),
                token: mockToken,
                isAuthenticated: true,
                mfaRequired: false,
                mfaSetupRequired: false,
                mfaSession: null,
                mfaChallenge: null,
              });
            } else {
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                mfaRequired: false,
                mfaSetupRequired: false,
                mfaSession: null,
                mfaChallenge: null,
              });
            }
            set({ isLoading: false });
            return;
          }

          if (USE_AUTH_PROXY) {
            try {
              const info = await authApi.getUserInfo();
              const user = mapProxyUserToUser(info);
              if (user) {
                // Get session tokens for API requests
                const cognitoSession = await cognitoAuthService.getSession();
                set({
                  user,
                  token: cognitoSession?.accessToken || null,
                  isAuthenticated: true,
                  mfaRequired: false,
                  mfaSetupRequired: false,
                  mfaSession: null,
                  activeTenantId: get().activeTenantId ?? user.tenantId ?? null,
                });
                return;
              }
            } catch (error) {
              console.warn('Auth check via proxy failed:', error);
            }

            set({
              user: null,
              token: null,
              isAuthenticated: false,
              mfaRequired: false,
              mfaSetupRequired: false,
              mfaSession: null,
              activeTenantId: null,
              mfaChallenge: null,
            });
            return;
          }

          try {
            const [session, userAttributes] = await Promise.all([
              cognitoAuthService.getSession(),
              cognitoAuthService.getCurrentUser(),
            ]);

            if (session?.accessToken && userAttributes) {
              const user = mapAttributesToUser(userAttributes);

              set({
                user,
                token: session.accessToken,
                isAuthenticated: true,
                mfaRequired: false,
                mfaSetupRequired: false,
                mfaSession: null,
                mfaChallenge: null,
                activeTenantId: user.tenantId ?? null,
              });
              return;
            }
          } catch (error) {
            console.error('Auth check failed:', error);
          }

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            mfaRequired: false,
            mfaSetupRequired: false,
            mfaSession: null,
            activeTenantId: null,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshToken: async () => {
        try {
          if (USE_AUTH_PROXY) {
            await authApi.refresh();
            // Don't set token to null for auth proxy
            set({ isAuthenticated: true });
            return;
          }

          const session = await cognitoAuthService.getSession();
          if (session?.accessToken) {
            set({ token: session.accessToken, isAuthenticated: true });
          } else {
            set({ token: null, isAuthenticated: false });
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          set({ isAuthenticated: false, token: null });
        }
      },

      resetAuth: () => {
        // Clear all localStorage authentication data
        localStorage.removeItem('mockToken');
        localStorage.removeItem('mockUser');
        localStorage.removeItem('clinic-auth-storage');
        
        // Clear any Amplify/Cognito data
        Object.keys(localStorage).forEach(key => {
          if (key.includes('amplify') || key.includes('cognito') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });

        // Reset state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          mfaRequired: false,
          mfaSetupRequired: false,
          mfaSession: null,
          mfaChallenge: null,
          activeTenantId: null,
        });
      },
    }),
    {
      name: 'clinic-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        activeTenantId: state.activeTenantId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.usingAuthProxy = USE_AUTH_PROXY;
        }
      },
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
    activeTenantId: state.activeTenantId,
    usingAuthProxy: state.usingAuthProxy,
  }));

export const useAuthUser = () => useAuthStore((state) => state.user);

export const useAuthStatus = () =>
  useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    mfaRequired: state.mfaRequired,
    mfaSetupRequired: state.mfaSetupRequired,
    usingAuthProxy: state.usingAuthProxy,
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
    setActiveTenantId: state.setActiveTenantId,
    resetAuth: state.resetAuth,
  }));
