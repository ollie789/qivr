import { useMemo } from "react";
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

const parseTimeRange = (timeRange: string): { from: Date; to: Date } => {
  const to = new Date();
  const from = new Date();
  switch (timeRange) {
    case "7days":
      from.setDate(from.getDate() - 7);
      break;
    case "90days":
      from.setDate(from.getDate() - 90);
      break;
    case "1year":
      from.setFullYear(from.getFullYear() - 1);
      break;
    case "30days":
    default:
      from.setDate(from.getDate() - 30);
      break;
  }
  return { from, to };
};

export function useAnalyticsDashboardData(
  timeRange: string = "30days",
): AnalyticsData {
  const { from, to } = useMemo(() => parseTimeRange(timeRange), [timeRange]);

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["patientDashboard"],
    queryFn: patientAnalyticsApi.getDashboard,
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["patientProgress", timeRange],
    queryFn: () => patientAnalyticsApi.getProgress(from, to),
  });

  const isLoading = dashboardLoading || progressLoading;

  // Map patient dashboard data to health metrics format
  const healthMetrics: HealthMetric[] = useMemo(() => {
    if (!dashboardData) return [];

    const metrics: HealthMetric[] = [];
    const today = new Date().toISOString();

    // PROM Score metric
    metrics.push({
      id: "prom-score",
      category: "PROM",
      name: "Current PROM Score",
      value: dashboardData.currentPromScore,
      unit: "pts",
      date: today,
      trend: dashboardData.promImprovement > 0 ? "up" : dashboardData.promImprovement < 0 ? "down" : "stable",
      percentageChange: dashboardData.currentPromScore > 0
        ? Math.round((dashboardData.promImprovement / dashboardData.currentPromScore) * 100)
        : 0,
      status: dashboardData.promImprovement >= 0 ? "good" : "warning",
    });

    // Pain Level metric
    metrics.push({
      id: "pain-level",
      category: "Pain",
      name: "Current Pain Level",
      value: dashboardData.currentPainLevel,
      unit: "/10",
      date: today,
      trend: dashboardData.painReduction > 0 ? "down" : dashboardData.painReduction < 0 ? "up" : "stable",
      percentageChange: dashboardData.painReduction,
      status: dashboardData.currentPainLevel <= 3 ? "good" : dashboardData.currentPainLevel <= 6 ? "warning" : "critical",
    });

    // Appointment adherence metric
    const adherenceRate = dashboardData.totalAppointments > 0
      ? Math.round((dashboardData.completedAppointments / dashboardData.totalAppointments) * 100)
      : 0;
    metrics.push({
      id: "adherence",
      category: "Engagement",
      name: "Appointment Adherence",
      value: adherenceRate,
      unit: "%",
      date: today,
      trend: adherenceRate >= 80 ? "up" : "stable",
      percentageChange: 0,
      status: adherenceRate >= 80 ? "good" : adherenceRate >= 50 ? "warning" : "critical",
    });

    // Streak metric
    metrics.push({
      id: "streak",
      category: "Engagement",
      name: "Current Streak",
      value: dashboardData.currentStreak,
      unit: "weeks",
      date: today,
      trend: dashboardData.currentStreak >= dashboardData.longestStreak ? "up" : "stable",
      percentageChange: 0,
      status: dashboardData.currentStreak >= 4 ? "good" : dashboardData.currentStreak >= 2 ? "warning" : "critical",
    });

    return metrics;
  }, [dashboardData]);

  // Map progress data to PROM analytics format
  const promAnalytics: PromAnalyticsSummary[] = useMemo(() => {
    if (!progressData || !dashboardData) return [];

    // Group PROM scores by type
    const promsByType = progressData.promScoreTimeline.reduce((acc, point) => {
      const type = point.type || "General";
      if (!acc[type]) {
        acc[type] = { scores: [], dates: [] };
      }
      acc[type].scores.push(point.score);
      acc[type].dates.push(point.date);
      return acc;
    }, {} as Record<string, { scores: number[]; dates: string[] }>);

    return Object.entries(promsByType).map(([templateName, data]) => {
      const avgScore = data.scores.length > 0
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : 0;

      return {
        templateName,
        completionRate: dashboardData.totalPromCompleted > 0 ? 100 : 0,
        averageScore: Math.round(avgScore),
        trendData: data.scores.map((score, i) => ({
          date: data.dates[i] ?? new Date().toISOString(),
          score,
        })),
        categoryScores: {},
        responseTime: 0,
      };
    });
  }, [progressData, dashboardData]);

  // Create health goals from dashboard data
  const healthGoals: HealthGoal[] = useMemo(() => {
    if (!dashboardData) return [];

    const goals: HealthGoal[] = [];
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 3);

    // Pain reduction goal
    if (dashboardData.currentPainLevel > 0) {
      const targetPain = Math.max(0, dashboardData.currentPainLevel - 3);
      const progress = dashboardData.painReduction > 0
        ? Math.min(100, (dashboardData.painReduction / 3) * 100)
        : 0;
      goals.push({
        id: "pain-reduction",
        title: "Reduce Pain Level",
        category: "Pain Management",
        target: targetPain,
        current: dashboardData.currentPainLevel,
        unit: "/10",
        deadline: deadline.toISOString(),
        progress,
        status: progress >= 100 ? "achieved" : progress >= 50 ? "on-track" : "behind",
      });
    }

    // PROM improvement goal
    if (dashboardData.currentPromScore > 0) {
      const targetScore = dashboardData.currentPromScore + 10;
      const progress = dashboardData.promImprovement > 0
        ? Math.min(100, (dashboardData.promImprovement / 10) * 100)
        : 0;
      goals.push({
        id: "prom-improvement",
        title: "Improve PROM Score",
        category: "Outcomes",
        target: targetScore,
        current: dashboardData.currentPromScore,
        unit: "pts",
        deadline: deadline.toISOString(),
        progress,
        status: progress >= 100 ? "achieved" : progress >= 50 ? "on-track" : "behind",
      });
    }

    // Engagement streak goal
    goals.push({
      id: "streak-goal",
      title: "Maintain 8-Week Streak",
      category: "Engagement",
      target: 8,
      current: dashboardData.currentStreak,
      unit: "weeks",
      deadline: deadline.toISOString(),
      progress: Math.min(100, (dashboardData.currentStreak / 8) * 100),
      status: dashboardData.currentStreak >= 8 ? "achieved" : dashboardData.currentStreak >= 4 ? "on-track" : "behind",
    });

    return goals;
  }, [dashboardData]);

  // Generate correlations from progress data
  const correlations: MetricCorrelation[] = useMemo(() => {
    if (!progressData || progressData.promScoreTimeline.length < 3 || progressData.painIntensityTimeline.length < 3) {
      return [];
    }

    // Simple correlation between pain and PROM (if both have data points)
    // This is a simplified version - actual correlation should come from backend
    const painAvg = progressData.painIntensityTimeline.reduce((a, b) => a + b.intensity, 0) / progressData.painIntensityTimeline.length;
    const promAvg = progressData.promScoreTimeline.reduce((a, b) => a + b.score, 0) / progressData.promScoreTimeline.length;

    // Higher pain often correlates with lower PROM scores (negative correlation)
    const estimatedCorrelation = painAvg > 5 && promAvg < 50 ? -0.7 : painAvg <= 5 && promAvg >= 50 ? -0.4 : -0.5;

    return [
      {
        metric1: "Pain Level",
        metric2: "PROM Score",
        correlation: estimatedCorrelation,
        significance: Math.abs(estimatedCorrelation) > 0.6 ? "high" : Math.abs(estimatedCorrelation) > 0.3 ? "medium" : "low",
      },
    ];
  }, [progressData]);

  return {
    healthMetrics,
    promAnalytics,
    healthGoals,
    correlations,
    loading: isLoading,
  };
}
