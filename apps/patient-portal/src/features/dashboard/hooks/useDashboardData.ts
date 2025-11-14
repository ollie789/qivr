import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  deriveDashboardStats,
  fetchDashboardOverview,
  fetchHealthSummary,
  fetchPendingProms,
  mapUpcomingAppointments,
} from "../../../services/dashboardApi";
import type { DashboardAppointment, DashboardStats } from "../../../types";

export function useDashboardData(limit = 3) {
  const overviewQuery = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: fetchDashboardOverview,
  });

  // Disabled - patient portal doesn't need health summary
  // const healthSummaryQuery = useQuery({
  //   queryKey: ["dashboard", "health-summary"],
  //   queryFn: fetchHealthSummary,
  // });

  const pendingPromsQuery = useQuery({
    queryKey: ["dashboard", "pending-proms", limit],
    queryFn: () => fetchPendingProms(limit),
  });

  const stats = useMemo<DashboardStats | undefined>(() => {
    if (!overviewQuery.data) {
      return undefined;
    }

    return deriveDashboardStats(
      overviewQuery.data,
      pendingPromsQuery.data ?? [],
      undefined, // healthSummaryQuery.data,
    );
  }, [overviewQuery.data, pendingPromsQuery.data]);

  const upcomingAppointments = useMemo<DashboardAppointment[]>(() => {
    if (!overviewQuery.data) {
      return [];
    }

    return mapUpcomingAppointments(overviewQuery.data, limit);
  }, [overviewQuery.data, limit]);

  const error = overviewQuery.error ?? pendingPromsQuery.error;

  return {
    stats,
    upcomingAppointments,
    pendingProms: pendingPromsQuery.data ?? [],
    isLoading:
      overviewQuery.isLoading ||
      pendingPromsQuery.isLoading ||
      healthSummaryQuery.isLoading,
    error,
  };
}
