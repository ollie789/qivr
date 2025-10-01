import apiClient from '../lib/api-client';

export type MessageTemplateChannel = 'sms' | 'email' | 'both';

export interface MessageTemplate {
  id: string;
  name: string;
  description?: string;
  subject?: string | null;
  content: string;
  channel: MessageTemplateChannel;
  variables: string[];
  updatedAt?: string;
}

export interface MessageTemplateListResult {
  templates: MessageTemplate[];
  source: 'api' | 'fallback';
}

export interface UpsertMessageTemplateInput {
  name: string;
  description?: string;
  subject?: string | null;
  content: string;
  channel: MessageTemplateChannel;
}

const FALLBACK_TEMPLATES: MessageTemplate[] = [
  {
    id: 'fallback-appointment-reminder',
    name: 'Appointment Reminder',
    content: 'Hi {{name}}, this is a reminder for your appointment on {{date}} at {{time}}. Reply CONFIRM to confirm or CANCEL to cancel.',
    channel: 'both',
    variables: ['name', 'date', 'time'],
  },
  {
    id: 'fallback-prom-request',
    name: 'PROM Request',
    content: 'Hi {{name}}, please complete your health questionnaire: {{link}}',
    channel: 'both',
    variables: ['name', 'link'],
  },
  {
    id: 'fallback-results-ready',
    name: 'Test Results Ready',
    content: 'Hi {{name}}, your test results are ready. Please log in to your patient portal to view them.',
    channel: 'both',
    variables: ['name'],
  },
  {
    id: 'fallback-welcome',
    name: 'Welcome Message',
    content: 'Welcome to our clinic, {{name}}! We look forward to providing you with excellent care.',
    channel: 'both',
    variables: ['name'],
  },
];

const ensureChannel = (value: unknown): MessageTemplateChannel => {
  if (value === 'sms' || value === 'email' || value === 'both') {
    return value;
  }
  if (typeof value === 'string') {
    const normalised = value.toLowerCase();
    if (normalised === 'sms' || normalised === 'email') {
      return normalised;
    }
  }
  return 'both';
};

const extractVariables = (content: string, provided?: unknown): string[] => {
  if (Array.isArray(provided) && provided.every(item => typeof item === 'string')) {
    return Array.from(new Set(provided as string[]));
  }

  const matches = content.match(/{{\s*([a-zA-Z0-9_\.]+)\s*}}/g) ?? [];
  return Array.from(new Set(matches.map(match => match.replace(/{{\s*|\s*}}/g, '').trim())));
};

const createFallbackId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `message-template-${Date.now()}`;

const normaliseTemplate = (dto: any): MessageTemplate => {
  const id = dto?.id ?? dto?.Id ?? dto?.templateId ?? dto?.TemplateId ?? createFallbackId();
  const name = dto?.name ?? dto?.Name ?? 'Untitled template';
  const subject = dto?.subject ?? dto?.Subject ?? null;
  const description = dto?.description ?? dto?.Description;
  const content = dto?.content ?? dto?.Content ?? '';
  const channel = ensureChannel(dto?.channel ?? dto?.Channel ?? dto?.messageType ?? dto?.MessageType);
  const variables = extractVariables(content, dto?.variables ?? dto?.Variables);
  const updatedAt = dto?.updatedAt ?? dto?.UpdatedAt ?? null;

  return {
    id: String(id),
    name: String(name),
    subject: subject !== undefined ? subject : null,
    description: description ?? undefined,
    content: String(content),
    channel,
    variables,
    updatedAt: updatedAt ? String(updatedAt) : undefined,
  };
};

const unwrapArray = (payload: any): any[] => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};

class MessageTemplatesApi {
  async list(): Promise<MessageTemplateListResult> {
    try {
      const response = await apiClient.get<any>('/api/messages/templates');
      const items = unwrapArray(response).map(normaliseTemplate);
      if (items.length === 0) {
        return { templates: FALLBACK_TEMPLATES, source: 'fallback' };
      }
      return { templates: items, source: 'api' };
    } catch (error) {
      console.warn('Failed to load message templates from API, using fallback templates.', error);
      return { templates: FALLBACK_TEMPLATES, source: 'fallback' };
    }
  }

  async create(payload: UpsertMessageTemplateInput): Promise<MessageTemplate> {
    const response = await apiClient.post<any>('/api/messages/templates', payload);
    return normaliseTemplate(response);
  }

  async update(id: string, payload: Partial<UpsertMessageTemplateInput>): Promise<MessageTemplate> {
    const response = await apiClient.put<any>(`/api/messages/templates/${id}`, payload);
    return normaliseTemplate(response);
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/api/messages/templates/${id}`);
  }
}

export const messageTemplatesApi = new MessageTemplatesApi();
export const defaultMessageTemplates = FALLBACK_TEMPLATES;

export default messageTemplatesApi;
