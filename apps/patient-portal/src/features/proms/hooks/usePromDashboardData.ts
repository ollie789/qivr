import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPromHistory,
  fetchPromInstances,
  fetchPromStats,
  savePromDraft,
  submitPromResponse,
} from '../../../services/promsApi';
import type { PromAnswerValue, PromHistoryEntry, PromInstance, PromStats } from '../../../types';

type SubmitArgs = {
  instanceId: string;
  responses: Record<string, PromAnswerValue>;
  timeSpentSeconds: number;
};

type DraftArgs = {
  instanceId: string;
  responses: Record<string, PromAnswerValue>;
  lastQuestionIndex: number;
};

export function usePromDashboardData() {
  const queryClient = useQueryClient();

  const {
    data: pendingProms = [],
    isLoading: pendingLoading,
  } = useQuery<PromInstance[]>({
    queryKey: ['promInstances', 'pending'],
    queryFn: () => fetchPromInstances('pending'),
  });

  const {
    data: promHistory = [],
    isLoading: historyLoading,
  } = useQuery<PromHistoryEntry[]>({
    queryKey: ['promHistory'],
    queryFn: fetchPromHistory,
  });

  const { data: promStats, isLoading: statsLoading } = useQuery<PromStats>({
    queryKey: ['promStats'],
    queryFn: fetchPromStats,
  });

  const submitMutation = useMutation({
    mutationFn: async ({ instanceId, responses, timeSpentSeconds }: SubmitArgs) => {
      return submitPromResponse(instanceId, responses, timeSpentSeconds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promInstances', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['promHistory'] });
      queryClient.invalidateQueries({ queryKey: ['promStats'] });
    },
  });

  const draftMutation = useMutation({
    mutationFn: async ({ instanceId, responses, lastQuestionIndex }: DraftArgs) => {
      return savePromDraft(instanceId, { responses, lastQuestionIndex });
    },
  });

  return {
    pendingProms,
    promHistory,
    promStats,
    pendingLoading,
    historyLoading,
    statsLoading,
    submit: submitMutation.mutateAsync,
    submitting: submitMutation.isPending,
    saveDraft: draftMutation.mutateAsync,
  };
}
