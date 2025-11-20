'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SignupForm, {
  SignupFormValues,
} from 'components/sections/authentications/default/SignupForm';

const SignUp = () => {
  const router = useRouter();

  const handleSignup = async (data: SignupFormValues) => {
    const res = await signIn('firebase-signup', {
      email: data.email,
      password: data.password,
      name: data.name,
      redirect: false,
      callbackUrl: '/',
    });
    if (res?.ok && res?.url) {
      router.push(res.url);
    }

    return res;
  };

  return <SignupForm provider="firebase" handleSignup={handleSignup} />;
};

export default SignUp;
