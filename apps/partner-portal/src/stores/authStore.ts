import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CognitoUserSession } from "amazon-cognito-identity-js";
import * as cognitoAuth from "../services/cognitoAuth";

interface Partner {
  id: string;
  name: string;
  email: string;
  slug?: string;
  logoUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  partner: Partner | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkSession: () => Promise<boolean>;
}

function parsePartnerFromSession(session: CognitoUserSession): Partner {
  const payload = session.getIdToken().decodePayload();
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.email.split("@")[0],
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      partner: null,

      login: async (email, password) => {
        const result = await cognitoAuth.signIn(email, password);
        if (result.success && result.session) {
          set({
            partner: parsePartnerFromSession(result.session),
            isAuthenticated: true,
          });
          return { success: true };
        }
        return { success: false, error: result.error };
      },

      logout: () => {
        cognitoAuth.signOut();
        set({ partner: null, isAuthenticated: false });
      },

      checkSession: async () => {
        const session = await cognitoAuth.getCurrentSession();
        if (session) {
          set({
            partner: parsePartnerFromSession(session),
            isAuthenticated: true,
          });
          return true;
        }
        set({ partner: null, isAuthenticated: false });
        return false;
      },
    }),
    {
      name: "partner-auth",
      partialize: (state) => ({ partner: state.partner }),
    },
  ),
);
