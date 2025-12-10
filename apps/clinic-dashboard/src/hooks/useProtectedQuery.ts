import { useQuery, useInfiniteQuery, useMutation, type UseQueryOptions, type UseInfiniteQueryOptions, type UseMutationOptions, type QueryKey, type QueryFunction } from '@tanstack/react-query';
import { useAuthGuard } from './useAuthGuard';

// Protected useQuery wrapper
export function useProtectedQuery<T = unknown, E = Error>(
  options: UseQueryOptions<T, E> & { queryKey: QueryKey; queryFn: () => Promise<T> }
) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    ...options,
    enabled: canMakeApiCalls && (options.enabled ?? true),
  });
}

// Protected useInfiniteQuery wrapper
export function useProtectedInfiniteQuery<T = unknown, E = Error>(
  options: UseInfiniteQueryOptions<T, E> & { queryKey: QueryKey; queryFn: QueryFunction<T> }
) {
  const { canMakeApiCalls } = useAuthGuard();

  return useInfiniteQuery({
    ...options,
    enabled: canMakeApiCalls && (options.enabled ?? true),
  });
}

// Protected useMutation wrapper (mutations usually don't need auth guard, but included for completeness)
export function useProtectedMutation<T = unknown, E = Error, V = void, C = unknown>(
  options: UseMutationOptions<T, E, V, C>
) {
  return useMutation(options);
}
