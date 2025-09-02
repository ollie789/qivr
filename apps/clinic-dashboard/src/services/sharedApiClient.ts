import { createAxiosInstance, TokenManager, handleApiError, isApiError, ApiErrorType } from '@shared/axiosConfig';
import { useAuthStore } from '../stores/authStore';

// Determine the correct API URL based on environment
const getApiUrl = () => {
  const viteApiUrl = import.meta.env?.VITE_API_URL;
  const isDevelopment = import.meta.env?.MODE === 'development';
  
  if (viteApiUrl) {
    // Use the API URL as-is if it already contains /api
    // Otherwise append /api to the base URL
    const cleanUrl = viteApiUrl.replace(/\/+$/, '');
    if (cleanUrl.includes('/api')) {
      return cleanUrl;
    }
    // Don't add /api twice
    return `${cleanUrl}/api`;
  }
  
  // Default to port 5000 for development (where the API is actually running)
  return isDevelopment ? 'http://localhost:5000/api' : 'https://api.qivr.com/api';
};

// Custom token manager for clinic dashboard
const clinicTokenManager: TokenManager = {
  getAccessToken: () => {
    const { token } = useAuthStore.getState();
    if (token) return token;
    
    // Fallback to localStorage
    const authTokens = localStorage.getItem('authTokens');
    if (authTokens) {
      try {
        const tokens = JSON.parse(authTokens);
        return tokens.accessToken || tokens.idToken;
      } catch (e) {
        console.error('Failed to parse auth tokens:', e);
      }
    }
    
    return localStorage.getItem('accessToken') || localStorage.getItem('idToken');
  },
  getRefreshToken: () => {
    const authTokens = localStorage.getItem('authTokens');
    if (authTokens) {
      try {
        const tokens = JSON.parse(authTokens);
        return tokens.refreshToken;
      } catch (e) {
        console.error('Failed to parse auth tokens:', e);
      }
    }
    return localStorage.getItem('refreshToken');
  },
  setTokens: (accessToken: string, refreshToken?: string) => {
    const { setToken } = useAuthStore.getState();
    setToken(accessToken);
    
    // Also update localStorage
    const authTokens = {
      accessToken,
      idToken: accessToken,
      refreshToken: refreshToken || localStorage.getItem('refreshToken'),
    };
    localStorage.setItem('authTokens', JSON.stringify(authTokens));
  },
  clearTokens: () => {
    const { logout } = useAuthStore.getState();
    logout();
    
    // Clear all token-related items from localStorage
    localStorage.removeItem('authTokens');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  },
  onTokenRefresh: (newToken: string) => {
    const { setToken } = useAuthStore.getState();
    setToken(newToken);
  }
};

// Create the API client with custom configuration
const apiClient = createAxiosInstance(
  clinicTokenManager,
  {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      // Don't retry on validation errors or auth errors
      if (error.response?.status === 400 || 
          error.response?.status === 401 || 
          error.response?.status === 422) {
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
apiClient.interceptors.request.use((config) => {
  const { user } = useAuthStore.getState();
  const tenantId = user?.clinicId || 
                   user?.tenantId || 
                   localStorage.getItem('clinicId') ||
                   localStorage.getItem('tenantId') ||
                   '11111111-1111-1111-1111-111111111111';
  
  config.headers['X-Tenant-Id'] = tenantId;
  config.headers['X-Clinic-Id'] = tenantId; // Backward compatibility
  
  return config;
});

// Export additional utilities
export { handleApiError, isApiError, ApiErrorType };
export default apiClient;
