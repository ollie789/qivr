import {
  createHttpClient,
  HttpError,
  getTenantId as getStoredTenantId,
  type HttpRequestOptions,
} from '@qivr/http';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const claimFromPayload = (
  payload: Record<string, unknown> | undefined,
  keys: string[],
): string | undefined => {
  if (!payload) return undefined;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
};

const decodeJwtPayload = (token: string | null | undefined): Record<string, unknown> | undefined => {
  if (!token) return undefined;
  const parts = token.split('.');
  if (parts.length < 2) return undefined;

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  try {
    const decoder: ((value: string) => string) | null =
      typeof atob === 'function'
        ? atob
        : typeof globalThis !== 'undefined' && typeof (globalThis as any).Buffer !== 'undefined'
          ? (value: string) => (globalThis as any).Buffer.from(value, 'base64').toString('utf-8')
          : null;

    if (!decoder) {
      return undefined;
    }

    const json = decoder(base64);
    return JSON.parse(json);
  } catch (error) {
    console.warn('Unable to decode JWT payload', error);
    return undefined;
  }
};

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
  try {
    const { token, user, isLoading, isAuthenticated } = useAuthStore.getState();
    
    // Don't make API calls if auth is still loading
    if (isLoading) {
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

    // Simplified tenant handling - let the API handle tenant assignment
    // The API will automatically assign users to the correct tenant on first login
    const tenantId = user?.tenantId || 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11';
    
    if (tenantId && !headers['X-Tenant-Id']) {
      headers['X-Tenant-Id'] = tenantId;
    }

    return await baseClient.request<T>({
      ...options,
      headers,
    });
  } catch (error) {
    console.error('API request error:', error);
    
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
