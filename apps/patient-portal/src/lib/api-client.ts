import { createHttpClient, HttpError, type HttpRequestOptions } from '@qivr/http';
import { getActiveTenantId } from '../state/tenantState';
import { fetchAuthSession } from '@aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const DEFAULT_TENANT_ID =
  import.meta.env.VITE_DEFAULT_TENANT_ID || 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11';
const DEFAULT_PATIENT_ID = import.meta.env.VITE_DEFAULT_PATIENT_ID || '33333333-3333-3333-3333-333333333333';
const DEV_AUTH_ENABLED = (import.meta.env.VITE_ENABLE_DEV_AUTH ?? 'true') === 'true';

type ApiParams = Record<string, string | number | boolean | undefined | null>;
type ApiRequestBody = unknown;
type ApiResponse = unknown;

const baseClient = createHttpClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export async function apiRequest<T = ApiResponse>(options: HttpRequestOptions): Promise<T> {
  try {
    const isFormData =
      typeof FormData !== 'undefined' && options.data instanceof FormData;

    const headers: Record<string, string> = {
      ...options.headers,
    };

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const activeTenantId = getActiveTenantId();
    if (activeTenantId && !headers['X-Tenant-Id']) {
      headers['X-Tenant-Id'] = activeTenantId;
    }

    const needsSession =
      !DEV_AUTH_ENABLED && (!headers['Authorization'] || !headers['X-Tenant-Id'] || !headers['X-Patient-Id']);

    let session: Awaited<ReturnType<typeof fetchAuthSession>> | undefined;

    if (needsSession) {
      try {
        session = await fetchAuthSession();
      } catch (sessionError) {
        if (!headers['Authorization']) {
          console.warn('Unable to fetch Cognito session for API request', sessionError);
        }
      }
    }

    if (!headers['Authorization'] && !DEV_AUTH_ENABLED) {
      const token = session?.tokens?.accessToken?.toString();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (!headers['X-Tenant-Id']) {
      const tenantFromSession = DEV_AUTH_ENABLED
        ? undefined
        : (session?.tokens?.idToken?.payload?.['custom:tenant_id'] as string | undefined) ??
          (session?.tokens?.idToken?.payload?.tenant_id as string | undefined) ??
          (session?.tokens?.idToken?.payload?.['custom:clinic_id'] as string | undefined);

      headers['X-Tenant-Id'] = tenantFromSession || activeTenantId || DEFAULT_TENANT_ID;
    }

    if (!headers['X-Patient-Id']) {
      const patientIdFromSession = DEV_AUTH_ENABLED
        ? undefined
        : (session?.tokens?.idToken?.payload?.sub as string | undefined);
      headers['X-Patient-Id'] = patientIdFromSession || DEFAULT_PATIENT_ID;
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
