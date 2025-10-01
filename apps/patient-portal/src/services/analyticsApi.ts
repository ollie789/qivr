import apiClient from '../lib/api-client';
import {
  ApiEnvelope,
  HealthGoal,
  HealthGoalStatus,
  HealthMetric,
  MetricCorrelation,
  PromAnalyticsSummary,
  TrendDirection,
  MetricStatus,
  CorrelationSignificance,
} from '../types';

type EnvelopeOrValue<T> = ApiEnvelope<T> | T;
type Maybe<T> = T | null | undefined;

const unwrap = <T>(payload: EnvelopeOrValue<T>): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

const toNumber = (value: Maybe<number>): number => (typeof value === 'number' ? Number(value) : 0);
const toString = (value: Maybe<string>, fallback = ''): string =>
  value != null && value !== '' ? String(value) : fallback;
const toIso = (value: Maybe<string>): string => {
  if (!value) {
    return new Date().toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const toTrend = (value: Maybe<string>): TrendDirection => {
  switch ((value ?? '').toLowerCase()) {
    case 'up':
    case 'increase':
    case 'increasing':
      return 'up';
    case 'down':
    case 'decrease':
    case 'decreasing':
      return 'down';
    default:
      return 'stable';
  }
};

const toMetricStatus = (value: Maybe<string>): MetricStatus => {
  switch ((value ?? '').toLowerCase()) {
    case 'good':
    case 'positive':
      return 'good';
    case 'critical':
    case 'bad':
      return 'critical';
    default:
      return 'warning';
  }
};

const toGoalStatus = (value: Maybe<string>): HealthGoalStatus => {
  switch ((value ?? '').toLowerCase()) {
    case 'achieved':
    case 'complete':
      return 'achieved';
    case 'on-track':
    case 'ontrack':
      return 'on-track';
    default:
      return 'behind';
  }
};

const toSignificance = (value: Maybe<string>): CorrelationSignificance => {
  switch ((value ?? '').toLowerCase()) {
    case 'high':
      return 'high';
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
};

const mapHealthMetric = (dto: any): HealthMetric => ({
  id: toString(dto.id ?? dto.Id, crypto.randomUUID()),
  category: toString(dto.category ?? dto.Category, 'general'),
  name: toString(dto.name ?? dto.Name, 'Health Metric'),
  value: typeof dto.value === 'number' ? dto.value : Number(dto.Value ?? 0),
  unit: toString(dto.unit ?? dto.Unit),
  date: toIso(dto.date ?? dto.Date),
  trend: toTrend(dto.trend ?? dto.Trend),
  percentageChange: typeof dto.percentageChange === 'number'
    ? dto.percentageChange
    : Number(dto.PercentageChange ?? 0),
  status: toMetricStatus(dto.status ?? dto.Status),
  target: dto.target ?? dto.Target ?? undefined,
});

const mapPromAnalytics = (dto: any): PromAnalyticsSummary => ({
  templateName: toString(dto.templateName ?? dto.TemplateName, 'PROM'),
  completionRate: typeof dto.completionRate === 'number'
    ? dto.completionRate
    : Number(dto.CompletionRate ?? 0),
  averageScore: typeof dto.averageScore === 'number'
    ? dto.averageScore
    : Number(dto.AverageScore ?? 0),
  trendData: Array.isArray(dto.trendData ?? dto.TrendData)
    ? (dto.trendData ?? dto.TrendData).map((point: any) => ({
        date: toIso(point.date ?? point.Date),
        score: typeof point.score === 'number' ? point.score : Number(point.Score ?? 0),
      }))
    : [],
  categoryScores: typeof dto.categoryScores === 'object' && dto.categoryScores !== null
    ? dto.categoryScores as Record<string, number>
    : typeof dto.CategoryScores === 'object' && dto.CategoryScores !== null
    ? dto.CategoryScores as Record<string, number>
    : {},
  responseTime: typeof dto.responseTime === 'number'
    ? dto.responseTime
    : Number(dto.ResponseTime ?? 0),
});

const mapHealthGoal = (dto: any): HealthGoal => ({
  id: toString(dto.id ?? dto.Id, crypto.randomUUID()),
  title: toString(dto.title ?? dto.Title, 'Health Goal'),
  category: toString(dto.category ?? dto.Category, 'general'),
  target: toNumber(dto.target ?? dto.Target),
  current: toNumber(dto.current ?? dto.Current),
  unit: toString(dto.unit ?? dto.Unit),
  deadline: toIso(dto.deadline ?? dto.Deadline),
  progress: toNumber(dto.progress ?? dto.Progress),
  status: toGoalStatus(dto.status ?? dto.Status),
});

const mapCorrelation = (dto: any): MetricCorrelation => ({
  metric1: toString(dto.metric1 ?? dto.Metric1, 'Metric A'),
  metric2: toString(dto.metric2 ?? dto.Metric2, 'Metric B'),
  correlation: typeof dto.correlation === 'number' ? dto.correlation : Number(dto.Correlation ?? 0),
  significance: toSignificance(dto.significance ?? dto.Significance),
});

export async function fetchHealthMetrics(timeRange: string): Promise<HealthMetric[]> {
  const response = await apiClient.get<EnvelopeOrValue<any[]>>(
    '/api/analytics/health-metrics',
    { timeRange },
  );
  return unwrap(response).map(mapHealthMetric);
}

export async function fetchPromAnalytics(timeRange: string): Promise<PromAnalyticsSummary[]> {
  const response = await apiClient.get<EnvelopeOrValue<any[]>>(
    '/api/analytics/prom-analytics',
    { timeRange },
  );
  return unwrap(response).map(mapPromAnalytics);
}

export async function fetchHealthGoals(): Promise<HealthGoal[]> {
  const response = await apiClient.get<EnvelopeOrValue<any[]>>(
    '/api/analytics/health-goals',
  );
  return unwrap(response).map(mapHealthGoal);
}

export async function fetchMetricCorrelations(): Promise<MetricCorrelation[]> {
  const response = await apiClient.get<EnvelopeOrValue<any[]>>(
    '/api/analytics/correlations',
  );
  return unwrap(response).map(mapCorrelation);
}
