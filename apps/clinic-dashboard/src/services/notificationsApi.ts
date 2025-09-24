import apiClient from '../lib/api-client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'message' | 'prom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  appointmentReminders: boolean;
  promReminders: boolean;
  messageAlerts: boolean;
  systemUpdates: boolean;
}

class NotificationsApi {
  async getNotifications(params?: {
    unreadOnly?: boolean;
    type?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await apiClient.get('/api/Notifications', { params });
    return response.data;
  }

  async getNotification(id: string) {
    const response = await apiClient.get(`/api/Notifications/${id}`);
    return response.data;
  }

  async markAsRead(id: string) {
    const response = await apiClient.put(`/api/Notifications/${id}/mark-read`);
    return response.data;
  }

  async markAllAsRead() {
    const response = await apiClient.put('/api/Notifications/mark-all-read');
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await apiClient.delete(`/api/Notifications/${id}`);
    return response.data;
  }

  async getUnreadCount() {
    const response = await apiClient.get('/api/Notifications/unread-count');
    return response.data;
  }

  async getPreferences() {
    const response = await apiClient.get('/api/Notifications/preferences');
    return response.data;
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    const response = await apiClient.put('/api/Notifications/preferences', preferences);
    return response.data;
  }

  async subscribeToUpdates(callback: (notification: Notification) => void) {
    // WebSocket or SSE implementation for real-time notifications
    const eventSource = new EventSource('/api/Notifications/stream');
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      callback(notification);
    };

    return () => eventSource.close();
  }
}

export const notificationsApi = new NotificationsApi();
