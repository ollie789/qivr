import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

export interface TokenManager {
  getAccessToken: () => string | null | undefined;
  getRefreshToken?: () => string | null | undefined;
  setTokens?: (accessToken: string, refreshToken?: string) => void;
  clearTokens?: () => void;
  onTokenRefresh?: (newToken: string) => void;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: any) => boolean;
}

export const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const message = axiosError.response?.data?.error || axiosError.message || 'Request failed';
    return new Error(message);
  }
  return error instanceof Error ? error : new Error(String(error));
};

export const isApiError = (error: any): error is AxiosError => axios.isAxiosError(error);

export function createAxiosInstance(
  tokenManager: TokenManager,
  retryOptions: RetryOptions = {},
  axiosConfig: AxiosRequestConfig = {}
): AxiosInstance {
  const instance = axios.create(axiosConfig);

  instance.interceptors.request.use((config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { maxRetries = 0, retryDelay = 500, retryCondition } = retryOptions;
      const config: any = error.config || {};

      const shouldRetry =
        (!retryCondition || retryCondition(error)) &&
        (error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504);

      if (shouldRetry && (config.__retryCount || 0) < maxRetries) {
        config.__retryCount = (config.__retryCount || 0) + 1;
        await new Promise((r) => setTimeout(r, retryDelay));
        return instance.request(config);
      }

      // Auto logout on 401
      if (error.response?.status === 401) {
        tokenManager.clearTokens?.();
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

export type ApiErrorType = 'NetworkError' | 'Unauthorized' | 'ValidationError' | 'UnknownError';

