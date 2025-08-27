import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuration for different environments
const API_CONFIGS = {
  development: {
    baseURL: 'http://localhost:5000/api',
    timeout: 30000,
    withCredentials: false,
  },
  production: {
    baseURL: process.env.VITE_API_URL || 'https://api.qivr.com/api',
    timeout: 60000,
    withCredentials: true,
  },
};

// Get current environment
const getEnvironment = (): 'development' | 'production' => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE) {
    return import.meta.env.MODE === 'production' ? 'production' : 'development';
  }
  return 'development';
};

// Error types for better handling
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiError {
  type: ApiErrorType;
  message: string;
  status?: number;
  data?: any;
  originalError?: Error;
}

// Helper to determine error type
const getErrorType = (error: AxiosError): ApiErrorType => {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return ApiErrorType.TIMEOUT;
    return ApiErrorType.NETWORK_ERROR;
  }

  switch (error.response.status) {
    case 401:
      return ApiErrorType.UNAUTHORIZED;
    case 403:
      return ApiErrorType.FORBIDDEN;
    case 404:
      return ApiErrorType.NOT_FOUND;
    case 400:
    case 422:
      return ApiErrorType.VALIDATION_ERROR;
    case 500:
    case 502:
    case 503:
    case 504:
      return ApiErrorType.SERVER_ERROR;
    default:
      return ApiErrorType.UNKNOWN;
  }
};

// Helper to get user-friendly error message
const getUserFriendlyMessage = (error: AxiosError): string => {
  const errorType = getErrorType(error);

  switch (errorType) {
    case ApiErrorType.NETWORK_ERROR:
      return 'Unable to connect to the server. Please check your internet connection.';
    case ApiErrorType.UNAUTHORIZED:
      return 'Your session has expired. Please log in again.';
    case ApiErrorType.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case ApiErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ApiErrorType.VALIDATION_ERROR:
      if (error.response?.data?.message) {
        return error.response.data.message;
      }
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (typeof errors === 'object') {
          return Object.values(errors).flat().join(', ');
        }
      }
      return 'Please check your input and try again.';
    case ApiErrorType.SERVER_ERROR:
      return 'A server error occurred. Please try again later.';
    case ApiErrorType.TIMEOUT:
      return 'The request timed out. Please try again.';
    default:
      return error.response?.data?.message || 'An unexpected error occurred. Please try again.';
  }
};

// Token management
export interface TokenManager {
  getAccessToken: () => string | null;
  getRefreshToken?: () => string | null;
  setTokens?: (accessToken: string, refreshToken?: string) => void;
  clearTokens?: () => void;
  onTokenRefresh?: (newToken: string) => void;
}

// Default token manager using localStorage
export const defaultTokenManager: TokenManager = {
  getAccessToken: () => {
    return localStorage.getItem('accessToken') || 
           localStorage.getItem('idToken') || 
           JSON.parse(localStorage.getItem('authTokens') || '{}')?.accessToken;
  },
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken') || 
           JSON.parse(localStorage.getItem('authTokens') || '{}')?.refreshToken;
  },
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authTokens');
    localStorage.removeItem('idToken');
  }
};

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    const errorType = getErrorType(error);
    return errorType === ApiErrorType.NETWORK_ERROR || 
           errorType === ApiErrorType.TIMEOUT ||
           (errorType === ApiErrorType.SERVER_ERROR && error.response?.status !== 500);
  }
};

// Create configured axios instance
export const createAxiosInstance = (
  tokenManager: TokenManager = defaultTokenManager,
  retryConfig: RetryConfig = defaultRetryConfig,
  customConfig?: Partial<AxiosRequestConfig>
): AxiosInstance => {
  const env = getEnvironment();
  const config = API_CONFIGS[env];

  const instance = axios.create({
    ...config,
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      ...customConfig?.headers,
    },
  });

  // Request interceptor for auth and tenant headers
  instance.interceptors.request.use(
    (config) => {
      // Add auth token
      const token = tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add tenant ID header
      const tenantId = localStorage.getItem('tenantId') || 
                      localStorage.getItem('clinicId') ||
                      JSON.parse(localStorage.getItem('currentUser') || '{}')?.['custom:tenant_id'] ||
                      '11111111-1111-1111-1111-111111111111';
      
      config.headers['X-Tenant-Id'] = tenantId;
      config.headers['X-Clinic-Id'] = tenantId; // Backward compatibility

      // Add request ID for tracking
      config.headers['X-Request-Id'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Log request in development
      if (env === 'development') {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and retry logic
  let retryCount = new Map<string, number>();

  instance.interceptors.response.use(
    (response) => {
      // Log response in development
      if (env === 'development') {
        console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data,
        });
      }

      // Clear retry count on success
      const requestId = response.config.headers?.['X-Request-Id'];
      if (requestId) {
        retryCount.delete(requestId);
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
      const requestId = originalRequest?.headers?.['X-Request-Id'] as string;
      
      // Get current retry count
      const currentRetries = retryCount.get(requestId) || 0;

      // Log error
      console.error('[API Error]', {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });

      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // Try to refresh token if available
        const refreshToken = tokenManager.getRefreshToken?.();
        if (refreshToken && tokenManager.onTokenRefresh) {
          try {
            const refreshResponse = await axios.post(`${config.baseURL}/auth/refresh`, {
              refreshToken,
            });
            
            const newAccessToken = refreshResponse.data.accessToken;
            tokenManager.setTokens?.(newAccessToken, refreshResponse.data.refreshToken);
            tokenManager.onTokenRefresh(newAccessToken);
            
            // Retry original request with new token
            originalRequest.headers!.Authorization = `Bearer ${newAccessToken}`;
            return instance(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            tokenManager.clearTokens?.();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
        }

        // No refresh token available, clear tokens and redirect to login
        tokenManager.clearTokens?.();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Retry logic for network errors and timeouts
      if (
        retryConfig.retryCondition?.(error) &&
        currentRetries < retryConfig.maxRetries &&
        !originalRequest._retry
      ) {
        retryCount.set(requestId, currentRetries + 1);
        
        console.log(`[API Retry] Attempt ${currentRetries + 1} of ${retryConfig.maxRetries} for ${originalRequest.url}`);
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay * Math.pow(2, currentRetries)));
        
        return instance(originalRequest);
      }

      // Clear retry count on final failure
      if (requestId) {
        retryCount.delete(requestId);
      }

      // Transform error for better handling
      const apiError: ApiError = {
        type: getErrorType(error),
        message: getUserFriendlyMessage(error),
        status: error.response?.status,
        data: error.response?.data,
        originalError: error,
      };

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// Default axios instance
export const defaultAxiosInstance = createAxiosInstance();

// Export utility functions
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && 'type' in error && 'message' in error;
};

export const handleApiError = (error: any, fallbackMessage = 'An error occurred'): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return fallbackMessage;
};

// Export types
export type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError };
