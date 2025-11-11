import { api } from './api';
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from '../types';

export const fetchProfile = (): Promise<UserProfile> => api.get<UserProfile>('/profile');

export const updateProfile = (
  payload: UpdateProfilePayload,
): Promise<UserProfile> => api.put<UserProfile>('/profile', payload);

export const changePassword = (
  payload: ChangePasswordPayload,
): Promise<void> => api.post('/profile/change-password', payload);

export const uploadProfilePhoto = async (file: File): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch('/api/profile/photo', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to upload profile photo');
  }

  return response.json();
};
