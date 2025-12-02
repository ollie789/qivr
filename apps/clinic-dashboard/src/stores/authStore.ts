import { create } from "zustand";
import { persist } from "zustand/middleware";
import authApi, { type AuthUserInfo } from "../services/authApi";

interface User {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  clinicId?: string;
  clinicName?: string;
  role: "admin" | "practitioner" | "receptionist" | "manager";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeTenantId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  resetAuth: () => void;
  setActiveTenantId: (tenantId: string | null) => void;
}

const mapUserInfo = (info: AuthUserInfo): User => {
  // Handle case-insensitive username field
  const username = info.username || (info as any).Username;

  // Validate required fields
  if (!username) {
    throw new Error("Username is required for authentication");
  }
  if (!info.email) {
    throw new Error("Email is required for authentication");
  }
  if (!info.tenantId) {
    console.warn("User has no tenant ID - may need to be assigned to a tenant");
  }

  const firstName = info.firstName ?? "";
  const lastName = info.lastName ?? "";
  const name = `${firstName} ${lastName}`.trim() || info.email;
  const role = (info.role ?? "practitioner").toLowerCase() as User["role"];
  const validRoles: Array<User["role"]> = [
    "admin",
    "practitioner",
    "receptionist",
    "manager",
  ];

  return {
    id: username,
    name,
    email: info.email,
    tenantId: info.tenantId ?? "",
    clinicId: info.tenantId ?? "", // Use tenantId as clinicId for compatibility
    clinicName: undefined,
    role: validRoles.includes(role) ? role : "practitioner",
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      activeTenantId: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const userInfo =
            response && typeof response === "object" && "userInfo" in response
              ? response.userInfo
              : await authApi.getUserInfo();

          if (!userInfo) {
            throw new Error("Failed to load user info");
          }

          // Block patients from accessing clinic dashboard
          if (userInfo.role?.toLowerCase() === "patient") {
            await authApi.logout();
            throw new Error(
              "Patients cannot access the clinic dashboard. Please use the patient portal.",
            );
          }

          const user = mapUserInfo(userInfo);
          set({
            user,
            token: "auth-proxy-token", // Token in httpOnly cookie
            isAuthenticated: true,
            activeTenantId: user.tenantId,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          localStorage.removeItem("auth-storage");
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            activeTenantId: null,
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const userInfo = await authApi.getUserInfo();
          if (userInfo) {
            // Block patients from accessing clinic dashboard
            if (userInfo.role?.toLowerCase() === "patient") {
              await authApi.logout();
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                activeTenantId: null,
              });
              throw new Error(
                "Patients cannot access the clinic dashboard. Please use the patient portal.",
              );
            }

            const user = mapUserInfo(userInfo);
            set({
              user,
              token: "auth-proxy-token",
              isAuthenticated: true,
              activeTenantId: user.tenantId,
            });
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              activeTenantId: null,
            });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            activeTenantId: null,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshToken: async () => {
        try {
          await authApi.refresh();
        } catch (error) {
          console.error("Token refresh failed:", error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            activeTenantId: null,
          });
        }
      },

      resetAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          activeTenantId: null,
        });
      },

      setActiveTenantId: (tenantId: string | null) => {
        set({ activeTenantId: tenantId });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        activeTenantId: state.activeTenantId,
      }),
    },
  ),
);

// Helper hooks
export const useAuth = () =>
  useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    activeTenantId: state.activeTenantId,
  }));

export const useAuthUser = () => useAuthStore((state) => state.user);

export const useAuthStatus = () =>
  useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
  }));

export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    checkAuth: state.checkAuth,
    refreshToken: state.refreshToken,
    resetAuth: state.resetAuth,
    setActiveTenantId: state.setActiveTenantId,
  }));
