// Enhanced apiClient with full HTTP method support
interface RequestOptions {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  onUploadProgress?: (progressEvent: ProgressEvent) => void;
}

const buildUrl = (baseUrl: string, params?: Record<string, any>): string => {
  if (!params) return baseUrl;
  const queryString = new URLSearchParams(params).toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

const apiClient = {
  get: async <T = any>(url: string, options?: RequestOptions): Promise<{ data: T }> => {
    const fullUrl = buildUrl(url, options?.params);
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    const data = await response.json();
    return { data };
  },
  
  post: async (url: string, data?: any, options?: RequestOptions) => {
    const fullUrl = buildUrl(url, options?.params);
    const isFormData = data instanceof FormData;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      ...options?.headers
    };
    
    // Don't set Content-Type for FormData, let the browser set it
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined)
    });
    
    return response.json();
  },
  
  put: async (url: string, data?: any, options?: RequestOptions) => {
    const fullUrl = buildUrl(url, options?.params);
    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
    return response.json();
  },
  
  patch: async (url: string, data?: any, options?: RequestOptions) => {
    const fullUrl = buildUrl(url, options?.params);
    const response = await fetch(fullUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
    return response.json();
  },
  
  delete: async (url: string, options?: RequestOptions) => {
    const fullUrl = buildUrl(url, options?.params);
    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    return response.json();
  }
};

export default apiClient;
