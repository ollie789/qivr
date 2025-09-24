import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api-client', () => {
  const mock = {
    get: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

import apiClient from '../../lib/api-client';
import {
  fetchHealthMetrics,
  fetchPromAnalytics,
  fetchHealthGoals,
  fetchMetricCorrelations,
} from '../analyticsApi';
import type {
  HealthGoal,
  HealthMetric,
  MetricCorrelation,
  PromAnalyticsSummary,
} from '../../types';

const mockClient = vi.mocked(apiClient);

describe('analyticsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchHealthMetrics forwards timeRange and unwraps envelope', async () => {
    const metrics: HealthMetric[] = [{
      id: 'metric-1',
      category: 'vitals',
      name: 'Blood Pressure',
      value: 120,
      unit: 'mmHg',
      date: '2024-01-01',
      trend: 'down',
      percentageChange: 5,
      status: 'good',
    }];
    mockClient.get.mockResolvedValueOnce({ data: metrics });

    const result = await fetchHealthMetrics('30days');

    expect(mockClient.get).toHaveBeenCalledWith('/api/Analytics/health-metrics', { timeRange: '30days' });
    expect(result).toEqual(metrics);
  });

  it('fetchPromAnalytics, fetchHealthGoals, fetchMetricCorrelations return plain values', async () => {
    const promAnalytics: PromAnalyticsSummary[] = [{
      templateName: 'PROM A',
      completionRate: 80,
      averageScore: 75,
      trendData: [],
      categoryScores: {},
      responseTime: 12,
    }];
    const goals: HealthGoal[] = [{
      id: 'goal-1',
      title: 'Walk Daily',
      category: 'activity',
      target: 30,
      current: 20,
      unit: 'minutes',
      deadline: '2024-02-01',
      progress: 66,
      status: 'behind',
    }];
    const correlations: MetricCorrelation[] = [{
      metric1: 'Sleep',
      metric2: 'Mood',
      correlation: 0.7,
      significance: 'high',
    }];

    mockClient.get
      .mockResolvedValueOnce(promAnalytics)
      .mockResolvedValueOnce(goals)
      .mockResolvedValueOnce(correlations);

    expect(await fetchPromAnalytics('30days')).toEqual(promAnalytics);
    expect(await fetchHealthGoals()).toEqual(goals);
    expect(await fetchMetricCorrelations()).toEqual(correlations);

    expect(mockClient.get).toHaveBeenNthCalledWith(1, '/api/Analytics/prom-analytics', { timeRange: '30days' });
    expect(mockClient.get).toHaveBeenNthCalledWith(2, '/api/Analytics/health-goals');
    expect(mockClient.get).toHaveBeenNthCalledWith(3, '/api/Analytics/correlations');
  });
});
