import { fetchAuthSession } from '@aws-amplify/auth';
import { createHttpClient, HttpError, type HttpRequestOptions } from '@qivr/http';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID || '11111111-1111-1111-1111-111111111111';
const DEFAULT_PATIENT_ID = import.meta.env.VITE_DEFAULT_PATIENT_ID || '33333333-3333-3333-3333-333333333333';

type ApiParams = Record<string, string | number | boolean | undefined | null>;
type ApiRequestBody = unknown;
type ApiResponse = unknown;

const baseClient = createHttpClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export async function apiRequest<T = ApiResponse>(options: HttpRequestOptions): Promise<T> {
  try {
    let accessToken: string | undefined;
    try {
      const session = await fetchAuthSession();
      accessToken = session.tokens?.accessToken?.toString();
    } catch (e) {
      console.log('No auth session, proceeding without token');
    }

    const isFormData =
      typeof FormData !== 'undefined' && options.data instanceof FormData;

    const headers: Record<string, string> = {
      'X-Tenant-Id': DEFAULT_TENANT_ID,
      'X-Patient-Id': DEFAULT_PATIENT_ID,
      ...options.headers,
    };

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

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
    const apiMessage = error.response?.data?.message || error.response?.data?.error;
    if (apiMessage) {
      return apiMessage;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
};

export const api = {
  get: <T = ApiResponse>(url: string, params?: ApiParams) =>
    apiRequest<T>({ url, method: 'GET', params }),
  post: <T = ApiResponse>(url: string, data?: ApiRequestBody, params?: ApiParams) =>
    apiRequest<T>({ url, method: 'POST', data, params }),
  put: <T = ApiResponse>(url: string, data?: ApiRequestBody, params?: ApiParams) =>
    apiRequest<T>({ url, method: 'PUT', data, params }),
  patch: <T = ApiResponse>(url: string, data?: ApiRequestBody, params?: ApiParams) =>
    apiRequest<T>({ url, method: 'PATCH', data, params }),
  delete: <T = ApiResponse>(url: string, params?: ApiParams) =>
    apiRequest<T>({ url, method: 'DELETE', params }),
};

export default api;
