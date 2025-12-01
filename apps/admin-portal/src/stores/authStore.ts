import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CognitoUser, CognitoUserSession } from "amazon-cognito-identity-js";
import * as cognitoAuth from "../services/cognitoAuth";

interface AdminUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  mfaRequired: boolean;
  mfaSetupRequired: boolean;
  totpSecret: string | null;
  pendingUser: CognitoUser | null;

  login: (
    email: string,
    password: string,
  ) => Promise<{
    success: boolean;
    error?: string;
    mfaRequired?: boolean;
    mfaSetupRequired?: boolean;
  }>;
  verifyMfa: (code: string) => Promise<{ success: boolean; error?: string }>;
  setupMfa: () => Promise<{ secretCode: string }>;
  completeMfaSetup: (
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkSession: () => Promise<boolean>;
}

function parseUserFromSession(session: CognitoUserSession): AdminUser {
  const payload = session.getIdToken().decodePayload();
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.email.split("@")[0],
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      mfaRequired: false,
      mfaSetupRequired: false,
      totpSecret: null,
      pendingUser: null,

      login: async (email, password) => {
        const result = await cognitoAuth.signIn(email, password);

        if (result.success && result.session) {
          set({
            user: parseUserFromSession(result.session),
            isAuthenticated: true,
            mfaRequired: false,
            mfaSetupRequired: false,
            pendingUser: null,
          });
          return { success: true };
        }

        if (result.challengeName === "SOFTWARE_TOKEN_MFA") {
          set({ mfaRequired: true, pendingUser: result.cognitoUser || null });
          return { success: false, mfaRequired: true };
        }

        if (result.challengeName === "MFA_SETUP") {
          set({
            mfaSetupRequired: true,
            pendingUser: result.cognitoUser || null,
          });
          return { success: false, mfaSetupRequired: true };
        }

        return { success: false, error: result.error };
      },

      verifyMfa: async (code) => {
        const { pendingUser } = get();
        if (!pendingUser)
          return { success: false, error: "No pending authentication" };

        const result = await cognitoAuth.verifyTotp(pendingUser, code);

        if (result.success && result.session) {
          set({
            user: parseUserFromSession(result.session),
            isAuthenticated: true,
            mfaRequired: false,
            pendingUser: null,
          });
          return { success: true };
        }

        return { success: false, error: result.error };
      },

      setupMfa: async () => {
        const { pendingUser } = get();
        if (!pendingUser) throw new Error("No pending user");

        const { secretCode } = await cognitoAuth.setupTotp(pendingUser);
        set({ totpSecret: secretCode });
        return { secretCode };
      },

      completeMfaSetup: async (code) => {
        const { pendingUser } = get();
        if (!pendingUser) return { success: false, error: "No pending user" };

        const result = await cognitoAuth.verifyTotpSetup(pendingUser, code);

        if (result.success) {
          // After MFA setup, user needs to sign in again
          set({ mfaSetupRequired: false, totpSecret: null, pendingUser: null });
          return { success: true };
        }

        return { success: false, error: result.error };
      },

      logout: () => {
        cognitoAuth.signOut();
        set({
          user: null,
          isAuthenticated: false,
          mfaRequired: false,
          mfaSetupRequired: false,
          totpSecret: null,
          pendingUser: null,
        });
      },

      checkSession: async () => {
        const session = await cognitoAuth.getCurrentSession();
        if (session) {
          set({ user: parseUserFromSession(session), isAuthenticated: true });
          return true;
        }
        set({ user: null, isAuthenticated: false });
        return false;
      },
    }),
    {
      name: "admin-auth",
      partialize: (state) => ({
        user: state.user,
        // Don't persist isAuthenticated - always verify with Cognito
      }),
    },
  ),
);
