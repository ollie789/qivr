import { PaletteColorKey } from 'theme/palette';
import { User } from 'types/users';

export interface TaskMetrics {
  title: string;
  count: number;
  change?: {
    amount: number;
    direction: 'less' | 'more';
    timeFrame: string;
  };
  deadlineRange?: string;
  icon: {
    name: string;
    color: 'primary' | 'success' | 'warning' | 'neutral';
  };
}

export interface DeadlineMetric {
  id: number;
  completed: 'before' | 'after' | 'on';
  count: number;
  prevCompleteCount: number;
}
export interface ScheduledMeeting {
  id: number;
  title: string;
  date: string;
  time: string;
  status: {
    label: string;
    active?: boolean;
  };
  joinMeetLink?: string;
  attendants: User[];
}

export type TaskStatus = 'complete' | 'due' | 'ongoing';

export type Task = {
  id: number;
  label: string;
  amountDone: number;
  startDate: number;
  endDate: number;
};

export interface Project {
  id: number;
  label: string;
  status: TaskStatus;
  tasks: {
    id: number;
    label: string;
    amountDone: number;
    startDate: number;
    endDate: number;
  }[];
}
export interface ProjectHours {
  aurora: number[];
  falcon: number[];
  phoenix: number[];
}

export interface ProjectTask {
  id: number;
  name: string;
  eta: string;
  lead: User;
  members: User[];
  progress: number;
  state: string;
}

export interface ProjectInfo {
  id?: number;
  name: string;
  color: PaletteColorKey;
  tasks: ProjectTask[];
}

export interface Event {
  id: number;
  title: string;
  allDayEvent: boolean;
  category: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  eventType: string;
  virtualLink?: string;
  physical?: string;
  members: User[];
  notificationMinutesBefore: number;
  notes?: string;
  color: PaletteColorKey;
}

export interface EventCategory {
  value: string;
  label: string;
  color: PaletteColorKey;
}
