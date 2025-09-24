import { fetchAuthSession } from '@aws-amplify/auth';
import { createHttpClient, HttpError, type HttpRequestOptions } from '@qivr/http';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID || '11111111-1111-1111-1111-111111111111';
const DEFAULT_CLINIC_ID = import.meta.env.VITE_DEFAULT_CLINIC_ID || '22222222-2222-2222-2222-222222222222';

// Type for API request parameters
type ApiParams = Record<string, string | number | boolean | undefined | null>;

// Type for API request body
type ApiRequestBody = Record<string, unknown> | FormData | string | null | undefined;

// Generic response type constraint
type ApiResponse = Record<string, unknown> | unknown[] | string | number | boolean | null;

const baseClient = createHttpClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export async function apiRequest<T extends ApiResponse = ApiResponse>(options: HttpRequestOptions): Promise<T> {
  try {
    // Try to get auth token, but allow unauthenticated requests
    let accessToken: string | undefined;
    try {
      const session = await fetchAuthSession();
      accessToken = session.tokens?.accessToken?.toString();
    } catch (e) {
      console.log('No auth session, proceeding without token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': DEFAULT_TENANT_ID,
      'X-Clinic-Id': DEFAULT_CLINIC_ID,
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return await baseClient.request<T>({
      ...options,
      headers,
    });
  } catch (error) {
    console.error('API request error:', error);
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
