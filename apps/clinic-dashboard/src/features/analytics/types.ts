import type { ReactNode } from 'react';

export interface AppointmentTrendDatum {
  name: string;
  appointments: number;
  completed: number;
  cancellations?: number;
  noShows?: number;
  newPatients?: number;
}

export interface PromCompletionDatum {
  name: string;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface DiagnosisDatum {
  name: string;
  percentage: number;
  color?: string;
  value?: number;
}

export interface StatCardItem {
  id: string;
  title: string;
  value: string | number | ReactNode;
  icon: ReactNode;
  avatarColor?: string;
  change?: number;
  changeLabel?: string;
}
