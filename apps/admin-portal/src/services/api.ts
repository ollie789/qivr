import { Tenant, TenantUsage, FeatureFlags } from "../types/tenant";

const API_BASE =
  import.meta.env.VITE_ADMIN_API_URL || "http://localhost:5000/api/admin";

function getToken(): string | null {
  try {
    const stored = localStorage.getItem("admin-auth");
    return stored ? JSON.parse(stored).state?.token : null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();

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
      localStorage.removeItem("admin-auth");
      window.location.href = "/login";
    }
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  newTenantsThisMonth: number;
  totalPatients: number;
  patientGrowthPercent: number;
  appointmentsThisMonth: number;
  mrr: number;
  mrrFormatted: string;
}

export interface BillingOverview {
  mrr: number;
  mrrFormatted: string;
  arr: number;
  activeSubscriptions: number;
  trialTenants: number;
  suspendedTenants: number;
  byPlan: Record<string, number>;
}

export interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  date: string;
}

export const adminApi = {
  // Dashboard
  getDashboardStats: () => request<DashboardStats>("/dashboard/stats"),
  getRecentActivity: () => request<any[]>("/dashboard/activity"),
  getRevenueData: (months = 6) =>
    request<any[]>(`/dashboard/revenue?months=${months}`),

  // Tenants
  getTenants: (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return request<Tenant[]>(`/tenants?${params}`);
  },
  getTenant: (id: string) => request<Tenant>(`/tenants/${id}`),
  updateTenant: (id: string, data: Partial<Tenant>) =>
    request(`/tenants/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  suspendTenant: (id: string) =>
    request(`/tenants/${id}/suspend`, { method: "POST" }),
  activateTenant: (id: string) =>
    request(`/tenants/${id}/activate`, { method: "POST" }),
  deleteTenant: (id: string) => request(`/tenants/${id}`, { method: "DELETE" }),

  // Feature Flags
  updateFeatureFlags: (id: string, flags: Partial<FeatureFlags>) =>
    request(`/tenants/${id}/features`, {
      method: "PUT",
      body: JSON.stringify(flags),
    }),

  // Usage
  getTenantUsage: (id: string, period?: string) =>
    request<TenantUsage>(
      `/tenants/${id}/usage${period ? `?period=${period}` : ""}`,
    ),
  getAllUsage: (period?: string) =>
    request<any[]>(`/usage${period ? `?period=${period}` : ""}`),
  getUsageTotals: () => request<any>("/usage/totals"),

  // Billing
  getBillingOverview: () => request<BillingOverview>("/billing/overview"),
  getInvoices: () => request<Invoice[]>("/billing/invoices"),
  syncStripeCustomer: (tenantId: string) =>
    request(`/billing/sync/${tenantId}`, { method: "POST" }),
};
