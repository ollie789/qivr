import { apiEndpoints } from 'routes/paths';
import axiosFetcher from 'services/axios/axiosFetcher';
import useSWR, { SWRConfiguration } from 'swr';
import useSWRMutation from 'swr/mutation';
import { ForgotPasswordFormValues } from 'components/sections/authentications/default/ForgotPasswordForm';
import { LoginFormValues } from 'components/sections/authentications/default/LoginForm';
import { SetPasswordFormValues } from 'components/sections/authentications/default/SetPassworForm';
import { SignupFormValues } from 'components/sections/authentications/default/SignupForm';
import { sendPasswordResetLinkFetcher } from '../dummyFetcher';

export interface User {
  id: number | string;
  name: string;
  email: string;
  avatar: null | string;
  type?: string;
  designation?: string;
}

export const useGetCurrentUser = (config?: SWRConfiguration<User | null>) => {
  const result = useSWR<User | null>(
    [apiEndpoints.profile, {}, { disableThrowError: true }],
    axiosFetcher,
    {
      suspense: true,
      shouldRetryOnError: false,
      errorRetryCount: 0,
      ...config,
    },
  );

  return result;
};

export const useLoginUser = () => {
  const mutation = useSWRMutation<
    {
      authToken: string;
      user: User;
    },
    any,
    any,
    LoginFormValues
  >([apiEndpoints.login, { method: 'post' }], axiosFetcher);

  return mutation;
};

export const useRegisterUser = () => {
  const mutation = useSWRMutation<any, any, any, SignupFormValues>(
    [apiEndpoints.register, { method: 'post' }],
    axiosFetcher,
  );

  return mutation;
};

export const useLogOutUser = () => {
  const mutation = useSWRMutation([apiEndpoints.logout, { method: 'post' }], axiosFetcher);

  return mutation;
};
export const useSendPasswordResetLink = () => {
  const mutation = useSWRMutation<any, any, any, ForgotPasswordFormValues>(
    [apiEndpoints.forgotPassword, { method: 'post' }],
    //In your real project use axiosFetcher instead of dummy sendPasswordResetLinkFetcher
    sendPasswordResetLinkFetcher,
  );

  return mutation;
};

export const useSetPassword = () => {
  const mutation = useSWRMutation<{ data: { message: string } }, any, any, SetPasswordFormValues>(
    [apiEndpoints.setPassword, { method: 'post' }],
    axiosFetcher,
  );

  return mutation;
};
