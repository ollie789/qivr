'use client';

import { signIn } from 'next-auth/react';
import { defaultJwtAuthCredentials } from 'config';
import paths from 'routes/paths';
import LoginForm, { LoginFormValues } from 'components/sections/authentications/default/LoginForm';

const Login = () => {
  const handleLogin = async (data: LoginFormValues) => {
    return await signIn('firebase-login', {
      email: data.email,
      password: data.password,
      redirect: false,
    });
  };

  return (
    <>
      <LoginForm
        provider="firebase"
        handleLogin={handleLogin}
        signUpLink={paths.defaultFirebaseSignup}
        forgotPasswordLink={paths.defaultFirebaseForgotPassword}
        defaultCredential={defaultJwtAuthCredentials}
      />
    </>
  );
};

export default Login;
