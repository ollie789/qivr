import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api-client', () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

import apiClient from '../../lib/api-client';
import {
  fetchMessages,
  getMessage,
  sendMessage,
  markAsRead,
  markAsUnread,
  deleteMessage,
  getUnreadCount,
} from '../messagesApi';

const mockClient = vi.mocked(apiClient);

describe('messagesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchMessages', () => {
    const mockMessagesResponse = {
      items: [
        {
          id: 'msg-1',
          subject: 'Appointment Reminder',
          content: 'Your appointment is tomorrow',
          from: 'Dr. Smith',
          to: 'patient@example.com',
          date: '2024-03-01T10:00:00Z',
          category: 'appointment',
          read: false,
          urgent: true,
          hasAttachments: false,
        },
        {
          id: 'msg-2',
          subject: 'Lab Results',
          content: 'Your results are ready',
          from: 'Lab Department',
          to: 'patient@example.com',
          date: '2024-02-28T15:00:00Z',
          category: 'results',
          read: true,
          urgent: false,
          hasAttachments: true,
        },
      ],
      nextCursor: 'cursor-abc',
      hasMore: true,
    };

    it('fetches messages with default params', async () => {
      mockClient.get.mockResolvedValueOnce(mockMessagesResponse);

      const result = await fetchMessages();

      expect(mockClient.get).toHaveBeenCalledWith('/api/messages', { limit: 20 });
      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('cursor-abc');
    });

    it('passes cursor for pagination', async () => {
      mockClient.get.mockResolvedValueOnce({ items: [], hasMore: false });

      await fetchMessages('cursor-abc', 50);

      expect(mockClient.get).toHaveBeenCalledWith('/api/messages', {
        limit: 50,
        cursor: 'cursor-abc',
      });
    });

    it('filters by category', async () => {
      mockClient.get.mockResolvedValueOnce({ items: [], hasMore: false });

      await fetchMessages(undefined, 20, 'appointment');

      expect(mockClient.get).toHaveBeenCalledWith('/api/messages', {
        limit: 20,
        category: 'appointment',
      });
    });

    it('filters unread only', async () => {
      mockClient.get.mockResolvedValueOnce({ items: [], hasMore: false });

      await fetchMessages(undefined, 20, undefined, true);

      expect(mockClient.get).toHaveBeenCalledWith('/api/messages', {
        limit: 20,
        unreadOnly: true,
      });
    });

    it('combines all filters', async () => {
      mockClient.get.mockResolvedValueOnce({ items: [], hasMore: false });

      await fetchMessages('cursor-xyz', 30, 'results', true);

      expect(mockClient.get).toHaveBeenCalledWith('/api/messages', {
        limit: 30,
        cursor: 'cursor-xyz',
        category: 'results',
        unreadOnly: true,
      });
    });
  });

  describe('getMessage', () => {
    it('fetches single message by id', async () => {
      const mockMessage = {
        id: 'msg-1',
        subject: 'Test Message',
        content: 'Full message content here',
        from: 'Dr. Smith',
        to: 'patient@example.com',
        date: '2024-03-01T10:00:00Z',
        category: 'general',
        read: true,
        urgent: false,
        hasAttachments: false,
      };
      mockClient.get.mockResolvedValueOnce(mockMessage);

      const result = await getMessage('msg-1');

      expect(mockClient.get).toHaveBeenCalledWith('/api/messages/msg-1');
      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Full message content here');
    });
  });

  describe('sendMessage', () => {
    it('sends new message', async () => {
      const request = {
        recipientId: 'prov-1',
        subject: 'Question about medication',
        content: 'I have a question about my prescription',
        messageType: 'inquiry',
        priority: 'normal',
      };

      const mockResponse = {
        id: 'msg-new',
        ...request,
        from: 'patient@example.com',
        to: 'Dr. Smith',
        date: '2024-03-01T12:00:00Z',
        category: 'sent',
        read: true,
        urgent: false,
        hasAttachments: false,
      };
      mockClient.post.mockResolvedValueOnce(mockResponse);

      const result = await sendMessage(request);

      expect(mockClient.post).toHaveBeenCalledWith('/api/messages', request);
      expect(result.id).toBe('msg-new');
    });

    it('sends reply to existing message', async () => {
      const request = {
        recipientId: 'prov-1',
        subject: 'Re: Appointment',
        content: 'Thank you for the information',
        parentMessageId: 'msg-original',
      };

      mockClient.post.mockResolvedValueOnce({ id: 'msg-reply', ...request });

      await sendMessage(request);

      expect(mockClient.post).toHaveBeenCalledWith('/api/messages', expect.objectContaining({
        parentMessageId: 'msg-original',
      }));
    });
  });

  describe('markAsRead', () => {
    it('patches message as read', async () => {
      mockClient.patch.mockResolvedValueOnce({});

      await markAsRead('msg-1');

      expect(mockClient.patch).toHaveBeenCalledWith('/api/messages/msg-1/read', {});
    });
  });

  describe('markAsUnread', () => {
    it('patches message as unread', async () => {
      mockClient.patch.mockResolvedValueOnce({});

      await markAsUnread('msg-1');

      expect(mockClient.patch).toHaveBeenCalledWith('/api/messages/msg-1/unread', {});
    });
  });

  describe('deleteMessage', () => {
    it('deletes message by id', async () => {
      mockClient.delete.mockResolvedValueOnce({});

      await deleteMessage('msg-1');

      expect(mockClient.delete).toHaveBeenCalledWith('/api/messages/msg-1');
    });
  });

  describe('getUnreadCount', () => {
    it('fetches unread count', async () => {
      mockClient.get.mockResolvedValueOnce({ count: 5 });

      const result = await getUnreadCount();

      expect(mockClient.get).toHaveBeenCalledWith('/api/messages/unread/count');
      expect(result).toBe(5);
    });

    it('returns zero when no unread messages', async () => {
      mockClient.get.mockResolvedValueOnce({ count: 0 });

      const result = await getUnreadCount();

      expect(result).toBe(0);
    });
  });
});
