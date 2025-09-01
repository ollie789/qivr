import axios from 'axios';

const API_ROOT_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';
const API_URL = API_ROOT_URL.replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Real API calls to backend
export const fetchDashboardStats = async () => {
  const response = await api.get('/api/dashboard/stats');
  return response.data;
};

export const fetchUpcomingAppointments = async () => {
  const response = await api.get('/api/appointments/upcoming');
  return response.data;
};

export const fetchPendingPROMs = async () => {
  const response = await api.get('/api/proms/pending');
  return response.data;
};

export const fetchNotifications = async () => {
  const response = await api.get('/api/notifications');
  return response.data;
};

export const markNotificationRead = async (id: string) => {
  const response = await api.put(`/api/notifications/${id}/mark-read`);
  return response.data;
};

export const fetchProviders = async () => {
  const response = await api.get('/api/providers');
  return response.data;
};

export const fetchProviderAvailability = async (providerId: string, date: string) => {
  const response = await api.get(`/api/appointments/availability?providerId=${providerId}&date=${date}`);
  return response.data;
};

export const bookAppointment = async (data: any) => {
  const response = await api.post('/api/appointments', data);
  return response.data;
};

export const cancelAppointment = async (id: string) => {
  const response = await api.post(`/api/appointments/${id}/cancel`);
  return response.data;
};

export const rescheduleAppointment = async (id: string, data: any) => {
  const response = await api.post(`/api/appointments/${id}/reschedule`, data);
  return response.data;
};

export const uploadDocument = async (file: File, metadata: any) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  
  const response = await api.post('/api/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const fetchTreatmentPlan = async () => {
  const response = await api.get('/api/treatment-plan');
  return response.data;
};

export const fetchProgressData = async (dateRange?: { start: string; end: string }) => {
  const params = dateRange ? `?start=${dateRange.start}&end=${dateRange.end}` : '';
  const response = await api.get(`/api/progress${params}`);
  return response.data;
};
