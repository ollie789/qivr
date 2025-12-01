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

export interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  status: string;
  planTier: string;
  createdAt: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  timezone?: string;
  featureFlags: Record<string, boolean>;
  usage: {
    patients: number;
    staff: number;
    appointmentsThisMonth: number;
  };
  limits: {
    maxStaff: number;
    maxPatients: number;
    maxStorageGb: number;
    maxAiCallsPerMonth: number;
  };
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

  // Tenant Management (production DB)
  getTenant: (id: string) => request<TenantDetail>(`/tenants/${id}`),
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

  // Billing (Stripe integration)
  getBillingOverview: () => request<BillingOverview>("/billing/overview"),
  getTenantInvoices: (tenantId: string, limit = 10) =>
    request<InvoicesResponse>(
      `/billing/tenants/${tenantId}/invoices?limit=${limit}`,
    ),
  getTenantPaymentMethods: (tenantId: string) =>
    request<PaymentMethodsResponse>(
      `/billing/tenants/${tenantId}/payment-methods`,
    ),
  getTenantSubscription: (tenantId: string) =>
    request<SubscriptionResponse>(`/billing/tenants/${tenantId}/subscription`),
  createStripeCustomer: (tenantId: string) =>
    request(`/billing/tenants/${tenantId}/stripe-customer`, { method: "POST" }),
  createPortalSession: (tenantId: string, returnUrl?: string) =>
    request<{ url: string }>(`/billing/tenants/${tenantId}/portal-session`, {
      method: "POST",
      body: JSON.stringify({ returnUrl }),
    }),
  getRecentTransactions: (limit = 20) =>
    request<TransactionsResponse>(`/billing/transactions?limit=${limit}`),
};

export interface BillingOverview {
  mrr: number;
  mrrFormatted: string;
  arr: number;
  arrFormatted: string;
  totalTenants: number;
  activeTenants: number;
  planBreakdown: Array<{ plan: string; count: number; revenue: number }>;
}

export interface Invoice {
  id: string;
  number: string;
  status: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  created: string;
  dueDate?: string;
  paid: boolean;
  hostedInvoiceUrl?: string;
  pdfUrl?: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  hasStripeAccount: boolean;
  message?: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
  hasStripeAccount: boolean;
}

export interface SubscriptionResponse {
  hasStripeSubscription: boolean;
  subscriptionId?: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  plan: string;
  priceId?: string;
  amount?: number;
  message?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  customerId?: string;
  customerEmail?: string;
  description?: string;
  paid: boolean;
  refunded: boolean;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}
