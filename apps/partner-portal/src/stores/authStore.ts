import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Partner {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  partner: Partner | null;
  token: string | null;
  login: (token: string, partner: Partner) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      partner: null,
      token: null,
      login: (token, partner) => {
        localStorage.setItem("partner_token", token);
        set({ isAuthenticated: true, token, partner });
      },
      logout: () => {
        localStorage.removeItem("partner_token");
        set({ isAuthenticated: false, token: null, partner: null });
      },
    }),
    {
      name: "partner-auth",
    },
  ),
);
