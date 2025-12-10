import apiClient from '../lib/api-client';

export type NotificationChannel = 'Email' | 'Sms' | 'Push' | 'InApp' | string;
export type NotificationPriority = 'Low' | 'Normal' | 'High' | 'Urgent' | string;

export interface CursorPage<T> {
  items: T[];
  nextCursor?: string | null;
  previousCursor?: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
  count: number;
}

export interface NotificationListItem {
  id: string;
  type: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  priority: NotificationPriority;
  createdAt: string;
  readAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationDetail extends NotificationListItem {
  sentAt?: string | null;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  preferredChannel: NotificationChannel;
}

// API response DTOs (can have different casing from backend)
interface NotificationDto {
  id: string | number;
  type?: string;
  title?: string;
  message?: string;
  channel?: string | number;
  priority?: string | number;
  createdAt?: string;
  readAt?: string | null;
  sentAt?: string | null;
  data?: Record<string, unknown> | null;
}

interface CursorPageDto<T> {
  items?: T[];
  Items?: T[];
  nextCursor?: string | null;
  NextCursor?: string | null;
  previousCursor?: string | null;
  PreviousCursor?: string | null;
  hasNext?: boolean;
  HasNext?: boolean;
  hasPrevious?: boolean;
  HasPrevious?: boolean;
  count?: number;
  Count?: number;
}

interface NotificationPreferencesDto {
  emailEnabled?: boolean;
  EmailEnabled?: boolean;
  smsEnabled?: boolean;
  SmsEnabled?: boolean;
  pushEnabled?: boolean;
  PushEnabled?: boolean;
  quietHoursStart?: string | null;
  QuietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  QuietHoursEnd?: string | null;
  preferredChannel?: string | number;
  PreferredChannel?: string | number;
}

const unwrap = <T>(payload: T | { data: T } | null | undefined): T | null | undefined => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

const ensureIso = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const isoCandidate = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
  const finalValue = isoCandidate.endsWith('Z') ? isoCandidate : `${isoCandidate}Z`;
  return new Date(finalValue).toISOString();
};

const mapChannel = (value: unknown): NotificationChannel => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    switch (value) {
      case 0:
        return 'Email';
      case 1:
        return 'Sms';
      case 2:
        return 'Push';
      case 3:
        return 'InApp';
      default:
        return 'Email';
    }
  }
  return 'Email';
};

const mapPriority = (value: unknown): NotificationPriority => {
  if (typeof value === 'string' && value.length > 0) {
    const normalised = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    return normalised as NotificationPriority;
  }
  if (typeof value === 'number') {
    switch (value) {
      case 0:
        return 'Low';
      case 1:
        return 'Normal';
      case 2:
        return 'High';
      case 3:
        return 'Urgent';
      default:
        return 'Normal';
    }
  }
  return 'Normal';
};

const mapNotification = (dto: NotificationDto): NotificationDetail => ({
  id: String(dto.id),
  type: dto.type ?? 'system',
  title: dto.title ?? 'Notification',
  message: dto.message ?? '',
  channel: mapChannel(dto.channel),
  priority: mapPriority(dto.priority),
  createdAt: ensureIso(dto.createdAt) ?? new Date().toISOString(),
  readAt: ensureIso(dto.readAt),
  sentAt: ensureIso(dto.sentAt),
  metadata: dto.data ?? null,
});

const toCursorPage = <T, D>(payload: CursorPageDto<D> | null | undefined, mapper: (value: D) => T): CursorPage<T> => {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.Items)
    ? payload.Items
    : [];

  return {
    items: items.map(mapper),
    nextCursor: payload?.nextCursor ?? payload?.NextCursor ?? null,
    previousCursor: payload?.previousCursor ?? payload?.PreviousCursor ?? null,
    hasNext: Boolean(payload?.hasNext ?? payload?.HasNext),
    hasPrevious: Boolean(payload?.hasPrevious ?? payload?.HasPrevious),
    count: payload?.count ?? payload?.Count ?? items.length,
  };
};

class NotificationsApi {
  async list(params: {
    cursor?: string | null;
    limit?: number;
    unreadOnly?: boolean;
    channel?: NotificationChannel;
    sortDescending?: boolean;
  } = {}): Promise<CursorPage<NotificationListItem>> {
    const response = await apiClient.get<CursorPageDto<NotificationDto>>('/api/notifications', {
      cursor: params.cursor ?? undefined,
      limit: params.limit ?? 20,
      unreadOnly: params.unreadOnly ?? undefined,
      channel: params.channel ?? undefined,
      sortDescending: params.sortDescending ?? true,
    });

    const data = unwrap(response) as CursorPageDto<NotificationDto> | null | undefined;
    return toCursorPage(data, mapNotification);
  }

  async get(id: string): Promise<NotificationDetail> {
    const response = await apiClient.get<NotificationDto>(`/api/notifications/${id}`);
    return mapNotification(response as unknown as NotificationDto);
  }

  async markAsRead(id: string): Promise<void> {
    await apiClient.put(`/api/notifications/${id}/mark-read`);
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.put('/api/notifications/mark-all-read');
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/notifications/${id}`);
  }

  async unreadCount(): Promise<number> {
    const response = await apiClient.get<{ count?: number }>('/api/notifications/unread-count');
    const data = unwrap(response);
    return typeof data?.count === 'number' ? data.count : 0;
  }

  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.get<NotificationPreferencesDto>('/api/notifications/preferences');
      const data = unwrap(response);
      return {
        emailEnabled: Boolean(data?.emailEnabled ?? data?.EmailEnabled ?? true),
        smsEnabled: Boolean(data?.smsEnabled ?? data?.SmsEnabled ?? true),
        pushEnabled: Boolean(data?.pushEnabled ?? data?.PushEnabled ?? true),
        quietHoursStart: data?.quietHoursStart ?? data?.QuietHoursStart ?? null,
        quietHoursEnd: data?.quietHoursEnd ?? data?.QuietHoursEnd ?? null,
        preferredChannel: mapChannel(data?.preferredChannel ?? data?.PreferredChannel),
      };
    } catch {
      // Return default preferences if endpoint doesn't exist
      console.warn('Notification preferences endpoint not available, using defaults');
      return {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        preferredChannel: 'Email',
      };
    }
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    await apiClient.put('/api/notifications/preferences', {
      emailEnabled: preferences.emailEnabled,
      smsEnabled: preferences.smsEnabled,
      pushEnabled: preferences.pushEnabled,
      quietHoursStart: preferences.quietHoursStart,
      quietHoursEnd: preferences.quietHoursEnd,
      preferredChannel: preferences.preferredChannel,
    });
  }

  subscribe(
    _onNotification: (notification: NotificationDetail) => void,
    _onError?: (error: Event) => void,
  ) {
    // SSE stream disabled - endpoint not implemented
    console.warn('Real-time notifications stream not available');
    return () => {}; // Return no-op cleanup function
    
    /* Disabled until backend implements SSE
    const source = new EventSource('/api/notifications/stream');

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onNotification(mapNotification(data));
      } catch (error) {
        console.error('Failed to parse notification event', error);
      }
    };

    if (onError) {
      source.onerror = onError;
    }

    return () => source.close();
    */
  }
}

export const notificationsApi = new NotificationsApi();
