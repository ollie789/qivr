import { FeatureFlags } from "../types/tenant";
import { getIdToken } from "./cognitoAuth";

const API_BASE =
  import.meta.env.VITE_ADMIN_API_URL || "http://localhost:5000/api/admin";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getIdToken();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = "/login";
    }
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface DashboardStats {
  totalTenants: string;
  activeTenants: string;
  totalPatients: string;
  totalStaff: string;
  mrr: string;
  mrrFormatted: string;
}

export const adminApi = {
  // Analytics (from Data Lake via Athena)
  getDashboardStats: () => request<DashboardStats>("/analytics/dashboard"),
  getTenants: () => request<any[]>("/analytics/tenants"),
  getUsageStats: (days = 30) => request<any[]>(`/analytics/usage?days=${days}`),
  getPromOutcomes: (region?: string, promType?: string) => {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (promType) params.set("promType", promType);
    return request<any[]>(`/analytics/prom-outcomes?${params}`);
  },
  getRevenueTrend: (months = 6) =>
    request<any[]>(`/analytics/revenue-trend?months=${months}`),

  // Tenant Management Actions (write to production DB)
  suspendTenant: (id: string) =>
    request(`/tenants/${id}/suspend`, { method: "POST" }),
  activateTenant: (id: string) =>
    request(`/tenants/${id}/activate`, { method: "POST" }),
  updatePlan: (id: string, plan: string) =>
    request(`/tenants/${id}/plan`, {
      method: "PUT",
      body: JSON.stringify({ plan }),
    }),
  updateFeatureFlags: (id: string, flags: Partial<FeatureFlags>) =>
    request(`/tenants/${id}/features`, {
      method: "PUT",
      body: JSON.stringify(flags),
    }),
  deleteTenant: (id: string) => request(`/tenants/${id}`, { method: "DELETE" }),
};
