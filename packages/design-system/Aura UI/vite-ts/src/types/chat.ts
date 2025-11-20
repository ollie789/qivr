import { FileAttachment } from './common';
import { User } from './users';

export interface Reaction {
  emoji: string;
  userId: number;
}

export interface MediaType {
  type: string;
  src: string;
}

export interface MessageType {
  id: number;
  type: 'sent' | 'received';
  senderId: number;
  text?: string;
  attachments?: { media?: MediaType[]; files?: FileAttachment[] };
  createdAt: Date;
  readAt: Date | string | null;
  reactions?: Reaction[];
  seen?: boolean;
}

export interface Conversation {
  id: string;
  conversationName?: string;
  recipients: User[];
  messages: MessageType[];
  unreadMessages: number;
  starred: boolean;
}

export type FilterType = 'all' | 'unread' | 'starred';
