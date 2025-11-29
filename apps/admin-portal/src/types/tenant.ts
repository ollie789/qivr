export type TenantStatus = "active" | "suspended" | "trial" | "churned";
export type PlanTier = "starter" | "professional" | "enterprise";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  planTier: PlanTier;
  createdAt: string;
  billingCustomerId?: string;
  contactEmail: string;
  contactName: string;
  featureFlags: FeatureFlags;
  usageLimits: UsageLimits;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlags {
  aiTriage: boolean;
  aiTreatmentPlans: boolean;
  documentOcr: boolean;
  smsReminders: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  hipaaAuditLogs: boolean;
}

export interface UsageLimits {
  maxPractitioners: number;
  maxPatients: number;
  maxStorageGb: number;
  maxAiCallsPerMonth: number;
}

export interface TenantUsage {
  tenantId: string;
  period: string;
  apiCalls: number;
  storageBytes: number;
  activePatients: number;
  aiCalls: number;
  smsSent: number;
  emailsSent: number;
}

export const DEFAULT_FEATURE_FLAGS: Record<PlanTier, FeatureFlags> = {
  starter: {
    aiTriage: false,
    aiTreatmentPlans: false,
    documentOcr: true,
    smsReminders: false,
    apiAccess: false,
    customBranding: false,
    hipaaAuditLogs: false,
  },
  professional: {
    aiTriage: true,
    aiTreatmentPlans: true,
    documentOcr: true,
    smsReminders: true,
    apiAccess: false,
    customBranding: false,
    hipaaAuditLogs: true,
  },
  enterprise: {
    aiTriage: true,
    aiTreatmentPlans: true,
    documentOcr: true,
    smsReminders: true,
    apiAccess: true,
    customBranding: true,
    hipaaAuditLogs: true,
  },
};
