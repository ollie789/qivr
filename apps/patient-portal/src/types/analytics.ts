export type TrendDirection = 'up' | 'down' | 'stable';
export type MetricStatus = 'good' | 'warning' | 'critical';

export interface HealthMetric {
  id: string;
  category: string;
  name: string;
  value: number;
  unit: string;
  date: string;
  trend: TrendDirection;
  percentageChange: number;
  status: MetricStatus;
  target?: number;
}

export interface PromAnalyticsSummary {
  templateName: string;
  completionRate: number;
  averageScore: number;
  trendData: Array<{ date: string; score: number }>;
  categoryScores: Record<string, number>;
  responseTime: number;
}

export type HealthGoalStatus = 'on-track' | 'behind' | 'achieved';

export interface HealthGoal {
  id: string;
  title: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  progress: number;
  status: HealthGoalStatus;
}

export type CorrelationSignificance = 'high' | 'medium' | 'low';

export interface MetricCorrelation {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: CorrelationSignificance;
}
