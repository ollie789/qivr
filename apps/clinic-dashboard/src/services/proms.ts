import apiClient from './sharedApiClient';
import type {
        CreatePromTemplateRequest,
        PromTemplateDetail,
        PromTemplateSummary,
} from './promApi';

export interface SchedulePromPayload {
	templateKey: string;
	version?: number;
	patientId: string;
	scheduledFor: string;
	dueAt?: string;
}

export const promsApi = {
        createTemplate: async (payload: CreatePromTemplateRequest) => {
                const res = await apiClient.post('/api/v1/proms/templates', payload);
                return res.data as PromTemplateDetail;
        },
        getTemplate: async (key: string, version?: number) => {
                const path = version ? `/api/v1/proms/templates/${key}/${version}` : `/api/v1/proms/templates/${key}`;
                const res = await apiClient.get(path);
                return res.data as PromTemplateDetail;
        },
        listTemplates: async (page = 1, pageSize = 20) => {
                const res = await apiClient.get('/api/v1/proms/templates', { params: { page, pageSize } });
                return res.data as PromTemplateSummary[];
        },
        schedule: async (payload: SchedulePromPayload) => {
                const res = await apiClient.post('/api/v1/proms/schedule', payload);
                return res.data;
        },
        submitAnswers: async (instanceId: string, answers: Record<string, unknown>) => {
                const res = await apiClient.post(`/api/v1/proms/instances/${instanceId}/answers`, answers);
                return res.data as { score: number; completedAt: string };
        },
        getInstance: async (id: string) => {
                const res = await apiClient.get(`/api/v1/proms/instances/${id}`);
                return res.data;
        },
};