import { ReactNode } from 'react';
import { FileAttachment } from './common';
import { User } from './users';

export interface DealInfoItem {
  id?: number;
  attribute: string;
  value: ReactNode;
  background: boolean;
}

export interface SummaryItemData {
  id?: string;
  icon: string;
  attribute: string;
  value: number;
}

export interface TimelineItemData {
  id?: number;
  title: string;
  description: string;
  date: string;
}

export interface AnalyticsData {
  value: number;
  name: string;
}
export interface SalesPipelineData {
  id?: number;
  name: 'Contact' | 'MQL' | 'SQL' | 'Chance' | 'W/L';
  status: 'done' | 'ongoing' | 'closed';
}

export interface AssignedToData {
  type: string;
  people: { id: number; name: string; avatar: string; editable: boolean }[];
}

export interface DealType {
  name: string;
  budget: number;
  state: 'ongoing' | 'past';
  closingDate?: Date;
  status?: 'closed' | 'lost';
}

export interface AccountData {
  name: string;
  dateCreated: Date;
  logo: string;
  tags: string[];
  contactIcons: string[];
  ongoingDeals: DealType[];
  pastDeals: DealType[];
}

export interface AssociatedContactInfo {
  id?: number;
  name: string;
  avatar: string;
  designation: string;
  company: string;
  contactInfo: {
    phone: string;
    email: string;
    contactOwner: { id: number; name: string; avatar: string }[];
  };
}

export interface Note {
  id: string;
  title: string;
  author: { avatar: string; name: string };
  createdAt: string;
  description: string;
}

export interface ActivityMonitoringData {
  allActivities: AllActivitiesData[];
  email: EmailData[];
  meeting: MeetingData[];
  callLog: CallLogData[];
  tasks: TasksData[];
  notes: Note[];
}

export interface Activity {
  id: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'error';
  type: 'mail' | 'call' | 'meeting' | 'task' | 'note' | 'attachment';
  title: string;
  user: string;
  assignment?: string;
  timeStamp: string;
}

export interface AllActivitiesData {
  id: string;
  date: string;
  activities: Activity[];
}

export interface EmailData {
  id: string;
  name: string;
  avatar: string | ReactNode;
  sentVia?: string;
  sentAt: string;
  message: ReactNode;
  attachment?: { src: string; name: string; size: string }[];
  files?: { type: 'image' | 'video' | 'file'; file: FileAttachment }[];
}

export interface Meeting {
  id: string;
  participant: string;
  scheduledBy: string;
  scheduledDate: string;
  guests: User[];
}

export interface MeetingData {
  id: string;
  date: string;
  meetings: Meeting[];
}

export interface Call {
  id: string;
  caller: string;
  receiver: string;
  duration: number;
  audioSrc: string;
  time: string;
  transcript: { id: number; user: string; message: string }[];
}

export interface CallLogData {
  id: string;
  date: string;
  calls: Call[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  timeStamp: string;
  people: User[];
}

export interface TasksData {
  id: string;
  title: string;
  taskList: Task[];
}
