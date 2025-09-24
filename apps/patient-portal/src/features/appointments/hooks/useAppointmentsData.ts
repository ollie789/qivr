import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAppointments,
  cancelAppointment,
  rescheduleAppointment,
  type AppointmentFilters,
  type AppointmentDto,
} from '../../../services/appointmentsApi';

interface CancelArgs {
  id: string;
  reason: string;
}

export function useAppointmentsData(filters: AppointmentFilters) {
  const queryClient = useQueryClient();

  const query = useQuery<AppointmentDto[]>({
    queryKey: ['appointments', filters],
    queryFn: () => fetchAppointments(filters),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: CancelArgs) => cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: (id: string) => rescheduleAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    appointments: query.data ?? [],
    isLoading: query.isLoading,
    cancel: cancelMutation.mutateAsync,
    reschedule: rescheduleMutation.mutateAsync,
  };
}
