import { FeatureFlags } from "../types/tenant";
import { getIdToken } from "./cognitoAuth";

// Use production API - admin portal always calls clinic.qivr.pro backend
const API_BASE =
  import.meta.env.VITE_ADMIN_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5001/api/admin"
    : "https://clinic.qivr.pro/api/admin");

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

// Operations & Monitoring
export interface SystemHealth {
  status: string;
  timestamp: string;
  checks: Array<{
    name: string;
    status: string;
    responseTime?: string;
    details?: string;
  }>;
  uptime: string;
}

export interface QueueStatus {
  timestamp: string;
  queues: Array<{
    name: string;
    queueUrl: string;
    messagesAvailable: number;
    messagesInFlight: number;
    messagesDelayed: number;
    status: string;
  }>;
}

export interface Alert {
  id: string;
  timestamp: string;
  type: string;
  severity: string;
  action?: string;
  resource?: string;
  error?: string;
  admin?: string;
  message?: string;
  details?: string;
}

// Tenant Insights
export interface TenantHealthScore {
  tenantId: string;
  name: string;
  slug: string;
  healthScore: number;
  churnRisk: string;
  metrics: {
    appointmentsLast30: number;
    appointmentsLast7: number;
    documentsLast30: number;
    promResponsesLast30: number;
    staffCount: number;
    patientCount: number;
  };
  scores: {
    activity: number;
    engagement: number;
    setup: number;
  };
  daysSinceCreation: number;
}

export interface OnboardingProgress {
  tenantId: string;
  name: string;
  slug: string;
  createdAt: string;
  daysOld: number;
  progress: number;
  completedSteps: number;
  totalSteps: number;
  milestones: Array<{
    step: string;
    completed: boolean;
    order: number;
  }>;
  status: string;
}

export interface FeatureAdoption {
  feature: string;
  category: string;
  tenantsUsing: number;
  adoptionRate: number;
  totalUsage: number;
}

// Support Tools
export interface AuditLog {
  id: string;
  createdAt: string;
  adminUserId?: string;
  adminEmail?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  correlationId?: string;
  previousState?: string;
  newState?: string;
  userAgent?: string;
  metadata?: string;
}

export interface ImpersonateResult {
  token: string;
  expiresIn: number;
  targetUser: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  warning: string;
}

export interface SearchResult {
  type: string;
  id: string;
  name: string;
  description: string;
  email?: string;
  tenantId?: string;
  role?: string;
  slug?: string;
}

// Extended Admin API
export const operationsApi = {
  getSystemHealth: () => request<SystemHealth>("/operations/health"),
  getMetrics: (hours = 24) =>
    request<any>(`/operations/metrics?hours=${hours}`),
  getActiveUsers: () => request<any>("/operations/active-users"),
  getQueues: () => request<QueueStatus>("/operations/queues"),
  getAlerts: (hours = 24) =>
    request<{ alerts: Alert[]; totalAlerts: number; bySeverity: any }>(
      `/operations/alerts?hours=${hours}`,
    ),
  getEtlStatus: () => request<any>("/operations/etl-status"),
};

export const insightsApi = {
  getHealthScores: () =>
    request<{
      timestamp: string;
      summary: any;
      tenants: TenantHealthScore[];
    }>("/insights/health-scores"),
  getOnboarding: (days = 30) =>
    request<{ summary: any; tenants: OnboardingProgress[] }>(
      `/insights/onboarding?days=${days}`,
    ),
  getFeatureAdoption: () =>
    request<{
      totalTenants: number;
      features: FeatureAdoption[];
      topFeatures: FeatureAdoption[];
    }>("/insights/feature-adoption"),
  getStorage: () => request<any>("/insights/storage"),
  getTrends: (days = 30) => request<any>(`/insights/trends?days=${days}`),
};

export const supportApi = {
  impersonate: (data: {
    tenantId: string;
    userId?: string;
    email?: string;
    reason?: string;
  }) =>
    request<ImpersonateResult>("/support/impersonate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAuditLogs: (params?: {
    page?: number;
    pageSize?: number;
    action?: string;
    resourceType?: string;
    adminEmail?: string;
    since?: string;
    until?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.pageSize)
      searchParams.set("pageSize", params.pageSize.toString());
    if (params?.action) searchParams.set("action", params.action);
    if (params?.resourceType)
      searchParams.set("resourceType", params.resourceType);
    if (params?.adminEmail) searchParams.set("adminEmail", params.adminEmail);
    if (params?.since) searchParams.set("since", params.since);
    if (params?.until) searchParams.set("until", params.until);
    return request<{
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      logs: AuditLog[];
    }>(`/support/audit-logs?${searchParams}`);
  },
  getAuditLogDetail: (id: string) =>
    request<AuditLog>(`/support/audit-logs/${id}`),
  sendAnnouncement: (data: {
    tenantId?: string;
    sendToAllTenants?: boolean;
    subject: string;
    body: string;
    htmlBody?: string;
  }) =>
    request<any>("/support/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  globalSearch: (q: string) =>
    request<{ query: string; resultCount: number; results: SearchResult[] }>(
      `/support/search?q=${encodeURIComponent(q)}`,
    ),
};

// External API key management
export interface ExternalApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  description?: string;
  partnerName?: string;
  contactEmail?: string;
  tenantId: string;
  tenantName?: string;
  tenantSlug?: string;
  scopes: string[];
  isActive: boolean;
  expiresAt?: string;
  lastUsedAt?: string;
  rateLimitPerHour: number;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  partnerName?: string;
  contactEmail?: string;
  tenantId: string;
  scopes?: string[];
  expiresAt?: string;
  rateLimitPerHour?: number;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  apiKey: string; // Full key - only shown once!
  keyPrefix: string;
  tenantId: string;
  tenantName: string;
  scopes: string[];
  expiresAt?: string;
  rateLimitPerHour: number;
  warning: string;
}

export const externalApiService = {
  getApiKeys: (tenantId?: string, includeRevoked = false) => {
    const params = new URLSearchParams();
    if (tenantId) params.set("tenantId", tenantId);
    if (includeRevoked) params.set("includeRevoked", "true");
    return request<{ keys: ExternalApiKey[] }>(`/external-api/keys?${params}`);
  },
  getApiKey: (id: string) =>
    request<ExternalApiKey>(`/external-api/keys/${id}`),
  createApiKey: (data: CreateApiKeyRequest) =>
    request<CreateApiKeyResponse>("/external-api/keys", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateApiKey: (
    id: string,
    data: Partial<Omit<CreateApiKeyRequest, "tenantId">>,
  ) =>
    request<{ id: string; updated: boolean }>(`/external-api/keys/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  revokeApiKey: (id: string, reason?: string) =>
    request<{ id: string; revoked: boolean }>(
      `/external-api/keys/${id}/revoke`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      },
    ),
  activateApiKey: (id: string) =>
    request<{ id: string; activated: boolean }>(
      `/external-api/keys/${id}/activate`,
      { method: "POST" },
    ),
  deleteApiKey: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/external-api/keys/${id}`, {
      method: "DELETE",
    }),
  regenerateApiKey: (id: string) =>
    request<CreateApiKeyResponse>(`/external-api/keys/${id}/regenerate`, {
      method: "POST",
    }),
  getUsageStats: (tenantId?: string, days = 30) => {
    const params = new URLSearchParams();
    if (tenantId) params.set("tenantId", tenantId);
    params.set("days", days.toString());
    return request<any>(`/external-api/usage?${params}`);
  },
  getDocs: () => request<any>("/external-api/docs"),
};

// Extended billing API for churn/renewals
export const billingExtendedApi = {
  getChurnAnalysis: (months = 6) =>
    request<any>(`/billing/churn?months=${months}`),
  getRevenueBreakdown: () => request<any>("/billing/revenue-breakdown"),
  getUpcomingRenewals: (days = 30) =>
    request<any>(`/billing/renewals?days=${days}`),
  getFailedPayments: (days = 30) =>
    request<any>(`/billing/failed-payments?days=${days}`),
  resendInvoice: (invoiceId: string) =>
    request<any>(`/billing/invoices/${invoiceId}/resend`, { method: "POST" }),
  voidInvoice: (invoiceId: string) =>
    request<any>(`/billing/invoices/${invoiceId}/void`, { method: "POST" }),
  refundCharge: (chargeId: string, amount?: number, reason?: string) =>
    request<any>(`/billing/charges/${chargeId}/refund`, {
      method: "POST",
      body: JSON.stringify({ amount, reason }),
    }),
};

// Research Partners API
export interface ResearchPartnerListItem {
  id: string;
  name: string;
  slug: string;
  contactEmail?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
  clinicCount: number;
  deviceCount: number;
  studyCount: number;
}

export interface ResearchPartnerDetail {
  id: string;
  name: string;
  slug: string;
  contactEmail?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  isActive: boolean;
  cognitoUserPoolId?: string;
  createdAt: string;
  updatedAt: string;
  affiliations: AffiliationResponse[];
  devices: DeviceResponse[];
  studies: StudyResponse[];
}

export interface AffiliationResponse {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  status: string;
  dataSharingLevel: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface DeviceResponse {
  id: string;
  name: string;
  deviceCode: string;
  category?: string;
  bodyRegion?: string;
  isActive: boolean;
  usageCount: number;
}

export interface StudyResponse {
  id: string;
  title: string;
  status: string;
  protocolId?: string;
  startDate?: string;
  endDate?: string;
  targetEnrollment: number;
  currentEnrollment: number;
}

export interface AvailableClinic {
  id: string;
  name: string;
  slug: string;
}

export interface CreatePartnerRequest {
  name: string;
  contactEmail?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
}

export interface UpdatePartnerRequest {
  name?: string;
  contactEmail?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
}

export interface CreateAffiliationRequest {
  tenantId: string;
  status?: string;
  dataSharingLevel?: string;
  notes?: string;
}

export interface UpdateAffiliationRequest {
  status?: string;
  dataSharingLevel?: string;
  notes?: string;
}

export interface CreateDeviceRequest {
  name: string;
  deviceCode: string;
  category?: string;
  bodyRegion?: string;
  description?: string;
}

export interface UpdateDeviceRequest {
  name?: string;
  deviceCode?: string;
  category?: string;
  bodyRegion?: string;
  description?: string;
  isActive?: boolean;
}

export const researchPartnersApi = {
  // Partner CRUD
  getPartners: () => request<ResearchPartnerListItem[]>("/research-partners"),
  getPartner: (id: string) =>
    request<ResearchPartnerDetail>(`/research-partners/${id}`),
  createPartner: (data: CreatePartnerRequest) =>
    request<{ id: string; slug: string }>("/research-partners", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePartner: (id: string, data: UpdatePartnerRequest) =>
    request<{ success: boolean }>(`/research-partners/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePartner: (id: string) =>
    request<{ success: boolean }>(`/research-partners/${id}`, {
      method: "DELETE",
    }),
  activatePartner: (id: string) =>
    request<{ success: boolean }>(`/research-partners/${id}/activate`, {
      method: "POST",
    }),
  deactivatePartner: (id: string) =>
    request<{ success: boolean }>(`/research-partners/${id}/deactivate`, {
      method: "POST",
    }),

  // Affiliations
  getAffiliations: (partnerId: string) =>
    request<AffiliationResponse[]>(
      `/research-partners/${partnerId}/affiliations`,
    ),
  addAffiliation: (partnerId: string, data: CreateAffiliationRequest) =>
    request<{ id: string }>(`/research-partners/${partnerId}/affiliations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAffiliation: (
    partnerId: string,
    affiliationId: string,
    data: UpdateAffiliationRequest,
  ) =>
    request<{ success: boolean }>(
      `/research-partners/${partnerId}/affiliations/${affiliationId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),
  deleteAffiliation: (partnerId: string, affiliationId: string) =>
    request<{ success: boolean }>(
      `/research-partners/${partnerId}/affiliations/${affiliationId}`,
      {
        method: "DELETE",
      },
    ),
  getAvailableClinics: (partnerId: string) =>
    request<AvailableClinic[]>(
      `/research-partners/${partnerId}/available-clinics`,
    ),

  // Devices
  getDevices: (partnerId: string) =>
    request<DeviceResponse[]>(`/research-partners/${partnerId}/devices`),
  createDevice: (partnerId: string, data: CreateDeviceRequest) =>
    request<{ id: string }>(`/research-partners/${partnerId}/devices`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateDevice: (
    partnerId: string,
    deviceId: string,
    data: UpdateDeviceRequest,
  ) =>
    request<{ success: boolean }>(
      `/research-partners/${partnerId}/devices/${deviceId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    ),
  deleteDevice: (partnerId: string, deviceId: string) =>
    request<{ success: boolean }>(
      `/research-partners/${partnerId}/devices/${deviceId}`,
      {
        method: "DELETE",
      },
    ),
};
