import { useSetPassword } from 'services/swr/api-hooks/useAuthApi';
import SetPasswordForm, {
  SetPasswordFormValues,
} from 'components/sections/authentications/default/SetPassworForm';

const SetPassword = () => {
  const { trigger: setPassword } = useSetPassword();

  const handleSetPassword = async (data: SetPasswordFormValues) => {
    return await setPassword(data).catch((error) => {
      throw new Error(error.data.message);
    });
  };

  return <SetPasswordForm handleSetPassword={handleSetPassword} />;
};

export default SetPassword;
