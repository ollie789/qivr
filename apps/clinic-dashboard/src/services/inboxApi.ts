/**
 * Inbox API service
 * Connects to the unified inbox backend endpoints
 */

import { api } from "../lib/api-client";

// ============================================================================
// Types
// ============================================================================

export interface InboxItem {
  id: string;
  itemType: string; // "Message" | "Document" | "Notification" | "Task" | "Reminder" | "Alert"
  messageId?: string;
  documentId?: string;
  notificationId?: string;
  patientId?: string;
  patientName?: string;
  title?: string;
  preview?: string;
  category?: string;
  priority: string; // "Low" | "Normal" | "High" | "Urgent"
  status: string; // "Unread" | "Read" | "ActionRequired" | "InProgress" | "Completed" | "Archived"
  isRead: boolean;
  isArchived: boolean;
  isStarred: boolean;
  requiresAction: boolean;
  dueDate?: string;
  receivedAt: string;
  readAt?: string;
  fromUserId?: string;
  fromName?: string;
  labels: string[];
  message?: InboxMessage;
  document?: InboxDocument;
}

export interface InboxMessage {
  id: string;
  content: string;
  sentAt: string;
  hasAttachments: boolean;
}

export interface InboxDocument {
  id: string;
  fileName: string;
  documentType: string;
  status: string;
  isUrgent: boolean;
}

export interface InboxResponse {
  items: InboxItem[];
  unreadCount: number;
  totalCount: number;
}

export interface InboxFilter {
  showArchived?: boolean;
  unreadOnly?: boolean;
  starredOnly?: boolean;
  itemType?: string;
  category?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UnreadCountResponse {
  count: number;
}

// ============================================================================
// API Functions
// ============================================================================

export const inboxApi = {
  /**
   * Get unified inbox items
   */
  getInbox: async (filter?: InboxFilter): Promise<InboxResponse> => {
    const params = new URLSearchParams();

    if (filter) {
      if (filter.showArchived !== undefined)
        params.set("showArchived", String(filter.showArchived));
      if (filter.unreadOnly !== undefined)
        params.set("unreadOnly", String(filter.unreadOnly));
      if (filter.starredOnly !== undefined)
        params.set("starredOnly", String(filter.starredOnly));
      if (filter.itemType) params.set("itemType", filter.itemType);
      if (filter.category) params.set("category", filter.category);
      if (filter.priority) params.set("priority", filter.priority);
      if (filter.search) params.set("search", filter.search);
      if (filter.limit) params.set("limit", String(filter.limit));
      if (filter.offset) params.set("offset", String(filter.offset));
    }

    const queryString = params.toString();
    const url = queryString ? `/api/inbox?${queryString}` : "/api/inbox";

    return await api.get<InboxResponse>(url);
  },

  /**
   * Get a specific inbox item by ID
   */
  getItem: async (id: string): Promise<InboxItem> => {
    return await api.get<InboxItem>(`/api/inbox/${id}`);
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<UnreadCountResponse>(
      "/api/inbox/unread-count",
    );
    return response.count;
  },

  /**
   * Mark a single item as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`/api/inbox/${id}/read`);
  },

  /**
   * Mark multiple items as read
   */
  markMultipleAsRead: async (ids: string[]): Promise<void> => {
    await api.post("/api/inbox/mark-read", { itemIds: ids });
  },

  /**
   * Archive an item
   */
  archive: async (id: string): Promise<void> => {
    await api.post(`/api/inbox/${id}/archive`);
  },

  /**
   * Unarchive an item
   */
  unarchive: async (id: string): Promise<void> => {
    await api.post(`/api/inbox/${id}/unarchive`);
  },

  /**
   * Star an item
   */
  star: async (id: string): Promise<void> => {
    await api.post(`/api/inbox/${id}/star`);
  },

  /**
   * Unstar an item
   */
  unstar: async (id: string): Promise<void> => {
    await api.post(`/api/inbox/${id}/unstar`);
  },

  /**
   * Delete an item (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/inbox/${id}`);
  },
};

export default inboxApi;
