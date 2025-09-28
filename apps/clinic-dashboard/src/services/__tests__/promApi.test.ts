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
import { promApi } from '../promApi';

const mockClient = vi.mocked(apiClient);

describe('promApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getResponses maps server payload and stats', async () => {
    const serverStats = {
      total: 10,
      completedCount: 4,
      pendingCount: 3,
      inProgressCount: 2,
      expiredCount: 1,
      cancelledCount: 0,
      completionRate: 41.8,
      averageScore: 72.345,
      nextDue: '2024-02-02T00:00:00Z',
      lastCompleted: '2024-02-01T00:00:00Z',
      streak: 3,
    };

    mockClient.get.mockResolvedValueOnce({
      data: [
        {
          id: 'resp-1',
          templateId: 'tmpl-1',
          templateName: 'Template A',
          patientId: 'pat-1',
          patientName: 'Ada Lovelace',
          status: 'Canceled',
          createdAt: '2024-01-05T10:00:00Z',
          scheduledAt: '2024-01-05T10:00:00Z',
          dueDate: '2024-01-10T10:00:00Z',
          completedAt: '2024-01-08T10:00:00Z',
          totalScore: 6,
          questionCount: 3,
          answeredCount: 3,
          notificationMethod: 'Email',
          reminderCount: 1,
          notes: 'Follow-up',
        },
      ],
      total: 10,
      stats: serverStats,
    });

    const result = await promApi.getResponses({
      status: 'completed',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      page: 2,
      limit: 5,
    });

    expect(mockClient.get).toHaveBeenCalledWith(
      '/api/v1/proms/admin/instances?status=completed&startDate=2024-01-01&endDate=2024-01-31&page=2&limit=5',
    );

    expect(result.total).toBe(10);
    expect(result.data).toHaveLength(1);
    const response = result.data[0];
    expect(response.status).toBe('cancelled');
    expect(response.templateName).toBe('Template A');
    expect(response.rawScore).toBe(6);
    expect(response.maxScore).toBe(9);
    expect(response.score).toBeCloseTo((6 / 9) * 100, 5);

    expect(result.stats.total).toBe(serverStats.total);
    expect(result.stats.completedCount).toBe(serverStats.completedCount);
    expect(result.stats.completionRate).toBe(Math.round(serverStats.completionRate));
    expect(result.stats.averageScore).toBeCloseTo(Math.round(serverStats.averageScore * 100) / 100, 5);
    expect(result.stats.nextDue).toBe(serverStats.nextDue);
    expect(result.stats.lastCompleted).toBe(serverStats.lastCompleted);
    expect(result.stats.streak).toBe(serverStats.streak);
  });

  it('getResponses falls back to calculated stats when missing from server', async () => {
    mockClient.get.mockResolvedValueOnce({
      data: [
        {
          id: 'resp-2',
          templateId: 'tmpl-2',
          templateName: 'Template B',
          patientId: 'pat-2',
          patientName: 'Grace Hopper',
          status: 'Pending',
          createdAt: '2024-01-05T12:00:00Z',
          scheduledAt: '2024-01-06T12:00:00Z',
          dueDate: '2024-01-09T12:00:00Z',
        },
      ],
      total: 1,
    });

    const result = await promApi.getResponses();

    expect(result.total).toBe(1);
    expect(result.stats.total).toBe(1);
    expect(result.stats.completedCount).toBe(0);
    expect(result.stats.pendingCount).toBe(1);
    expect(result.stats.completionRate).toBe(0);
    expect(result.stats.nextDue).toBe('2024-01-09T12:00:00Z');
  });

  it('getResponse maps a single instance', async () => {
    mockClient.get.mockResolvedValueOnce({
      id: 'resp-3',
      templateId: 'tmpl-3',
      templateName: 'Template C',
      patientId: 'pat-3',
      patientName: 'Alan Turing',
      status: 'Completed',
      createdAt: '2024-01-02T08:00:00Z',
      scheduledAt: '2024-01-03T08:00:00Z',
      dueDate: '2024-01-05T08:00:00Z',
      completedAt: '2024-01-04T08:00:00Z',
      totalScore: 12,
      questionCount: 6,
      answeredCount: 6,
      answers: { mood: 3 },
    });

    const result = await promApi.getResponse('resp-3');

    expect(mockClient.get).toHaveBeenCalledWith('/api/v1/proms/instances/resp-3');
    expect(result.id).toBe('resp-3');
    expect(result.score).toBeCloseTo((12 / (6 * 3)) * 100, 5);
    expect(result.responses).toEqual({ mood: 3 });
  });
});
