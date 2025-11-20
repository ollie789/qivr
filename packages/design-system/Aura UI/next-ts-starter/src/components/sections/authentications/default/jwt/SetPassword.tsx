'use client';

import { useResetPassword } from 'services/api-hooks/useAuthApi';
import SetPasswordForm, {
  SetPasswordFormValues,
} from 'components/sections/authentications/default/SetPassworForm';

const SetPassword = () => {
  const { trigger: resetPassword } = useResetPassword();

  const handleSetPassword = async (data: SetPasswordFormValues) => {
    return await resetPassword(data).catch((error) => {
      throw new Error(error.data.message);
    });
  };

  return <SetPasswordForm handleSetPassword={handleSetPassword} />;
};

export default SetPassword;
