import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardStats,
  fetchPendingProms,
  fetchUpcomingAppointments,
} from '../../../services/dashboardApi';
import type {
  DashboardAppointment,
  DashboardStats,
  PendingProm,
} from '../../../types';

export function useDashboardData(limit = 3) {
  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
  });

  const appointmentsQuery = useQuery<DashboardAppointment[]>({
    queryKey: ['dashboard', 'appointments', limit],
    queryFn: () => fetchUpcomingAppointments(limit),
  });

  const pendingPromsQuery = useQuery<PendingProm[]>({
    queryKey: ['dashboard', 'pending-proms', limit],
    queryFn: () => fetchPendingProms(limit),
  });

  return {
    stats: statsQuery.data,
    upcomingAppointments: appointmentsQuery.data ?? [],
    pendingProms: pendingPromsQuery.data ?? [],
    isLoading: statsQuery.isLoading || appointmentsQuery.isLoading || pendingPromsQuery.isLoading,
    error: statsQuery.error ?? appointmentsQuery.error ?? pendingPromsQuery.error,
  };
}
