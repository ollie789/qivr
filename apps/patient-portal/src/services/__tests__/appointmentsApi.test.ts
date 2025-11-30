import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  handleApiError: vi.fn((error, msg) => msg),
}));

import { api } from '../api';
import {
  fetchAppointments,
  cancelAppointment,
  fetchAvailableProviders,
  fetchAvailableSlots,
  bookAppointment,
} from '../appointmentsApi';

const mockApi = vi.mocked(api);

describe('appointmentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAppointments', () => {
    const mockAppointmentDto = {
      id: 'apt-1',
      providerId: 'prov-1',
      providerName: 'Dr. Smith',
      providerSpecialty: 'Physiotherapy',
      appointmentType: 'initial-consultation',
      scheduledStart: '2024-03-01T09:00:00Z',
      scheduledEnd: '2024-03-01T09:30:00Z',
      status: 'Scheduled',
      location: 'Clinic Room 1',
      notes: 'First visit',
      createdAt: '2024-02-25T10:00:00Z',
      updatedAt: '2024-02-25T10:00:00Z',
    };

    it('fetches upcoming appointments with correct params', async () => {
      mockApi.get.mockResolvedValueOnce({ items: [mockAppointmentDto] });

      const result = await fetchAppointments({ upcoming: true });

      expect(mockApi.get).toHaveBeenCalledWith('/api/appointments', expect.objectContaining({
        limit: 50,
        sortDescending: false,
      }));
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'apt-1',
        providerName: 'Dr. Smith',
        status: 'scheduled',
        duration: 30,
      });
    });

    it('fetches past appointments with descending sort', async () => {
      mockApi.get.mockResolvedValueOnce({ items: [mockAppointmentDto] });

      await fetchAppointments({ past: true });

      expect(mockApi.get).toHaveBeenCalledWith('/api/appointments', expect.objectContaining({
        sortDescending: true,
      }));
    });

    it('normalizes numeric status values', async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [
          { ...mockAppointmentDto, id: 'apt-1', status: 0 },  // scheduled
          { ...mockAppointmentDto, id: 'apt-2', status: 1 },  // confirmed
          { ...mockAppointmentDto, id: 'apt-3', status: 3 },  // completed
          { ...mockAppointmentDto, id: 'apt-4', status: 4 },  // cancelled
          { ...mockAppointmentDto, id: 'apt-5', status: 5 },  // no-show
        ],
      });

      const result = await fetchAppointments({});

      expect(result.map(a => a.status)).toEqual([
        'scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'
      ]);
    });

    it('handles PascalCase response fields', async () => {
      mockApi.get.mockResolvedValueOnce({
        Items: [{
          Id: 'apt-1',
          ProviderId: 'prov-1',
          ProviderName: 'Dr. Jones',
          ScheduledStart: '2024-03-01T10:00:00Z',
          ScheduledEnd: '2024-03-01T10:30:00Z',
          Status: 'Confirmed',
          AppointmentType: 'follow-up',
          CreatedAt: '2024-02-20T00:00:00Z',
        }],
      });

      const result = await fetchAppointments({});

      expect(result[0]).toMatchObject({
        id: 'apt-1',
        providerName: 'Dr. Jones',
        status: 'confirmed',
      });
    });

    it('calculates duration correctly', async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [{
          ...mockAppointmentDto,
          scheduledStart: '2024-03-01T09:00:00Z',
          scheduledEnd: '2024-03-01T10:00:00Z', // 1 hour
        }],
      });

      const result = await fetchAppointments({});

      expect(result[0]?.duration).toBe(60);
    });

    it('detects virtual appointments from videoLink', async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [{
          ...mockAppointmentDto,
          videoLink: 'https://meet.example.com/abc',
        }],
      });

      const result = await fetchAppointments({});

      expect(result[0]?.isVirtual).toBe(true);
    });

    it('detects virtual appointments from locationType', async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [{
          ...mockAppointmentDto,
          locationType: 1, // Virtual
        }],
      });

      const result = await fetchAppointments({});

      expect(result[0]?.isVirtual).toBe(true);
    });

    it('provides default provider name when missing', async () => {
      mockApi.get.mockResolvedValueOnce({
        items: [{
          ...mockAppointmentDto,
          providerName: null,
        }],
      });

      const result = await fetchAppointments({});

      expect(result[0]?.providerName).toBe('Assigned clinician');
    });
  });

  describe('cancelAppointment', () => {
    it('posts cancellation with reason', async () => {
      mockApi.post.mockResolvedValueOnce({});

      await cancelAppointment('apt-1', 'Schedule conflict');

      expect(mockApi.post).toHaveBeenCalledWith('/api/appointments/apt-1/cancel', {
        reason: 'Schedule conflict',
      });
    });
  });

  describe('fetchAvailableProviders', () => {
    it('fetches providers for date', async () => {
      mockApi.get.mockResolvedValueOnce([
        {
          id: 'prov-1',
          fullName: 'Dr. Smith',
          specialty: 'Physiotherapy',
          title: 'Senior Physio',
        },
      ]);

      const result = await fetchAvailableProviders('2024-03-01');

      expect(mockApi.get).toHaveBeenCalledWith('/api/appointments/providers/available', {
        date: '2024-03-01',
      });
      expect(result[0]).toMatchObject({
        id: 'prov-1',
        name: 'Dr. Smith',
        specialty: 'Physiotherapy',
      });
    });

    it('handles user nested object for name', async () => {
      mockApi.get.mockResolvedValueOnce([
        {
          id: 'prov-2',
          user: {
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane@clinic.com',
          },
        },
      ]);

      const result = await fetchAvailableProviders('2024-03-01');

      expect(result[0]?.name).toBe('Jane Doe');
      expect(result[0]?.email).toBe('jane@clinic.com');
    });

    it('provides default name when missing', async () => {
      mockApi.get.mockResolvedValueOnce([{ id: 'prov-3' }]);

      const result = await fetchAvailableProviders('2024-03-01');

      expect(result[0]?.name).toBe('Available provider');
    });

    it('passes specialization filter', async () => {
      mockApi.get.mockResolvedValueOnce([]);

      await fetchAvailableProviders('2024-03-01', 'physiotherapy');

      expect(mockApi.get).toHaveBeenCalledWith('/api/appointments/providers/available', {
        date: '2024-03-01',
        specialization: 'physiotherapy',
      });
    });
  });

  describe('fetchAvailableSlots', () => {
    it('fetches and filters available slots', async () => {
      mockApi.get.mockResolvedValueOnce([
        { providerId: 'prov-1', startTime: '09:00', endTime: '09:30', available: true },
        { providerId: 'prov-1', startTime: '09:30', endTime: '10:00', available: false },
        { providerId: 'prov-1', startTime: '10:00', endTime: '10:30', available: true },
      ]);

      const result = await fetchAvailableSlots('prov-1', '2024-03-01', 30);

      expect(mockApi.get).toHaveBeenCalledWith('/api/appointments/availability', {
        providerId: 'prov-1',
        date: '2024-03-01',
        durationMinutes: '30',
      });
      expect(result).toHaveLength(2); // Only available slots
      expect(result[0]?.startTime).toBe('09:00');
      expect(result[1]?.startTime).toBe('10:00');
    });

    it('handles mixed case fields in response', async () => {
      // API might return with either camelCase or PascalCase - implementation uses fallbacks
      mockApi.get.mockResolvedValueOnce([
        {
          ProviderId: 'prov-1',
          StartTime: '14:00',
          EndTime: '14:30',
          available: true, // lowercase available is checked for filtering
        },
      ]);

      const result = await fetchAvailableSlots('prov-1', '2024-03-01');

      expect(result[0]).toMatchObject({
        providerId: 'prov-1',
        startTime: '14:00',
        endTime: '14:30',
      });
    });
  });

  describe('bookAppointment', () => {
    it('books appointment with payload', async () => {
      mockApi.post.mockResolvedValueOnce({
        id: 'apt-new',
        providerId: 'prov-1',
        providerName: 'Dr. Smith',
        scheduledStart: '2024-03-01T14:00:00Z',
        scheduledEnd: '2024-03-01T14:30:00Z',
        appointmentType: 'consultation',
        status: 'Scheduled',
        createdAt: '2024-02-28T10:00:00Z',
      });

      const result = await bookAppointment({
        providerId: 'prov-1',
        startTime: '2024-03-01T14:00:00Z',
        durationMinutes: 30,
        appointmentType: 'consultation',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/appointments/book', {
        providerId: 'prov-1',
        startTime: '2024-03-01T14:00:00Z',
        durationMinutes: 30,
        appointmentType: 'consultation',
      });
      expect(result.id).toBe('apt-new');
      expect(result.status).toBe('scheduled');
    });

    it('uses defaults for optional fields', async () => {
      mockApi.post.mockResolvedValueOnce({
        id: 'apt-new',
        status: 'Scheduled',
        scheduledStart: '2024-03-01T14:00:00Z',
      });

      await bookAppointment({
        providerId: 'prov-1',
        startTime: '2024-03-01T14:00:00Z',
      });

      expect(mockApi.post).toHaveBeenCalledWith('/api/appointments/book', {
        providerId: 'prov-1',
        startTime: '2024-03-01T14:00:00Z',
        durationMinutes: 30,
        appointmentType: 'consultation',
      });
    });

    it('throws error on failure', async () => {
      mockApi.post.mockRejectedValueOnce(new Error('Server error'));

      await expect(bookAppointment({
        providerId: 'prov-1',
        startTime: '2024-03-01T14:00:00Z',
      })).rejects.toThrow('Unable to book appointment');
    });
  });
});
