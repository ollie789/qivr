import { useNavigate } from 'react-router';
import { defaultJwtAuthCredentials } from 'config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from 'providers/AuthProvider';
import paths, { rootPaths } from 'routes/paths';
import { firebaseAuth } from 'services/firebase/firebase';
import LoginForm, { LoginFormValues } from 'components/sections/authentications/default/LoginForm';

const Login = () => {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const handleLogin = async (data: LoginFormValues) => {
    const userCredential = await signInWithEmailAndPassword(
      firebaseAuth,
      data.email,
      data.password,
    ).catch((error) => {
      console.log({ error });
    });

    if (userCredential) {
      const user = userCredential.user;
      setSession(
        {
          id: user.uid,
          name: user.displayName as string,
          email: user.email as string,
          avatar: user.photoURL,
        },
        //@ts-ignore
        user.accessToken,
      );
      navigate(rootPaths.root);
    }
  };

  return (
    <LoginForm
      provider="firebase"
      handleLogin={handleLogin}
      signUpLink={paths.defaultFirebaseSignup}
      forgotPasswordLink={paths.defaultFirebaseForgotPassword}
      defaultCredential={defaultJwtAuthCredentials}
    />
  );
};

export default Login;
