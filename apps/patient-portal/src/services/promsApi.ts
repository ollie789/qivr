import apiClient from "../lib/api-client";
import {
  ApiEnvelope,
  PromAnswerValue,
  PromDraftPayload,
  PromHistoryEntry,
  PromInstance,
  PromInstanceStatus,
  PromScoringMethod,
  PromStats,
  PromTemplate,
} from "../types";

const PROM_API_BASE = "/api/proms";

type EnvelopeOrValue<T> = ApiEnvelope<T> | T;

function unwrapEnvelope<T>(payload: EnvelopeOrValue<T>): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as ApiEnvelope<T>)
  ) {
    const { data } = payload as ApiEnvelope<T>;
    return data;
  }
  return payload as T;
}

interface ApiPromInstance {
  id: string;
  templateId: string;
  templateName: string;
  status: string;
  createdAt: string;
  scheduledAt: string;
  dueDate: string;
  completedAt?: string;
  totalScore?: number;
  questionCount?: number;
  answeredCount?: number;
  answers?: Record<string, unknown> | null;
}

const MAX_SCORE_PER_QUESTION = 3;

const normalizeStatus = (status: string): PromInstanceStatus => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "inprogress":
    case "in-progress":
      return "in-progress";
    case "completed":
      return "completed";
    case "expired":
      return "expired";
    case "cancelled":
    case "canceled":
      return "cancelled";
    default:
      return "pending";
  }
};

const mapPromInstance = (dto: ApiPromInstance): PromInstance => {
  const status = normalizeStatus(dto.status);
  const totalScore =
    typeof dto.totalScore === "number" ? dto.totalScore : undefined;
  const questionCount =
    typeof dto.questionCount === "number" ? dto.questionCount : undefined;

  return {
    id: dto.id,
    templateId: dto.templateId,
    templateName: dto.templateName,
    status,
    assignedDate: dto.createdAt,
    scheduledFor: dto.scheduledAt,
    dueDate: dto.dueDate,
    completedDate: dto.completedAt,
    score: totalScore,
    totalScore,
    questionCount,
    answeredCount: dto.answeredCount,
    responses: dto.answers as Record<string, PromAnswerValue> | undefined,
  };
};

const toHistoryEntry = (instance: PromInstance): PromHistoryEntry => {
  const score = instance.totalScore ?? instance.score ?? 0;
  const maxScore =
    instance.questionCount && instance.questionCount > 0
      ? instance.questionCount * MAX_SCORE_PER_QUESTION
      : score > 0
        ? score
        : 0;
  const percentageScore = maxScore > 0 ? (Number(score) / maxScore) * 100 : 0;

  const completedDate =
    instance.completedDate ??
    instance.dueDate ??
    instance.scheduledFor ??
    instance.assignedDate;

  return {
    id: instance.id,
    templateName: instance.templateName,
    completedDate: completedDate ?? new Date().toISOString(),
    score: Number(score),
    maxScore,
    percentageScore,
    trend: "stable",
  };
};

const calculateStats = (instances: PromInstance[]): PromStats => {
  const totalAssigned = instances.length;
  const completed = instances.filter((i) => i.status === "completed");
  const pending = instances.filter(
    (i) => i.status === "pending" || i.status === "in-progress",
  );

  const completionRate =
    totalAssigned === 0 ? 0 : (completed.length / totalAssigned) * 100;

  const percentageScores = completed.map((instance) => {
    const score = instance.totalScore ?? instance.score ?? 0;
    const maxScore =
      instance.questionCount && instance.questionCount > 0
        ? instance.questionCount * MAX_SCORE_PER_QUESTION
        : score > 0
          ? score
          : 0;
    return maxScore > 0 ? (Number(score) / maxScore) * 100 : 0;
  });

  const averageScore =
    percentageScores.length > 0
      ? percentageScores.reduce((total, value) => total + value, 0) /
        percentageScores.length
      : 0;

  const sortedCompletedDates = completed
    .map((instance) => instance.completedDate)
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  if (sortedCompletedDates.length > 0) {
    streak = 1;
    const firstDate = sortedCompletedDates[0];
    let previous = firstDate ? new Date(firstDate).setHours(0, 0, 0, 0) : 0;

    for (let index = 1; index < sortedCompletedDates.length; index += 1) {
      const currentDateStr = sortedCompletedDates[index];
      const current = currentDateStr
        ? new Date(currentDateStr).setHours(0, 0, 0, 0)
        : 0;
      const difference = (previous - current) / (24 * 60 * 60 * 1000);
      if (difference === 1) {
        streak += 1;
        previous = current;
      } else {
        break;
      }
    }
  }

  const nextDue = pending
    .map((instance) => instance.dueDate)
    .filter((date): date is string => Boolean(date))
    .sort()[0];

  const lastCompleted = sortedCompletedDates[0];

  return {
    totalAssigned,
    completed: completed.length,
    pending: pending.length,
    averageScore,
    completionRate,
    streak,
    lastCompleted,
    nextDue,
  };
};

export async function fetchPromInstances(
  status?: PromInstanceStatus,
): Promise<PromInstance[]> {
  const params = status ? { status } : undefined;
  const response = await apiClient.get<EnvelopeOrValue<ApiPromInstance[]>>(
    `${PROM_API_BASE}/instances`,
    params,
  );
  const unwrapped = unwrapEnvelope(response);
  return unwrapped.map(mapPromInstance);
}

export async function fetchPromHistory(): Promise<PromHistoryEntry[]> {
  const response = await apiClient.get<EnvelopeOrValue<ApiPromInstance[]>>(
    `${PROM_API_BASE}/instances`,
    { status: "completed" },
  );
  return unwrapEnvelope(response).map(mapPromInstance).map(toHistoryEntry);
}

export async function fetchPromStats(): Promise<PromStats> {
  const response = await apiClient.get<EnvelopeOrValue<ApiPromInstance[]>>(
    `${PROM_API_BASE}/instances`,
  );
  const instances = unwrapEnvelope(response).map(mapPromInstance);
  return calculateStats(instances);
}

export async function submitPromResponse(
  instanceId: string,
  responses: Record<string, PromAnswerValue>,
  timeSpentSeconds: number,
): Promise<void> {
  const payload = {
    answers: Object.entries(responses).map(([questionId, value]) => ({
      questionId,
      value,
    })),
    completionSeconds: timeSpentSeconds,
  };

  await apiClient.post(
    `${PROM_API_BASE}/instances/${instanceId}/answers`,
    payload,
  );
}

export async function savePromDraft(
  instanceId: string,
  draft: PromDraftPayload,
): Promise<void> {
  await apiClient.put(`${PROM_API_BASE}/instances/${instanceId}/draft`, draft);
}

export async function fetchPromInstance(
  instanceId: string,
): Promise<PromInstance> {
  const response = await apiClient.get<ApiPromInstance>(
    `${PROM_API_BASE}/instances/${instanceId}`,
  );
  return mapPromInstance(response);
}

export async function fetchPromTemplate(
  templateId: string,
): Promise<PromTemplate> {
  const response = await apiClient.get<PromTemplate>(
    `${PROM_API_BASE}/templates/by-id/${templateId}`,
  );
  return response;
}

export async function submitPromAnswers(
  instanceId: string,
  answers: Record<string, PromAnswerValue>,
): Promise<{ score: number; completedAt: string }> {
  const response = await apiClient.post<{ score: number; completedAt: string }>(
    `${PROM_API_BASE}/instances/${instanceId}/answers`,
    answers,
  );
  return response;
}

// Treatment Progress Feedback Types
export interface TreatmentExercise {
  id: string;
  name: string;
  description?: string;
}

export interface TreatmentProgressContext {
  treatmentPlanId: string;
  treatmentPlanName: string;
  currentPhase: number;
  totalPhases: number;
  exercises: TreatmentExercise[];
  startedAt: string;
  weeksInTreatment: number;
}

export interface SubmitTreatmentProgressRequest {
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
}

export async function fetchTreatmentContext(
  instanceId: string,
): Promise<TreatmentProgressContext | null> {
  try {
    const response = await apiClient.get<TreatmentProgressContext>(
      `${PROM_API_BASE}/instances/${instanceId}/treatment-context`,
    );
    return response;
  } catch {
    // No treatment context available
    return null;
  }
}

export async function submitTreatmentProgress(
  instanceId: string,
  request: SubmitTreatmentProgressRequest,
): Promise<void> {
  await apiClient.post(
    `${PROM_API_BASE}/instances/${instanceId}/treatment-progress`,
    request,
  );
}

export type { PromScoringMethod };
