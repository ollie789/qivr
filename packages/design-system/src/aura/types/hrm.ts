import { User } from './users';

export interface Details {
  salary: number;
  recruiter: {
    name: string;
    link: string;
  };
  application: number;
  department: string;
  location: string;
  employment: string;
}

export interface KPI {
  value: number | string;
  subtitle: string;
  change: {
    percentage: number;
    since: string;
  };
}

export interface LeaveRecord {
  title: string;
  days: number;
  remainingDays: number;
}

export interface Profile {
  user: User;
  role: string;
  details: Details;
  kpis: KPI[];
  leaves: LeaveRecord[];
}

export interface Attendance {
  date: string;
  summary: {
    status: string;
    count: number;
  }[];
  details: {
    day: number;
    status: string;
  }[];
}

export interface Allocation {
  workforce: {
    department: string;
    headCount: number;
  }[];
  expenses: {
    category: string;
    budgets: number[];
  }[];
}

export interface Notification {
  id: string | number;
  title: string;
  subtitle: string;
  type: string;
  timeframe?: string;
  status?: string;
  applicationLink?: string;
}

export interface Notifications {
  date: string;
  items: Notification[];
}

export interface HeadcountRecord {
  period: string;
  stats: { involuntary: number; voluntary: number; other: number };
}

export interface Headcount {
  name: string;
  records: HeadcountRecord[];
}

export interface Resignation {
  id: number;
  profile: {
    name: string;
    role: string;
    branch: string;
    link: string;
  };
  reason: string;
  jssResponse: {
    status: string;
    response: { id: number; label: string; value: number }[];
  };
  lastSalary: number;
  activity: {
    average: string;
    details: number[];
  };
}
