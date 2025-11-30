import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api-client', () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { __esModule: true, default: mock };
});

import apiClient from '../../lib/api-client';
import { patientApi } from '../patientApi';

const mockClient = vi.mocked(apiClient);

describe('patientApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPatients', () => {
    it('maps paginated response correctly', async () => {
      mockClient.get.mockResolvedValueOnce({
        items: [
          {
            id: 'pat-1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phoneNumber: '0400123456',
            dateOfBirth: '1990-01-15',
            gender: 'male',
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
        nextCursor: 'cursor-abc',
        hasNext: true,
        count: 50,
      });

      const result = await patientApi.getPatients({ limit: 10 });

      expect(mockClient.get).toHaveBeenCalledWith('/api/patients', {
        limit: 10,
        cursor: undefined,
        search: undefined,
        status: undefined,
        providerId: undefined,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '0400123456',
        status: 'active',
      });
      expect(result.nextCursor).toBe('cursor-abc');
      expect(result.total).toBe(50);
    });

    it('handles array response (legacy format)', async () => {
      mockClient.get.mockResolvedValueOnce([
        {
          id: 'pat-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          isActive: false,
        },
      ]);

      const result = await patientApi.getPatients();

      expect(result.data[0]?.status).toBe('inactive');
      expect(result.nextCursor).toBeUndefined();
    });

    it('passes search parameters correctly', async () => {
      mockClient.get.mockResolvedValueOnce({ items: [], count: 0 });

      await patientApi.getPatients({
        search: 'john',
        status: 'active',
        provider: 'prov-1',
        cursor: 'next-page',
      });

      expect(mockClient.get).toHaveBeenCalledWith('/api/patients', {
        limit: 200,
        cursor: 'next-page',
        search: 'john',
        status: 'active',
        providerId: 'prov-1',
      });
    });
  });

  describe('getPatient', () => {
    it('maps detailed patient with address', async () => {
      mockClient.get.mockResolvedValueOnce({
        id: 'pat-3',
        firstName: 'Alice',
        lastName: 'Wonder',
        email: 'alice@example.com',
        address: '123 Main St',
        city: 'Sydney',
        state: 'NSW',
        postalCode: '2000',
        notes: 'VIP patient',
      });

      const result = await patientApi.getPatient('pat-3');

      expect(mockClient.get).toHaveBeenCalledWith('/api/patients/pat-3');
      expect(result?.address).toEqual({
        street: '123 Main St',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
      });
      expect(result?.notes).toBe('VIP patient');
    });

    it('returns undefined on error', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Not found'));

      const result = await patientApi.getPatient('invalid-id');

      expect(result).toBeUndefined();
    });

    it('maps recent appointments and proms', async () => {
      mockClient.get.mockResolvedValueOnce({
        id: 'pat-4',
        firstName: 'Bob',
        lastName: 'Builder',
        email: 'bob@example.com',
        recentAppointments: [
          { id: 'apt-1', date: '2024-02-01', provider: 'Dr Smith', type: 'follow-up', status: 'completed' },
        ],
        recentProms: [
          { id: 'prom-1', templateName: 'Pain Scale', status: 'Completed', score: 7 },
        ],
      });

      const result = await patientApi.getPatient('pat-4');

      expect(result?.recentAppointments).toHaveLength(1);
      expect(result?.recentAppointments?.[0]?.provider).toBe('Dr Smith');
      expect(result?.recentProms).toHaveLength(1);
      expect(result?.recentProms?.[0]?.score).toBe(7);
    });
  });

  describe('createPatient', () => {
    it('posts patient data and returns mapped result', async () => {
      const newPatient = {
        firstName: 'New',
        lastName: 'Patient',
        email: 'new@example.com',
        phone: '0411222333',
        dateOfBirth: '1985-06-20',
        gender: 'female',
      };

      mockClient.post.mockResolvedValueOnce({
        id: 'pat-new',
        ...newPatient,
        phoneNumber: newPatient.phone,
        isActive: true,
        createdAt: '2024-03-01T10:00:00Z',
      });

      const result = await patientApi.createPatient(newPatient);

      expect(mockClient.post).toHaveBeenCalledWith('/api/patients', {
        firstName: 'New',
        lastName: 'Patient',
        email: 'new@example.com',
        phone: '0411222333',
        dateOfBirth: '1985-06-20',
        gender: 'female',
      });

      expect(result.id).toBe('pat-new');
      expect(result.status).toBe('active');
    });
  });

  describe('updatePatient', () => {
    it('sends PUT request with updates', async () => {
      mockClient.put.mockResolvedValueOnce({
        id: 'pat-1',
        firstName: 'John',
        lastName: 'Updated',
        email: 'john@example.com',
        isActive: true,
      });

      const result = await patientApi.updatePatient('pat-1', { lastName: 'Updated' });

      expect(mockClient.put).toHaveBeenCalledWith('/api/patients/pat-1', { lastName: 'Updated' });
      expect(result?.lastName).toBe('Updated');
    });
  });

  describe('deletePatient', () => {
    it('sends DELETE request', async () => {
      mockClient.delete.mockResolvedValueOnce(undefined);

      await patientApi.deletePatient('pat-1');

      expect(mockClient.delete).toHaveBeenCalledWith('/api/patients/pat-1');
    });
  });

  describe('getPatientAppointments', () => {
    it('fetches appointments for patient', async () => {
      mockClient.get.mockResolvedValueOnce({
        items: [
          { id: 'apt-1', patientId: 'pat-1', status: 'scheduled' },
          { id: 'apt-2', patientId: 'pat-1', status: 'completed' },
        ],
      });

      const result = await patientApi.getPatientAppointments('pat-1');

      expect(mockClient.get).toHaveBeenCalledWith('/api/appointments', {
        patientId: 'pat-1',
        limit: 50,
        sortDescending: true,
      });
      expect(result).toHaveLength(2);
    });
  });
});
