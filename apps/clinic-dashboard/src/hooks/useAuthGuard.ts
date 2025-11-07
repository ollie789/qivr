import { useAuthStatus } from '../stores/authStore';

/**
 * Hook to guard against making API calls when authentication is loading or user is not authenticated
 * Returns true if it's safe to make API calls
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading } = useAuthStatus();
  
  return {
    canMakeApiCalls: isAuthenticated && !isLoading,
    isLoading,
    isAuthenticated,
  };
};
