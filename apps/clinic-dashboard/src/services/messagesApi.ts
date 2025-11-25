import apiClient from '../lib/api-client';

export type MessagePriority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type MessageCategory = 'General' | 'Email' | 'Sms' | string;

export interface CursorPage<T> {
  items: T[];
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
  count: number;
}

export interface MessageListItem {
  id: string;
  subject: string;
  from: string;
  to: string;
  preview: string;
  sentAt: string;
  category: MessageCategory;
  read: boolean;
  urgent: boolean;
  hasAttachments: boolean;
  parentMessageId?: string | null;
}

export interface MessageDetail {
  id: string;
  subject: string;
  content: string;
  createdAt: string;
  read: boolean;
  readAt?: string | null;
  priority: MessagePriority;
  messageType: MessageCategory;
  hasAttachments: boolean;
  parentMessageId?: string | null;
  relatedAppointmentId?: string | null;
  sender: {
    id: string;
    name: string;
  };
  recipient: {
    id: string;
    name: string;
  };
  isFromCurrentUser: boolean;
}

export interface ConversationSummary {
  participantId: string;
  participantName: string;
  participantAvatar?: string | null;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSender: string;
  unreadCount: number;
  totalMessages: number;
  hasAttachments: boolean;
  isUrgent: boolean;
}

export interface SendMessagePayload {
  recipientId: string;
  content: string;
  subject?: string;
  priority?: MessagePriority;
  messageType?: MessageCategory;
  relatedAppointmentId?: string;
  parentMessageId?: string;
  scheduledFor?: string;
}

const unwrap = <T>(payload: T | { data: T }): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as any)) {
    return (payload as any).data as T;
  }
  return payload as T;
};

const normaliseCursorPage = <T>(payload: any, mapItem: (item: any) => T): CursorPage<T> => {
  const rawItems = payload?.items ?? payload?.Items ?? [];
  return {
    items: Array.isArray(rawItems) ? rawItems.map(mapItem) : [],
    nextCursor: payload?.nextCursor ?? payload?.NextCursor ?? null,
    previousCursor: payload?.previousCursor ?? payload?.PreviousCursor ?? null,
    hasNext: Boolean(payload?.hasNext ?? payload?.HasNext),
    hasPrevious: Boolean(payload?.hasPrevious ?? payload?.HasPrevious),
    count: payload?.count ?? payload?.Count ?? (Array.isArray(rawItems) ? rawItems.length : 0),
  };
};

const ensureIsoDate = (value: string): string => {
  if (!value) {
    return new Date(0).toISOString();
  }

  const trimmed = value.trim();
  // Handle already ISO strings
  if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
    const isoCandidate = trimmed.endsWith('Z') ? trimmed : `${trimmed}Z`;
    return new Date(isoCandidate).toISOString();
  }

  // Expect format yyyy-MM-dd HH:mm
  const normalised = trimmed.replace(' ', 'T');
  return new Date(`${normalised}:00Z`).toISOString();
};

const mapPortalMessage = (dto: any): MessageListItem => ({
  id: dto.id,
  subject: dto.subject ?? 'No subject',
  from: dto.from ?? 'Unknown',
  to: dto.to ?? 'Unknown',
  preview: dto.content ?? '',
  sentAt: ensureIsoDate(dto.date ?? ''),
  category: dto.category ?? 'General',
  read: Boolean(dto.read),
  urgent: Boolean(dto.urgent),
  hasAttachments: Boolean(dto.hasAttachments),
  parentMessageId: dto.parentMessageId ?? null,
});

const toPriorityString = (value: any): MessagePriority => {
  if (typeof value === 'string') {
    const normalised = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    if (['Low', 'Normal', 'High', 'Urgent'].includes(normalised)) {
      return normalised as MessagePriority;
    }
  }
  if (typeof value === 'number') {
    switch (value) {
      case 0: return 'Low';
      case 1: return 'Normal';
      case 2: return 'High';
      case 3: return 'Urgent';
      default: return 'Normal';
    }
  }
  return 'Normal';
};

const toCategoryString = (value: any): MessageCategory => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    switch (value) {
      case 1: return 'Email';
      case 2: return 'Sms';
      default: return 'General';
    }
  }
  return 'General';
};

const mapMessageDetail = (dto: any): MessageDetail => ({
  id: String(dto.id),
  subject: dto.subject ?? 'No subject',
  content: dto.content ?? '',
  createdAt: ensureIsoDate(dto.createdAt ?? new Date().toISOString()),
  read: Boolean(dto.isRead),
  readAt: dto.readAt ? ensureIsoDate(dto.readAt) : null,
  priority: toPriorityString(dto.priority),
  messageType: toCategoryString(dto.messageType),
  hasAttachments: Boolean(dto.hasAttachments),
  parentMessageId: dto.parentMessageId ? String(dto.parentMessageId) : null,
  relatedAppointmentId: dto.relatedAppointmentId ? String(dto.relatedAppointmentId) : null,
  sender: {
    id: dto.senderId ? String(dto.senderId) : '',
    name: dto.senderName ?? 'Unknown sender',
  },
  recipient: {
    id: dto.recipientId ? String(dto.recipientId) : '',
    name: dto.recipientName ?? 'Unknown recipient',
  },
  isFromCurrentUser: Boolean(dto.isFromCurrentUser),
});

const mapConversationSummary = (dto: any): ConversationSummary => ({
  participantId: String(dto.participantId),
  participantName: dto.participantName ?? 'Unknown',
  participantAvatar: dto.participantAvatar ?? null,
  participantRole: dto.participantRole ?? 'Unknown',
  lastMessage: dto.lastMessage ?? '',
  lastMessageTime: ensureIsoDate(dto.lastMessageTime ?? new Date().toISOString()),
  lastMessageSender: dto.lastMessageSender ?? 'Unknown',
  unreadCount: dto.unreadCount ?? 0,
  totalMessages: dto.totalMessages ?? 0,
  hasAttachments: Boolean(dto.hasAttachments),
  isUrgent: Boolean(dto.isUrgent),
});

class MessagesApi {
  async list(params: {
    cursor?: string | null;
    limit?: number;
    category?: MessageCategory;
    unreadOnly?: boolean;
    sortDescending?: boolean;
  } = {}): Promise<CursorPage<MessageListItem>> {
    const response = await apiClient.get<any>('/api/messages', {
      cursor: params.cursor ?? undefined,
      limit: params.limit ?? 20,
      category: params.category ?? undefined,
      unreadOnly: params.unreadOnly ?? undefined,
      sortDescending: params.sortDescending ?? true,
    });

    const data = unwrap(response);
    return normaliseCursorPage(data, mapPortalMessage);
  }

  async getMessage(id: string): Promise<MessageDetail> {
    const response = await apiClient.get<any>(`/api/messages/${id}`);
    const data = unwrap(response);
    return mapMessageDetail(data);
  }

  async getConversations(): Promise<ConversationSummary[]> {
    const response = await apiClient.get<any>('/api/messages/conversations');
    const data = unwrap(response);
    return Array.isArray(data) ? data.map(mapConversationSummary) : [];
  }

  async getConversationMessages(participantId: string, params: {
    cursor?: string | null;
    limit?: number;
    sortDescending?: boolean;
  } = {}): Promise<CursorPage<MessageDetail>> {
    const response = await apiClient.get<any>(
      `/api/messages/conversation/${participantId}`,
      {
        cursor: params.cursor ?? undefined,
        limit: params.limit ?? 20,
        sortDescending: params.sortDescending ?? true,
      },
    );

    const data = unwrap(response);
    return normaliseCursorPage(data, mapMessageDetail);
  }

  async send(payload: SendMessagePayload): Promise<MessageDetail> {
    const response = await apiClient.post<any>('/api/messages', {
      recipientId: payload.recipientId,
      subject: payload.subject,
      content: payload.content,
      priority: payload.priority,
      messageType: payload.messageType,
      relatedAppointmentId: payload.relatedAppointmentId,
      parentMessageId: payload.parentMessageId,
    });

    const data = unwrap(response);
    return mapMessageDetail(data);
  }

  async markAsRead(id: string): Promise<void> {
    await apiClient.post(`/api/messages/${id}/read`);
  }

  async markManyAsRead(ids: string[]): Promise<void> {
    await apiClient.post('/api/messages/mark-read', ids);
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/messages/${id}`);
  }

  async unreadCount(): Promise<number> {
    const response = await apiClient.get<any>('/api/messages/unread-count');
    const data = unwrap(response);
    return typeof data?.count === 'number' ? data.count : 0;
  }
}

export const messagesApi = new MessagesApi();
