import { apiEndpoints } from 'routes/paths';
import axiosFetcher from 'services/axios/axiosFetcher';
import { sendPasswordResetLinkFetcher } from 'services/swr/dummyFetcher';
import useSWRMutation from 'swr/mutation';
import { ForgotPasswordFormValues } from 'components/sections/authentications/common/ForgotPasswordForm';
import { SetPasswordFormValues } from 'components/sections/authentications/default/SetPassworForm';

export interface User {
  id: number | string;
  name: string;
  email: string;
  avatar: null | string;
  type?: string;
  designation?: string;
}

export const useSendPasswordResetLink = () => {
  const mutation = useSWRMutation<any, any, any, ForgotPasswordFormValues>(
    [apiEndpoints.forgotPassword, { method: 'post' }],
    // axiosFetcher,
    sendPasswordResetLinkFetcher,
  );

  return mutation;
};

export const useResetPassword = () => {
  const mutation = useSWRMutation<{ data: { message: string } }, any, any, SetPasswordFormValues>(
    [apiEndpoints.setPassword, { method: 'post' }],
    axiosFetcher,
  );

  return mutation;
};
