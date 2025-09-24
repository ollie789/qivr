import { api, apiRequest } from './api';
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

  return apiRequest<UserProfile>({
    url: '/profile/photo',
    method: 'POST',
    data: formData,
  });
};
