import { useQuery } from '@tanstack/react-query';
import {
  fetchHealthGoals,
  fetchHealthMetrics,
  fetchMetricCorrelations,
  fetchPromAnalytics,
} from '../../../services/analyticsApi';
import type {
  HealthGoal,
  HealthMetric,
  MetricCorrelation,
  PromAnalyticsSummary,
} from '../../../types';

type AnalyticsData = {
  healthMetrics: HealthMetric[];
  promAnalytics: PromAnalyticsSummary[];
  healthGoals: HealthGoal[];
  correlations: MetricCorrelation[];
  loading: boolean;
};

export function useAnalyticsDashboardData(timeRange: string = '30days'): AnalyticsData {
  const { data: healthMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: ['healthMetrics', timeRange],
    queryFn: () => fetchHealthMetrics(timeRange),
  });

  const { data: promAnalytics = [], isLoading: promLoading } = useQuery({
    queryKey: ['promAnalytics', timeRange],
    queryFn: () => fetchPromAnalytics(timeRange),
  });

  const { data: healthGoals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['healthGoals'],
    queryFn: fetchHealthGoals,
  });

  const { data: correlations = [], isLoading: corrLoading } = useQuery({
    queryKey: ['correlations'],
    queryFn: fetchMetricCorrelations,
  });

  return {
    healthMetrics,
    promAnalytics,
    healthGoals,
    correlations,
    loading: metricsLoading || promLoading || goalsLoading || corrLoading,
  };
}
