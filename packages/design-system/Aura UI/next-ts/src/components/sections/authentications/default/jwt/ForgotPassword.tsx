'use client';

import { useSendPasswordResetLink } from 'services/api-hooks/useAuthApi';
import ForgotPasswordForm from 'components/sections/authentications/common/ForgotPasswordForm';

const ForgotPassword = () => {
  const { trigger } = useSendPasswordResetLink();

  const handleSendResetLink = async (data: { email: string }) => {
    return await trigger(data).catch((error) => {
      throw new Error(error.data.message);
    });
  };

  return <ForgotPasswordForm handleSendResetLink={handleSendResetLink} />;
};

export default ForgotPassword;
