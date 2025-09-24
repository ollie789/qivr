import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('../../lib/api-client', () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

import apiClient from '../../lib/api-client';
import {
  fetchPromInstances,
  fetchPromStats,
  fetchPromTemplate,
  fetchPromInstance,
  savePromDraft,
  submitPromResponse,
} from '../promsApi';
import type { PromInstance, PromStats, PromTemplate } from '../../types';

const mockClient = vi.mocked(apiClient);

describe('promsApi', () => {
  const sampleInstances: PromInstance[] = [
    {
      id: '1',
      templateId: 'tmpl-1',
      templateName: 'PROM A',
      status: 'pending',
    },
  ];

  const stats: PromStats = {
    totalAssigned: 10,
    completed: 5,
    pending: 3,
    averageScore: 82,
    completionRate: 50,
    streak: 2,
  };

  const template: PromTemplate = {
    id: 'tmpl-1',
    name: 'PROM Template',
    category: 'general',
    questions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchPromInstances unwraps envelope responses', async () => {
    mockClient.get.mockResolvedValueOnce({ data: sampleInstances });

    const result = await fetchPromInstances('pending');

    expect(mockClient.get).toHaveBeenCalledWith('/api/PromInstance', { status: 'pending' });
    expect(result).toEqual(sampleInstances);
  });

  it('fetchPromInstances returns plain values when no envelope present', async () => {
    mockClient.get.mockResolvedValueOnce(sampleInstances);

    const result = await fetchPromInstances();

    expect(mockClient.get).toHaveBeenCalledWith('/api/PromInstance', undefined);
    expect(result).toEqual(sampleInstances);
  });

  it('submitPromResponse posts answers payload', async () => {
    mockClient.post.mockResolvedValueOnce(sampleInstances[0]);

    const responses = { q1: 'yes', q2: 3 };
    await submitPromResponse('instance-1', responses, 120);

    expect(mockClient.post).toHaveBeenCalledWith('/api/PromInstance/instance-1/submit', {
      answers: [
        { questionId: 'q1', value: 'yes' },
        { questionId: 'q2', value: 3 },
      ],
      completionSeconds: 120,
    });
  });

  it('savePromDraft forwards draft payload', async () => {
    mockClient.post.mockResolvedValueOnce(undefined);

    await savePromDraft('instance-2', { responses: { q1: 'draft' }, lastQuestionIndex: 2 });

    expect(mockClient.post).toHaveBeenCalledWith('/api/PromInstance/instance-2/draft', {
      responses: { q1: 'draft' },
      lastQuestionIndex: 2,
    });
  });

  it('fetchPromStats unwraps responses', async () => {
    mockClient.get.mockResolvedValueOnce({ data: stats });

    const result = await fetchPromStats();

    expect(mockClient.get).toHaveBeenCalledWith('/api/PromInstance/stats');
    expect(result).toEqual(stats);
  });

  it('fetchPromInstance and fetchPromTemplate use legacy routes', async () => {
    mockClient.get
      .mockResolvedValueOnce(sampleInstances[0])
      .mockResolvedValueOnce(template);

    const instance = await fetchPromInstance('instance-3');
    expect(mockClient.get).toHaveBeenNthCalledWith(1, '/api/v1/proms/instances/instance-3');
    expect(instance).toEqual(sampleInstances[0]);

    const tpl = await fetchPromTemplate('tmpl-1');
    expect(mockClient.get).toHaveBeenNthCalledWith(2, '/api/v1/proms/templates/by-id/tmpl-1');
    expect(tpl).toEqual(template);
  });
});
