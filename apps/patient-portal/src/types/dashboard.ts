export interface DashboardStats {
  upcomingAppointments: number;
  pendingProms: number;
  completedEvaluations: number;
  lastVisit?: string;
}

export type DashboardAppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface DashboardAppointment {
  id: string;
  providerName: string;
  providerSpecialty?: string;
  appointmentType: string;
  scheduledStart: string;
  scheduledEnd?: string;
  location?: string;
  isVirtual?: boolean;
  status: DashboardAppointmentStatus;
}

export interface PendingProm {
  id: string;
  templateName: string;
  scheduledFor: string;
  daysOverdue?: number;
}

export interface RecoveryProgress {
  percentage: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface DashboardData {
  stats?: DashboardStats;
  upcomingAppointments: DashboardAppointment[];
  pendingProms: PendingProm[];
}
