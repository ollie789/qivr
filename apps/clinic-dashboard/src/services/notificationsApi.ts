import apiClient from './sharedApiClient';

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
  metadata?: Record<string, any>;
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
    const response = await apiClient.get('/api/notifications', { params });
    return response.data;
  }

  async getNotification(id: string) {
    const response = await apiClient.get(`/api/notifications/${id}`);
    return response.data;
  }

  async markAsRead(id: string) {
    const response = await apiClient.put(`/api/notifications/${id}/read`);
    return response.data;
  }

  async markAllAsRead() {
    const response = await apiClient.put('/api/notifications/read-all');
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await apiClient.delete(`/api/notifications/${id}`);
    return response.data;
  }

  async getUnreadCount() {
    const response = await apiClient.get('/api/notifications/unread-count');
    return response.data;
  }

  async getPreferences() {
    const response = await apiClient.get('/api/notifications/preferences');
    return response.data;
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>) {
    const response = await apiClient.put('/api/notifications/preferences', preferences);
    return response.data;
  }

  async subscribeToUpdates(callback: (notification: Notification) => void) {
    // WebSocket or SSE implementation for real-time notifications
    const eventSource = new EventSource('/api/notifications/stream');
    
    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      callback(notification);
    };

    return () => eventSource.close();
  }
}

export const notificationsApi = new NotificationsApi();
