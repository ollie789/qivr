import {
  createHttpClient,
  HttpError,
  getTenantId as getStoredTenantId,
  type HttpRequestOptions,
} from '@qivr/http';
import { useAuthStore } from '../stores/authStore';
import { fetchAuthSession } from '@aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const USE_AUTH_PROXY = import.meta.env.VITE_USE_AUTH_PROXY === 'true';

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
    const { token, user, activeTenantId } = useAuthStore.getState();
    const isFormData = typeof FormData !== 'undefined' && options.data instanceof FormData;

    const headers: Record<string, string> = {
      ...options.headers,
    };

    if (!isFormData && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    let session: Awaited<ReturnType<typeof fetchAuthSession>> | undefined;
    const loadSession = async (): Promise<Awaited<ReturnType<typeof fetchAuthSession>> | undefined> => {
      if (USE_AUTH_PROXY) {
        return undefined;
      }
      if (session) {
        return session;
      }

      try {
        session = await fetchAuthSession();
      } catch (sessionError) {
        console.warn('Unable to fetch Cognito session for API request', sessionError);
        session = undefined;
      }

      return session;
    };

    // Handle authentication tokens
    if (!headers['Authorization']) {
      if (!USE_AUTH_PROXY) {
        const currentSession = await loadSession();
        const cognitoToken = currentSession?.tokens?.accessToken?.toString();
        if (cognitoToken) {
          headers['Authorization'] = `Bearer ${cognitoToken}`;
        } else if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } else if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const sessionTokens = !USE_AUTH_PROXY ? (await loadSession())?.tokens : undefined;
    const idTokenPayload = sessionTokens?.idToken?.payload as Record<string, unknown> | undefined;
    const accessTokenPayload = sessionTokens?.accessToken?.payload as Record<string, unknown> | undefined;
    const storedTenantId = typeof window !== 'undefined' ? getStoredTenantId() : null;

    const tenantId = activeTenantId
      ?? user?.tenantId
      ?? claimFromPayload(idTokenPayload, [
        'custom:custom:tenant_id',
        'custom:tenant_id',
        'tenant_id',
      ])
      ?? claimFromPayload(accessTokenPayload, [
        'custom:custom:tenant_id',
        'custom:tenant_id',
        'tenant_id',
      ])
      ?? claimFromPayload(decodeJwtPayload(token), [
        'custom:custom:tenant_id',
        'custom:tenant_id',
        'tenant_id',
      ])
      ?? storedTenantId
      ?? undefined;

    if (tenantId && !headers['X-Tenant-Id']) {
      headers['X-Tenant-Id'] = tenantId;
    }

    const clinicId = user?.clinicId
      ?? claimFromPayload(idTokenPayload, [
        'custom:custom:clinic_id',
        'custom:clinic_id',
        'clinic_id',
      ])
      ?? claimFromPayload(accessTokenPayload, [
        'custom:custom:clinic_id',
        'custom:clinic_id',
        'clinic_id',
      ])
      ?? undefined;

    if (clinicId && !headers['X-Clinic-Id']) {
      headers['X-Clinic-Id'] = clinicId;
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
