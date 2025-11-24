import { useQuery } from "@tanstack/react-query";
import patientAnalyticsApi from "../../../services/patientAnalyticsApi";
import type {
  HealthGoal,
  HealthMetric,
  MetricCorrelation,
  PromAnalyticsSummary,
} from "../../../types";

type AnalyticsData = {
  healthMetrics: HealthMetric[];
  promAnalytics: PromAnalyticsSummary[];
  healthGoals: HealthGoal[];
  correlations: MetricCorrelation[];
  loading: boolean;
};

export function useAnalyticsDashboardData(
  _timeRange: string = "30days",
): AnalyticsData {
  const { isLoading } = useQuery({
    queryKey: ["patientDashboard"],
    queryFn: patientAnalyticsApi.getDashboard,
  });

  // Map dashboard data to legacy format for now
  const healthMetrics: HealthMetric[] = [];
  const promAnalytics: PromAnalyticsSummary[] = [];
  const healthGoals: HealthGoal[] = [];
  const correlations: MetricCorrelation[] = [];

  return {
    healthMetrics,
    promAnalytics,
    healthGoals,
    correlations,
    loading: isLoading,
  };
}
