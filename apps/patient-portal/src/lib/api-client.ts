/**
 * Auth-aware HTTP client for patient portal
 * Automatically attaches Cognito authentication tokens for patient users
 */

import { fetchAuthSession } from '@aws-amplify/auth';
import { createHttpClient, HttpError, type HttpRequestOptions } from '@qivr/http';

// Get the base API URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

// Create base HTTP client
const baseClient = createHttpClient({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});

/**
 * Makes an authenticated API request with automatic token attachment
 * @param options Request options
 * @returns Promise with response data
 */
export async function apiRequest<T = any>(options: HttpRequestOptions): Promise<T> {
  try {
    // Get fresh token from Cognito (handles refresh automatically)
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();
    
    if (!accessToken) {
      throw new HttpError('No authentication token available', 401);
    }

    // Get patient ID from token claims if needed
    const idToken = session.tokens?.idToken;
    const patientId = idToken?.payload?.sub as string;

    // Prepare headers with auth
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add patient ID header if available
    if (patientId) {
      headers['X-Patient-Id'] = patientId;
    }

    // Make the request
    return await baseClient.request<T>({
      ...options,
      headers,
    });
  } catch (error) {
    // Handle 401 errors by attempting token refresh
    if (error instanceof HttpError && error.status === 401) {
      return handleUnauthorized(options);
    }
    throw error;
  }
}

/**
 * Handles 401 unauthorized responses by refreshing token and retrying
 * @param originalOptions Original request options
 * @returns Promise with response data after retry
 */
async function handleUnauthorized<T = any>(originalOptions: HttpRequestOptions): Promise<T> {
  try {
    // Force token refresh
    const session = await fetchAuthSession({ forceRefresh: true });
    const newAccessToken = session.tokens?.accessToken?.toString();
    
    if (!newAccessToken) {
      // If still no token after refresh, user needs to re-login
      // Redirect to login page
      window.location.href = '/login';
      throw new HttpError('Session expired. Please login again.', 401);
    }

    // Get patient ID from refreshed token
    const idToken = session.tokens?.idToken;
    const patientId = idToken?.payload?.sub as string;

    // Prepare headers with new token
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${newAccessToken}`,
      'Content-Type': 'application/json',
      ...originalOptions.headers,
    };

    // Add patient ID header
    if (patientId) {
      headers['X-Patient-Id'] = patientId;
    }

    // Retry the request with new token
    return await baseClient.request<T>({
      ...originalOptions,
      headers,
    });
  } catch (retryError) {
    // If retry also fails, redirect to login
    window.location.href = '/login';
    throw retryError;
  }
}

// Convenience methods for common HTTP verbs
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

// Export for direct usage
export default api;
