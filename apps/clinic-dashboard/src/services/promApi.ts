import apiClient from '../lib/api-client';
import { PromInstanceDto } from "./promInstanceApi";

export interface PromTemplateQuestion {
  id: string;
  text: string;
  type:
    | "text"
    | "number"
    | "scale"
    | "multiple-choice"
    | "checkbox"
    | "date"
    | "time"
    | "radio";
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  conditionalLogic?: Record<string, unknown>;
  scoring?: Record<string, unknown>;
  order?: number;
  [key: string]: unknown;
}

export interface PromTemplateSummary {
  id: string;
  key: string;
  version: number;
  name: string;
  description?: string;
  category?: string;
  frequency?: string;
  isActive?: boolean;
  createdAt: string;
}

export interface PromTemplateDetail extends PromTemplateSummary {
  questions: PromTemplateQuestion[];
  scoringMethod?: Record<string, unknown>;
  scoringRules?: Record<string, unknown>;
  isActive: boolean;
}

export interface CreatePromTemplateRequest {
  key: string;
  name: string;
  description?: string;
  category: string;
  frequency: string;
  questions: PromTemplateQuestion[];
  scoringMethod?: Record<string, unknown>;
  scoringRules?: Record<string, unknown>;
  isActive?: boolean;
  version?: number;
}

// Type for PROM answer values
export type PromAnswerValue = string | number | boolean | string[] | Date | null;

export interface PromResponse {
  id: string;
  templateId: string;
  patientId: string;
  patientName: string;
  responses: Record<string, PromAnswerValue>;
  status: "pending" | "in-progress" | "completed" | "expired" | "cancelled";
  startedAt?: string;
  completedAt?: string;
  score?: number;
  notes?: string;
}

class PromApi {
  async getTemplates(params?: {
    category?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PromTemplateSummary[]> {
    return await apiClient.get<PromTemplateSummary[]>(
      "/api/v1/proms/templates",
      params,
    );
  }

  async getTemplate(id: string): Promise<PromTemplateDetail> {
    return await apiClient.get<PromTemplateDetail>(
      `/api/v1/proms/templates/by-id/${id}`,
    );
  }

  async createTemplate(
    data: CreatePromTemplateRequest,
  ): Promise<PromTemplateDetail> {
    return await apiClient.post<PromTemplateDetail>(
      "/api/v1/proms/templates",
      data,
    );
  }

  async updateTemplate(id: string, data: Partial<PromTemplateDetail>) {
    return await apiClient.put<PromTemplateDetail>(
      `/api/v1/proms/templates/by-id/${id}`,
      data,
    );
  }

  async deleteTemplate(id: string) {
    return await apiClient.delete<void>(`/api/v1/proms/templates/by-id/${id}`);
  }

  async sendProm(data: {
    templateKey: string;
    version?: number;
    patientId: string;
    scheduledFor: string;
    dueAt?: string;
  }) {
    return await apiClient.post("/api/v1/proms/schedule", data);
  }

  async getResponses(params?: {
    templateId?: string;
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.templateId) queryParams.append("templateId", params.templateId);
    if (params?.patientId) queryParams.append("patientId", params.patientId);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = `/api/PromInstance${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const instances = await apiClient.get<PromInstanceDto[]>(url);

    const mapped = instances.map((instance) => {
      const rawStatus = (instance.status || "").toLowerCase();
      const normalizedStatus: PromResponse["status"] =
        rawStatus === "completed"
          ? "completed"
          : rawStatus === "in-progress"
            ? "in-progress"
            : rawStatus === "inprogress"
              ? "in-progress"
              : rawStatus === "expired"
                ? "expired"
                : rawStatus === "cancelled"
                  ? "cancelled"
                  : "pending";

      return {
        id: instance.id,
        templateId: instance.templateId,
        patientId: instance.patientId,
        patientName: instance.patientName,
        responses: instance.answers ?? {},
        status: normalizedStatus,
        startedAt: instance.createdAt,
        completedAt: instance.completedAt,
        score: instance.totalScore ? Number(instance.totalScore) : undefined,
        notes: instance.notes,
      } as PromResponse;
    });

    const limit = params?.limit ?? mapped.length;
    const page = params?.page ?? 1;
    const start = (page - 1) * limit;
    const data = mapped.slice(start, start + limit);

    return {
      data,
      total: mapped.length,
    };
  }

  async getResponse(id: string) {
    return await apiClient.get(`/api/v1/proms/instances/${id}`);
  }

  async submitResponse(id: string, responses: Record<string, PromAnswerValue>) {
    return await apiClient.post(
      `/api/v1/proms/instances/${id}/answers`,
      responses,
    );
  }

  async getAnalytics(
    templateId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    },
  ) {
    return await apiClient.get(
      `/api/v1/proms/templates/by-id/${templateId}`,
      params,
    );
  }
}

export const promApi = new PromApi();
