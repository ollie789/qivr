import { AxiosInstance } from 'axios';
import { createAxiosInstance, TokenManager, handleApiError, isApiError } from '../utils/axiosConfig';

// Determine the correct API URL
const getApiUrl = () => {
  const viteApiUrl = import.meta.env?.VITE_API_URL;
  
  if (!viteApiUrl) {
    throw new Error('VITE_API_URL environment variable is required');
  }
  
  const cleanUrl = viteApiUrl.replace(/\/+$/, '');
  return cleanUrl.includes('/api') ? cleanUrl : `${cleanUrl}/api`;
};

// Custom token manager for patient portal
const patientTokenManager: TokenManager = {
  getAccessToken: () => {
    // Try multiple sources for token
    const idToken = localStorage.getItem('idToken');
    const accessToken = localStorage.getItem('accessToken');
    const authToken = localStorage.getItem('authToken');
    
    return idToken || accessToken || authToken;
  },
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('idToken', accessToken); // Store as both for compatibility
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userAttributes');
  }
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = createAxiosInstance(
      patientTokenManager,
      {
        maxRetries: 3,
        retryDelay: 1000,
        retryCondition: (error) => {
          // Don't retry on client errors
          if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
            return false;
          }
          return true;
        }
      },
      {
        baseURL: getApiUrl(),
        timeout: 30000,
      }
    );

    // Add custom interceptor for tenant ID
    this.client.interceptors.request.use((config) => {
      // Add tenant ID header from localStorage or auth context
      const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('clinicId');
      
      if (tenantId) {
        config.headers['X-Tenant-Id'] = tenantId;
        config.headers['X-Clinic-Id'] = tenantId;
      }
      
      return config;
    });
  }


  get<T = any>(url: string, config?: any) {
    return this.client.get<T>(url, config);
  }

  post<T = any>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config);
  }

  put<T = any>(url: string, data?: any, config?: any) {
    return this.client.put<T>(url, data, config);
  }

  patch<T = any>(url: string, data?: any, config?: any) {
    return this.client.patch<T>(url, data, config);
  }

  delete<T = any>(url: string, config?: any) {
    return this.client.delete<T>(url, config);
  }
}

const apiClient = new ApiClient();

// Export error handling utilities
export { handleApiError, isApiError };
export default apiClient;
