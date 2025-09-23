import apiClient from "./sharedApiClient";
import type {
  CreatePromTemplateRequest,
  PromTemplateDetail,
  PromTemplateSummary,
} from "./promApi";

export interface SchedulePromPayload {
  templateKey: string;
  version?: number;
  patientId: string;
  scheduledFor: string;
  dueAt?: string;
}

export const promsApi = {
  createTemplate: async (payload: CreatePromTemplateRequest) => {
    return await apiClient.post<PromTemplateDetail>(
      "/api/v1/proms/templates",
      payload,
    );
  },
  getTemplate: async (key: string, version?: number) => {
    const path = version
      ? `/api/v1/proms/templates/${key}/${version}`
      : `/api/v1/proms/templates/${key}`;
    return await apiClient.get<PromTemplateDetail>(path);
  },
  listTemplates: async (page = 1, pageSize = 20) => {
    return await apiClient.get<PromTemplateSummary[]>(
      "/api/v1/proms/templates",
      { page, pageSize },
    );
  },
  schedule: async (payload: SchedulePromPayload) => {
    return await apiClient.post("/api/v1/proms/schedule", payload);
  },
  submitAnswers: async (
    instanceId: string,
    answers: Record<string, unknown>,
  ) => {
    return await apiClient.post<{ score: number; completedAt: string }>(
      `/api/v1/proms/instances/${instanceId}/answers`,
      answers,
    );
  },
  getInstance: async (id: string) => {
    return await apiClient.get(`/api/v1/proms/instances/${id}`);
  },
};
