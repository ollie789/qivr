import apiClient from '../lib/api-client';

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
  templateName: string;
  patientId: string;
  patientName: string;
  responses: Record<string, PromAnswerValue>;
  status: "pending" | "in-progress" | "completed" | "expired" | "cancelled";
  assignedAt?: string;
  scheduledAt?: string;
  dueDate?: string;
  completedAt?: string;
  score?: number;
  notes?: string;
  questionCount?: number;
  answeredCount?: number;
  notificationMethod?: string;
  reminderCount?: number;
  rawScore?: number;
  maxScore?: number;
}

export interface PromResponsesStats {
  total: number;
  completedCount: number;
  pendingCount: number;
  inProgressCount: number;
  expiredCount: number;
  cancelledCount: number;
  completionRate: number;
  averageScore: number;
  nextDue?: string;
  lastCompleted?: string;
  streak: number;
}

export interface PromResponsesResult {
  data: PromResponse[];
  total: number;
  stats: PromResponsesStats;
}

interface ApiPromInstance {
  id: string;
  templateId: string;
  templateName: string;
  patientId: string;
  patientName: string;
  status: string;
  createdAt: string;
  scheduledAt: string;
  dueDate: string;
  completedAt?: string;
  totalScore?: number;
  questionCount?: number;
  answeredCount?: number;
  notificationMethod?: string;
  reminderCount?: number;
  tags?: string[];
  notes?: string;
  answers?: Record<string, unknown> | null;
}

interface ApiPromResponsesStats {
  total: number;
  completedCount: number;
  pendingCount: number;
  inProgressCount: number;
  expiredCount: number;
  cancelledCount: number;
  completionRate: number;
  averageScore: number;
  nextDue?: string;
  lastCompleted?: string;
  streak: number;
}

interface ApiPromResponsesResponse {
  data: ApiPromInstance[];
  total: number;
  stats?: ApiPromResponsesStats;
}

const MAX_SCORE_PER_QUESTION = 3;

const normalizeStatus = (status: string | undefined) => {
  if (!status) return 'pending' as const;
  const normalized = status.toLowerCase();
  switch (normalized) {
    case 'inprogress':
    case 'in-progress':
      return 'in-progress' as const;
    case 'completed':
      return 'completed' as const;
    case 'expired':
      return 'expired' as const;
    case 'cancelled':
    case 'canceled':
      return 'cancelled' as const;
    default:
      return 'pending' as const;
  }
};

const mapPromInstance = (item: ApiPromInstance): PromResponse => {
  const questionCount = item.questionCount ?? 0;
  const rawScore = typeof item.totalScore === 'number' ? Number(item.totalScore) : undefined;
  const maxScore = questionCount > 0 ? questionCount * MAX_SCORE_PER_QUESTION : undefined;
  const percentageScore = maxScore && rawScore !== undefined && maxScore > 0
    ? (rawScore / maxScore) * 100
    : undefined;

  return {
    id: item.id,
    templateId: item.templateId,
    templateName: item.templateName,
    patientId: item.patientId,
    patientName: item.patientName,
    responses: (item.answers as Record<string, PromAnswerValue>) ?? {},
    status: normalizeStatus(item.status),
    assignedAt: item.createdAt,
    scheduledAt: item.scheduledAt,
    dueDate: item.dueDate,
    completedAt: item.completedAt,
    score: percentageScore,
    rawScore,
    maxScore,
    notes: item.notes ?? undefined,
    questionCount,
    answeredCount: item.answeredCount,
    notificationMethod: item.notificationMethod,
    reminderCount: item.reminderCount,
  };
};

const calculateStats = (responses: PromResponse[]): PromResponsesStats => {
  const total = responses.length;
  const completed = responses.filter((item) => item.status === 'completed');
  const pending = responses.filter((item) => item.status === 'pending');
  const inProgress = responses.filter((item) => item.status === 'in-progress');
  const expired = responses.filter((item) => item.status === 'expired');
  const cancelled = responses.filter((item) => item.status === 'cancelled');

  const completionRate = total === 0 ? 0 : Math.round((completed.length / total) * 1000) / 10;

  const percentageScores = completed
    .map((item) => {
      if (typeof item.rawScore === 'number' && typeof item.maxScore === 'number' && item.maxScore > 0) {
        return (item.rawScore / item.maxScore) * 100;
      }
      if (typeof item.score === 'number') {
        return item.score;
      }
      return 0;
    })
    .filter((value) => value > 0);

  const averageScore = percentageScores.length > 0
    ? Math.round((percentageScores.reduce((sum, value) => sum + value, 0) / percentageScores.length) * 100) / 100
    : 0;

  const completedDates = completed
    .map((item) => item.completedAt)
    .filter((date): date is string => Boolean(date));

  const sortedCompleted = [...completedDates]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const nextDue = responses
    .filter((item) => item.status === 'pending' || item.status === 'in-progress')
    .map((item) => item.dueDate ?? item.scheduledAt ?? item.assignedAt)
    .filter((date): date is string => Boolean(date))
    .sort()[0];

  const normalizedCompletionDays = Array.from(new Set(
    completedDates.map((date) => new Date(date).setHours(0, 0, 0, 0))
  )).sort((a, b) => b - a);

  let streak = 0;
  if (normalizedCompletionDays.length > 0) {
    streak = 1;
    for (let index = 1; index < normalizedCompletionDays.length; index += 1) {
      const prevDay = normalizedCompletionDays[index - 1];
      const currentDay = normalizedCompletionDays[index];
      if (prevDay && currentDay) {
        const difference = (prevDay - currentDay) / (24 * 60 * 60 * 1000);
        if (difference === 1) {
          streak += 1;
        } else if (difference !== 0) {
          break;
        }
      }
    }
  }

  return {
    total,
    completedCount: completed.length,
    pendingCount: pending.length,
    inProgressCount: inProgress.length,
    expiredCount: expired.length,
    cancelledCount: cancelled.length,
    completionRate,
    averageScore,
    nextDue,
    lastCompleted: sortedCompleted[0],
    streak,
  };
};

const mapApiStats = (
  stats: ApiPromResponsesStats | undefined,
  responses: PromResponse[],
): PromResponsesStats => {
  if (!stats) {
    return calculateStats(responses);
  }

  return {
    total: stats.total,
    completedCount: stats.completedCount,
    pendingCount: stats.pendingCount,
    inProgressCount: stats.inProgressCount,
    expiredCount: stats.expiredCount,
    cancelledCount: stats.cancelledCount,
    completionRate: Math.round(stats.completionRate * 10) / 10,
    averageScore: Math.round(stats.averageScore * 100) / 100,
    nextDue: stats.nextDue,
    lastCompleted: stats.lastCompleted,
    streak: stats.streak,
  };
};

export const enum NotificationMethod {
  None = 0,
  Email = 1,
  Sms = 2,
  InApp = 4,
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
      "/api/proms/templates",
      params,
    );
  }

  async getTemplate(id: string): Promise<PromTemplateDetail> {
    return await apiClient.get<PromTemplateDetail>(
      `/api/proms/templates/by-id/${id}`,
    );
  }

  async createTemplate(
    data: CreatePromTemplateRequest,
  ): Promise<PromTemplateDetail> {
    return await apiClient.post<PromTemplateDetail>(
      "/api/proms/templates",
      data,
    );
  }

  async updateTemplate(id: string, data: Partial<PromTemplateDetail>) {
    return await apiClient.put<PromTemplateDetail>(
      `/api/proms/templates/by-id/${id}`,
      data,
    );
  }

  async deleteTemplate(id: string) {
    return await apiClient.delete<void>(`/api/proms/templates/by-id/${id}`);
  }

  async sendProm(data: {
    templateKey: string;
    version?: number;
    patientId: string;
    scheduledFor?: string;
    dueAt?: string;
    notificationMethod?: NotificationMethod;
    tags?: string[];
    notes?: string;
  }): Promise<PromResponse> {
    const scheduledFor = data.scheduledFor ?? new Date().toISOString();
    const response = await apiClient.post<ApiPromInstance>("/api/proms/schedule", {
      templateKey: data.templateKey,
      version: data.version,
      patientId: data.patientId,
      scheduledFor,
      dueAt: data.dueAt,
      notificationMethod: data.notificationMethod,
      tags: data.tags,
      notes: data.notes,
    });

    return mapPromInstance(response);
  }

  async getResponses(params?: {
    templateId?: string;
    patientId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PromResponsesResult> {
    const queryParams = new URLSearchParams();
    if (params?.templateId) queryParams.append("templateId", params.templateId);
    if (params?.patientId) queryParams.append("patientId", params.patientId);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 25;
    queryParams.append("page", String(page));
    queryParams.append("limit", String(limit));

    const url = `/api/proms/admin/instances${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiClient.get<ApiPromResponsesResponse>(url);
    const mapped = response.data.map(mapPromInstance);

    return {
      data: mapped,
      total: response.total,
      stats: mapApiStats(response.stats, mapped),
    };
  }

  async getResponse(id: string) {
    const dto = await apiClient.get<ApiPromInstance>(`/api/proms/instances/${id}`);
    return mapPromInstance(dto);
  }

  async submitResponse(id: string, responses: Record<string, PromAnswerValue>) {
    return await apiClient.post(
      `/api/proms/instances/${id}/answers`,
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
      `/api/proms/templates/by-id/${templateId}`,
      params,
    );
  }

  async getTreatmentProgressAggregate(
    treatmentPlanId: string,
  ): Promise<TreatmentProgressAggregate | null> {
    try {
      return await apiClient.get<TreatmentProgressAggregate>(
        `/api/proms/treatment-progress/${treatmentPlanId}`,
      );
    } catch {
      return null;
    }
  }

  async getPatientTreatmentProgress(
    patientId: string,
    treatmentPlanId?: string,
  ): Promise<TreatmentProgressFeedback[]> {
    const params = treatmentPlanId ? { treatmentPlanId } : undefined;
    return await apiClient.get<TreatmentProgressFeedback[]>(
      `/api/proms/treatment-progress/patient/${patientId}`,
      params,
    );
  }
}

// Treatment Progress Feedback Types
export interface ExerciseFeedbackSummary {
  exerciseId: string;
  exerciseName: string;
  helpfulCount: number;
  problematicCount: number;
  helpfulPercentage: number;
  problematicPercentage: number;
}

export interface TreatmentProgressAggregate {
  treatmentPlanId: string;
  totalFeedbacks: number;
  averageEffectivenessRating: number | null;
  averagePainChange: number | null;
  exerciseComplianceBreakdown: Record<string, number>;
  averageSessionsPerWeek: number | null;
  exerciseFeedback: ExerciseFeedbackSummary[];
  commonBarriers: Record<string, number>;
  patientsWantingDiscussion: number;
  latestFeedbackDate: string | null;
}

export interface TreatmentProgressFeedback {
  id: string;
  promInstanceId: string;
  treatmentPlanId: string;
  patientId: string;
  overallEffectivenessRating?: number;
  painComparedToStart?: number;
  exerciseCompliance?: string;
  sessionsCompletedThisWeek?: number;
  helpfulExerciseIds?: string[];
  problematicExerciseIds?: string[];
  exerciseComments?: string;
  barriers?: string[];
  suggestions?: string;
  wantsClinicianDiscussion?: boolean;
  currentPhaseNumber?: number;
  submittedAt: string;
}

// === PROM Analytics Types ===

export interface ScoreTrendPoint {
  date: string;
  value: number;
  interpretationBand?: string;
  context?: string;
  instanceId: string;
}

export interface PatientScoreTrend {
  patientId: string;
  patientName: string;
  instrumentKey: string;
  scoreKey: string;
  dataPoints: ScoreTrendPoint[];
  overallChange?: number;
  achievedMCID?: boolean;
}

export interface ScoreAggregation {
  groupKey: string;
  groupLabel?: string;
  count: number;
  average?: number;
  median?: number;
  min?: number;
  max?: number;
  standardDeviation?: number;
  bandDistribution?: Record<string, number>;
}

export interface ResponseOptionCount {
  value: string;
  displayLabel?: string;
  count: number;
  percentage: number;
}

export interface ItemResponseDistribution {
  questionCode: string;
  questionLabel?: string;
  totalResponses: number;
  distribution: ResponseOptionCount[];
}

export interface PromSummaryScore {
  id: string;
  instanceId: string;
  definitionId?: string;
  scoreKey: string;
  label?: string;
  value: number;
  rawValue?: number;
  rangeMin?: number;
  rangeMax?: number;
  higherIsBetter?: boolean;
  interpretationBand?: string;
  severity?: string;
  itemCount?: number;
  missingItemCount?: number;
  hasFloorEffect: boolean;
  hasCeilingEffect: boolean;
  createdAt: string;
}

export interface PromInstanceScoreSummary {
  instanceId: string;
  templateId: string;
  templateKey: string;
  templateName: string;
  completedAt?: string;
  primaryScore?: PromSummaryScore;
  allScores: PromSummaryScore[];
}

export interface PromItemResponse {
  id: string;
  instanceId: string;
  templateQuestionId: string;
  questionCode?: string;
  questionLabel?: string;
  valueRaw?: string;
  valueNumeric?: number;
  valueDisplay?: string;
  multiSelectValues?: string[];
  isSkipped: boolean;
  responseTimeSeconds?: number;
  createdAt: string;
}

export interface PromAnalyticsQuery {
  templateId?: string;
  instrumentKey?: string;
  scoreKey?: string;
  questionCode?: string;
  patientId?: string;
  providerId?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month" | "quarter" | "year";
}

export const promApi = new PromApi();

// Add analytics methods to PromApi class - extend above
Object.assign(PromApi.prototype, {
  async getPatientScoreTrend(
    patientId: string,
    instrumentKey: string,
    scoreKey?: string,
  ): Promise<PatientScoreTrend> {
    return await apiClient.get<PatientScoreTrend>(
      `/api/proms/analytics/patient/${patientId}/trend`,
      { instrumentKey, scoreKey },
    );
  },

  async getScoreAggregations(
    query: PromAnalyticsQuery,
  ): Promise<ScoreAggregation[]> {
    return await apiClient.post<ScoreAggregation[]>(
      "/api/proms/analytics/scores/aggregate",
      query,
    );
  },

  async getItemDistribution(
    questionCode: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ItemResponseDistribution> {
    return await apiClient.get<ItemResponseDistribution>(
      `/api/proms/analytics/items/${questionCode}/distribution`,
      { startDate, endDate },
    );
  },

  async getInstanceScores(
    instanceId: string,
  ): Promise<PromInstanceScoreSummary> {
    return await apiClient.get<PromInstanceScoreSummary>(
      `/api/proms/instances/${instanceId}/scores`,
    );
  },

  async getInstanceItemResponses(
    instanceId: string,
  ): Promise<PromItemResponse[]> {
    return await apiClient.get<PromItemResponse[]>(
      `/api/proms/instances/${instanceId}/item-responses`,
    );
  },
});

// Extend interface for TypeScript
declare module "./promApi" {
  interface PromApi {
    getPatientScoreTrend(
      patientId: string,
      instrumentKey: string,
      scoreKey?: string,
    ): Promise<PatientScoreTrend>;
    getScoreAggregations(query: PromAnalyticsQuery): Promise<ScoreAggregation[]>;
    getItemDistribution(
      questionCode: string,
      startDate?: string,
      endDate?: string,
    ): Promise<ItemResponseDistribution>;
    getInstanceScores(instanceId: string): Promise<PromInstanceScoreSummary>;
    getInstanceItemResponses(instanceId: string): Promise<PromItemResponse[]>;
  }
}
