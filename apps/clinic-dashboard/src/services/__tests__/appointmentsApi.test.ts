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
import { appointmentsApi } from '../appointmentsApi';

const mockClient = vi.mocked(apiClient);

describe('appointmentsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAppointmentDto = {
    id: 'apt-1',
    patientId: 'pat-1',
    patientName: 'John Doe',
    patientEmail: 'john@example.com',
    patientPhone: '0400123456',
    providerId: 'prov-1',
    providerName: 'Dr. Smith',
    appointmentType: 'initial-consultation',
    status: 'Scheduled',
    scheduledStart: '2024-03-01T09:00:00Z',
    scheduledEnd: '2024-03-01T09:30:00Z',
    notes: 'First visit',
    location: 'Room 1',
    reasonForVisit: 'Back pain',
    createdAt: '2024-02-25T10:00:00Z',
    updatedAt: '2024-02-25T10:00:00Z',
  };

  describe('getAppointments', () => {
    it('maps paginated response and normalizes status', async () => {
      mockClient.get.mockResolvedValueOnce({
        items: [mockAppointmentDto],
        nextCursor: 'next-cursor',
        hasNext: true,
        count: 100,
      });

      const result = await appointmentsApi.getAppointments({ limit: 20 });

      expect(mockClient.get).toHaveBeenCalledWith('/api/appointments', { params: { limit: 20 } });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: 'apt-1',
        patientName: 'John Doe',
        providerName: 'Dr. Smith',
        status: 'scheduled', // normalized to lowercase
        appointmentType: 'initial-consultation',
      });
      expect(result.nextCursor).toBe('next-cursor');
      expect(result.hasNext).toBe(true);
    });

    it('handles array response (legacy format)', async () => {
      mockClient.get.mockResolvedValueOnce([mockAppointmentDto]);

      const result = await appointmentsApi.getAppointments();

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBeUndefined();
      expect(result.hasNext).toBe(false);
    });

    it('provides default values for missing patient/provider names', async () => {
      mockClient.get.mockResolvedValueOnce([
        {
          ...mockAppointmentDto,
          patientName: null,
          providerName: null,
          patientEmail: null,
        },
      ]);

      const result = await appointmentsApi.getAppointments();

      expect(result.items[0]?.patientName).toBe('Unknown patient');
      expect(result.items[0]?.providerName).toBe('Assigned provider');
      expect(result.items[0]?.patientEmail).toBe('');
    });
  });

  describe('getAppointment', () => {
    it('fetches single appointment by id', async () => {
      mockClient.get.mockResolvedValueOnce(mockAppointmentDto);

      const result = await appointmentsApi.getAppointment('apt-1');

      expect(mockClient.get).toHaveBeenCalledWith('/api/appointments/apt-1');
      expect(result.id).toBe('apt-1');
      expect(result.reasonForVisit).toBe('Back pain');
    });
  });

  describe('createAppointment', () => {
    it('posts new appointment data', async () => {
      const newAppointment = {
        patientId: 'pat-2',
        providerId: 'prov-1',
        scheduledStart: '2024-03-05T14:00:00Z',
        scheduledEnd: '2024-03-05T14:30:00Z',
        appointmentType: 'follow-up',
        reasonForVisit: 'Review results',
      };

      mockClient.post.mockResolvedValueOnce({
        id: 'apt-new',
        ...newAppointment,
        status: 'Scheduled',
        createdAt: '2024-03-01T10:00:00Z',
        updatedAt: '2024-03-01T10:00:00Z',
      });

      const result = await appointmentsApi.createAppointment(newAppointment);

      expect(mockClient.post).toHaveBeenCalledWith('/api/appointments', newAppointment);
      expect(result.id).toBe('apt-new');
      expect(result.status).toBe('scheduled');
    });
  });

  describe('updateAppointment', () => {
    it('sends PUT request with updates', async () => {
      mockClient.put.mockResolvedValueOnce({
        ...mockAppointmentDto,
        notes: 'Updated notes',
      });

      const result = await appointmentsApi.updateAppointment('apt-1', { notes: 'Updated notes' });

      expect(mockClient.put).toHaveBeenCalledWith('/api/appointments/apt-1', { notes: 'Updated notes' });
      expect(result.notes).toBe('Updated notes');
    });
  });

  describe('cancelAppointment', () => {
    it('posts cancellation with reason', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true });

      await appointmentsApi.cancelAppointment('apt-1', 'Patient requested');

      expect(mockClient.post).toHaveBeenCalledWith('/api/appointments/apt-1/cancel', {
        reason: 'Patient requested',
      });
    });
  });

  describe('confirmAppointment', () => {
    it('posts confirmation', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true });

      await appointmentsApi.confirmAppointment('apt-1');

      expect(mockClient.post).toHaveBeenCalledWith('/api/appointments/apt-1/confirm');
    });
  });

  describe('rescheduleAppointment', () => {
    it('posts reschedule with PascalCase fields', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true });

      await appointmentsApi.rescheduleAppointment('apt-1', {
        scheduledStart: '2024-03-10T10:00:00Z',
        scheduledEnd: '2024-03-10T10:30:00Z',
        reason: 'Conflict',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/api/appointments/apt-1/reschedule', {
        NewStartTime: '2024-03-10T10:00:00Z',
        NewEndTime: '2024-03-10T10:30:00Z',
        Reason: 'Conflict',
      });
    });
  });

  describe('markAsNoShow', () => {
    it('posts no-show status', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true });

      await appointmentsApi.markAsNoShow('apt-1');

      expect(mockClient.post).toHaveBeenCalledWith('/api/appointments/apt-1/no-show');
    });
  });

  describe('completeAppointment', () => {
    it('posts completion with notes', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true });

      await appointmentsApi.completeAppointment('apt-1', {
        notes: 'Session completed successfully',
        followUpRequired: true,
        followUpDate: '2024-04-01',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/api/appointments/apt-1/complete', {
        notes: 'Session completed successfully',
        followUpRequired: true,
        followUpDate: '2024-04-01',
      });
    });
  });

  describe('deleteAppointment', () => {
    it('sends DELETE request', async () => {
      mockClient.delete.mockResolvedValueOnce(undefined);

      await appointmentsApi.deleteAppointment('apt-1');

      expect(mockClient.delete).toHaveBeenCalledWith('/api/appointments/apt-1');
    });
  });

  describe('getAvailableSlots', () => {
    it('fetches available slots for provider', async () => {
      const slots = [
        { start: '2024-03-01T09:00:00Z', end: '2024-03-01T09:30:00Z', available: true, providerId: 'prov-1' },
        { start: '2024-03-01T09:30:00Z', end: '2024-03-01T10:00:00Z', available: false, providerId: 'prov-1' },
      ];
      mockClient.get.mockResolvedValueOnce(slots);

      const result = await appointmentsApi.getAvailableSlots({
        providerId: 'prov-1',
        date: '2024-03-01',
        duration: 30,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/api/appointments/availability', {
        params: { providerId: 'prov-1', date: '2024-03-01', duration: 30 },
      });
      expect(result).toHaveLength(2);
      expect(result[0]?.available).toBe(true);
    });
  });

  describe('sendReminder', () => {
    it('posts reminder request', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true });

      await appointmentsApi.sendReminder('apt-1');

      expect(mockClient.post).toHaveBeenCalledWith('/api/appointments/apt-1/send-reminder');
    });
  });

  describe('waitlist operations', () => {
    it('getWaitlist fetches waitlist', async () => {
      mockClient.get.mockResolvedValueOnce([]);

      await appointmentsApi.getWaitlist();

      expect(mockClient.get).toHaveBeenCalledWith('/api/appointments/waitlist');
    });

    it('addToWaitlist posts waitlist entry', async () => {
      mockClient.post.mockResolvedValueOnce({ id: 'waitlist-1' });

      await appointmentsApi.addToWaitlist({
        patientId: 'pat-1',
        appointmentType: 'consultation',
        notes: 'Urgent',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/api/appointments/waitlist', {
        patientId: 'pat-1',
        appointmentType: 'consultation',
        notes: 'Urgent',
      });
    });
  });
});
