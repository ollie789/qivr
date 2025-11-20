import { JSX } from 'react';
import { User } from './users';

interface Attachment {
  id: number;
  file: string;
  fileType: string;
}

export interface Email {
  id: number;
  user: User;
  subject: string;
  description: string;
  details: JSX.Element;
  time: Date;
  readAt: Date | string | null;
  starred: boolean;
  important: boolean;
  snoozedTill: Date | string | null;
  folder: string;
  label: string;
  attachments?: Attachment[];
}

export interface DatewiseEmail {
  today: Email[];
  yesterday: Email[];
  older: Email[];
}

export interface EmailCategory {
  title: string;
  icon: string;
}
