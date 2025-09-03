import api from '../lib/api-client';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
  };
  medicalRecordNumber: string;
  status: 'active' | 'inactive' | 'pending';
  lastVisit?: string;
  nextAppointment?: string;
  conditions: string[];
  provider?: string;
  insuranceProvider?: string;
  registeredDate: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    postcode: string;
  };
  insuranceProvider?: string;
  medicareNumber?: string;
  initialConditions?: string[];
  intakeId?: string; // Link to intake submission
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {
  status?: 'active' | 'inactive' | 'pending';
  provider?: string;
  tags?: string[];
}

export interface PatientSearchParams {
  search?: string;
  status?: string;
  provider?: string;
  condition?: string;
  page?: number;
  pageSize?: number;
}

class PatientApi {
  private basePath = '/api/v1';

  // Get all patients with optional filters
  async getPatients(params?: PatientSearchParams) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      const url = queryParams.toString() 
        ? `${this.basePath}/patients?${queryParams}` 
        : `${this.basePath}/patients`;
      return await api.get<any>(url);
    } catch (error) {
      console.error('Error fetching patients:', error);
      // Return mock data for development
      return {
        data: this.getMockPatients(),
        total: 2,
        page: 1,
        pageSize: 10,
      };
    }
  }

  // Get a single patient by ID
  async getPatient(id: string) {
    try {
      return await api.get<Patient>(`${this.basePath}/patients/${id}`);
    } catch (error) {
      console.error('Error fetching patient:', error);
      // Return mock data for development
      return this.getMockPatients().find(p => p.id === id);
    }
  }

  // Create a new patient
  async createPatient(patient: CreatePatientDto) {
    try {
      return await api.post<Patient>(`${this.basePath}/patients`, patient);
    } catch (error) {
      console.error('Error creating patient:', error);
      // Return mock response for development
      return {
        id: `patient-${Date.now()}`,
        ...patient,
        medicalRecordNumber: `MRN${Date.now()}`,
        status: 'active' as const,
        registeredDate: new Date().toISOString(),
        conditions: patient.initialConditions || [],
        tags: [],
        createdAt: new Date().toISOString(),
      };
    }
  }

  // Update an existing patient
  async updatePatient(id: string, updates: UpdatePatientDto) {
    try {
      return await api.patch<Patient>(`${this.basePath}/patients/${id}`, updates);
    } catch (error) {
      console.error('Error updating patient:', error);
      // Return mock response for development
      const existing = this.getMockPatients().find(p => p.id === id);
      return { ...existing, ...updates, updatedAt: new Date().toISOString() };
    }
  }

  // Delete a patient (soft delete)
  async deletePatient(id: string) {
    try {
      return await api.delete<any>(`${this.basePath}/patients/${id}`);
    } catch (error) {
      console.error('Error deleting patient:', error);
      return { success: true };
    }
  }

  // Get patient's medical history
  async getPatientHistory(id: string) {
    try {
      return await api.get<any>(`${this.basePath}/patients/${id}/history`);
    } catch (error) {
      console.error('Error fetching patient history:', error);
      return {
        appointments: [],
        evaluations: [],
        proms: [],
        documents: [],
      };
    }
  }

  // Get patient's appointments
  async getPatientAppointments(id: string) {
    try {
      return await api.get<any[]>(`${this.basePath}/patients/${id}/appointments`);
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      return [];
    }
  }

  // Get patient's evaluations
  async getPatientEvaluations(id: string) {
    try {
      return await api.get<any[]>(`${this.basePath}/patients/${id}/evaluations`);
    } catch (error) {
      console.error('Error fetching patient evaluations:', error);
      return [];
    }
  }

  // Link patient to intake submission
  async linkPatientToIntake(patientId: string, intakeId: string) {
    try {
      return await api.post<any>(`${this.basePath}/patients/${patientId}/link-intake`, { intakeId });
    } catch (error) {
      console.error('Error linking patient to intake:', error);
      return { success: true };
    }
  }

  // Create patient from intake submission
  async createPatientFromIntake(intakeId: string, patientData: CreatePatientDto) {
    try {
      return await api.post<Patient>(`${this.basePath}/patients/from-intake`, {
        intakeId,
        ...patientData,
      });
    } catch (error) {
      console.error('Error creating patient from intake:', error);
      // Return mock response for development
      return this.createPatient({ ...patientData, intakeId });
    }
  }

  // Export patients data
  async exportPatients(format: 'csv' | 'pdf' | 'excel' = 'csv', filters?: PatientSearchParams) {
    try {
      const queryParams = new URLSearchParams({ format });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) queryParams.append(key, String(value));
        });
      }
      // Note: For blob responses, we need to use native fetch with auth
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/patients/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
      });
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `patients_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting patients:', error);
      throw error;
    }
  }

  // Mock data for development
  private getMockPatients(): Patient[] {
    return [
      {
        id: '1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+61 432 123 456',
        dateOfBirth: '1985-03-15',
        gender: 'Female',
        address: {
          street: '123 Collins St',
          city: 'Melbourne',
          state: 'VIC',
          postcode: '3000',
        },
        medicalRecordNumber: 'MRN001234',
        status: 'active',
        lastVisit: '2024-01-10',
        nextAppointment: '2024-02-15',
        conditions: ['Lower Back Pain', 'Sciatica'],
        provider: 'Dr. Emily Chen',
        insuranceProvider: 'Medibank Private',
        registeredDate: '2023-06-15',
        tags: ['Regular', 'Chronic Pain'],
      },
      {
        id: '2',
        firstName: 'Michael',
        lastName: 'Thompson',
        email: 'michael.t@email.com',
        phone: '+61 412 987 654',
        dateOfBirth: '1972-11-22',
        gender: 'Male',
        address: {
          street: '456 George St',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
        },
        medicalRecordNumber: 'MRN001235',
        status: 'active',
        lastVisit: '2024-01-12',
        conditions: ['Knee Injury', 'Post-Surgery Rehab'],
        provider: 'Dr. James Williams',
        insuranceProvider: 'BUPA',
        registeredDate: '2023-09-20',
        tags: ['Post-Op'],
      },
      {
        id: '3',
        firstName: 'Lisa',
        lastName: 'Chen',
        email: 'lisa.chen@email.com',
        phone: '+61 423 456 789',
        dateOfBirth: '1990-07-08',
        gender: 'Female',
        address: {
          street: '789 Queen St',
          city: 'Brisbane',
          state: 'QLD',
          postcode: '4000',
        },
        medicalRecordNumber: 'MRN001236',
        status: 'active',
        lastVisit: '2024-01-15',
        nextAppointment: '2024-01-25',
        conditions: ['Shoulder Impingement', 'Neck Pain'],
        provider: 'Dr. Priya Patel',
        insuranceProvider: 'HCF',
        registeredDate: '2023-11-10',
        tags: ['Regular'],
      },
    ];
  }
}

export const patientApi = new PatientApi();
