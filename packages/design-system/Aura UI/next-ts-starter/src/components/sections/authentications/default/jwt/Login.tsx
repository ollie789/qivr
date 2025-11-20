'use client';

import { signIn as nextAuthSignIn } from 'next-auth/react';
import { defaultJwtAuthCredentials } from 'config';
import paths from 'routes/paths';
import LoginForm, { LoginFormValues } from 'components/sections/authentications/default/LoginForm';

const Login = () => {
  const handleLogin = async (data: LoginFormValues) => {
    return await nextAuthSignIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });
  };

  return (
    <LoginForm
      handleLogin={handleLogin}
      signUpLink={paths.defaultJwtSignup}
      forgotPasswordLink={paths.defaultJwtForgotPassword}
      defaultCredential={defaultJwtAuthCredentials}
    />
  );
};

export default Login;
