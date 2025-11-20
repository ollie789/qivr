import { User } from './users';

export interface KPI {
  title: string;
  value: string;
  changePercent: number;
  trend: 'increase' | 'decrease' | 'neutral';
  since: string;
  hours?: number[];
  activities?: number[];
  earnings?: number[];
  projectsWorked?: {
    lastWeek: number[];
    prevWeek: number[];
  };
}

export interface Screenshot {
  id: number;
  activity: number;
  screenshot: string;
}

export interface Screencast {
  id: number;
  name: string;
  avatar: string;
  screenshots: Screenshot[];
}

export interface Timesheet {
  id: number;
  project: string;
  workLogs: {
    user: User;
    durations: number[];
    team: string;
  }[];
}

export interface Project {
  id: number;
  label: string;
}

export interface Task {
  id: number;
  resourceId: number;
  from: number;
  to: number;
  label: string;
  assignees: { id: number; name: string; avatar: string }[];
  classes?: string;
  category: string;
}

export interface TimeRange {
  id: number;
  from: number;
  to: number;
  resizable: boolean;
  classes?: string;
}
