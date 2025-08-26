import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

// Add response interceptor to handle errors and provide mock data
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If API fails, return mock data for development
    if (error.config && !error.config._retry) {
      error.config._retry = true;
      
      // Mock data based on the endpoint
      const url = error.config.url;
      
      if (url?.includes('/dashboard/stats')) {
        return {
          data: {
            upcomingAppointments: 2,
            pendingPROMs: 3,
            completedEvaluations: 5,
            lastVisit: '2025-08-20T10:00:00Z',
          }
        };
      }
      
      if (url?.includes('/appointments/upcoming')) {
        return {
          data: [
            {
              id: '1',
              providerName: 'Dr. Sarah Smith',
              appointmentType: 'Follow-up',
              scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
              location: 'Room 101',
              status: 'confirmed',
            },
            {
              id: '2',
              providerName: 'Dr. John Brown',
              appointmentType: 'Assessment',
              scheduledStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
              location: 'Room 203',
              status: 'scheduled',
            },
          ]
        };
      }
      
      if (url?.includes('/proms/pending')) {
        return {
          data: [
            {
              id: '1',
              templateName: 'Daily Pain Assessment',
              scheduledFor: new Date().toISOString(),
              daysOverdue: 0,
            },
            {
              id: '2',
              templateName: 'Weekly Progress Review',
              scheduledFor: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              daysOverdue: 2,
            },
            {
              id: '3',
              templateName: 'Treatment Satisfaction Survey',
              scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              daysOverdue: 0,
            },
          ]
        };
      }
    }
    
    return Promise.reject(error);
  }
);

export const fetchDashboardStats = async () => {
  // Mock data for now
  return {
    totalEvaluations: 12,
    upcomingAppointments: 3,
    pendingPROMs: 2,
    lastVisit: '2024-03-15',
  };
};

export const fetchUpcomingAppointments = async () => {
  // Mock data
  return [
    { id: 1, date: '2024-03-20', time: '10:00 AM', practitioner: 'Dr. Smith', type: 'Follow-up' },
    { id: 2, date: '2024-03-25', time: '2:30 PM', practitioner: 'Dr. Johnson', type: 'Assessment' },
  ];
};

export const fetchPendingPROMs = async () => {
  // Mock data
  return [
    { id: 1, title: 'Weekly Pain Assessment', dueDate: '2024-03-18' },
    { id: 2, title: 'Functional Mobility Survey', dueDate: '2024-03-19' },
  ];
};
