import type {
  DeviceOutcomeBriefSummary,
  DeviceOutcomeSummaryResponse,
  DeviceOutcomeTimelineResponse,
  DeviceComparisonResponse,
} from "../types/outcomes";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("partner_token");

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export const deviceOutcomesApi = {
  // Get all devices with brief outcome summaries
  getDevicesWithOutcomes: async (): Promise<{
    devices: DeviceOutcomeBriefSummary[];
  }> => {
    return fetchWithAuth("/research-partner/device-outcomes");
  },

  // Get detailed outcome summary for a specific device
  getDeviceSummary: async (
    deviceId: string,
    params?: {
      promType?: string;
      fromDate?: string;
      toDate?: string;
    },
  ): Promise<DeviceOutcomeSummaryResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.promType) searchParams.set("promType", params.promType);
    if (params?.fromDate) searchParams.set("fromDate", params.fromDate);
    if (params?.toDate) searchParams.set("toDate", params.toDate);

    const query = searchParams.toString();
    return fetchWithAuth(
      `/research-partner/device-outcomes/${deviceId}/summary${query ? `?${query}` : ""}`,
    );
  },

  // Get timeline data for a device
  getDeviceTimeline: async (
    deviceId: string,
    promType: string = "ODI",
  ): Promise<DeviceOutcomeTimelineResponse> => {
    return fetchWithAuth(
      `/research-partner/device-outcomes/${deviceId}/timeline?promType=${promType}`,
    );
  },

  // Compare multiple devices
  compareDevices: async (
    deviceIds: string[],
    promType?: string,
  ): Promise<DeviceComparisonResponse> => {
    return fetchWithAuth("/research-partner/device-outcomes/compare", {
      method: "POST",
      body: JSON.stringify({
        deviceIds,
        promType,
      }),
    });
  },
};

export const authApi = {
  // Login with partner credentials
  login: async (
    email: string,
    password: string,
  ): Promise<{ token: string; partner: { id: string; name: string } }> => {
    // For now, this is a placeholder - would integrate with Cognito
    return fetchWithAuth("/auth/partner-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // Get current partner info
  getPartnerInfo: async (): Promise<{
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
  }> => {
    return fetchWithAuth("/research-partner/me");
  },
};
