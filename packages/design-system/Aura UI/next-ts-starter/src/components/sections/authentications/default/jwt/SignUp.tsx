'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SignupForm, {
  SignupFormValues,
} from 'components/sections/authentications/default/SignupForm';

const SignUp = () => {
  const router = useRouter();

  const handleSignup = async (data: SignupFormValues) => {
    const res = await signIn('jwt-signup', {
      email: data.email,
      password: data.password,
      name: data.name,
      redirect: false,
    });

    if (res?.ok) {
      router.push('/');
    }
    return res;
  };

  return <SignupForm handleSignup={handleSignup} />;
};

export default SignUp;
