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

  describe('getTemplates', () => {
    it('fetches templates with params', async () => {
      const templates = [
        { id: 'tmpl-1', key: 'pain-scale', version: 1, name: 'Pain Scale', category: 'pain', createdAt: '2024-01-01' },
        { id: 'tmpl-2', key: 'phq-9', version: 1, name: 'PHQ-9', category: 'mental-health', createdAt: '2024-01-02' },
      ];
      mockClient.get.mockResolvedValueOnce(templates);

      const result = await promApi.getTemplates({ category: 'pain', isActive: true });

      expect(mockClient.get).toHaveBeenCalledWith('/api/proms/templates', { category: 'pain', isActive: true });
      expect(result).toHaveLength(2);
      expect(result[0]?.key).toBe('pain-scale');
    });
  });

  describe('getTemplate', () => {
    it('fetches template detail by id', async () => {
      const template = {
        id: 'tmpl-1',
        key: 'pain-scale',
        version: 1,
        name: 'Pain Scale',
        questions: [
          { id: 'q1', text: 'Rate your pain', type: 'scale', required: true, min: 0, max: 10 },
        ],
        isActive: true,
        createdAt: '2024-01-01',
      };
      mockClient.get.mockResolvedValueOnce(template);

      const result = await promApi.getTemplate('tmpl-1');

      expect(mockClient.get).toHaveBeenCalledWith('/api/proms/templates/by-id/tmpl-1');
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0]?.type).toBe('scale');
    });
  });

  describe('createTemplate', () => {
    it('posts new template', async () => {
      const newTemplate = {
        key: 'custom-prom',
        name: 'Custom PROM',
        category: 'general',
        frequency: 'weekly',
        questions: [
          { id: 'q1', text: 'How are you?', type: 'text' as const, required: true },
        ],
      };

      mockClient.post.mockResolvedValueOnce({
        id: 'tmpl-new',
        ...newTemplate,
        version: 1,
        isActive: true,
        createdAt: '2024-03-01',
      });

      const result = await promApi.createTemplate(newTemplate);

      expect(mockClient.post).toHaveBeenCalledWith('/api/proms/templates', newTemplate);
      expect(result.id).toBe('tmpl-new');
    });
  });

  describe('updateTemplate', () => {
    it('updates template by id', async () => {
      mockClient.put.mockResolvedValueOnce({ id: 'tmpl-1', name: 'Updated Name' });

      await promApi.updateTemplate('tmpl-1', { name: 'Updated Name' });

      expect(mockClient.put).toHaveBeenCalledWith('/api/proms/templates/by-id/tmpl-1', { name: 'Updated Name' });
    });
  });

  describe('deleteTemplate', () => {
    it('deletes template by id', async () => {
      mockClient.delete.mockResolvedValueOnce(undefined);

      await promApi.deleteTemplate('tmpl-1');

      expect(mockClient.delete).toHaveBeenCalledWith('/api/proms/templates/by-id/tmpl-1');
    });
  });

  describe('sendProm', () => {
    it('schedules prom for patient', async () => {
      const scheduleData = {
        templateKey: 'pain-scale',
        version: 1,
        patientId: 'pat-1',
        scheduledFor: '2024-03-01T10:00:00Z',
        dueAt: '2024-03-08T10:00:00Z',
        notificationMethod: 1,
        notes: 'Weekly check-in',
      };

      mockClient.post.mockResolvedValueOnce({
        id: 'instance-1',
        templateId: 'tmpl-1',
        templateName: 'Pain Scale',
        patientId: 'pat-1',
        patientName: 'John Doe',
        status: 'Pending',
        createdAt: '2024-03-01T00:00:00Z',
        scheduledAt: '2024-03-01T10:00:00Z',
        dueDate: '2024-03-08T10:00:00Z',
      });

      const result = await promApi.sendProm(scheduleData);

      expect(mockClient.post).toHaveBeenCalledWith('/api/proms/schedule', scheduleData);
      expect(result.id).toBe('instance-1');
      expect(result.status).toBe('pending');
    });
  });

  describe('getResponses', () => {
    it('fetches responses with filters and maps stats', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: [
          {
            id: 'resp-1',
            templateId: 'tmpl-1',
            templateName: 'Pain Scale',
            patientId: 'pat-1',
            patientName: 'John Doe',
            status: 'Completed',
            createdAt: '2024-02-01T00:00:00Z',
            scheduledAt: '2024-02-01T00:00:00Z',
            dueDate: '2024-02-08T00:00:00Z',
            completedAt: '2024-02-05T10:00:00Z',
            totalScore: 6,
            questionCount: 3,
            answeredCount: 3,
          },
          {
            id: 'resp-2',
            templateId: 'tmpl-1',
            templateName: 'Pain Scale',
            patientId: 'pat-2',
            patientName: 'Jane Smith',
            status: 'Pending',
            createdAt: '2024-02-10T00:00:00Z',
            scheduledAt: '2024-02-10T00:00:00Z',
            dueDate: '2024-02-17T00:00:00Z',
            questionCount: 3,
          },
        ],
        total: 2,
        stats: {
          total: 2,
          completedCount: 1,
          pendingCount: 1,
          inProgressCount: 0,
          expiredCount: 0,
          cancelledCount: 0,
          completionRate: 50,
          averageScore: 66.67,
          nextDue: '2024-02-17T00:00:00Z',
          lastCompleted: '2024-02-05T10:00:00Z',
          streak: 1,
        },
      });

      const result = await promApi.getResponses({
        status: 'completed',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        page: 1,
        limit: 25,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/api/proms/admin/instances?status=completed&startDate=2024-02-01&endDate=2024-02-28&page=1&limit=25'
      );

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);

      // Check completed response mapping
      const completed = result.data[0];
      expect(completed?.status).toBe('completed');
      expect(completed?.rawScore).toBe(6);
      expect(completed?.maxScore).toBe(9); // 3 questions * 3 max score
      expect(completed?.score).toBeCloseTo(66.67, 1); // (6/9) * 100

      // Check stats mapping
      expect(result.stats.completedCount).toBe(1);
      expect(result.stats.pendingCount).toBe(1);
      expect(result.stats.completionRate).toBe(50);
    });

    it('normalizes cancelled/canceled status', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: [
          {
            id: 'resp-1',
            templateId: 'tmpl-1',
            templateName: 'Test',
            patientId: 'pat-1',
            patientName: 'Test Patient',
            status: 'Canceled', // American spelling
            createdAt: '2024-01-01',
            scheduledAt: '2024-01-01',
            dueDate: '2024-01-08',
          },
        ],
        total: 1,
      });

      const result = await promApi.getResponses();

      expect(result.data[0]?.status).toBe('cancelled'); // British spelling normalized
    });

    it('calculates stats locally when server stats missing', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: [
          {
            id: 'resp-1',
            templateId: 'tmpl-1',
            templateName: 'Test',
            patientId: 'pat-1',
            patientName: 'Test',
            status: 'Completed',
            createdAt: '2024-01-01',
            scheduledAt: '2024-01-01',
            dueDate: '2024-01-08',
            completedAt: '2024-01-05',
            totalScore: 9,
            questionCount: 3,
          },
          {
            id: 'resp-2',
            templateId: 'tmpl-1',
            templateName: 'Test',
            patientId: 'pat-2',
            patientName: 'Test 2',
            status: 'Pending',
            createdAt: '2024-01-10',
            scheduledAt: '2024-01-10',
            dueDate: '2024-01-17',
          },
        ],
        total: 2,
        // No stats provided
      });

      const result = await promApi.getResponses();

      // Stats should be calculated locally
      expect(result.stats.total).toBe(2);
      expect(result.stats.completedCount).toBe(1);
      expect(result.stats.pendingCount).toBe(1);
      expect(result.stats.completionRate).toBe(50);
    });
  });

  describe('getResponse', () => {
    it('fetches single response by id', async () => {
      mockClient.get.mockResolvedValueOnce({
        id: 'resp-1',
        templateId: 'tmpl-1',
        templateName: 'Pain Scale',
        patientId: 'pat-1',
        patientName: 'John Doe',
        status: 'Completed',
        createdAt: '2024-02-01',
        scheduledAt: '2024-02-01',
        dueDate: '2024-02-08',
        completedAt: '2024-02-05',
        totalScore: 6,
        questionCount: 3,
        answers: { q1: 2, q2: 2, q3: 2 },
      });

      const result = await promApi.getResponse('resp-1');

      expect(mockClient.get).toHaveBeenCalledWith('/api/proms/instances/resp-1');
      expect(result.responses).toEqual({ q1: 2, q2: 2, q3: 2 });
      expect(result.status).toBe('completed');
    });
  });

  describe('submitResponse', () => {
    it('posts answers for instance', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true });

      await promApi.submitResponse('resp-1', { q1: 3, q2: 2, q3: 1 });

      expect(mockClient.post).toHaveBeenCalledWith('/api/proms/instances/resp-1/answers', {
        q1: 3,
        q2: 2,
        q3: 1,
      });
    });
  });

  describe('status normalization', () => {
    const testCases = [
      { input: 'Pending', expected: 'pending' },
      { input: 'InProgress', expected: 'in-progress' },
      { input: 'in-progress', expected: 'in-progress' },
      { input: 'Completed', expected: 'completed' },
      { input: 'Expired', expected: 'expired' },
      { input: 'Cancelled', expected: 'cancelled' },
      { input: 'Canceled', expected: 'cancelled' },
      { input: 'unknown', expected: 'pending' },
      { input: '', expected: 'pending' },
    ];

    it.each(testCases)('normalizes "$input" to "$expected"', async ({ input, expected }) => {
      mockClient.get.mockResolvedValueOnce({
        id: 'resp-1',
        templateId: 'tmpl-1',
        templateName: 'Test',
        patientId: 'pat-1',
        patientName: 'Test',
        status: input,
        createdAt: '2024-01-01',
        scheduledAt: '2024-01-01',
        dueDate: '2024-01-08',
      });

      const result = await promApi.getResponse('resp-1');

      expect(result.status).toBe(expected);
    });
  });

  describe('score calculation', () => {
    it('calculates percentage score from raw score and question count', async () => {
      mockClient.get.mockResolvedValueOnce({
        id: 'resp-1',
        templateId: 'tmpl-1',
        templateName: 'Test',
        patientId: 'pat-1',
        patientName: 'Test',
        status: 'Completed',
        createdAt: '2024-01-01',
        scheduledAt: '2024-01-01',
        dueDate: '2024-01-08',
        totalScore: 15, // raw score
        questionCount: 10, // 10 questions * 3 max = 30 max score
      });

      const result = await promApi.getResponse('resp-1');

      expect(result.rawScore).toBe(15);
      expect(result.maxScore).toBe(30); // 10 * 3
      expect(result.score).toBe(50); // (15/30) * 100
    });

    it('handles missing question count', async () => {
      mockClient.get.mockResolvedValueOnce({
        id: 'resp-1',
        templateId: 'tmpl-1',
        templateName: 'Test',
        patientId: 'pat-1',
        patientName: 'Test',
        status: 'Completed',
        createdAt: '2024-01-01',
        scheduledAt: '2024-01-01',
        dueDate: '2024-01-08',
        totalScore: 5,
        // No questionCount
      });

      const result = await promApi.getResponse('resp-1');

      expect(result.rawScore).toBe(5);
      expect(result.maxScore).toBeUndefined(); // Can't calculate without question count
      expect(result.score).toBeUndefined();
    });
  });
});
