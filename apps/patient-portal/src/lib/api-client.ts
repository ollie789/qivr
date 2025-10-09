import { createHttpClient, HttpError, type HttpRequestOptions } from '@qivr/http';
import { getActiveTenantId } from '../state/tenantState';
import { fetchAuthSession } from '@aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const DEV_AUTH_ENABLED = (import.meta.env.VITE_ENABLE_DEV_AUTH ?? 'false') === 'true';

type ApiParams = Record<string, string | number | boolean | undefined | null>;
type ApiRequestBody = unknown;
type ApiResponse = unknown;

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

    let session: Awaited<ReturnType<typeof fetchAuthSession>> | undefined;
    const ensureSession = async () => {
      if (DEV_AUTH_ENABLED) {
        return undefined;
      }
      if (!session) {
        session = await fetchAuthSession();
      }
      return session;
    };

    const needsSession =
      !DEV_AUTH_ENABLED && (!headers['Authorization'] || !headers['X-Tenant-Id'] || !headers['X-Patient-Id']);

    if (needsSession) {
      try {
        await ensureSession();
      } catch (sessionError) {
        console.warn('Unable to fetch Cognito session for API request', sessionError);
      }
    }

    const idTokenPayload = !DEV_AUTH_ENABLED
      ? (await ensureSession())?.tokens?.idToken?.payload
      : undefined;

    if (!headers['Authorization'] && !DEV_AUTH_ENABLED) {
      const token = session?.tokens?.accessToken?.toString();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    if (!headers['X-Tenant-Id']) {
      const tenantFromSession = claimFromPayload(idTokenPayload, [
        'custom:custom:tenant_id',
        'custom:tenant_id',
        'tenant_id',
      ]);
      if (tenantFromSession) {
        headers['X-Tenant-Id'] = tenantFromSession;
      }
    }

    if (!headers['X-Patient-Id']) {
      const patientIdFromSession = typeof idTokenPayload?.sub === 'string'
        ? (idTokenPayload.sub as string)
        : undefined;
      if (patientIdFromSession) {
        headers['X-Patient-Id'] = patientIdFromSession;
      }
    }

    if (!headers['X-Clinic-Id']) {
      const clinicIdFromSession = claimFromPayload(idTokenPayload, [
        'custom:custom:clinic_id',
        'custom:clinic_id',
        'clinic_id',
      ]);
      if (clinicIdFromSession) {
        headers['X-Clinic-Id'] = clinicIdFromSession;
      }
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
