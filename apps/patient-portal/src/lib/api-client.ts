// Aligned with clinic dashboard auth system
// Uses httpOnly cookies + X-Tenant-Id header pattern

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://clinic.qivr.pro/api';

class ApiClient {
  private tenantId: string | null = null;

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add tenant ID header if available (for patient operations)
    if (this.tenantId) {
      headers['X-Tenant-Id'] = this.tenantId;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include httpOnly cookies
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return response.text() as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Error handling utilities
export const handleApiError = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

export default new ApiClient();
