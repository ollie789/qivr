import { JSX } from 'react';
import { StaticImageData } from 'next/image';

export type NotificationType =
  | 'birthday'
  | 'friend_request'
  | 'commented'
  | 'following'
  | 'reaction_love'
  | 'reaction_smile'
  | 'photos'
  | 'group_invitation'
  | 'tagged';

export interface Notification {
  id: number;
  type: NotificationType;
  detail: JSX.Element;
  readAt: null | Date | string;
  user: {
    id: number;
    name: string;
    avatar: string;
  }[];
  images?: string[] | StaticImageData[];
  createdAt: string | Date;
}

export interface DatewiseNotification {
  today: Notification[];
  older: Notification[];
}
