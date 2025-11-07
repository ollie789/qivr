import apiClient from '../lib/api-client';

export interface Message {
  id: string;
  subject: string;
  content: string;
  from: string;
  to: string;
  date: string;
  category: string;
  read: boolean;
  urgent: boolean;
  hasAttachments: boolean;
  parentMessageId?: string;
}

export interface SendMessageRequest {
  recipientId: string;
  subject: string;
  content: string;
  messageType?: string;
  priority?: string;
  parentMessageId?: string;
}

export interface MessagesResponse {
  items: Message[];
  nextCursor?: string;
  hasMore: boolean;
}

export async function fetchMessages(
  cursor?: string,
  limit: number = 20,
  category?: string,
  unreadOnly?: boolean
): Promise<MessagesResponse> {
  const params: Record<string, string | number | boolean> = { limit };
  if (cursor) params.cursor = cursor;
  if (category) params.category = category;
  if (unreadOnly) params.unreadOnly = unreadOnly;

  return apiClient.get<MessagesResponse>('/api/messages', params);
}

export async function getMessage(messageId: string): Promise<Message> {
  return apiClient.get<Message>(`/api/messages/${messageId}`);
}

export async function sendMessage(request: SendMessageRequest): Promise<Message> {
  return apiClient.post<Message>('/api/messages', request);
}

export async function markAsRead(messageId: string): Promise<void> {
  await apiClient.patch(`/api/messages/${messageId}/read`, {});
}

export async function markAsUnread(messageId: string): Promise<void> {
  await apiClient.patch(`/api/messages/${messageId}/unread`, {});
}

export async function deleteMessage(messageId: string): Promise<void> {
  await apiClient.delete(`/api/messages/${messageId}`);
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ count: number }>('/api/messages/unread/count');
  return response.count;
}
