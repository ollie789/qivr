import {
  createHttpClient,
  HttpError,
  type HttpRequestOptions,
} from '@qivr/http';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

// Type for API request parameters
type ApiParams = any;

// Type for API request body
type ApiRequestBody = any;

// Generic response type constraint
type ApiResponse = any;

const baseClient = createHttpClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export async function apiRequest<T extends ApiResponse = ApiResponse>(options: HttpRequestOptions): Promise<T> {
  const { user, isLoading } = useAuthStore.getState();
  
  // Don't block login/auth requests even if loading
  const isAuthRequest = options.url?.includes('/api/auth/') || options.url?.includes('/login');
  
  // Don't make API calls if auth is still loading (except auth requests)
  if (isLoading && !isAuthRequest) {
    throw new Error('Authentication is still loading');
  }

  const isFormData = typeof FormData !== 'undefined' && options.data instanceof FormData;

  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Auth proxy uses httpOnly cookies, no Authorization header needed
  // Token is only for client-side state management

  // Only send tenant ID if user is authenticated and has a tenant
  const tenantId = user?.tenantId;
  
  if (tenantId && !headers['X-Tenant-Id']) {
    headers['X-Tenant-Id'] = tenantId;
  }

  try {
    return await baseClient.request<T>({
      ...options,
      headers,
    });
  } catch (error) {
    console.error('API request error:', error);
    
    // Handle 401 Unauthorized - try to refresh token
    if (error instanceof HttpError && error.status === 401) {
      try {
        console.log('401 Unauthorized - attempting token refresh');
        await useAuthStore.getState().refreshToken();
        // Retry the original request
        return await baseClient.request<T>({
          ...options,
          headers,
        });
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        const { resetAuth } = useAuthStore.getState();
        resetAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw refreshError;
      }
    }
    
    // Handle 403 Forbidden errors by triggering complete auth reset
    if (error instanceof HttpError && error.status === 403) {
      const { resetAuth } = useAuthStore.getState();
      console.warn('403 Forbidden - clearing all authentication data and forcing re-login');
      resetAuth();
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    throw error;
  }
}

export const api = {
  get: <T extends ApiResponse = ApiResponse>(url: string, params?: ApiParams) => 
    apiRequest<T>({ url, method: 'GET', params }),
  post: <T extends ApiResponse = ApiResponse>(url: string, data?: ApiRequestBody, params?: ApiParams) => 
    apiRequest<T>({ url, method: 'POST', data, params }),
  put: <T extends ApiResponse = ApiResponse>(url: string, data?: ApiRequestBody, params?: ApiParams) => 
    apiRequest<T>({ url, method: 'PUT', data, params }),
  patch: <T extends ApiResponse = ApiResponse>(url: string, data?: ApiRequestBody, params?: ApiParams) => 
    apiRequest<T>({ url, method: 'PATCH', data, params }),
  delete: <T extends ApiResponse = ApiResponse>(url: string, params?: ApiParams) => 
    apiRequest<T>({ url, method: 'DELETE', params }),
};

type ApiErrorShape = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
} & Error;

export const isApiError = (error: unknown): error is ApiErrorShape => {
  if (error instanceof HttpError) {
    return true;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as Partial<ApiErrorShape>;
    return Boolean(maybeError.response?.data);
  }

  return false;
};

export const handleApiError = (error: unknown, defaultMessage: string): string => {
  if (isApiError(error)) {
    const apiMessage =
      error.response?.data?.message || error.response?.data?.error;
    if (apiMessage) {
      return apiMessage;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
};

export default api;
// test change
