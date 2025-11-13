import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../lib/api-client", () => {
  const mock = {
    get: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

import apiClient from "../../lib/api-client";
import {
  fetchHealthMetrics,
  fetchPromAnalytics,
  fetchHealthGoals,
  fetchMetricCorrelations,
} from "../analyticsApi";

const mockClient = vi.mocked(apiClient);

describe("analyticsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchHealthMetrics forwards timeRange and maps values", async () => {
    mockClient.get.mockResolvedValueOnce({
      data: [
        {
          Id: "metric-1",
          Category: "vitals",
          Name: "Blood Pressure",
          Value: 120,
          Unit: "mmHg",
          Date: "2024-01-01T00:00:00Z",
          Trend: "down",
          PercentageChange: 5,
          Status: "good",
          Target: 110,
        },
      ],
    });

    const result = await fetchHealthMetrics("30days");

    expect(mockClient.get).toHaveBeenCalledWith(
      "/api/analytics/health-metrics",
      { timeRange: "30days" },
    );
    expect(result).toEqual([
      {
        id: "metric-1",
        category: "vitals",
        name: "Blood Pressure",
        value: 120,
        unit: "mmHg",
        date: expect.any(String),
        trend: "down",
        percentageChange: 5,
        status: "good",
        target: 110,
      },
    ]);
  });

  it("fetchPromAnalytics, fetchHealthGoals, fetchMetricCorrelations map responses", async () => {
    mockClient.get
      .mockResolvedValueOnce({
        data: [
          {
            TemplateName: "PROM A",
            CompletionRate: 80,
            AverageScore: 75,
            TrendData: [{ Date: "2024-01-01", Score: 70 }],
            CategoryScores: { mobility: 60 },
            ResponseTime: 12,
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            Id: "goal-1",
            Title: "Walk Daily",
            Category: "activity",
            Target: 30,
            Current: 20,
            Unit: "minutes",
            Deadline: "2024-02-01",
            Progress: 66,
            Status: "behind",
          },
        ],
      })
      .mockResolvedValueOnce({
        data: [
          {
            Metric1: "Sleep",
            Metric2: "Mood",
            Correlation: 0.7,
            Significance: "high",
          },
        ],
      });

    expect(await fetchPromAnalytics("30days")).toEqual([
      {
        templateName: "PROM A",
        completionRate: 80,
        averageScore: 75,
        trendData: [{ date: expect.any(String), score: 70 }],
        categoryScores: { mobility: 60 },
        responseTime: 12,
      },
    ]);
    expect(await fetchHealthGoals()).toEqual([
      {
        id: "goal-1",
        title: "Walk Daily",
        category: "activity",
        target: 30,
        current: 20,
        unit: "minutes",
        deadline: expect.any(String),
        progress: 66,
        status: "behind",
      },
    ]);
    expect(await fetchMetricCorrelations()).toEqual([
      {
        metric1: "Sleep",
        metric2: "Mood",
        correlation: 0.7,
        significance: "high",
      },
    ]);

    expect(mockClient.get).toHaveBeenNthCalledWith(
      1,
      "/api/analytics/prom-analytics",
      { timeRange: "30days" },
    );
    expect(mockClient.get).toHaveBeenNthCalledWith(
      2,
      "/api/analytics/health-goals",
    );
    expect(mockClient.get).toHaveBeenNthCalledWith(
      3,
      "/api/analytics/correlations",
    );
  });
});
