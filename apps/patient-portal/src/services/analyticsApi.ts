import apiClient from '../lib/api-client';
import {
  ApiEnvelope,
  HealthGoal,
  HealthMetric,
  MetricCorrelation,
  PromAnalyticsSummary,
} from '../types';

type EnvelopeOrValue<T> = ApiEnvelope<T> | T;

function unwrapEnvelope<T>(payload: EnvelopeOrValue<T>): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export async function fetchHealthMetrics(timeRange: string): Promise<HealthMetric[]> {
  const response = await apiClient.get<EnvelopeOrValue<HealthMetric[]>>(
    '/api/Analytics/health-metrics',
    { timeRange },
  );
  return unwrapEnvelope(response);
}

export async function fetchPromAnalytics(timeRange: string): Promise<PromAnalyticsSummary[]> {
  const response = await apiClient.get<EnvelopeOrValue<PromAnalyticsSummary[]>>(
    '/api/Analytics/prom-analytics',
    { timeRange },
  );
  return unwrapEnvelope(response);
}

export async function fetchHealthGoals(): Promise<HealthGoal[]> {
  const response = await apiClient.get<EnvelopeOrValue<HealthGoal[]>>(
    '/api/Analytics/health-goals',
  );
  return unwrapEnvelope(response);
}

export async function fetchMetricCorrelations(): Promise<MetricCorrelation[]> {
  const response = await apiClient.get<EnvelopeOrValue<MetricCorrelation[]>>(
    '/api/Analytics/correlations',
  );
  return unwrapEnvelope(response);
}
