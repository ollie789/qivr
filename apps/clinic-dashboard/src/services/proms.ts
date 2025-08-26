import apiClient from './sharedApiClient';

export interface CreatePromTemplatePayload {
	key: string;
	name: string;
	description?: string;
	schemaJson: string; // stringified JSON from builder
	scoringMethod?: string;
	scoringRules?: string; // stringified JSON
	isActive?: boolean;
	version?: number;
}

export interface PromTemplateSummary {
	id: string;
	key: string;
	version: number;
	name: string;
	description?: string;
	createdAt: string;
}

export interface SchedulePromPayload {
	templateKey: string;
	version?: number;
	patientId: string;
	scheduledFor: string;
	dueAt?: string;
}

export const promsApi = {
	createTemplate: async (payload: CreatePromTemplatePayload) => {
		const res = await apiClient.post('/api/v1/proms/templates', payload);
		return res.data as { id: string; key: string; version: number };
	},
	getTemplate: async (key: string, version?: number) => {
		const path = version ? `/api/v1/proms/templates/${key}/${version}` : `/api/v1/proms/templates/${key}`;
		const res = await apiClient.get(path);
		return res.data as PromTemplateSummary;
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