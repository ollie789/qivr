import { AxiosInstance } from 'axios';
import { createAxiosInstance, TokenManager, handleApiError, isApiError } from '../utils/axiosConfig';

// Determine the correct API URL
const getApiUrl = () => {
  const viteApiUrl = import.meta.env?.VITE_API_URL;
  const isDevelopment = import.meta.env?.MODE === 'development';
  
  if (viteApiUrl) {
    const cleanUrl = viteApiUrl.replace(/\/+$/, '');
    return cleanUrl.includes('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  
  return isDevelopment ? 'http://localhost:5000/api' : 'https://api.qivr.com/api';
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

    // Add custom interceptor for tenant ID and mock data
    this.client.interceptors.request.use((config) => {
      // Add tenant ID header
      const tenantId = localStorage.getItem('tenantId') || 
                      localStorage.getItem('clinicId') ||
                      '11111111-1111-1111-1111-111111111111';
      config.headers['X-Tenant-Id'] = tenantId;
      config.headers['X-Clinic-Id'] = tenantId;

      // Handle mock data in development
      if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === 'true') {
        return this.handleMockData(config);
      }
      
      return config;
    });
  }

  private handleMockData(config: any) {
    // Mock PROM instances
    if (config.url?.includes('/proms/instances') && config.method === 'get') {
      const mockPromInstances = [
        {
          id: 'prom-1',
          templateId: 'template-1',
          templateName: 'PHQ-9 Depression Screen',
          category: 'Mental Health',
          status: 'Pending',
          scheduledFor: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'prom-2',
          templateId: 'template-2',
          templateName: 'Pain Assessment',
          category: 'Pain Management',
          status: 'Pending',
          scheduledFor: new Date().toISOString(),
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'prom-3',
          templateId: 'template-3',
          templateName: 'Quality of Life Survey',
          category: 'General Health',
          status: 'Completed',
          scheduledFor: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          score: 78.5,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'prom-4',
          templateId: 'template-1',
          templateName: 'PHQ-9 Depression Screen',
          category: 'Mental Health',
          status: 'Completed',
          scheduledFor: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          score: 65.0,
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // If fetching a specific instance
      const instanceMatch = config.url?.match(/\/proms\/instances\/([^/]+)$/);
      if (instanceMatch) {
        const instance = mockPromInstances.find(p => p.id === instanceMatch[1]);
        config.adapter = () => Promise.resolve({
          data: instance || mockPromInstances[0],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config
        });
        return config;
      }
      
      config.adapter = () => Promise.resolve({
        data: mockPromInstances,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config
      });
      return config;
    }

    // Mock PROM templates
    if (config.url?.includes('/proms/templates')) {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'PHQ-9 Depression Screen',
          description: 'Patient Health Questionnaire for depression screening',
          category: 'Mental Health',
          frequency: 'Weekly',
          questions: [
            {
              id: 'q1',
              text: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
              type: 'radio',
              options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
              required: true
            },
            {
              id: 'q2',
              text: 'Over the last 2 weeks, how often have you had little interest or pleasure in doing things?',
              type: 'radio',
              options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
              required: true
            },
            {
              id: 'q3',
              text: 'Over the last 2 weeks, how often have you had trouble falling or staying asleep, or sleeping too much?',
              type: 'radio',
              options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
              required: true
            }
          ],
          scoringMethod: { type: 'sum', maxScore: 27 }
        },
        {
          id: 'template-2',
          name: 'Pain Assessment',
          description: 'Comprehensive pain assessment questionnaire',
          category: 'Pain Management',
          frequency: 'Daily',
          questions: [
            {
              id: 'p1',
              text: 'Rate your current pain level',
              type: 'slider',
              min: 0,
              max: 10,
              step: 1,
              required: true,
              helpText: '0 = No pain, 10 = Worst pain imaginable'
            },
            {
              id: 'p2',
              text: 'Which areas are affected? (select all that apply)',
              type: 'checkbox',
              options: ['Head', 'Neck', 'Back', 'Shoulders', 'Arms', 'Legs', 'Other'],
              required: false
            },
            {
              id: 'p3',
              text: 'Describe your pain in your own words',
              type: 'text',
              required: false,
              helpText: 'Optional: Provide any additional details about your pain'
            }
          ],
          scoringMethod: { type: 'average' }
        },
        {
          id: 'template-3',
          name: 'Quality of Life Survey',
          description: 'General quality of life assessment',
          category: 'General Health',
          frequency: 'Monthly',
          questions: [
            {
              id: 'qol1',
              text: 'How would you rate your overall quality of life?',
              type: 'scale',
              required: true
            },
            {
              id: 'qol2',
              text: 'How satisfied are you with your health?',
              type: 'scale',
              required: true
            },
            {
              id: 'qol3',
              text: 'How well are you able to perform daily activities?',
              type: 'scale',
              required: true
            }
          ],
          scoringMethod: { type: 'percentage' }
        }
      ];
      
      // If fetching a specific template
      const templateMatch = config.url?.match(/\/proms\/templates\/([^/]+)$/);
      if (templateMatch) {
        const template = mockTemplates.find(t => t.id === templateMatch[1]);
        config.adapter = () => Promise.resolve({
          data: template || mockTemplates[0],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: config
        });
        return config;
      }
      
      config.adapter = () => Promise.resolve({
        data: mockTemplates,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config
      });
      return config;
    }

    // Mock PROM submission
    if (config.url?.includes('/proms/instances') && config.url?.includes('/submit')) {
      config.adapter = () => Promise.resolve({
        data: { score: 75.5, message: 'Responses submitted successfully' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config
      });
      return config;
    }

    return config;
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
