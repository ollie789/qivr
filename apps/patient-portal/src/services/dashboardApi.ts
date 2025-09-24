import { api } from './api';
import type {
  DashboardAppointment,
  DashboardData,
  DashboardStats,
  PendingProm,
} from '../types';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return api.get<DashboardStats>('/dashboard/stats');
}

export async function fetchUpcomingAppointments(limit = 3): Promise<DashboardAppointment[]> {
  return api.get<DashboardAppointment[]>(`/appointments/upcoming?limit=${limit}`);
}

export async function fetchPendingProms(limit = 3): Promise<PendingProm[]> {
  return api.get<PendingProm[]>(`/proms/pending?limit=${limit}`);
}

export async function fetchDashboardData(limit = 3): Promise<DashboardData> {
  const [stats, upcomingAppointments, pendingProms] = await Promise.all([
    fetchDashboardStats(),
    fetchUpcomingAppointments(limit),
    fetchPendingProms(limit),
  ]);

  return {
    stats,
    upcomingAppointments,
    pendingProms,
  };
}
