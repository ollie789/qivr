import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api-client', () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

import apiClient from '../../lib/api-client';
import { analyticsApi } from '../analyticsApi';

const mockClient = vi.mocked(apiClient);

describe('analyticsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('fetches dashboard metrics without date', async () => {
      const metrics = {
        todayAppointments: 12,
        completedToday: 8,
        cancelledToday: 1,
        noShowToday: 1,
        completionRate: 66.7,
        pendingIntakes: 3,
        totalPatients: 150,
        newPatientsThisMonth: 12,
        estimatedRevenue: 4500,
        noShowRate: 8.3,
        averageWaitTime: 12,
        staffUtilization: 75,
      };
      mockClient.get.mockResolvedValueOnce(metrics);

      const result = await analyticsApi.getDashboardMetrics();

      expect(mockClient.get).toHaveBeenCalledWith('/api/clinic-analytics/dashboard', undefined);
      expect(result.todayAppointments).toBe(12);
      expect(result.completionRate).toBe(66.7);
      expect(result.staffUtilization).toBe(75);
    });

    it('fetches dashboard metrics for specific date', async () => {
      const date = new Date('2024-03-01T00:00:00Z');
      mockClient.get.mockResolvedValueOnce({
        todayAppointments: 10,
        completedToday: 7,
        cancelledToday: 2,
        noShowToday: 0,
        completionRate: 70,
        pendingIntakes: 2,
        totalPatients: 148,
        newPatientsThisMonth: 10,
        estimatedRevenue: 3800,
        noShowRate: 0,
        averageWaitTime: 10,
        staffUtilization: 80,
      });

      const result = await analyticsApi.getDashboardMetrics(date);

      expect(mockClient.get).toHaveBeenCalledWith('/api/clinic-analytics/dashboard', {
        date: date.toISOString(),
      });
      expect(result.completionRate).toBe(70);
    });
  });

  describe('getClinicalAnalytics', () => {
    it('fetches clinical analytics without date range', async () => {
      const analytics = {
        averagePromScore: 72.5,
        totalEvaluations: 45,
        topConditions: [
          { condition: 'Lower Back Pain', count: 25 },
          { condition: 'Neck Pain', count: 15 },
          { condition: 'Shoulder Pain', count: 12 },
        ],
        averagePainIntensity: 5.2,
        bodyRegionDistribution: [
          { region: 'Lumbar Spine', count: 30, avgIntensity: 6.1 },
          { region: 'Cervical Spine', count: 20, avgIntensity: 4.8 },
        ],
        patientImprovementRate: 68,
        totalPatientsTracked: 120,
      };
      mockClient.get.mockResolvedValueOnce(analytics);

      const result = await analyticsApi.getClinicalAnalytics();

      expect(mockClient.get).toHaveBeenCalledWith('/api/clinic-analytics/clinical', {});
      expect(result.averagePromScore).toBe(72.5);
      expect(result.topConditions).toHaveLength(3);
      expect(result.topConditions[0]?.condition).toBe('Lower Back Pain');
    });

    it('fetches clinical analytics with date range', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-03-31');

      mockClient.get.mockResolvedValueOnce({
        averagePromScore: 75,
        totalEvaluations: 150,
        topConditions: [],
        averagePainIntensity: 4.8,
        bodyRegionDistribution: [],
        patientImprovementRate: 72,
        totalPatientsTracked: 80,
        appointmentTrends: [
          { date: '2024-01-01', scheduled: 20, completed: 18, cancelled: 2 },
          { date: '2024-01-08', scheduled: 22, completed: 20, cancelled: 1 },
        ],
        promCompletionData: [
          { week: '2024-W01', completed: 15, pending: 5, completionRate: 75 },
          { week: '2024-W02', completed: 18, pending: 4, completionRate: 82 },
        ],
        patientSatisfaction: 4.5,
      });

      const result = await analyticsApi.getClinicalAnalytics(from, to);

      expect(mockClient.get).toHaveBeenCalledWith('/api/clinic-analytics/clinical', {
        from: from.toISOString(),
        to: to.toISOString(),
      });
      expect(result.appointmentTrends).toHaveLength(2);
      expect(result.promCompletionData).toHaveLength(2);
      expect(result.patientSatisfaction).toBe(4.5);
    });

    it('handles partial date range (from only)', async () => {
      const from = new Date('2024-02-01');

      mockClient.get.mockResolvedValueOnce({
        averagePromScore: 70,
        totalEvaluations: 50,
        topConditions: [],
        averagePainIntensity: 5.0,
        bodyRegionDistribution: [],
        patientImprovementRate: 65,
        totalPatientsTracked: 40,
      });

      await analyticsApi.getClinicalAnalytics(from);

      expect(mockClient.get).toHaveBeenCalledWith('/api/clinic-analytics/clinical', {
        from: from.toISOString(),
      });
    });
  });

  describe('getPainMapAnalytics', () => {
    it('fetches pain map analytics', async () => {
      const painMapData = {
        totalPainMaps: 85,
        painPoints3D: [
          { x: 0, y: 0.5, z: -0.1, intensity: 7, bodyRegion: 'Lower Back', painType: 'Aching' },
          { x: 0.1, y: 0.8, z: 0, intensity: 5, bodyRegion: 'Neck', painType: 'Sharp' },
        ],
        painTypeDistribution: [
          { type: 'Aching', count: 45 },
          { type: 'Sharp', count: 25 },
          { type: 'Burning', count: 15 },
        ],
        intensityDistribution: [
          { range: '1-3', count: 20 },
          { range: '4-6', count: 35 },
          { range: '7-10', count: 30 },
        ],
        averageIntensity: 5.8,
        mostCommonRegion: 'Lower Back',
      };
      mockClient.get.mockResolvedValueOnce(painMapData);

      const result = await analyticsApi.getPainMapAnalytics();

      expect(mockClient.get).toHaveBeenCalledWith('/api/clinic-analytics/pain-maps', {});
      expect(result.totalPainMaps).toBe(85);
      expect(result.painPoints3D).toHaveLength(2);
      expect(result.painPoints3D[0]).toMatchObject({
        x: 0,
        y: 0.5,
        z: -0.1,
        intensity: 7,
        bodyRegion: 'Lower Back',
      });
      expect(result.painTypeDistribution).toHaveLength(3);
      expect(result.mostCommonRegion).toBe('Lower Back');
    });

    it('fetches pain map analytics with date range', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-02-28');

      mockClient.get.mockResolvedValueOnce({
        totalPainMaps: 40,
        painPoints3D: [],
        painTypeDistribution: [],
        intensityDistribution: [],
        averageIntensity: 5.5,
        mostCommonRegion: 'Cervical Spine',
      });

      const result = await analyticsApi.getPainMapAnalytics(from, to);

      expect(mockClient.get).toHaveBeenCalledWith('/api/clinic-analytics/pain-maps', {
        from: from.toISOString(),
        to: to.toISOString(),
      });
      expect(result.totalPainMaps).toBe(40);
      expect(result.mostCommonRegion).toBe('Cervical Spine');
    });
  });

  describe('edge cases', () => {
    it('handles empty responses', async () => {
      mockClient.get.mockResolvedValueOnce({
        averagePromScore: 0,
        totalEvaluations: 0,
        topConditions: [],
        averagePainIntensity: 0,
        bodyRegionDistribution: [],
        patientImprovementRate: 0,
        totalPatientsTracked: 0,
      });

      const result = await analyticsApi.getClinicalAnalytics();

      expect(result.totalEvaluations).toBe(0);
      expect(result.topConditions).toEqual([]);
    });

    it('handles zero values correctly', async () => {
      mockClient.get.mockResolvedValueOnce({
        todayAppointments: 0,
        completedToday: 0,
        cancelledToday: 0,
        noShowToday: 0,
        completionRate: 0,
        pendingIntakes: 0,
        totalPatients: 0,
        newPatientsThisMonth: 0,
        estimatedRevenue: 0,
        noShowRate: 0,
        averageWaitTime: 0,
        staffUtilization: 0,
      });

      const result = await analyticsApi.getDashboardMetrics();

      expect(result.completionRate).toBe(0);
      expect(result.staffUtilization).toBe(0);
    });
  });

  describe('getUnifiedAnalytics', () => {
    it('fetches unified analytics with default days', async () => {
      const unifiedData = {
        healthMetrics: [
          { id: 'm1', category: 'appointments', name: 'Completion Rate', value: 85, unit: '%', trend: 'up', percentageChange: 5, status: 'good' },
        ],
        promAnalytics: [
          { templateName: 'Pain Scale', totalCount: 100, completedCount: 85, completionRate: 85, averageScore: 72 },
        ],
        healthGoals: [
          { id: 'g1', title: 'Reduce No-Shows', category: 'operations', target: 5, current: 8, unit: '%', progress: 60, status: 'behind' },
        ],
        correlations: [
          { metric1: 'PROM Score', metric2: 'Patient Retention', correlation: 0.75, significance: 'high' },
        ],
        loading: false,
      };
      mockClient.get.mockResolvedValueOnce(unifiedData);

      const result = await analyticsApi.getUnifiedAnalytics();

      expect(mockClient.get).toHaveBeenCalledWith('/api/clinic-analytics/unified', { days: '30' });
      expect(result.healthMetrics).toHaveLength(1);
      expect(result.promAnalytics).toHaveLength(1);
      expect(result.healthGoals).toHaveLength(1);
      expect(result.correlations).toHaveLength(1);
    });

    it('fetches unified analytics with custom days', async () => {
      mockClient.get.mockResolvedValueOnce({
        healthMetrics: [],
        promAnalytics: [],
        healthGoals: [],
        correlations: [],
        loading: false,
      });

      await analyticsApi.getUnifiedAnalytics(90);

      expect(mockClient.get).toHaveBeenCalledWith('/api/clinic-analytics/unified', { days: '90' });
    });

    it('handles health metrics with different statuses', async () => {
      mockClient.get.mockResolvedValueOnce({
        healthMetrics: [
          { id: 'm1', name: 'Good Metric', status: 'good', trend: 'up' },
          { id: 'm2', name: 'Warning Metric', status: 'warning', trend: 'stable' },
          { id: 'm3', name: 'Critical Metric', status: 'critical', trend: 'down' },
        ],
        promAnalytics: [],
        healthGoals: [],
        correlations: [],
        loading: false,
      });

      const result = await analyticsApi.getUnifiedAnalytics();

      expect(result.healthMetrics[0].status).toBe('good');
      expect(result.healthMetrics[1].status).toBe('warning');
      expect(result.healthMetrics[2].status).toBe('critical');
    });

    it('handles goal statuses', async () => {
      mockClient.get.mockResolvedValueOnce({
        healthMetrics: [],
        promAnalytics: [],
        healthGoals: [
          { id: 'g1', title: 'On Track Goal', status: 'on-track', progress: 80 },
          { id: 'g2', title: 'Behind Goal', status: 'behind', progress: 40 },
          { id: 'g3', title: 'Achieved Goal', status: 'achieved', progress: 100 },
        ],
        correlations: [],
        loading: false,
      });

      const result = await analyticsApi.getUnifiedAnalytics();

      expect(result.healthGoals[0].status).toBe('on-track');
      expect(result.healthGoals[2].progress).toBe(100);
    });
  });
});
