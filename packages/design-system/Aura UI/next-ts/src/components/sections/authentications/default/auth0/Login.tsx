'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { rootPaths } from 'routes/paths';
import Auth0Login from 'components/sections/authentications/default/Auth0Login';

const Login = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const handleLogin = async () => {
    try {
      const res = await signIn('auth0', { callbackUrl: callbackUrl || rootPaths.root });
      console.log({ res });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignUp = async () => {
    try {
      const res = await signIn(
        'auth0',
        { callbackUrl: callbackUrl || rootPaths.root },
        {
          screen_hint: 'signup',
        },
      );
      console.log({ res });
    } catch (error) {
      console.error(error);
    }
  };

  return <Auth0Login handleLogin={handleLogin} handleSignUp={handleSignUp} />;
};

export default Login;
