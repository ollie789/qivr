const API_BASE =
  import.meta.env.VITE_ADMIN_API_URL || "http://localhost:5000/api/admin";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("admin-auth")
    ? JSON.parse(localStorage.getItem("admin-auth")!).state?.token
    : null;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const adminApi = {
  // Tenants
  getTenants: () => request<any[]>("/tenants"),
  getTenant: (id: string) => request<any>(`/tenants/${id}`),
  createTenant: (data: any) =>
    request("/tenants", { method: "POST", body: JSON.stringify(data) }),
  updateTenant: (id: string, data: any) =>
    request(`/tenants/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  suspendTenant: (id: string) =>
    request(`/tenants/${id}/suspend`, { method: "POST" }),
  activateTenant: (id: string) =>
    request(`/tenants/${id}/activate`, { method: "POST" }),

  // Feature Flags
  updateFeatureFlags: (id: string, flags: any) =>
    request(`/tenants/${id}/features`, {
      method: "PUT",
      body: JSON.stringify(flags),
    }),

  // Usage
  getTenantUsage: (id: string, period?: string) =>
    request<any>(`/tenants/${id}/usage${period ? `?period=${period}` : ""}`),
  getAllUsage: (period?: string) =>
    request<any[]>(`/usage${period ? `?period=${period}` : ""}`),

  // Billing
  getBillingOverview: () => request<any>("/billing/overview"),
  syncStripeCustomer: (tenantId: string) =>
    request(`/billing/sync/${tenantId}`, { method: "POST" }),

  // Dashboard
  getDashboardStats: () => request<any>("/dashboard/stats"),
};
