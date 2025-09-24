import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changePassword,
  fetchProfile,
  updateProfile,
  uploadProfilePhoto,
} from '../../../services/profileApi';
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from '../../../types';
import { handleApiError } from '../../../lib/api-client';

type MutationError = string | null;

export function useProfileData() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const profileError = profileQuery.error
    ? handleApiError(profileQuery.error, 'Failed to load profile')
    : null;

  const updateProfileMutation = useMutation<UserProfile, unknown, UpdateProfilePayload>({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const changePasswordMutation = useMutation<void, unknown, ChangePasswordPayload>({
    mutationFn: changePassword,
  });

  const uploadPhotoMutation = useMutation<UserProfile, unknown, File>({
    mutationFn: uploadProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const mapError = (error: unknown, fallback: string): MutationError =>
    handleApiError(error, fallback);

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileError,
    refetch: profileQuery.refetch,
    updateProfile: updateProfileMutation.mutateAsync,
    updateProfileStatus: {
      isPending: updateProfileMutation.isPending,
      error: updateProfileMutation.error
        ? mapError(updateProfileMutation.error, 'Failed to update profile')
        : null,
    },
    changePassword: changePasswordMutation.mutateAsync,
    changePasswordStatus: {
      isPending: changePasswordMutation.isPending,
      error: changePasswordMutation.error
        ? mapError(changePasswordMutation.error, 'Failed to update password')
        : null,
    },
    uploadPhoto: uploadPhotoMutation.mutateAsync,
    uploadPhotoStatus: {
      isPending: uploadPhotoMutation.isPending,
      error: uploadPhotoMutation.error
        ? mapError(uploadPhotoMutation.error, 'Failed to upload profile photo')
        : null,
    },
  };
}
