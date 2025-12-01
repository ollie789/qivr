import { useQuery } from "@tanstack/react-query";
import apiClient from "../lib/api-client";

export interface FeatureFlags {
  aiTriage: boolean;
  aiTreatmentPlans: boolean;
  documentOcr: boolean;
  smsReminders: boolean;
  apiAccess: boolean;
  customBranding: boolean;
  hipaaAuditLogs: boolean;
}

const defaultFlags: FeatureFlags = {
  aiTriage: false,
  aiTreatmentPlans: false,
  documentOcr: true,
  smsReminders: false,
  apiAccess: false,
  customBranding: false,
  hipaaAuditLogs: false,
};

export function useFeatureFlags() {
  const { data, isLoading } = useQuery({
    queryKey: ["featureFlags"],
    queryFn: () => apiClient.get<FeatureFlags>("/settings/features"),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    flags: data ?? defaultFlags,
    isLoading,
    isEnabled: (feature: keyof FeatureFlags) =>
      data?.[feature] ?? defaultFlags[feature],
  };
}
