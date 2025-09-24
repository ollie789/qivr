import apiClient from '../lib/api-client';
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
} from '../types';

const PROM_INSTANCE_BASE = '/api/PromInstance';
const PROM_LEGACY_BASE = '/api/v1/proms';

type EnvelopeOrValue<T> = ApiEnvelope<T> | T;

function unwrapEnvelope<T>(payload: EnvelopeOrValue<T>): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    const { data } = payload as ApiEnvelope<T>;
    return data;
  }
  return payload as T;
}

export async function fetchPromInstances(status?: PromInstanceStatus): Promise<PromInstance[]> {
  const params = status ? { status } : undefined;
  const response = await apiClient.get<EnvelopeOrValue<PromInstance[]>>(PROM_INSTANCE_BASE, params);
  return unwrapEnvelope(response);
}

export async function fetchPromHistory(): Promise<PromHistoryEntry[]> {
  const response = await apiClient.get<EnvelopeOrValue<PromHistoryEntry[]>>(PROM_INSTANCE_BASE, {
    status: 'completed',
  });
  return unwrapEnvelope(response);
}

export async function fetchPromStats(): Promise<PromStats> {
  const response = await apiClient.get<EnvelopeOrValue<PromStats>>(`${PROM_INSTANCE_BASE}/stats`);
  return unwrapEnvelope(response);
}

export async function submitPromResponse(
  instanceId: string,
  responses: Record<string, PromAnswerValue>,
  timeSpentSeconds: number,
): Promise<PromInstance> {
  const payload = {
    answers: Object.entries(responses).map(([questionId, value]) => ({ questionId, value })),
    completionSeconds: timeSpentSeconds,
  };

  const response = await apiClient.post<EnvelopeOrValue<PromInstance>>(
    `${PROM_INSTANCE_BASE}/${instanceId}/submit`,
    payload,
  );
  return unwrapEnvelope(response);
}

export async function savePromDraft(
  instanceId: string,
  draft: PromDraftPayload,
): Promise<void> {
  await apiClient.post(`${PROM_INSTANCE_BASE}/${instanceId}/draft`, draft);
}

export async function fetchPromInstance(instanceId: string): Promise<PromInstance> {
  const response = await apiClient.get<PromInstance>(
    `${PROM_LEGACY_BASE}/instances/${instanceId}`,
  );
  return response;
}

export async function fetchPromTemplate(templateId: string): Promise<PromTemplate> {
  const response = await apiClient.get<PromTemplate>(
    `${PROM_LEGACY_BASE}/templates/by-id/${templateId}`,
  );
  return response;
}

export async function submitPromAnswers(
  instanceId: string,
  answers: Record<string, PromAnswerValue>,
): Promise<void> {
  await apiClient.post(`${PROM_LEGACY_BASE}/instances/${instanceId}/answers`, answers);
}

export type { PromScoringMethod };
