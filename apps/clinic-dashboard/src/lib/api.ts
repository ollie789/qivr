import { api } from "./api-client";

export const apiKeysApi = {
  list: () => api.get("/api/api-keys"),
  create: (data: {
    name: string;
    description?: string;
    expiresInDays?: number;
  }) => api.post("/api/api-keys", data),
  revoke: (id: string) => api.delete(`/api/api-keys/${id}`),
  toggle: (id: string) => api.patch(`/api/api-keys/${id}/toggle`),
};

export const treatmentPlansApi = {
  list: (patientId?: string) =>
    api.get("/api/treatment-plans", patientId ? { patientId } : undefined),
  get: (id: string) => api.get(`/api/treatment-plans/${id}`),
  create: (data: any) => api.post("/api/treatment-plans", data),
  update: (id: string, data: any) =>
    api.put(`/api/treatment-plans/${id}`, data),
  delete: (id: string) => api.delete(`/api/treatment-plans/${id}`),

  // AI Generation
  generate: (data: {
    patientId: string;
    evaluationId?: string;
    preferredDurationWeeks?: number;
    sessionsPerWeek?: number;
    focusAreas?: string[];
    contraindications?: string[];
  }) => api.post("/api/treatment-plans/generate", data),

  // Approval workflow
  approve: (id: string) => api.post(`/api/treatment-plans/${id}/approve`),

  // Exercise suggestions
  suggestExercises: (data: {
    bodyRegion?: string;
    condition?: string;
    difficulty?: string;
    excludeExercises?: string[];
    maxResults?: number;
  }) => api.post("/api/treatment-plans/suggest-exercises", data),

  // Session completion
  completeSession: (
    planId: string,
    sessionNumber: number,
    data: {
      painLevelAfter?: number;
      notes?: string;
      appointmentId?: string;
    },
  ) =>
    api.post(
      `/api/treatment-plans/${planId}/sessions/${sessionNumber}/complete`,
      data,
    ),

  // Milestones
  getMilestones: (id: string) =>
    api.get(`/api/treatment-plans/${id}/milestones`),
};

export const exerciseLibraryApi = {
  list: (params?: {
    category?: string;
    bodyRegion?: string;
    difficulty?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => api.get("/api/treatment-plans/exercises", params),
  get: (id: string) => api.get(`/api/treatment-plans/exercises/${id}`),
  getFilters: () => api.get("/api/treatment-plans/exercises/filters"),
  create: (data: {
    name: string;
    description?: string;
    instructions?: string;
    defaultSets?: number;
    defaultReps?: number;
    defaultHoldSeconds?: number;
    defaultFrequency?: string;
    category: string;
    bodyRegion: string;
    difficulty?: string;
    targetConditions?: string[];
    contraindications?: string[];
    equipment?: string[];
    tags?: string[];
  }) => api.post("/api/treatment-plans/exercises", data),
};

export const aiTriageApi = {
  analyze: (data: {
    symptoms?: string;
    medicalHistory?: string;
    chiefComplaint?: string;
    duration?: string;
    severity?: number;
    currentMedications?: string[];
    allergies?: string[];
    age?: number;
  }) => api.post("/api/ai-triage/analyze", data),
};

export interface AvailableDevice {
  id: string;
  name: string;
  deviceCode: string;
  category?: string;
  bodyRegion?: string;
  partnerName: string;
  partnerId: string;
}

export interface DeviceUsage {
  id: string;
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  partnerName: string;
  procedureDate: string;
  procedureType?: string;
  implantLocation?: string;
  quantity: number;
  notes?: string;
}

export const deviceTrackingApi = {
  // Get devices available for this clinic
  getAvailableDevices: (params?: {
    category?: string;
    bodyRegion?: string;
    search?: string;
  }) =>
    api.get<{ devices: AvailableDevice[]; message?: string }>(
      "/api/device-tracking/available-devices",
      params,
    ),

  // Get recently used devices by current clinician
  getRecentDevices: () =>
    api.get<{ devices: AvailableDevice[] }>("/api/device-tracking/recent"),

  // Record device usage
  recordUsage: (data: {
    deviceId: string;
    patientId: string;
    appointmentId?: string;
    treatmentPlanId?: string;
    procedureDate?: string;
    procedureType?: string;
    implantLocation?: string;
    quantity?: number;
    notes?: string;
  }) =>
    api.post<{ id: string; success: boolean }>(
      "/api/device-tracking/record",
      data,
    ),

  // Get patient's device history
  getPatientDevices: (patientId: string) =>
    api.get<{ usages: DeviceUsage[] }>(
      `/api/device-tracking/patient/${patientId}`,
    ),

  // Delete a usage record
  deleteUsage: (usageId: string) =>
    api.delete<{ success: boolean }>(`/api/device-tracking/${usageId}`),
};
