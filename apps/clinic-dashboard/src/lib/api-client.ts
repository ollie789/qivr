import { fetchAuthSession } from '@aws-amplify/auth';
import { createHttpClient, HttpError, type HttpRequestOptions } from '@qivr/http';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID || '11111111-1111-1111-1111-111111111111';
const DEFAULT_CLINIC_ID = import.meta.env.VITE_DEFAULT_CLINIC_ID || '22222222-2222-2222-2222-222222222222';

const baseClient = createHttpClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export async function apiRequest<T = any>(options: HttpRequestOptions): Promise<T> {
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
  get: <T = any>(url: string, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'GET', params }),
  post: <T = any>(url: string, data?: any, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'POST', data, params }),
  put: <T = any>(url: string, data?: any, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'PUT', data, params }),
  patch: <T = any>(url: string, data?: any, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'PATCH', data, params }),
  delete: <T = any>(url: string, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'DELETE', params }),
};

export default api;
