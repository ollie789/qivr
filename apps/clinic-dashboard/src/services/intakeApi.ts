import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('clinic-auth-storage');
  if (authStorage) {
    const { state } = JSON.parse(authStorage);
    if (state?.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface IntakeSubmission {
  id: string;
  patientName: string;
  email: string;
  phone: string;
  submittedAt: string;
  conditionType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  painLevel: number;
  symptoms: string[];
  aiSummary?: string;
  assignedTo?: string;
  notes?: string;
}

export interface IntakeDetails {
  id: string;
  patient: {
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address?: string;
  };
  evaluation: {
    submittedAt: string;
    conditionType: string;
    severity: string;
    painLevel: number;
    symptoms: string[];
    description: string;
    duration: string;
    triggers?: string[];
    previousTreatments?: string[];
  };
  painMap?: {
    bodyParts: Array<{
      region: string;
      intensity: number;
      type: string;
    }>;
  };
  aiSummary?: {
    content: string;
    riskFactors: string[];
    recommendations: string[];
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
  };
  status: string;
  assignedTo?: string;
  notes?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

export interface IntakeFilters {
  status?: string;
  severity?: string;
  assignedTo?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const intakeApi = {
  // Get all intake submissions with filters
  async getIntakes(filters?: IntakeFilters): Promise<{ data: IntakeSubmission[]; total: number }> {
    try {
      // Using test endpoint for development
      const response = await apiClient.get('/api/testdata/evaluations', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching intakes:', error);
      // Return mock data for development
      return {
        data: [
          {
            id: '1',
            patientName: 'John Doe',
            email: 'john.doe@email.com',
            phone: '+61 400 000 001',
            submittedAt: new Date().toISOString(),
            conditionType: 'Lower Back Pain',
            severity: 'high',
            status: 'pending',
            painLevel: 7,
            symptoms: ['chronic pain', 'stiffness', 'limited mobility'],
          },
          {
            id: '2',
            patientName: 'Jane Smith',
            email: 'jane.smith@email.com',
            phone: '+61 400 000 002',
            submittedAt: new Date(Date.now() - 3600000).toISOString(),
            conditionType: 'Neck Pain',
            severity: 'medium',
            status: 'reviewing',
            painLevel: 5,
            symptoms: ['headaches', 'tension', 'radiating pain'],
            assignedTo: 'Dr. Brown',
          },
          {
            id: '3',
            patientName: 'Bob Johnson',
            email: 'bob.johnson@email.com',
            phone: '+61 400 000 003',
            submittedAt: new Date(Date.now() - 7200000).toISOString(),
            conditionType: 'Shoulder Injury',
            severity: 'medium',
            status: 'approved',
            painLevel: 6,
            symptoms: ['limited range', 'weakness', 'pain with movement'],
            assignedTo: 'Dr. Smith',
          },
        ],
        total: 3,
      };
    }
  },

  // Get single intake details
  async getIntakeDetails(id: string): Promise<IntakeDetails> {
    try {
      const response = await apiClient.get(`/api/evaluations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching intake details:', error);
      // Return mock data for development
      return {
        id,
        patient: {
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '+61 400 000 001',
          dateOfBirth: '1985-05-15',
          address: '123 Main St, Sydney NSW 2000',
        },
        evaluation: {
          submittedAt: new Date().toISOString(),
          conditionType: 'Lower Back Pain',
          severity: 'high',
          painLevel: 7,
          symptoms: ['chronic pain', 'stiffness', 'limited mobility'],
          description: 'Experiencing severe lower back pain for the past 3 weeks',
          duration: '3 weeks',
          triggers: ['sitting', 'bending', 'lifting'],
          previousTreatments: ['physiotherapy', 'massage'],
        },
        painMap: {
          bodyParts: [
            { region: 'lower-back', intensity: 8, type: 'sharp' },
            { region: 'left-hip', intensity: 5, type: 'dull' },
          ],
        },
        aiSummary: {
          content: 'Patient presents with chronic lower back pain consistent with lumbar strain...',
          riskFactors: ['sedentary lifestyle', 'poor posture'],
          recommendations: ['physiotherapy', 'ergonomic assessment', 'exercise program'],
          approved: false,
        },
        status: 'pending',
      };
    }
  },

  // Update intake status
  async updateIntakeStatus(id: string, status: string, notes?: string): Promise<void> {
    try {
      await apiClient.put(`/api/evaluations/${id}/status`, { status, notes });
    } catch (error) {
      console.error('Error updating intake status:', error);
      throw error;
    }
  },

  // Assign intake to provider
  async assignIntake(id: string, providerId: string): Promise<void> {
    try {
      await apiClient.put(`/api/evaluations/${id}/assign`, { providerId });
    } catch (error) {
      console.error('Error assigning intake:', error);
      throw error;
    }
  },

  // Approve AI summary
  async approveAISummary(id: string): Promise<void> {
    try {
      await apiClient.put(`/api/evaluations/${id}/ai-summary/approve`);
    } catch (error) {
      console.error('Error approving AI summary:', error);
      throw error;
    }
  },

  // Update triage information
  async updateTriage(id: string, triage: { severity: string; priority: number; notes: string }): Promise<void> {
    try {
      await apiClient.put(`/api/evaluations/${id}/triage`, triage);
    } catch (error) {
      console.error('Error updating triage:', error);
      throw error;
    }
  },

  // Schedule appointment from intake
  async scheduleAppointment(intakeId: string, appointment: {
    providerId: string;
    dateTime: string;
    duration: number;
    type: string;
  }): Promise<void> {
    try {
      await apiClient.post(`/api/evaluations/${intakeId}/schedule`, appointment);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      throw error;
    }
  },

  // Get intake statistics
  async getIntakeStats(): Promise<{
    total: number;
    pending: number;
    reviewing: number;
    approved: number;
    rejected: number;
    avgProcessingTime: number;
  }> {
    try {
      const response = await apiClient.get('/api/evaluations/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching intake stats:', error);
      return {
        total: 25,
        pending: 5,
        reviewing: 3,
        approved: 15,
        rejected: 2,
        avgProcessingTime: 2.5,
      };
    }
  },
};

export default intakeApi;
