import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('../promsApi', () => ({
  fetchPromInstances: vi.fn(),
}));

import { api } from '../api';
import { fetchPromInstances } from '../promsApi';
import {
  fetchDashboardOverview,
  fetchHealthSummary,
  fetchPendingProms,
  deriveDashboardStats,
  mapUpcomingAppointments,
  fetchDashboardData,
} from '../dashboardApi';

const mockApi = vi.mocked(api);
const mockFetchPromInstances = vi.mocked(fetchPromInstances);

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOverviewResponse = {
    patientId: 'pat-1',
    lastUpdated: '2024-03-01T10:00:00Z',
    upcomingAppointments: [
      {
        id: 'apt-1',
        providerId: 'prov-1',
        providerName: 'Dr. Smith',
        scheduledStart: '2024-03-05T09:00:00Z',
        scheduledEnd: '2024-03-05T09:30:00Z',
        appointmentType: 'follow-up',
        status: 'Confirmed',
        location: 'Clinic Room 1',
      },
      {
        id: 'apt-2',
        providerId: 'prov-2',
        providerName: 'Dr. Jones',
        scheduledStart: '2024-03-10T14:00:00Z',
        scheduledEnd: '2024-03-10T14:30:00Z',
        appointmentType: 'consultation',
        status: 'Scheduled',
        location: 'Telehealth',
      },
    ],
    recentPromResponses: [],
    medicationReminders: [],
    healthMetrics: [],
    unreadMessagesCount: 3,
    nextAppointment: null,
  };

  const mockHealthSummary = {
    patientId: 'pat-1',
    patientName: 'John Doe',
    dateOfBirth: '1985-06-15',
    lastVisit: '2024-02-15T10:00:00Z',
    activeConditions: ['Lower Back Pain', 'Neck Stiffness'],
    activeMedications: [
      { name: 'Ibuprofen', startDate: '2024-01-01', status: 'active' },
    ],
    recentVitals: [
      { type: 'Blood Pressure', value: '120/80', unit: 'mmHg', recordedAt: '2024-02-15' },
    ],
  };

  describe('fetchDashboardOverview', () => {
    it('fetches dashboard overview', async () => {
      mockApi.get.mockResolvedValueOnce(mockOverviewResponse);

      const result = await fetchDashboardOverview();

      expect(mockApi.get).toHaveBeenCalledWith('/api/patient-dashboard/overview');
      expect(result.patientId).toBe('pat-1');
      expect(result.upcomingAppointments).toHaveLength(2);
      expect(result.unreadMessagesCount).toBe(3);
    });
  });

  describe('fetchHealthSummary', () => {
    it('fetches health summary', async () => {
      mockApi.get.mockResolvedValueOnce(mockHealthSummary);

      const result = await fetchHealthSummary();

      expect(mockApi.get).toHaveBeenCalledWith('/api/patient-dashboard/health-summary');
      expect(result.patientName).toBe('John Doe');
      expect(result.activeConditions).toHaveLength(2);
    });
  });

  describe('fetchPendingProms', () => {
    it('fetches and sorts pending proms by due date', async () => {
      mockFetchPromInstances.mockResolvedValueOnce([
        {
          id: 'prom-1',
          templateId: 'tmpl-1',
          templateName: 'Pain Scale',
          status: 'pending',
          assignedDate: '2024-02-01',
          scheduledFor: '2024-03-01',
          dueDate: '2024-03-05',
        },
        {
          id: 'prom-2',
          templateId: 'tmpl-2',
          templateName: 'PHQ-9',
          status: 'pending',
          assignedDate: '2024-02-15',
          scheduledFor: '2024-02-20',
          dueDate: '2024-02-25', // Earlier due date
        },
      ]);

      const result = await fetchPendingProms(5);

      expect(mockFetchPromInstances).toHaveBeenCalledWith('pending');
      expect(result).toHaveLength(2);
      expect(result[0]?.templateName).toBe('PHQ-9'); // Earlier due date first
      expect(result[1]?.templateName).toBe('Pain Scale');
    });

    it('calculates days overdue correctly', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3); // 3 days ago

      mockFetchPromInstances.mockResolvedValueOnce([
        {
          id: 'prom-1',
          templateId: 'tmpl-1',
          templateName: 'Overdue PROM',
          status: 'pending',
          assignedDate: '2024-01-01',
          scheduledFor: '2024-01-15',
          dueDate: pastDate.toISOString(),
        },
      ]);

      const result = await fetchPendingProms();

      expect(result[0]?.daysOverdue).toBe(3);
    });

    it('respects limit parameter', async () => {
      mockFetchPromInstances.mockResolvedValueOnce([
        { id: 'prom-1', templateId: 't1', templateName: 'PROM 1', status: 'pending', dueDate: '2024-03-01' },
        { id: 'prom-2', templateId: 't2', templateName: 'PROM 2', status: 'pending', dueDate: '2024-03-02' },
        { id: 'prom-3', templateId: 't3', templateName: 'PROM 3', status: 'pending', dueDate: '2024-03-03' },
        { id: 'prom-4', templateId: 't4', templateName: 'PROM 4', status: 'pending', dueDate: '2024-03-04' },
      ]);

      const result = await fetchPendingProms(2);

      expect(result).toHaveLength(2);
    });
  });

  describe('deriveDashboardStats', () => {
    it('derives stats from overview and pending proms', () => {
      const pendingProms = [
        { id: 'p1', templateName: 'PROM 1', scheduledFor: '2024-03-01' },
        { id: 'p2', templateName: 'PROM 2', scheduledFor: '2024-03-02' },
      ];

      const result = deriveDashboardStats(mockOverviewResponse, pendingProms, mockHealthSummary);

      expect(result.upcomingAppointments).toBe(2);
      expect(result.pendingProms).toBe(2);
      expect(result.completedEvaluations).toBe(2); // From activeConditions
      expect(result.lastVisit).toBe('2024-02-15T10:00:00Z');
    });

    it('handles missing health summary', () => {
      const pendingProms = [{ id: 'p1', templateName: 'PROM 1', scheduledFor: '2024-03-01' }];

      const result = deriveDashboardStats(mockOverviewResponse, pendingProms, undefined);

      expect(result.completedEvaluations).toBe(0);
      expect(result.lastVisit).toBeUndefined();
    });

    it('handles empty appointments', () => {
      const emptyOverview = { ...mockOverviewResponse, upcomingAppointments: [] };

      const result = deriveDashboardStats(emptyOverview, [], undefined);

      expect(result.upcomingAppointments).toBe(0);
    });
  });

  describe('mapUpcomingAppointments', () => {
    it('maps appointments with status normalization', () => {
      const result = mapUpcomingAppointments(mockOverviewResponse);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'apt-1',
        providerName: 'Dr. Smith',
        status: 'confirmed',
        appointmentType: 'follow-up',
      });
      expect(result[1]?.status).toBe('scheduled');
    });

    it('detects virtual appointments from location', () => {
      const overview = {
        ...mockOverviewResponse,
        upcomingAppointments: [
          {
            id: 'apt-1',
            providerId: 'prov-1',
            scheduledStart: '2024-03-01T10:00:00Z',
            scheduledEnd: '2024-03-01T10:30:00Z',
            appointmentType: 'telehealth',
            status: 'Scheduled',
            location: 'Telehealth Video Call',
          },
        ],
      };

      const result = mapUpcomingAppointments(overview);

      expect(result[0]?.isVirtual).toBe(true);
    });

    it('provides default provider name', () => {
      const overview = {
        ...mockOverviewResponse,
        upcomingAppointments: [
          {
            id: 'apt-1',
            providerId: 'prov-1',
            providerName: null,
            scheduledStart: '2024-03-01T10:00:00Z',
            scheduledEnd: '2024-03-01T10:30:00Z',
            appointmentType: 'consultation',
            status: 'Scheduled',
          },
        ],
      };

      const result = mapUpcomingAppointments(overview);

      expect(result[0]?.providerName).toBe('Assigned Provider');
    });

    it('respects limit parameter', () => {
      const result = mapUpcomingAppointments(mockOverviewResponse, 1);

      expect(result).toHaveLength(1);
    });

    it('normalizes different status values', () => {
      const overview = {
        ...mockOverviewResponse,
        upcomingAppointments: [
          { ...mockOverviewResponse.upcomingAppointments[0], id: 'a1', status: 'Cancelled' },
          { ...mockOverviewResponse.upcomingAppointments[0], id: 'a2', status: 'canceled' },
          { ...mockOverviewResponse.upcomingAppointments[0], id: 'a3', status: 'No-Show' },
          { ...mockOverviewResponse.upcomingAppointments[0], id: 'a4', status: 'noshow' },
          { ...mockOverviewResponse.upcomingAppointments[0], id: 'a5', status: 'Completed' },
        ],
      };

      const result = mapUpcomingAppointments(overview, 10);

      expect(result.map(a => a.status)).toEqual([
        'cancelled', 'cancelled', 'no-show', 'no-show', 'completed'
      ]);
    });
  });

  describe('fetchDashboardData', () => {
    it('fetches all dashboard data in parallel', async () => {
      mockApi.get
        .mockResolvedValueOnce(mockOverviewResponse)
        .mockResolvedValueOnce(mockHealthSummary);
      mockFetchPromInstances.mockResolvedValueOnce([
        { id: 'prom-1', templateId: 't1', templateName: 'Pain Scale', status: 'pending', dueDate: '2024-03-05' },
      ]);

      const result = await fetchDashboardData();

      expect(result.stats.upcomingAppointments).toBe(2);
      expect(result.stats.pendingProms).toBe(1);
      expect(result.upcomingAppointments).toHaveLength(2);
      expect(result.pendingProms).toHaveLength(1);
    });

    it('handles health summary failure gracefully', async () => {
      mockApi.get
        .mockResolvedValueOnce(mockOverviewResponse)
        .mockRejectedValueOnce(new Error('Health summary unavailable'));
      mockFetchPromInstances.mockResolvedValueOnce([]);

      const result = await fetchDashboardData();

      // Should not throw, and should use undefined for health summary
      expect(result.stats.lastVisit).toBeUndefined();
      expect(result.stats.completedEvaluations).toBe(0);
    });

    it('respects limit for appointments and proms', async () => {
      const manyAppointments = Array.from({ length: 10 }, (_, i) => ({
        id: `apt-${i}`,
        providerId: 'prov-1',
        providerName: 'Dr. Smith',
        scheduledStart: `2024-03-${String(i + 1).padStart(2, '0')}T09:00:00Z`,
        scheduledEnd: `2024-03-${String(i + 1).padStart(2, '0')}T09:30:00Z`,
        appointmentType: 'consultation',
        status: 'Scheduled',
      }));

      mockApi.get
        .mockResolvedValueOnce({ ...mockOverviewResponse, upcomingAppointments: manyAppointments })
        .mockResolvedValueOnce(mockHealthSummary);
      mockFetchPromInstances.mockResolvedValueOnce([]);

      const result = await fetchDashboardData(5);

      expect(result.upcomingAppointments).toHaveLength(5);
    });
  });
});
