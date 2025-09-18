/**
 * Shared API client - exports the auth-aware API client for backward compatibility
 */

export { default } from '../lib/api-client';
export * from '../lib/api-client';

// Helper functions
export const isApiError = (error: any): boolean => {
  return error?.response?.data?.message !== undefined;
};

export const handleApiError = (error: any, defaultMessage: string): string => {
  if (isApiError(error)) {
    return error.response.data.message;
  }
  return error?.message || defaultMessage;
};
