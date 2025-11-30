import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

import { api } from '../api';
import { fetchProfile, updateProfile, changePassword } from '../profileApi';

const mockApi = vi.mocked(api);

describe('profileApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchProfile', () => {
    it('fetches user profile', async () => {
      const mockProfile = {
        id: 'user-1',
        email: 'patient@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0400123456',
        dateOfBirth: '1985-06-15',
        address: {
          street: '123 Main St',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
        },
        emergencyContact: {
          name: 'Jane Doe',
          phone: '0411222333',
          relationship: 'Spouse',
        },
        preferences: {
          notifications: true,
          emailReminders: true,
          smsReminders: false,
        },
      };
      mockApi.get.mockResolvedValueOnce(mockProfile);

      const result = await fetchProfile();

      expect(mockApi.get).toHaveBeenCalledWith('/profile');
      expect(result.firstName).toBe('John');
      expect(result.email).toBe('patient@example.com');
    });
  });

  describe('updateProfile', () => {
    it('updates profile with payload', async () => {
      const updatePayload = {
        firstName: 'Johnny',
        phone: '0400999888',
        address: {
          street: '456 New St',
          city: 'Melbourne',
          state: 'VIC',
          postcode: '3000',
        },
      };

      const updatedProfile = {
        id: 'user-1',
        email: 'patient@example.com',
        ...updatePayload,
      };
      mockApi.put.mockResolvedValueOnce(updatedProfile);

      const result = await updateProfile(updatePayload);

      expect(mockApi.put).toHaveBeenCalledWith('/profile', updatePayload);
      expect(result.firstName).toBe('Johnny');
      expect(result.address?.city).toBe('Melbourne');
    });

    it('updates emergency contact', async () => {
      const updatePayload = {
        emergencyContact: {
          name: 'Bob Smith',
          phone: '0422333444',
          relationship: 'Friend',
        },
      };

      mockApi.put.mockResolvedValueOnce({
        id: 'user-1',
        ...updatePayload,
      });

      const result = await updateProfile(updatePayload);

      expect(mockApi.put).toHaveBeenCalledWith('/profile', updatePayload);
      expect(result.emergencyContact?.name).toBe('Bob Smith');
    });

    it('updates notification preferences', async () => {
      const updatePayload = {
        preferences: {
          notifications: false,
          emailReminders: true,
          smsReminders: true,
        },
      };

      mockApi.put.mockResolvedValueOnce({
        id: 'user-1',
        preferences: updatePayload.preferences,
      });

      await updateProfile(updatePayload);

      expect(mockApi.put).toHaveBeenCalledWith('/profile', updatePayload);
    });
  });

  describe('changePassword', () => {
    it('posts password change request', async () => {
      const passwordPayload = {
        currentPassword: 'oldPassword123',
        newPassword: 'newSecurePassword456',
      };
      mockApi.post.mockResolvedValueOnce({});

      await changePassword(passwordPayload);

      expect(mockApi.post).toHaveBeenCalledWith('/profile/change-password', passwordPayload);
    });
  });
});
