import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "support";
}

interface AuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // TODO: Replace with actual admin API auth
        // For now, simple hardcoded check for development
        if (email === "admin@qivr.io" && password === "admin123") {
          set({
            user: { id: "1", email, name: "Admin User", role: "super_admin" },
            token: "dev-token",
            isAuthenticated: true,
          });
        } else {
          throw new Error("Invalid credentials");
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: "admin-auth" },
  ),
);
